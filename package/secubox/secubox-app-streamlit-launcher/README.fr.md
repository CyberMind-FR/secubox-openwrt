[English](README.md) | Francais | [中文](README.zh.md)

# SecuBox Streamlit Launcher

Lanceur d'applications Streamlit a la demande avec arret sur inactivite et gestion de la memoire.

## Presentation

Le Streamlit Launcher optimise l'utilisation des ressources sur les appareils contraints par :

- **Demarrage des applications a la demande** lors du premier acces (chargement paresseux)
- **Arret des applications inactives** apres un delai configurable (defaut : 30 min)
- **Gestion de la pression memoire** en arretant les applications a basse priorite quand la memoire est faible
- **Systeme de priorite** pour garder les applications critiques en fonctionnement plus longtemps

## Architecture

```
+-------------+     +--------------+     +-----------------+
|   HAProxy   |---->|  mitmproxy   |---->| Streamlit       |
|   (vhost)   |     |  (WAF+track) |     | Launcher Daemon |
+-------------+     +--------------+     +--------+--------+
                           |                      |
                    Suivre acces             Start/Stop
                           |                      |
                    +------v------+         +-----v-----+
                    | /tmp/access |         |  slforge  |
                    |   (touch)   |         |  start/   |
                    +-------------+         |   stop    |
                                            +-----------+
```

## Installation

```bash
opkg install secubox-app-streamlit-launcher
```

## Reference CLI

```bash
# Afficher le statut
streamlit-launcherctl status

# Lister toutes les applications avec details
streamlit-launcherctl list

# Demarrer/arreter manuellement une application
streamlit-launcherctl start <app>
streamlit-launcherctl stop <app>

# Definir la priorite (plus haut = reste actif plus longtemps)
streamlit-launcherctl priority <app> <value>

# Definir toujours actif (jamais d'arret auto)
streamlit-launcherctl priority <app> 100 1

# Executer la verification d'inactivite manuellement
streamlit-launcherctl check

# Executer la verification de pression memoire
streamlit-launcherctl check-memory
```

## Configuration

Editez `/etc/config/streamlit-launcher` :

```
config global 'global'
    # Activer le daemon launcher
    option enabled '1'

    # Activer le demarrage a la demande (vs toujours actif)
    option on_demand '1'

    # Minutes d'inactivite avant arret d'une application
    option idle_timeout '30'

    # Secondes entre les verifications d'inactivite
    option check_interval '60'

    # Memoire libre minimale (Mo) avant arret force des applications
    option memory_threshold '100'

    # Secondes max d'attente pour le demarrage d'une application
    option startup_timeout '30'

# Priorites des applications (plus haut = reste actif plus longtemps)
config priority 'control'
    option app 'control'
    option value '100'
    option always_on '1'

config priority 'ytdownload'
    option app 'ytdownload'
    option value '30'
```

## Systeme de Priorite

| Priorite | Comportement |
|----------|--------------|
| 100 + always_on | Jamais arrete automatiquement |
| 80-99 | Arrete en dernier lors de pression memoire |
| 50 (defaut) | Priorite normale |
| 1-49 | Arrete en premier lors de pression memoire |

## Integration avec slforge

Le launcher fonctionne aux cotes de `slforge` (Streamlit Forge) :

- `slforge` gere la configuration, la creation et le start/stop basique des applications
- `streamlit-launcherctl` ajoute la gestion a la demande et de l'inactivite

Quand le mode a la demande est active :
1. L'utilisateur accede a `https://app.example.com`
2. HAProxy route vers mitmproxy
3. Si l'application est arretee, mitmproxy peut declencher le demarrage via hook
4. Le launcher demarre l'application et attend qu'elle soit prete
5. La requete est servie
6. L'acces est enregistre
7. Apres le delai d'inactivite, l'application est arretee

## Suivi des Acces

Le launcher suit les acces aux applications via des fichiers touch dans `/tmp/streamlit-access/` :

```bash
# Enregistrer un acces (reinitialise le timer d'inactivite)
streamlit-launcherctl track <app>

# Ou directement
touch /tmp/streamlit-access/<app>
```

Ceci peut etre declenche par :
- Hook de requete mitmproxy
- Script de health check HAProxy
- Tache cron parsant les logs d'acces

## Gestion Memoire

Quand la memoire libre descend sous le seuil :

1. Les applications sont triees par priorite (plus basse en premier)
2. Les applications a basse priorite sont arretees une par une
3. S'arrete quand la memoire remonte au-dessus du seuil
4. Les applications toujours actives ne sont jamais arretees

## Controle du Service

```bash
# Activer/demarrer le daemon
/etc/init.d/streamlit-launcher enable
/etc/init.d/streamlit-launcher start

# Verifier le statut du daemon
/etc/init.d/streamlit-launcher status

# Voir les logs
logread -e streamlit-launcher
```

## Fichiers

| Chemin | Description |
|--------|-------------|
| `/usr/sbin/streamlit-launcherctl` | Outil CLI |
| `/etc/config/streamlit-launcher` | Configuration UCI |
| `/etc/init.d/streamlit-launcher` | Script init Procd |
| `/tmp/streamlit-access/` | Fichiers de suivi des acces |
| `/usr/share/streamlit-launcher/loading.html` | Modele de page de chargement |

## Exemple : Optimiser pour Faible Memoire

```bash
# Definir un delai agressif (10 min)
uci set streamlit-launcher.global.idle_timeout='10'

# Abaisser le seuil memoire (declencher le nettoyage a 150Mo libres)
uci set streamlit-launcher.global.memory_threshold='150'

# Rendre le dashboard toujours actif
streamlit-launcherctl priority dashboard 100 1

# Abaisser la priorite des applications lourdes
streamlit-launcherctl priority jupyter 20
streamlit-launcherctl priority analytics 30

uci commit streamlit-launcher
/etc/init.d/streamlit-launcher restart
```
