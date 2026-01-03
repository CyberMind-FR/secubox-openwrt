"""
WebSocket endpoints for real-time Command Center data streaming.

Handles real-time metrics, threat feeds, traffic stats, and command execution
streaming to connected clients.
"""

from fastapi import WebSocket, WebSocketDisconnect
import asyncio
import json
import logging
from typing import Set, TYPE_CHECKING
from datetime import datetime

if TYPE_CHECKING:
    from .services import DataStore

logger = logging.getLogger(__name__)


class CommandCenterManager:
    """Manages WebSocket connections for the Command Center."""

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"Command Center client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection."""
        self.active_connections.discard(websocket)
        logger.info(f"Command Center client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Broadcast a message to all connected clients."""
        dead_connections = set()
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Failed to send to client: {e}")
                dead_connections.add(connection)

        # Clean up dead connections
        self.active_connections -= dead_connections


# Global manager instance
manager = CommandCenterManager()


async def stream_metrics(ws: WebSocket, store: "DataStore"):
    """
    Stream system metrics every 2 seconds.

    Args:
        ws: WebSocket connection
        store: DataStore instance for backend access
    """
    while True:
        try:
            backend = store.get_backend()
            metrics = await backend.get_system_metrics()

            await ws.send_json({
                'type': 'metrics',
                'timestamp': datetime.now().timestamp(),
                'data': metrics
            })
        except WebSocketDisconnect:
            break
        except Exception as e:
            logger.error(f"Error streaming metrics: {e}")
            # Continue streaming despite errors
            pass

        await asyncio.sleep(2)  # Update every 2 seconds


async def stream_threats(ws: WebSocket, store: "DataStore"):
    """
    Stream threat feed every 5 seconds.

    Args:
        ws: WebSocket connection
        store: DataStore instance for backend access
    """
    while True:
        try:
            backend = store.get_backend()
            threats = await backend.get_threat_feed()

            await ws.send_json({
                'type': 'threats',
                'timestamp': datetime.now().timestamp(),
                'data': threats
            })
        except WebSocketDisconnect:
            break
        except Exception as e:
            logger.error(f"Error streaming threats: {e}")
            pass

        await asyncio.sleep(5)  # Update every 5 seconds


async def stream_traffic(ws: WebSocket, store: "DataStore"):
    """
    Stream traffic stats every 3 seconds.

    Args:
        ws: WebSocket connection
        store: DataStore instance for backend access
    """
    while True:
        try:
            backend = store.get_backend()
            traffic = await backend.get_traffic_stats()

            await ws.send_json({
                'type': 'traffic',
                'timestamp': datetime.now().timestamp(),
                'data': traffic
            })
        except WebSocketDisconnect:
            break
        except Exception as e:
            logger.error(f"Error streaming traffic: {e}")
            pass

        await asyncio.sleep(3)  # Update every 3 seconds


async def handle_command_execution(ws: WebSocket, command: str, store: "DataStore"):
    """
    Execute a command and stream output back to client.

    Args:
        ws: WebSocket connection
        command: Command string to execute
        store: DataStore instance for backend access
    """
    try:
        # Send execution start acknowledgment
        await ws.send_json({
            'type': 'command_output',
            'data': {
                'command': command,
                'output': f'[{datetime.now().strftime("%H:%M:%S")}] Executing: {command}\n',
                'status': 'running'
            }
        })

        # Execute command via backend
        backend = store.get_backend()
        output = await backend.get_command_output(command)

        # Send command output
        await ws.send_json({
            'type': 'command_output',
            'data': {
                'command': command,
                'output': output,
                'status': 'completed'
            }
        })

    except Exception as e:
        logger.error(f"Error executing command '{command}': {e}")
        await ws.send_json({
            'type': 'command_output',
            'data': {
                'command': command,
                'output': f'[ERROR] {str(e)}\n',
                'status': 'error'
            }
        })


async def command_center_websocket(websocket: WebSocket, store: "DataStore"):
    """
    Main WebSocket endpoint handler for Command Center.

    Manages connection lifecycle and spawns background streaming tasks
    for metrics, threats, and traffic data.

    Args:
        websocket: FastAPI WebSocket connection
        store: DataStore instance
    """
    await manager.connect(websocket)

    # Create background streaming tasks
    metrics_task = asyncio.create_task(stream_metrics(websocket, store))
    threats_task = asyncio.create_task(stream_threats(websocket, store))
    traffic_task = asyncio.create_task(stream_traffic(websocket, store))

    try:
        # Listen for client messages
        while True:
            # Receive JSON message from client
            data = await websocket.receive_json()

            message_type = data.get('type')

            if message_type == 'subscribe':
                # Client subscribing to streams (already active via background tasks)
                logger.info(f"Client subscribed to streams: {data.get('streams', [])}")
                await websocket.send_json({
                    'type': 'subscribed',
                    'streams': ['metrics', 'threats', 'traffic', 'commands']
                })

            elif message_type == 'execute':
                # Execute command
                command = data.get('command', '')
                if command:
                    await handle_command_execution(websocket, command, store)
                else:
                    await websocket.send_json({
                        'type': 'error',
                        'message': 'No command specified'
                    })

            elif message_type == 'ping':
                # Heartbeat/keepalive
                await websocket.send_json({'type': 'pong'})

            else:
                logger.warning(f"Unknown message type: {message_type}")
                await websocket.send_json({
                    'type': 'error',
                    'message': f'Unknown message type: {message_type}'
                })

    except WebSocketDisconnect:
        logger.info("Client disconnected normally")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        # Clean up
        manager.disconnect(websocket)

        # Cancel background streaming tasks
        metrics_task.cancel()
        threats_task.cancel()
        traffic_task.cancel()

        try:
            await metrics_task
        except asyncio.CancelledError:
            pass

        try:
            await threats_task
        except asyncio.CancelledError:
            pass

        try:
            await traffic_task
        except asyncio.CancelledError:
            pass

        logger.info("WebSocket connection closed and tasks cleaned up")
