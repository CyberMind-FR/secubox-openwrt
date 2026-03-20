# SecuBox Fabricator

🌐 **Langues :** [English](README.md) | Français | [中文](README.zh.md)

Constructeur de Widgets et Composants pour la plateforme SecuBox.

## Fonctionnalités

7 onglets pour construire des composants SecuBox :

1. **📊 Collecteurs** - Générateur de collecteurs de statistiques (scripts shell avec cron)
2. **🚀 Apps** - Déployeur d'applications Streamlit
3. **📝 Blogs** - Gestion de sites MetaBlogizer
4. **🌐 Statics** - Générateur de pages HTML statiques
5. **🔌 Services** - Exposition de services (Emancipate)
6. **🧩 Widgets** - Concepteur de widgets HTML
7. **🪟 Embedder** - Constructeur de pages portail (intègre apps/services/blogs)

## Déploiement

```bash
# Copier vers le routeur
scp app.py root@192.168.255.1:/srv/streamlit/apps/fabricator/

# Enregistrer l'instance
uci set streamlit.fabricator=instance
uci set streamlit.fabricator.name=fabricator
uci set streamlit.fabricator.app=fabricator
uci set streamlit.fabricator.port=8520
uci set streamlit.fabricator.enabled=1
uci commit streamlit

# Redémarrer
/etc/init.d/streamlit restart
```

## Émancipation

```bash
streamlitctl emancipate fabricator fabric.gk2.secubox.in
```

## Accès

- Local : http://192.168.255.1:8520
- Externe : https://fabric.gk2.secubox.in
