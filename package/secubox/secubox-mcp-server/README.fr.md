[English](README.md) | Francais | [中文](README.zh.md)

# SecuBox MCP Server

Serveur Model Context Protocol (MCP) pour SecuBox. Expose les donnees de securite de l'appareil aux assistants IA (Claude Desktop, Cursor, VS Code) via JSON-RPC 2.0 sur stdio.

**Version** : 1.0.0

## Apercu

MCP (Model Context Protocol) est un protocole ouvert d'Anthropic qui permet aux assistants IA d'acceder aux sources de donnees locales. Ce serveur fournit les donnees de securite SecuBox aux outils IA pour :

- Analyse de renseignements sur les menaces en temps reel
- Recherche de vulnerabilites CVE avec conseils d'attenuation
- Suggestions de regles de filtrage WAF
- Evaluations de la posture de securite
- Surveillance reseau et systeme

## Installation

```sh
opkg install secubox-mcp-server
```

## Outils Disponibles

### Outils de Securite

| Outil | Description |
|-------|-------------|
| `crowdsec.alerts` | Obtenir les alertes de securite CrowdSec actives |
| `crowdsec.decisions` | Obtenir les decisions de blocage actives |
| `waf.logs` | Obtenir les evenements de menaces WAF depuis mitmproxy |

### Outils Reseau

| Outil | Description |
|-------|-------------|
| `network.flows` | Obtenir le resume du trafic reseau |
| `wireguard.status` | Obtenir le statut du tunnel VPN |
| `dns.queries` | Obtenir les statistiques des requetes DNS |

### Outils Systeme

| Outil | Description |
|-------|-------------|
| `system.metrics` | Obtenir CPU, memoire, disque, temperature |
| `uci.get` | Lire la configuration UCI OpenWrt |
| `uci.set` | Ecrire la configuration UCI (desactive par defaut) |

### Outils IA (Necessite LocalAI)

| Outil | Description |
|-------|-------------|
| `ai.analyze_threats` | Analyse IA des alertes CrowdSec avec recommandations |
| `ai.cve_lookup` | Analyse de vulnerabilite CVE et conseils d'attenuation |
| `ai.suggest_waf_rules` | Modeles de filtrage mitmproxy/WAF suggeres par l'IA |
| `ai.explain_ban` | Expliquer pourquoi une IP a ete bannie |
| `ai.security_posture` | Evaluation de la posture de securite |

## Integration Claude Desktop

Ajouter a `~/.config/claude/claude_desktop_config.json` :

```json
{
  "mcpServers": {
    "secubox": {
      "command": "ssh",
      "args": ["root@192.168.255.1", "/usr/bin/secubox-mcp"]
    }
  }
}
```

Puis redemarrer Claude Desktop. Posez des questions comme :
- "Quelles sont les menaces de securite actuelles sur mon routeur ?"
- "Analysez CVE-2024-1234 et suggerez des attenuations"
- "Quel est le resume de mon trafic reseau ?"
- "Suggerez des regles WAF basees sur les attaques recentes"

## Configuration

Configuration UCI : `/etc/config/mcp-server`

```uci
config mcp-server 'main'
    option enabled '1'

    # Liste blanche d'outils - seuls ces outils peuvent etre invoques
    list allowed_tool 'crowdsec.alerts'
    list allowed_tool 'crowdsec.decisions'
    list allowed_tool 'waf.logs'
    list allowed_tool 'dns.queries'
    list allowed_tool 'network.flows'
    list allowed_tool 'system.metrics'
    list allowed_tool 'wireguard.status'
    list allowed_tool 'uci.get'
    # list allowed_tool 'uci.set'  # Desactive par defaut

    # Outils IA (necessitent LocalAI)
    list allowed_tool 'ai.analyze_threats'
    list allowed_tool 'ai.cve_lookup'
    list allowed_tool 'ai.suggest_waf_rules'
    list allowed_tool 'ai.explain_ban'
    list allowed_tool 'ai.security_posture'

    # Classification des donnees pour la souverainete
    option classification 'local_only'
```

### Activer/Desactiver des Outils

```sh
# Activer uci.set (attention - permet les modifications de configuration)
uci add_list mcp-server.main.allowed_tool='uci.set'
uci commit mcp-server

# Desactiver un outil
uci del_list mcp-server.main.allowed_tool='ai.security_posture'
uci commit mcp-server
```

## Tests

### Tester le Protocole Localement

```sh
# Initialiser
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | /usr/bin/secubox-mcp

# Lister les outils
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | /usr/bin/secubox-mcp

# Appeler un outil
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"system.metrics","arguments":{}}}' | /usr/bin/secubox-mcp
```

### Tester via SSH

```sh
ssh root@192.168.255.1 '/usr/bin/secubox-mcp' <<'EOF'
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"crowdsec.alerts","arguments":{"limit":10}}}
EOF
```

## Integration LocalAI

Les outils IA necessitent LocalAI en cours d'execution sur l'appareil :

```sh
# Installer et demarrer LocalAI
opkg install secubox-app-localai
localaictl install
localaictl model-install tinyllama
uci set localai.main.enabled=1
uci commit localai
/etc/init.d/localai start
```

Les outils IA utiliseront automatiquement LocalAI a `http://127.0.0.1:8081` pour l'analyse.

## Considerations de Securite

1. **Liste Blanche d'Outils** : Seuls les outils listes dans la configuration UCI peuvent etre invoques
2. **uci.set Desactive** : Acces en ecriture desactive par defaut
3. **Donnees Sensibles Bloquees** : uci.get bloque les champs password/secret/key
4. **SSH Requis** : MCP s'execute sur SSH - necessite une authentification par cle
5. **Classification des Donnees** : Toutes les donnees marquees LOCAL_ONLY par defaut
6. **Pas d'Escalade Cloud** : Le serveur s'execute entierement sur l'appareil

## Fichiers

| Fichier | Description |
|---------|-------------|
| `/usr/bin/secubox-mcp` | Serveur MCP principal |
| `/usr/lib/secubox-mcp/protocol.sh` | Gestionnaire de protocole JSON-RPC |
| `/usr/lib/secubox-mcp/tools/*.sh` | Implementations des outils |
| `/etc/config/mcp-server` | Configuration UCI |

## Dependances

- `jsonfilter` — Analyse JSON (natif OpenWrt)
- `cscli` — CLI CrowdSec (pour les outils crowdsec)
- `wg` — Outils WireGuard (pour les outils wireguard)
- `secubox-app-localai` — LocalAI (pour les outils IA)

## Protocole

MCP utilise JSON-RPC 2.0 sur stdio :

- **Transport** : stdin/stdout
- **Version du Protocole** : 2024-11-05
- **Methodes** : `initialize`, `tools/list`, `tools/call`, `ping`

## Licence

MIT

## References

- [Specification Model Context Protocol](https://modelcontextprotocol.io/)
- [Guide MCP Claude Desktop](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [Documentation SecuBox](https://secubox.dev/docs)
