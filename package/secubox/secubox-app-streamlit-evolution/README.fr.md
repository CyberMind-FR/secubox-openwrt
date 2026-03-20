# SecuBox Evolution Dashboard

> **Languages:** [English](README.md) | Francais | [中文](README.zh.md)

Tableau de bord Streamlit interactif montrant l'evolution du projet SecuBox.

## Fonctionnalites

- **Synchronisation GitHub en temps reel** : Recupere HISTORY.md, WIP.md, TODO.md, README.md depuis la branche master
- **Suivi des jalons** : Analyse et affiche les jalons du projet avec leurs dates
- **Recherche** : Recherche plein texte dans tous les fichiers du projet
- **Vue chronologique** : Frise chronologique visuelle de l'evolution du projet
- **Distribution des fonctionnalites** : Graphiques montrant la repartition par categorie de fonctionnalites
- **Theme cyberpunk sombre** : Correspond au langage de design SecuBox

## Deploiement

1. Copier `secubox_evolution.py` dans `/srv/streamlit/apps/`
2. Ajouter l'instance : `uci set streamlit.secubox_evolution=instance && uci set streamlit.secubox_evolution.enabled='1' && uci set streamlit.secubox_evolution.app='secubox_evolution' && uci set streamlit.secubox_evolution.port='8510' && uci commit streamlit`
3. Redemarrer : `/etc/init.d/streamlit restart`
4. Acces : `http://<device-ip>:8510`

## Dependances

- streamlit >= 1.32.0
- pandas >= 2.0.0
- requests >= 2.31.0

## Sources de donnees

- GitHub : `https://raw.githubusercontent.com/gkerma/secubox-openwrt/master/.claude/`
- Rafraichissement automatique : Cache TTL de 5 minutes
