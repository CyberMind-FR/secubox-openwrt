# SecuBox SMB/CIFS Remote Mount Manager

Manages SMB/CIFS network shares for media servers (Jellyfin, Lyrion), backups, and general-purpose remote storage.

## Installation

```sh
opkg install secubox-app-smbfs
```

## Configuration

UCI config file: `/etc/config/smbfs`

```
config smbfs 'global'
    option enabled '1'
    option mount_base '/mnt/smb'
    option cifs_version '3.0'
    option timeout '10'

config mount 'movies'
    option enabled '1'
    option server '//192.168.1.100/movies'
    option mountpoint '/mnt/smb/movies'
    option username 'media'
    option _password 'secret'
    option read_only '1'
    option auto_mount '1'
    option description 'NAS movie library'
```

## Usage

```sh
# Add a share
smbfsctl add movies //nas/movies /mnt/smb/movies

# Set credentials
smbfsctl credentials movies user password

# Set options
smbfsctl set movies read_only 1
smbfsctl set movies description 'Movie library'

# Test connectivity
smbfsctl test movies

# Mount / unmount
smbfsctl mount movies
smbfsctl umount movies

# Enable auto-mount at boot
smbfsctl enable movies

# List all shares
smbfsctl list

# Show detailed mount status
smbfsctl status

# Mount all enabled shares
smbfsctl mount-all
```

## Integration with Media Apps

```sh
# Jellyfin: add mounted share as media library
uci add_list jellyfin.media.media_path='/mnt/smb/movies'
uci commit jellyfin

# Lyrion: point music library to mounted share
uci set lyrion.main.media_path='/mnt/smb/music'
uci commit lyrion
```

## Features

- UCI-based share configuration with credentials storage
- Auto-mount at boot for enabled shares
- Read-only or read-write mount modes
- CIFS protocol version selection (2.0, 2.1, 3.0)
- Connectivity test before mounting
- Mount status with disk usage reporting
- Integration with Jellyfin and Lyrion media paths

## Files

- `/etc/config/smbfs` -- UCI configuration
- `/etc/init.d/smbfs` -- procd init script (auto-mount)
- `/usr/sbin/smbfsctl` -- controller CLI

## Dependencies

- `kmod-fs-cifs` -- CIFS kernel module
- `cifsmount` -- mount.cifs utility

## License

Apache-2.0
