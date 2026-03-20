# SecuBox Streamlit Platform

> **Languages:** [English](README.md) | Francais | [中文](README.zh.md)

Plateforme d'hebergement Streamlit multi-instances pour OpenWrt avec conteneurs LXC et integration Gitea.

## Fonctionnalites

- **Support multi-instances** : Executez plusieurs applications Streamlit sur differents ports
- **Applications par dossier** : Chaque application dans son propre repertoire avec ses dependances
- **Integration Gitea** : Clonez et synchronisez des applications directement depuis les depots Gitea
- **Isolation LXC** : Les applications s'executent dans un conteneur Alpine Linux isole
- **Installation automatique des dependances** : `requirements.txt` traite automatiquement

## Demarrage rapide

### 1. Installation et activation

```bash
opkg install secubox-app-streamlit
/etc/init.d/streamlit enable
streamlitctl install
```

### 2. Creer votre premiere application

```bash
streamlitctl app create myapp
streamlitctl instance add myapp 8502
/etc/init.d/streamlit restart
```

Acces a : `http://<device-ip>:8502`

## Deploiement depuis Gitea

La plateforme s'integre avec Gitea pour le deploiement d'applications versionne.

### Configuration des identifiants Gitea

```bash
# Configurer la connexion Gitea
uci set streamlit.gitea.enabled=1
uci set streamlit.gitea.url='http://192.168.255.1:3000'
uci set streamlit.gitea.user='admin'
uci set streamlit.gitea.token='your-access-token'
uci commit streamlit

# Stocker les identifiants git dans le conteneur
streamlitctl gitea setup
```

### Cloner une application depuis un depot Gitea

**Methode 1 : Utiliser streamlitctl (recommande)**

```bash
# Cloner avec le raccourci du depot (utilisateur/repo)
streamlitctl gitea clone yijing CyberMood/yijing-oracle

# Ajouter une instance sur un port
streamlitctl instance add yijing 8505

# Redemarrer pour appliquer
/etc/init.d/streamlit restart
```

**Methode 2 : Clone manuel + Configuration UCI**

```bash
# Cloner directement dans le repertoire des applications
git clone http://192.168.255.1:3000/CyberMood/yijing-oracle.git /srv/streamlit/apps/yijing

# Enregistrer dans UCI
uci set streamlit.yijing=app
uci set streamlit.yijing.name='Yijing Oracle'
uci set streamlit.yijing.path='yijing/app.py'
uci set streamlit.yijing.enabled='1'
uci set streamlit.yijing.port='8505'
uci commit streamlit

# Ajouter l'instance et redemarrer
streamlitctl instance add yijing 8505
/etc/init.d/streamlit restart
```

### Mettre a jour une application depuis Gitea

```bash
# Recuperer les derniers changements
streamlitctl gitea pull yijing

# Redemarrer pour appliquer les changements
/etc/init.d/streamlit restart
```

## Structure des dossiers d'applications

Chaque application reside dans `/srv/streamlit/apps/<appname>/` :

```
/srv/streamlit/apps/myapp/
├── app.py              # Point d'entree principal (ou main.py, <appname>.py)
├── requirements.txt    # Dependances Python (installees automatiquement)
├── .streamlit/         # Configuration Streamlit optionnelle
│   └── config.toml
└── ...                 # Autres fichiers (pages/, data/, etc.)
```

**Ordre de detection du fichier principal** : `app.py` > `main.py` > `<appname>.py` > premier fichier `.py`

## Reference CLI

### Gestion du conteneur

```bash
streamlitctl install      # Configurer le conteneur LXC
streamlitctl uninstall    # Supprimer le conteneur (conserve les applications)
streamlitctl update       # Mettre a jour la version de Streamlit
streamlitctl status       # Afficher l'etat de la plateforme
streamlitctl logs [app]   # Voir les logs
streamlitctl shell        # Ouvrir un shell dans le conteneur
```

### Gestion des applications

```bash
streamlitctl app list                    # Lister toutes les applications
streamlitctl app create <name>           # Creer un nouveau dossier d'application
streamlitctl app delete <name>           # Supprimer une application
streamlitctl app deploy <name> <path>    # Deployer depuis un chemin/archive
```

### Gestion des instances

```bash
streamlitctl instance list               # Lister les instances
streamlitctl instance add <app> <port>   # Ajouter une instance
streamlitctl instance remove <name>      # Supprimer une instance
streamlitctl instance start <name>       # Demarrer une instance unique
streamlitctl instance stop <name>        # Arreter une instance unique
```

### Integration Gitea

```bash
streamlitctl gitea setup                 # Configurer les identifiants git
streamlitctl gitea clone <name> <repo>   # Cloner depuis Gitea
streamlitctl gitea pull <name>           # Recuperer les derniers changements
```

## Configuration UCI

Configuration principale : `/etc/config/streamlit`

```
config streamlit 'main'
    option enabled '1'
    option http_port '8501'
    option data_path '/srv/streamlit'
    option memory_limit '512M'

config streamlit 'gitea'
    option enabled '1'
    option url 'http://192.168.255.1:3000'
    option user 'admin'
    option token 'your-token'

config app 'myapp'
    option name 'My App'
    option enabled '1'
    option repo 'user/myapp'

config instance 'myapp'
    option app 'myapp'
    option port '8502'
    option enabled '1'
```

## Exemple : Workflow Gitea complet

```bash
# 1. Creer un depot dans Gitea avec votre application Streamlit
#    - app.py (fichier principal)
#    - requirements.txt (dependances)

# 2. Configurer la plateforme streamlit
uci set streamlit.gitea.enabled=1
uci set streamlit.gitea.url='http://192.168.255.1:3000'
uci set streamlit.gitea.user='admin'
uci set streamlit.gitea.token='abc123'
uci commit streamlit

# 3. Cloner et deployer
streamlitctl gitea setup
streamlitctl gitea clone myapp admin/my-streamlit-app
streamlitctl instance add myapp 8502
/etc/init.d/streamlit restart

# 4. Acceder a l'application
curl http://192.168.255.1:8502

# 5. Mettre a jour depuis Gitea quand le code change
streamlitctl gitea pull myapp
/etc/init.d/streamlit restart
```

## Integration HAProxy

Pour exposer les applications Streamlit via un vhost HAProxy :

```bash
# Ajouter un backend pour l'application
uci add haproxy backend
uci set haproxy.@backend[-1].name='streamlit_myapp'
uci set haproxy.@backend[-1].mode='http'
uci add_list haproxy.@backend[-1].server='myapp 192.168.255.1:8502'
uci commit haproxy

# Ajouter un vhost
uci add haproxy vhost
uci set haproxy.@vhost[-1].name='myapp_vhost'
uci set haproxy.@vhost[-1].domain='myapp.example.com'
uci set haproxy.@vhost[-1].backend='streamlit_myapp'
uci set haproxy.@vhost[-1].ssl='1'
uci commit haproxy

/etc/init.d/haproxy restart
```

## Depannage

**Le conteneur ne demarre pas :**
```bash
streamlitctl status
lxc-info -n streamlit
```

**L'application ne se charge pas :**
```bash
streamlitctl logs myapp
streamlitctl shell
# Dans le conteneur :
cd /srv/apps/myapp && streamlit run app.py
```

**Le clone git echoue :**
```bash
# Verifier les identifiants
streamlitctl gitea setup
# Tester manuellement
git clone http://admin:token@192.168.255.1:3000/user/repo.git /tmp/test
```

## Licence

Copyright (C) 2025 CyberMind.fr
