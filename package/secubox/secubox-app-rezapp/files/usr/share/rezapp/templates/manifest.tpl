{
  "id": "APPNAME",
  "name": "APPNAME",
  "version": "1.0.0",
  "category": "utilities",
  "runtime": "lxc",
  "maturity": "community",
  "description": "Auto-generated from SOURCE_IMAGE by RezApp Forge",
  "source": {
    "docker_image": "SOURCE_IMAGE",
    "converted_by": "rezappctl",
    "converted_at": "TIMESTAMP"
  },
  "packages": ["secubox-app-APPNAME"],
  "capabilities": ["lxc-container"],
  "requirements": {
    "arch": ["aarch64", "x86_64"],
    "min_ram_mb": 256,
    "min_storage_mb": 500
  },
  "network": {
    "inbound_ports": [],
    "protocols": []
  },
  "actions": {
    "install": "opkg install secubox-app-APPNAME",
    "start": "APPNAMEctl start",
    "stop": "APPNAMEctl stop",
    "status": "APPNAMEctl status"
  }
}
