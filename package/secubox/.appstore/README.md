# SecuBox App Store Metadata

This directory contains metadata for all SecuBox applications available in the app store.

## Structure

- `apps.json` - Master catalog of all available SecuBox applications
- Individual app directories with detailed metadata

## App Categories

### 🔒 Security
Applications focused on security, threat detection, and network protection.

### 🌐 Network
Network services, utilities, and infrastructure applications.

### 🏠 IoT & Home Automation
Smart home devices, automation systems, and IoT integration.

### 🎬 Media
Media streaming, entertainment, and content management.

## Application Status

- **stable** - Production-ready, tested and stable
- **beta** - Functional but may have minor issues
- **alpha** - Early development, experimental
- **dev** - Under active development

## Adding New Applications

To add a new application to the app store:

1. Create the package in `package/secubox/secubox-app-<name>/`
2. Add metadata entry in `apps.json`
3. Ensure proper tagging and categorization
4. Add dependencies and conflicts if any
5. Link to LuCI app if available

## Metadata Fields

Each app entry includes:

- **id**: Unique package identifier
- **name**: Display name
- **version**: Current version
- **category**: Primary category
- **description**: Brief description
- **icon**: Emoji or icon identifier
- **author**: Package maintainer
- **license**: Software license
- **url**: Upstream project URL
- **tags**: Searchable tags
- **requires**: System requirements
- **status**: Development status
- **luci_app**: Associated LuCI interface (if any)
- **dependencies**: Required packages
- **conflicts**: Conflicting packages

## Integration

The app store metadata is used by:

- **luci-app-secubox** - Main SecuBox interface
- **Build system** - Package management and dependency resolution
- **Documentation** - Automated documentation generation
- **CI/CD** - Automated testing and deployment

## Versioning

App store metadata version: 1.0
Last updated: 2024-12-30
