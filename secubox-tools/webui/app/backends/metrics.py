"""
Real-time metrics collection for Command Center.

Provides simulated data for virtualized backend and fallback data
for HTTP backend when real metrics aren't available.
"""

from typing import Dict, Any
import random
import time
from datetime import datetime


class MetricsCollector:
    """Generates realistic system metrics for visualization."""

    @staticmethod
    async def get_system_metrics() -> Dict[str, Any]:
        """
        Collect CPU, memory, and network metrics.

        Returns:
            dict: System metrics including CPU usage, memory stats, and network throughput
        """
        # Simulate realistic CPU usage with some variability
        cpu_usage = random.randint(15, 75) + random.random() * 10

        # Simulate per-core usage
        cores = [
            max(0, min(100, cpu_usage + random.randint(-20, 20)))
            for _ in range(4)
        ]

        # Memory stats
        total_memory = 4096  # 4GB
        used_memory = random.randint(1024, 3072)
        memory_percent = (used_memory / total_memory) * 100

        # Network throughput (bytes per second)
        rx_rate = random.randint(50, 500) * 1024  # 50KB-500KB/s download
        tx_rate = random.randint(20, 200) * 1024  # 20KB-200KB/s upload

        return {
            'cpu': {
                'usage': round(cpu_usage, 2),
                'cores': [round(c, 2) for c in cores],
                'temperature': random.randint(45, 75)  # Celsius
            },
            'memory': {
                'used': used_memory,
                'total': total_memory,
                'percent': round(memory_percent, 2),
                'available': total_memory - used_memory
            },
            'network': {
                'rx_bytes': random.randint(1000000, 10000000),
                'tx_bytes': random.randint(500000, 5000000),
                'rx_rate': rx_rate,
                'tx_rate': tx_rate,
                'connections': random.randint(10, 50)
            },
            'uptime': random.randint(100000, 500000),  # seconds
            'load_avg': [
                round(cpu_usage / 100 * 4, 2),  # 1min
                round(cpu_usage / 100 * 4 * 0.9, 2),  # 5min
                round(cpu_usage / 100 * 4 * 0.8, 2)  # 15min
            ]
        }

    @staticmethod
    async def get_threat_feed() -> Dict[str, Any]:
        """
        Collect security threat events from firewall/IDS.

        Returns:
            dict: Threat events and counters
        """
        # Threat event templates
        threat_templates = [
            {
                'ip': f'192.168.{random.randint(1, 254)}.{random.randint(1, 254)}',
                'severity': 'high',
                'action': 'blocked',
                'reason': 'SSH brute force attempt'
            },
            {
                'ip': f'10.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}',
                'severity': 'medium',
                'action': 'quarantined',
                'reason': 'Port scan detected'
            },
            {
                'ip': f'172.{random.randint(16, 31)}.{random.randint(0, 255)}.{random.randint(1, 254)}',
                'severity': 'high',
                'action': 'blocked',
                'reason': 'SQL injection attempt'
            },
            {
                'ip': f'192.168.{random.randint(1, 254)}.{random.randint(1, 254)}',
                'severity': 'medium',
                'action': 'blocked',
                'reason': 'Malformed HTTP request'
            },
            {
                'ip': f'10.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}',
                'severity': 'low',
                'action': 'allowed',
                'reason': 'Rate limit exceeded'
            },
            {
                'ip': f'203.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}',
                'severity': 'high',
                'action': 'blocked',
                'reason': 'Known botnet IP'
            }
        ]

        # Generate 0-3 recent events
        num_events = random.randint(0, 3)
        recent_events = []

        for _ in range(num_events):
            event = random.choice(threat_templates).copy()
            # Add timestamp
            now = datetime.now()
            event['time'] = now.strftime('%H:%M:%S')
            event['timestamp'] = now.isoformat()
            recent_events.append(event)

        # Sort by time (most recent first)
        recent_events.sort(key=lambda x: x['timestamp'], reverse=True)

        return {
            'recent_events': recent_events,
            'counters': {
                'blocked': random.randint(150, 250),
                'allowed': random.randint(4500, 5500),
                'quarantined': random.randint(0, 8)
            },
            'threat_level': 'moderate' if num_events > 1 else 'low',
            'last_update': datetime.now().isoformat()
        }

    @staticmethod
    async def get_traffic_stats() -> Dict[str, Any]:
        """
        Collect network traffic classification and statistics.

        Returns:
            dict: Protocol distribution and top domains
        """
        # Protocol distribution (percentages)
        total = 100
        https_percent = random.randint(50, 70)
        dns_percent = random.randint(10, 20)
        ssh_percent = random.randint(5, 15)
        other_percent = max(0, total - https_percent - dns_percent - ssh_percent)

        protocols = {
            'https': https_percent,
            'dns': dns_percent,
            'ssh': ssh_percent,
            'http': max(0, other_percent - 5),
            'other': max(0, 5)
        }

        # Top domain templates
        domain_templates = [
            {'domain': 'api.openai.com', 'category': 'cloud'},
            {'domain': 'github.com', 'category': 'development'},
            {'domain': 'stackoverflow.com', 'category': 'development'},
            {'domain': 'reddit.com', 'category': 'social'},
            {'domain': 'youtube.com', 'category': 'media'},
            {'domain': 'cloudflare.com', 'category': 'cdn'},
            {'domain': 'google.com', 'category': 'search'},
            {'domain': 'aws.amazon.com', 'category': 'cloud'},
            {'domain': 'microsoft.com', 'category': 'software'},
            {'domain': 'docker.io', 'category': 'containers'}
        ]

        # Select 3-5 random domains
        num_domains = random.randint(3, 5)
        selected_domains = random.sample(domain_templates, num_domains)

        # Assign random bytes to each domain
        top_domains = [
            {
                **domain,
                'bytes': random.randint(100000, 5000000),
                'packets': random.randint(100, 10000),
                'connections': random.randint(1, 20)
            }
            for domain in selected_domains
        ]

        # Sort by bytes (descending)
        top_domains.sort(key=lambda x: x['bytes'], reverse=True)

        return {
            'protocols': protocols,
            'top_domains': top_domains,
            'total_bandwidth': sum(d['bytes'] for d in top_domains),
            'active_connections': random.randint(15, 50),
            'last_update': datetime.now().isoformat()
        }

    @staticmethod
    async def get_command_output(command: str) -> str:
        """
        Generate simulated command output.

        Args:
            command: The command to execute

        Returns:
            str: Simulated command output
        """
        timestamp = datetime.now().strftime('[%H:%M:%S]')

        # Simulate different command outputs
        if command.startswith('uname'):
            return f"{timestamp} Linux secubox 5.15.0-openwrt #0 SMP PREEMPT\n"
        elif command.startswith('uptime'):
            return f"{timestamp} 12:34:56 up 3 days, 5:23, 2 users, load average: 0.45, 0.32, 0.28\n"
        elif command.startswith('free'):
            return f"{timestamp}\n              total        used        free      shared  buff/cache   available\nMem:        4096000     2048000     1024000      128000     1024000     1920000\nSwap:             0           0           0\n"
        elif command.startswith('df'):
            return f"{timestamp}\nFilesystem      Size  Used Avail Use% Mounted on\n/dev/root        32G   12G   18G  40% /\n"
        elif command.startswith('ps'):
            return f"{timestamp}\n  PID TTY          TIME CMD\n    1 ?        00:00:01 init\n  412 ?        00:00:00 uhttpd\n  528 ?        00:00:00 dnsmasq\n"
        else:
            return f"{timestamp} Command '{command}' executed successfully\n"
