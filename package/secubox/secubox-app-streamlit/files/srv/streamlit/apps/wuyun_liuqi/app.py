#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
通書 Tong Shu — Almanach Chinois Génératif
Application Streamlit par CyberMind.FR / Gandalf des Conjureurs
"""

import streamlit as st
import cnlunar
from datetime import datetime, date, timedelta
import json
import sys, os

# Import Wu Yun Liu Qi module (alongside this script)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    import wuyun_liuqi as wyql
except ImportError:
    wyql = None

# ─────────────────────────────────────────────────────
# CONFIGURATION & CONSTANTS
# ─────────────────────────────────────────────────────

HEAVENLY_STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]
EARTHLY_BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]
ZODIAC_ANIMALS = ["鼠 Rat", "牛 Bœuf", "虎 Tigre", "兔 Lapin", "龍 Dragon", "蛇 Serpent",
                  "馬 Cheval", "羊 Chèvre", "猴 Singe", "雞 Coq", "狗 Chien", "豬 Cochon"]
ZODIAC_EMOJI = ["🐀", "🐂", "🐅", "🐇", "🐉", "🐍", "🐴", "🐐", "🐒", "🐓", "🐕", "🐷"]

ELEMENTS_CN = {"甲": "木", "乙": "木", "丙": "火", "丁": "火", "戊": "土", "己": "土",
               "庚": "金", "辛": "金", "壬": "水", "癸": "水"}
ELEMENTS_FR = {"木": "Bois 🌳", "火": "Feu 🔥", "土": "Terre 🏔️", "金": "Métal ⚔️", "水": "Eau 💧"}
ELEMENTS_COLOR = {"木": "#2d8a4e", "火": "#c0392b", "土": "#b8860b", "金": "#95a5a6", "水": "#2471a3"}

YINYANG = {"甲": "Yang", "乙": "Yin", "丙": "Yang", "丁": "Yin", "戊": "Yang", "己": "Yin",
           "庚": "Yang", "辛": "Yin", "壬": "Yang", "癸": "Yin"}

STEMS_FR = {"甲": "Jiǎ", "乙": "Yǐ", "丙": "Bǐng", "丁": "Dīng", "戊": "Wù",
            "己": "Jǐ", "庚": "Gēng", "辛": "Xīn", "壬": "Rén", "癸": "Guǐ"}
BRANCHES_FR = {"子": "Zǐ", "丑": "Chǒu", "寅": "Yín", "卯": "Mǎo", "辰": "Chén",
               "巳": "Sì", "午": "Wǔ", "未": "Wèi", "申": "Shēn", "酉": "Yǒu",
               "戌": "Xū", "亥": "Hài"}

# 12 Day Officers with French translations and quality
DAY_OFFICERS = {
    "建": {"fr": "Établir (Jiàn)", "quality": "⚖️ Modéré", "color": "#f39c12", "desc": "Jour d'établissement. Favorable aux initiatives nouvelles mais avec prudence."},
    "除": {"fr": "Éliminer (Chú)", "quality": "✅ Favorable", "color": "#27ae60", "desc": "Jour d'élimination. Excellent pour le nettoyage, les soins médicaux, la purification."},
    "满": {"fr": "Plénitude (Mǎn)", "quality": "✅ Favorable", "color": "#27ae60", "desc": "Jour de plénitude. Favorable aux récoltes, célébrations et accumulations."},
    "平": {"fr": "Équilibre (Píng)", "quality": "⚖️ Modéré", "color": "#f39c12", "desc": "Jour d'équilibre. Favorable aux activités ordinaires et à la médiation."},
    "定": {"fr": "Fixation (Dìng)", "quality": "✅ Favorable", "color": "#27ae60", "desc": "Jour de fixation. Favorable aux engagements, contrats, installations."},
    "执": {"fr": "Saisir (Zhí)", "quality": "⚖️ Modéré", "color": "#f39c12", "desc": "Jour de prise en main. Favorable à la discipline et aux procédures légales."},
    "破": {"fr": "Briser (Pò)", "quality": "❌ Défavorable", "color": "#c0392b", "desc": "Jour de destruction. Favorable uniquement aux démolitions et ruptures volontaires."},
    "危": {"fr": "Danger (Wēi)", "quality": "❌ Défavorable", "color": "#c0392b", "desc": "Jour de danger. La prudence est de mise. Éviter les entreprises risquées."},
    "成": {"fr": "Accomplir (Chéng)", "quality": "✅ Favorable", "color": "#27ae60", "desc": "Jour d'accomplissement. Excellent pour conclure des affaires et célébrer."},
    "收": {"fr": "Récolter (Shōu)", "quality": "✅ Favorable", "color": "#27ae60", "desc": "Jour de récolte. Favorable aux encaissements, rentrées et conclusions."},
    "开": {"fr": "Ouvrir (Kāi)", "quality": "✅ Favorable", "color": "#27ae60", "desc": "Jour d'ouverture. Excellent pour les inaugurations et nouveaux départs."},
    "闭": {"fr": "Fermer (Bì)", "quality": "❌ Défavorable", "color": "#c0392b", "desc": "Jour de fermeture. Favorable uniquement aux enterrements et clôtures."},
}

# 12 Day Gods
DAY_GODS = {
    "青龙": {"fr": "Dragon Vert", "emoji": "🐲", "quality": "Auspicieux"},
    "明堂": {"fr": "Salle Lumineuse", "emoji": "🏛️", "quality": "Auspicieux"},
    "天刑": {"fr": "Châtiment Céleste", "emoji": "⚡", "quality": "Inauspicieux"},
    "朱雀": {"fr": "Oiseau Vermillon", "emoji": "🐦", "quality": "Inauspicieux"},
    "金匮": {"fr": "Coffre d'Or", "emoji": "📦", "quality": "Auspicieux"},
    "天德": {"fr": "Vertu Céleste", "emoji": "🌟", "quality": "Auspicieux"},
    "白虎": {"fr": "Tigre Blanc", "emoji": "🐯", "quality": "Inauspicieux"},
    "玉堂": {"fr": "Salle de Jade", "emoji": "💎", "quality": "Auspicieux"},
    "天牢": {"fr": "Prison Céleste", "emoji": "🔒", "quality": "Inauspicieux"},
    "玄武": {"fr": "Tortue Noire", "emoji": "🐢", "quality": "Inauspicieux"},
    "司命": {"fr": "Maître du Destin", "emoji": "📜", "quality": "Auspicieux"},
    "勾陈": {"fr": "Crochet de la Constellation", "emoji": "⭐", "quality": "Inauspicieux"},
}

# Activities translations (Chinese to French)
ACTIVITIES_FR = {
    "沐浴": "🛁 Bain / Purification",
    "剃头": "✂️ Coupe de cheveux",
    "经络": "💆 Acupuncture / Méridiens",
    "纳财": "💰 Encaisser de l'argent",
    "扫舍宇": "🧹 Nettoyer la maison",
    "伐木": "🪓 Couper du bois",
    "畋猎": "🏹 Chasser",
    "牧养": "🐄 Élevage",
    "选将": "⚔️ Choisir des officiers",
    "开仓": "📦 Ouvrir l'entrepôt",
    "纳畜": "🐴 Acheter du bétail",
    "安抚边境": "🏰 Sécuriser les frontières",
    "酝酿": "🍷 Brasser / Fermenter",
    "整手足甲": "💅 Manucure / Pédicure",
    "整容": "🪞 Soins esthétiques",
    "出行": "🚶 Voyager",
    "结婚姻": "💍 Fiançailles",
    "宴会": "🎉 Banquet / Réception",
    "嫁娶": "👰 Mariage",
    "修造": "🔨 Rénovation / Construction",
    "上官": "🏛️ Prise de fonction",
    "进人口": "👶 Adoption",
    "修置产室": "🏠 Aménager une propriété",
    "开渠": "💧 Creuser un canal",
    "穿井": "⛏️ Creuser un puits",
    "安碓硙": "⚙️ Installer des machines",
    "平治道涂": "🛤️ Travaux routiers",
    "破屋坏垣": "🏚️ Démolition",
    "营建": "🏗️ Construction majeure",
    "筑堤防": "🌊 Construire des digues",
    "搬移": "📦 Déménagement",
    "缮城郭": "🏯 Réparer fortifications",
    "修仓库": "🏪 Réparer entrepôt",
    "修饰垣墙": "🧱 Réparer les murs",
    "求嗣": "👶 Prier pour descendance",
    "修宫室": "🏛️ Réparer palais/maison",
    "庆赐": "🎁 Célébrer / Offrir",
    "补垣": "🧱 Réparer les clôtures",
    "纳采": "💐 Demande en mariage",
    "入学": "📚 Entrer à l'école",
    "开市": "🏪 Ouvrir un commerce",
    "立券交易": "📝 Signer des contrats",
    "裁制": "✂️ Couture / Confection",
    "祈福": "🙏 Prier pour bénédictions",
    "入宅": "🏡 Emménager",
    "安床": "🛏️ Installer le lit",
    "求医疗病": "🏥 Consulter un médecin",
    "上表章": "📋 Soumettre requête",
    "冠带": "👑 Cérémonie de passage",
    "栽种": "🌱 Planter",
    "破土": "⛏️ Terrassement",
    "安葬": "⚰️ Enterrement",
    "启攒": "🪦 Exhumation",
    "解除": "🔓 Lever restrictions",
    "鼓铸": "🔔 Fondre des métaux",
    "出师": "🎓 Partir en campagne",
    "上册": "📖 Enregistrement officiel",
    "远回": "🔙 Retour de voyage",
    "宣政事": "📣 Annonces officielles",
    "塞穴": "🕳️ Boucher des trous",
    "颁诏": "📜 Promulguer décrets",
    "招贤": "🤝 Recruter des talents",
    "恤孤茕": "🤲 Aider les orphelins",
    "布政事": "📋 Administrer",
    "雪冤": "⚖️ Réhabiliter injustice",
    "临政": "🏛️ Gouverner",
    "覃恩": "🕊️ Accorder le pardon",
    "竖柱上梁": "🏗️ Lever charpente",
}

# Solar terms with French
SOLAR_TERMS_FR = {
    "立春": "🌱 Lì Chūn — Début du Printemps",
    "雨水": "🌧️ Yǔ Shuǐ — Eau de Pluie",
    "惊蛰": "🐛 Jīng Zhé — Éveil des Insectes",
    "春分": "🌸 Chūn Fēn — Équinoxe de Printemps",
    "清明": "🍃 Qīng Míng — Pure Clarté",
    "谷雨": "🌾 Gǔ Yǔ — Pluie des Grains",
    "立夏": "☀️ Lì Xià — Début de l'Été",
    "小满": "🌿 Xiǎo Mǎn — Petite Abondance",
    "芒种": "🌾 Máng Zhǒng — Grains en Épi",
    "夏至": "🌞 Xià Zhì — Solstice d'Été",
    "小暑": "🌡️ Xiǎo Shǔ — Petite Chaleur",
    "大暑": "🔥 Dà Shǔ — Grande Chaleur",
    "立秋": "🍂 Lì Qiū — Début de l'Automne",
    "处暑": "🌅 Chǔ Shǔ — Fin de Chaleur",
    "白露": "💧 Bái Lù — Rosée Blanche",
    "秋分": "🍁 Qiū Fēn — Équinoxe d'Automne",
    "寒露": "🥶 Hán Lù — Rosée Froide",
    "霜降": "❄️ Shuāng Jiàng — Descente du Givre",
    "立冬": "🌨️ Lì Dōng — Début de l'Hiver",
    "小雪": "🌨️ Xiǎo Xuě — Petite Neige",
    "大雪": "❄️ Dà Xuě — Grande Neige",
    "冬至": "🌑 Dōng Zhì — Solstice d'Hiver",
    "小寒": "🧊 Xiǎo Hán — Petit Froid",
    "大寒": "🏔️ Dà Hán — Grand Froid",
}

# Shichen (2-hour periods) names
SHICHEN_NAMES = [
    ("子時 Zǐ", "23:00–01:00", "🐀"),
    ("丑時 Chǒu", "01:00–03:00", "🐂"),
    ("寅時 Yín", "03:00–05:00", "🐅"),
    ("卯時 Mǎo", "05:00–07:00", "🐇"),
    ("辰時 Chén", "07:00–09:00", "🐉"),
    ("巳時 Sì", "09:00–11:00", "🐍"),
    ("午時 Wǔ", "11:00–13:00", "🐴"),
    ("未時 Wèi", "13:00–15:00", "🐐"),
    ("申時 Shēn", "15:00–17:00", "🐒"),
    ("酉時 Yǒu", "17:00–19:00", "🐓"),
    ("戌時 Xū", "19:00–21:00", "🐕"),
    ("亥時 Hài", "21:00–23:00", "🐷"),
    ("子時 Zǐ (2e)", "23:00–01:00", "🐀"),
]

MOON_PHASES_FR = {
    "朔": "🌑 Nouvelle Lune (Shuò)",
    "上弦": "🌓 Premier Quartier (Shàng Xián)",
    "望": "🌕 Pleine Lune (Wàng)",
    "下弦": "🌗 Dernier Quartier (Xià Xián)",
}

STAR_ZODIAC_FR = {
    "水瓶座": "♒ Verseau",
    "双鱼座": "♓ Poissons",
    "白羊座": "♈ Bélier",
    "金牛座": "♉ Taureau",
    "双子座": "♊ Gémeaux",
    "巨蟹座": "♋ Cancer",
    "狮子座": "♌ Lion",
    "处女座": "♍ Vierge",
    "天秤座": "♎ Balance",
    "天蝎座": "♏ Scorpion",
    "射手座": "♐ Sagittaire",
    "摩羯座": "♑ Capricorne",
}

QUALITY_LEVEL_FR = {
    -1: ("⬛ Sans qualité particulière", "#7f8c8d"),
    0: ("🟢 Supérieur — Le bon l'emporte sur le mauvais", "#27ae60"),
    1: ("🟡 Favorable — Le bon contre le mauvais", "#f1c40f"),
    2: ("🟠 Moyen — Le bon ne compense pas le mauvais", "#e67e22"),
    3: ("🔴 Inférieur — Le mauvais domine", "#c0392b"),
}

# Chinese zodiac single characters to French with emoji
ZODIAC_CN_FR = {
    "鼠": "🐀 Rat", "子": "🐀 Rat",
    "牛": "🐂 Bœuf", "丑": "🐂 Bœuf",
    "虎": "🐅 Tigre", "寅": "🐅 Tigre",
    "兔": "🐇 Lapin", "卯": "🐇 Lapin",
    "龙": "🐉 Dragon", "龍": "🐉 Dragon", "辰": "🐉 Dragon",
    "蛇": "🐍 Serpent", "巳": "🐍 Serpent",
    "马": "🐴 Cheval", "馬": "🐴 Cheval", "午": "🐴 Cheval",
    "羊": "🐐 Chèvre", "未": "🐐 Chèvre",
    "猴": "🐒 Singe", "申": "🐒 Singe",
    "鸡": "🐓 Coq", "雞": "🐓 Coq", "酉": "🐓 Coq",
    "狗": "🐕 Chien", "戌": "🐕 Chien",
    "猪": "🐷 Cochon", "豬": "🐷 Cochon", "亥": "🐷 Cochon",
}

def translate_zodiac(cn_text):
    """Translate Chinese zodiac characters to French with emoji."""
    if not cn_text:
        return cn_text
    result = cn_text
    for cn, fr in ZODIAC_CN_FR.items():
        result = result.replace(cn, fr)
    return result

def translate_zodiac_list(cn_list):
    """Translate a list of Chinese zodiac characters to French."""
    return [translate_zodiac(item) for item in cn_list]


# ─────────────────────────────────────────────────────
# HELPER FUNCTIONS
# ─────────────────────────────────────────────────────

def get_element_info(stem):
    """Get element name, color and yin/yang from a Heavenly Stem."""
    elem = ELEMENTS_CN.get(stem, "?")
    return elem, ELEMENTS_FR.get(elem, elem), ELEMENTS_COLOR.get(elem, "#333"), YINYANG.get(stem, "?")


def get_branch_animal(branch):
    """Get zodiac animal from Earthly Branch."""
    idx = EARTHLY_BRANCHES.index(branch) if branch in EARTHLY_BRANCHES else -1
    if idx >= 0:
        return ZODIAC_ANIMALS[idx], ZODIAC_EMOJI[idx]
    return "?", "?"


def format_pillar(chars):
    """Format a BaZi pillar with element info."""
    if len(chars) >= 2:
        stem, branch = chars[0], chars[1]
        elem_cn, elem_fr, color, yy = get_element_info(stem)
        animal, emoji = get_branch_animal(branch)
        pinyin_s = STEMS_FR.get(stem, "")
        pinyin_b = BRANCHES_FR.get(branch, "")
        return {
            "chars": chars,
            "stem": stem,
            "branch": branch,
            "element_cn": elem_cn,
            "element_fr": elem_fr,
            "color": color,
            "yinyang": yy,
            "animal": animal,
            "emoji": emoji,
            "pinyin": f"{pinyin_s} {pinyin_b}"
        }
    return {"chars": chars, "stem": "?", "branch": "?", "element_cn": "?",
            "element_fr": "?", "color": "#333", "yinyang": "?", "animal": "?",
            "emoji": "?", "pinyin": "?"}


def translate_activity(act_cn):
    """Translate a Chinese activity to French."""
    return ACTIVITIES_FR.get(act_cn, f"📌 {act_cn}")


def get_lunar_data(selected_date, hour=12):
    """Get all Tong Shu data for a given date."""
    dt = datetime(selected_date.year, selected_date.month, selected_date.day, hour, 0)
    lunar = cnlunar.Lunar(dt)
    return lunar


def render_pillar_card(pillar_info, label_cn, label_fr):
    """Render a single BaZi pillar as styled HTML."""
    p = pillar_info
    return f"""
    <div style="text-align:center; padding:15px; margin:8px;
                background: linear-gradient(135deg, rgba(40,40,50,0.8), rgba(30,30,40,0.9));
                border: 2px solid {p['color']}; border-radius:14px; min-width:130px;
                box-shadow: 0 0 15px {p['color']}40;">
        <div style="font-size:0.85em; color:#aaa; margin-bottom:6px;">{label_cn}<br/><span style="color:#888;">{label_fr}</span></div>
        <div style="font-size:2.5em; font-weight:bold; color:{p['color']}; line-height:1.1; text-shadow: 0 0 10px {p['color']}80;">
            {p['chars']}
        </div>
        <div style="font-size:0.9em; color:#999; margin-top:4px;">{p['pinyin']}</div>
        <div style="font-size:1em; margin-top:8px;">
            <span style="color:{p['color']}; font-weight:bold;">{p['element_fr']}</span>
        </div>
        <div style="font-size:0.9em; color:#aaa;">{p['yinyang']}</div>
        <div style="font-size:1.6em; margin-top:6px;">{p['emoji']}</div>
        <div style="font-size:0.85em; color:#999;">{p['animal']}</div>
    </div>
    """


# ─────────────────────────────────────────────────────
# STREAMLIT APP
# ─────────────────────────────────────────────────────

st.set_page_config(
    page_title="通書 Tong Shu — Almanach Chinois",
    page_icon="📅",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&family=Noto+Sans+SC:wght@300;400;700&display=swap');

    .main-title {
        text-align: center;
        font-family: 'Noto Serif SC', serif;
        font-size: 3.2em;
        color: #ff6b6b;
        margin-bottom: 0;
        text-shadow: 0 0 20px rgba(255,107,107,0.5);
    }
    .sub-title {
        text-align: center;
        font-family: 'Noto Sans SC', sans-serif;
        font-size: 1.2em;
        color: #aaa;
        margin-top: -5px;
        margin-bottom: 20px;
    }
    .date-banner {
        text-align: center;
        background: linear-gradient(135deg, rgba(139,0,0,0.8), rgba(204,51,51,0.8), rgba(139,0,0,0.8));
        color: #ffd700;
        padding: 25px;
        border-radius: 16px;
        margin: 10px 0 20px 0;
        font-family: 'Noto Serif SC', serif;
        box-shadow: 0 4px 20px rgba(255,107,107,0.3);
        border: 1px solid rgba(255,215,0,0.3);
    }
    .date-banner h1 { color: #ffd700; margin: 0; font-size: 2.2em; }
    .date-banner h2 { color: #ffe0b2; margin: 5px 0; font-size: 1.3em; font-weight: 300; }
    .date-banner h3 { color: #ffcc80; margin: 5px 0; font-size: 1.1em; font-weight: 300; }

    .section-header {
        font-family: 'Noto Serif SC', serif;
        color: #ff6b6b;
        border-bottom: 2px solid #ff6b6b;
        padding-bottom: 10px;
        margin-top: 30px;
        font-size: 1.6em;
        text-shadow: 0 0 10px rgba(255,107,107,0.3);
    }

    .pillars-container {
        display: flex;
        justify-content: center;
        gap: 15px;
        flex-wrap: wrap;
        margin: 20px 0;
    }

    .info-card {
        background: rgba(40,40,50,0.6);
        border: 1px solid rgba(255,107,107,0.3);
        border-radius: 12px;
        padding: 18px;
        margin: 10px 0;
        backdrop-filter: blur(10px);
    }

    .activity-good {
        background: linear-gradient(135deg, rgba(39,174,96,0.2), rgba(39,174,96,0.1));
        border-left: 4px solid #27ae60;
        padding: 10px 16px;
        margin: 5px 0;
        border-radius: 0 8px 8px 0;
        font-size: 1em;
        color: #7dcea0;
    }
    .activity-bad {
        background: linear-gradient(135deg, rgba(192,57,43,0.2), rgba(192,57,43,0.1));
        border-left: 4px solid #c0392b;
        padding: 10px 16px;
        margin: 5px 0;
        border-radius: 0 8px 8px 0;
        font-size: 1em;
        color: #f1948a;
    }

    .god-tag-good {
        display: inline-block;
        background: rgba(39,174,96,0.2);
        color: #7dcea0;
        padding: 6px 12px;
        margin: 4px;
        border-radius: 20px;
        font-size: 0.9em;
        border: 1px solid rgba(39,174,96,0.5);
    }
    .god-tag-bad {
        display: inline-block;
        background: rgba(192,57,43,0.2);
        color: #f1948a;
        padding: 6px 12px;
        margin: 4px;
        border-radius: 20px;
        font-size: 0.9em;
        border: 1px solid rgba(192,57,43,0.5);
    }

    .shichen-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        border-radius: 12px;
        overflow: hidden;
    }
    .shichen-table th {
        background: linear-gradient(135deg, #8b0000, #cc3333);
        color: #ffd700;
        padding: 12px;
        font-family: 'Noto Sans SC', sans-serif;
        font-size: 1.05em;
    }
    .shichen-table td {
        padding: 10px 12px;
        border-bottom: 1px solid rgba(255,107,107,0.2);
        text-align: center;
        background: rgba(40,40,50,0.4);
    }
    .shichen-current {
        background: rgba(255,107,107,0.2) !important;
        font-weight: bold;
        color: #ffd700;
    }

    .solar-term-box {
        background: linear-gradient(135deg, rgba(39,174,96,0.15), rgba(243,156,18,0.15));
        border: 2px solid rgba(243,156,18,0.5);
        border-radius: 12px;
        padding: 18px;
        margin: 12px 0;
        text-align: center;
    }

    .officer-badge {
        display: inline-block;
        padding: 10px 24px;
        border-radius: 25px;
        font-size: 1.2em;
        font-weight: bold;
        margin: 6px;
    }

    .footer {
        text-align: center;
        color: #888;
        padding: 25px;
        font-size: 0.9em;
        border-top: 1px solid rgba(255,107,107,0.2);
        margin-top: 40px;
    }

    div[data-testid="stSidebar"] {
        background: linear-gradient(180deg, rgba(40,40,50,0.95), rgba(30,30,40,0.95));
    }

    .stDateInput > div > div > input {
        font-size: 1.1em;
    }
</style>
""", unsafe_allow_html=True)


# ─── SIDEBAR ──────────────────────────────────────────

with st.sidebar:
    st.markdown("## 📅 Sélection de la Date")
    selected_date = st.date_input(
        "Choisir une date",
        value=date.today(),
        min_value=date(1901, 1, 1),
        max_value=date(2099, 12, 31),
        format="DD/MM/YYYY"
    )

    st.markdown("---")

    # Quick navigation
    st.markdown("### ⚡ Navigation Rapide")
    col1, col2 = st.columns(2)
    with col1:
        if st.button("◀ Hier", use_container_width=True):
            st.session_state['nav_date'] = selected_date - timedelta(days=1)
            st.rerun()
    with col2:
        if st.button("Demain ▶", use_container_width=True):
            st.session_state['nav_date'] = selected_date + timedelta(days=1)
            st.rerun()

    if st.button("📌 Aujourd'hui", use_container_width=True):
        st.session_state['nav_date'] = date.today()
        st.rerun()

    st.markdown("---")

    # Week view
    st.markdown("### 📆 Vue Semaine")
    week_start = selected_date - timedelta(days=selected_date.weekday())
    for i in range(7):
        d = week_start + timedelta(days=i)
        try:
            lunar_d = get_lunar_data(d)
            officer = lunar_d.today12DayOfficer
            officer_info = DAY_OFFICERS.get(officer, {})
            quality_icon = "🟢" if "Favorable" in officer_info.get("quality", "") else (
                "🔴" if "Défavorable" in officer_info.get("quality", "") else "🟡"
            )
            label = f"{quality_icon} {d.strftime('%a %d/%m')} — {officer}"
            is_today = d == selected_date
            if st.button(label, key=f"week_{i}", use_container_width=True,
                        type="primary" if is_today else "secondary"):
                st.session_state['nav_date'] = d
                st.rerun()
        except Exception:
            st.button(f"📅 {d.strftime('%a %d/%m')}", key=f"week_{i}",
                     use_container_width=True, disabled=True)

    st.markdown("---")
    st.markdown("""
    <div style="text-align:center; font-size:0.8em; color:#888;">
        通書 Tong Shu v1.0<br/>
        CyberMind.FR<br/>
        🧙‍♂️ Gandalf des Conjureurs
    </div>
    """, unsafe_allow_html=True)


# Handle navigation state
if 'nav_date' in st.session_state:
    selected_date = st.session_state.pop('nav_date')

# ─── MAIN CONTENT ─────────────────────────────────────

try:
    lunar = get_lunar_data(selected_date)
except Exception as e:
    st.error(f"Erreur de calcul pour cette date: {e}")
    st.stop()

# Title
st.markdown('<div class="main-title">通書 Tong Shu</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-title">Almanach Chinois Génératif — 中國曆法</div>', unsafe_allow_html=True)

# ─── DATE BANNER ──────────────────────────────────────

weekday_fr = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
month_fr = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet",
            "Août", "Septembre", "Octobre", "Novembre", "Décembre"]

gregorian_str = f"{weekday_fr[selected_date.weekday()]} {selected_date.day} {month_fr[selected_date.month-1]} {selected_date.year}"
lunar_str = f"{lunar.lunarYearCn}年 {lunar.lunarMonthCn} {lunar.lunarDayCn}"
year_animal_idx = EARTHLY_BRANCHES.index(lunar.year8Char[1]) if lunar.year8Char[1] in EARTHLY_BRANCHES else 0

solar_term_today = ""
if lunar.todaySolarTerms and lunar.todaySolarTerms != "无":
    solar_term_today = f"<h3>🌿 {SOLAR_TERMS_FR.get(lunar.todaySolarTerms, lunar.todaySolarTerms)}</h3>"

st.markdown(f"""
<div class="date-banner">
    <h2>{gregorian_str}</h2>
    <h1>{ZODIAC_EMOJI[year_animal_idx]} {lunar_str}</h1>
    <h3>Année {lunar.year8Char} · Mois {lunar.month8Char} · Jour {lunar.day8Char}</h3>
    <h3>{STAR_ZODIAC_FR.get(lunar.starZodiac, lunar.starZodiac)} · Saison : {lunar.lunarSeason}</h3>
    {solar_term_today}
</div>
""", unsafe_allow_html=True)


# ─── DAY QUALITY & OFFICER ────────────────────────────

st.markdown('<div class="section-header">🏷️ Qualité du Jour · 日質</div>', unsafe_allow_html=True)

officer = lunar.today12DayOfficer
officer_info = DAY_OFFICERS.get(officer, {"fr": officer, "quality": "?", "color": "#666", "desc": ""})
god12 = lunar.today12DayGod
god12_info = DAY_GODS.get(god12, {"fr": god12, "emoji": "⭐", "quality": "?"})

level_info = QUALITY_LEVEL_FR.get(lunar.todayLevel, ("?", "#666"))

col1, col2, col3 = st.columns(3)

with col1:
    st.markdown(f"""
    <div style="background:rgba(40,40,50,0.6); border:1px solid rgba(255,107,107,0.3); border-radius:12px; padding:15px; margin:8px 0; text-align:center;">
        <div style="font-size:0.85em; color:#888;">Officier du Jour 日值</div>
        <div style="font-size:2.5em; color:{officer_info['color']}; font-weight:bold; margin:5px 0;">
            {officer}
        </div>
        <div style="font-size:1em;">{officer_info['fr']}</div>
        <div class="officer-badge" style="background:{officer_info['color']}20; color:{officer_info['color']};">
            {officer_info['quality']}
        </div>
        <div style="font-size:0.85em; color:#666; margin-top:8px;">{officer_info['desc']}</div>
    </div>
    """, unsafe_allow_html=True)

with col2:
    st.markdown(f"""
    <div style="background:rgba(40,40,50,0.6); border:1px solid rgba(255,107,107,0.3); border-radius:12px; padding:15px; margin:8px 0; text-align:center;">
        <div style="font-size:0.85em; color:#888;">Divinité du Jour 神煞</div>
        <div style="font-size:2.5em; margin:5px 0;">
            {god12_info['emoji']}
        </div>
        <div style="font-size:1.1em; font-weight:bold;">{god12} — {god12_info['fr']}</div>
        <div style="font-size:0.9em; color:{'#27ae60' if god12_info['quality'] == 'Auspicieux' else '#c0392b'};">
            {god12_info['quality']}
        </div>
    </div>
    """, unsafe_allow_html=True)

with col3:
    st.markdown(f"""
    <div style="background:rgba(40,40,50,0.6); border:1px solid rgba(255,107,107,0.3); border-radius:12px; padding:15px; margin:8px 0; text-align:center;">
        <div style="font-size:0.85em; color:#888;">Constellation 宿</div>
        <div style="font-size:2em; font-weight:bold; color:#8b0000; margin:5px 0;">
            {lunar.today28Star}
        </div>
        <div style="font-size:0.85em; color:#666; margin-top:8px;">Niveau du jour</div>
        <div style="font-size:0.9em; color:{level_info[1]}; font-weight:bold;">
            {level_info[0]}
        </div>
    </div>
    """, unsafe_allow_html=True)


# ─── FOUR PILLARS ─────────────────────────────────────

st.markdown('<div class="section-header">🏛️ Quatre Piliers (四柱 Sì Zhù)</div>', unsafe_allow_html=True)

# Get current hour pillar
now = datetime.now()
current_hour_idx = ((now.hour + 1) % 24) // 2
if now.hour == 23 or now.hour == 0:
    current_hour_idx = 0

pillar_year = format_pillar(lunar.year8Char)
pillar_month = format_pillar(lunar.month8Char)
pillar_day = format_pillar(lunar.day8Char)
pillar_hour = format_pillar(lunar.twohour8Char)

pillars_html = f"""
<div class="pillars-container">
    {render_pillar_card(pillar_year, "年柱", "Année")}
    {render_pillar_card(pillar_month, "月柱", "Mois")}
    {render_pillar_card(pillar_day, "日柱", "Jour")}
    {render_pillar_card(pillar_hour, "時柱", "Heure")}
</div>
"""
st.html(pillars_html)


# ─── CLASH & DIRECTIONS ──────────────────────────────

st.markdown('<div class="section-header">🧭 Conflits & Directions · 沖煞方位</div>', unsafe_allow_html=True)

col1, col2 = st.columns(2)

with col1:
    st.markdown(f"""
    <div style="background:rgba(40,40,50,0.6); border:1px solid rgba(255,107,107,0.3); border-radius:12px; padding:18px; margin:8px 0;">
        <h4 style="color:#ff6b6b; font-size:1.2em; margin-bottom:12px;">⚡ Conflit du Jour · 日沖</h4>
        <p style="font-size:1.2em; color:#eee;">{translate_zodiac(lunar.chineseZodiacClash)}</p>
        <p style="font-size:1em; color:#bbb; line-height:1.8;">
            🐾 Animal en conflit : <strong style="color:#f1948a;">{translate_zodiac(lunar.zodiacLose)}</strong><br/>
            🐾 Animal favorable : <strong style="color:#7dcea0;">{translate_zodiac(lunar.zodiacWin)}</strong><br/>
            🤝 Trinité (三合 Sān Hé) : <strong style="color:#aaa;">{', '.join(translate_zodiac_list(lunar.zodiacMark3List))}</strong><br/>
            🔗 Harmonie (六合 Liù Hé) : <strong style="color:#aaa;">{translate_zodiac(lunar.zodiacMark6)}</strong>
        </p>
    </div>
    """, unsafe_allow_html=True)

with col2:
    # Wealth/Joy/Happiness god directions based on day stem
    stem = lunar.day8Char[0]
    # Direction mapping based on Day Stem (traditional)
    joy_dirs = {"甲": "東北", "乙": "西北", "丙": "西南", "丁": "正南", "戊": "東南",
                "己": "東北", "庚": "西北", "辛": "西南", "壬": "正南", "癸": "東南"}
    wealth_dirs = {"甲": "東北", "乙": "正北", "丙": "正西", "丁": "西北", "戊": "正北",
                   "己": "正南", "庚": "東南", "辛": "正東", "壬": "正南", "癸": "東南"}
    happiness_dirs = {"甲": "東北", "乙": "西北", "丙": "西南", "丁": "東南", "戊": "正北",
                      "己": "東南", "庚": "西南", "辛": "東北", "壬": "正北", "癸": "正南"}

    dir_fr = {"東北": "Nord-Est", "西北": "Nord-Ouest", "西南": "Sud-Ouest", "正南": "Sud",
              "東南": "Sud-Est", "正北": "Nord", "正西": "Ouest", "正東": "Est"}

    joy_d = joy_dirs.get(stem, "?")
    wealth_d = wealth_dirs.get(stem, "?")
    happy_d = happiness_dirs.get(stem, "?")

    st.markdown(f"""
    <div style="background:rgba(40,40,50,0.6); border:1px solid rgba(255,107,107,0.3); border-radius:12px; padding:18px; margin:8px 0;">
        <h4 style="color:#ffd700; font-size:1.2em; margin-bottom:12px;">🧭 Directions Propices · 吉方</h4>
        <p style="font-size:1.05em; color:#bbb; line-height:2;">
            😊 <strong style="color:#eee;">Joie (喜神) :</strong> <span style="color:#7dcea0;">{joy_d}</span> — {dir_fr.get(joy_d, joy_d)}<br/>
            🤑 <strong style="color:#eee;">Richesse (財神) :</strong> <span style="color:#f7dc6f;">{wealth_d}</span> — {dir_fr.get(wealth_d, wealth_d)}<br/>
            🙏 <strong style="color:#eee;">Bonheur (福神) :</strong> <span style="color:#85c1e9;">{happy_d}</span> — {dir_fr.get(happy_d, happy_d)}
        </p>
    </div>
    """, unsafe_allow_html=True)


# ─── AUSPICIOUS & INAUSPICIOUS ────────────────────────

st.markdown('<div class="section-header">📋 Activités du Jour · 宜忌</div>', unsafe_allow_html=True)

col1, col2 = st.columns(2)

with col1:
    st.markdown("#### ✅ Activités Favorables (宜)")
    good_things = lunar.goodThing or []
    if good_things:
        for act in good_things:
            translated = translate_activity(act)
            st.markdown(f'<div class="activity-good">{translated}</div>', unsafe_allow_html=True)
    else:
        st.markdown('<div class="activity-bad">Aucune activité particulièrement favorable</div>',
                   unsafe_allow_html=True)

with col2:
    st.markdown("#### ❌ Activités à Éviter (忌)")
    bad_things = lunar.badThing or []
    if bad_things:
        for act in bad_things:
            translated = translate_activity(act)
            st.markdown(f'<div class="activity-bad">{translated}</div>', unsafe_allow_html=True)
    else:
        st.markdown('<div class="activity-good">Aucune restriction particulière</div>',
                   unsafe_allow_html=True)


# ─── GODS & SPIRITS ──────────────────────────────────

st.markdown('<div class="section-header">👼 Divinités & Esprits (神煞)</div>', unsafe_allow_html=True)

col1, col2 = st.columns(2)

with col1:
    st.markdown("#### 🌟 Divinités Favorables (吉神)")
    gods_html = ""
    for god in (lunar.goodGodName or []):
        gods_html += f'<span class="god-tag-good">✨ {god}</span>'
    st.markdown(gods_html or "—", unsafe_allow_html=True)

with col2:
    st.markdown("#### 👹 Esprits Défavorables (凶神)")
    demons_html = ""
    for demon in (lunar.badGodName or []):
        demons_html += f'<span class="god-tag-bad">⚠️ {demon}</span>'
    st.markdown(demons_html or "—", unsafe_allow_html=True)


# ─── HOURLY PILLARS (SHICHEN) ────────────────────────

st.markdown('<div class="section-header">⏰ Heures Chinoises (時辰 Shí Chen)</div>', unsafe_allow_html=True)

hour_pillars = lunar.twohour8CharList or []
now_hour = datetime.now().hour
is_today = selected_date == date.today()

table_html = '<table class="shichen-table"><thead><tr>'
table_html += '<th>時辰</th><th>Période</th><th>Pilier 柱</th><th>Élément</th><th>Animal</th>'
table_html += '</tr></thead><tbody>'

for i, (name, period, emoji) in enumerate(SHICHEN_NAMES):
    if i < len(hour_pillars):
        p = format_pillar(hour_pillars[i])
        # Determine if this is the current shichen
        is_current = False
        if is_today:
            if i == 0 and (now_hour == 23 or now_hour == 0):
                is_current = True
            elif i > 0 and i < 12:
                start_hour = (2 * i - 1)
                end_hour = start_hour + 2
                if start_hour <= now_hour < end_hour:
                    is_current = True
            elif i == 12 and (now_hour == 23):
                is_current = True

        row_class = 'class="shichen-current"' if is_current else ''
        current_marker = " 👈 MAINTENANT" if is_current else ""
        table_html += f'<tr {row_class}>'
        table_html += f'<td>{emoji} {name}</td>'
        table_html += f'<td>{period}</td>'
        table_html += f'<td style="font-size:1.3em; font-weight:bold; color:{p["color"]};">{p["chars"]}</td>'
        table_html += f'<td>{p["element_fr"]}</td>'
        table_html += f'<td>{p["emoji"]} {p["animal"]}{current_marker}</td>'
        table_html += '</tr>'

table_html += '</tbody></table>'
st.html(table_html)


# ─── SOLAR TERMS ──────────────────────────────────────

st.markdown('<div class="section-header">🌿 Termes Solaires (節氣 Jié Qì)</div>', unsafe_allow_html=True)

# Next solar term
next_st = lunar.nextSolarTerm
next_st_date = lunar.nextSolarTermDate
next_st_year = lunar.nextSolarTermYear if hasattr(lunar, 'nextSolarTermYear') else selected_date.year

if next_st and next_st != "无":
    next_st_fr = SOLAR_TERMS_FR.get(next_st, next_st)
    try:
        next_date_str = f"{next_st_date[1]:02d}/{next_st_date[0]:02d}/{next_st_year}"
        days_until = (date(next_st_year, next_st_date[0], next_st_date[1]) - selected_date).days
    except Exception:
        next_date_str = str(next_st_date)
        days_until = "?"

    st.markdown(f"""
    <div class="solar-term-box">
        <div style="font-size:1.3em; font-weight:bold;">{next_st_fr}</div>
        <div style="font-size:0.95em; color:#666; margin-top:5px;">
            Prochain terme solaire : {next_date_str}
            {"— dans " + str(days_until) + " jour(s)" if isinstance(days_until, int) and days_until > 0 else "— Aujourd'hui !" if days_until == 0 else ""}
        </div>
    </div>
    """, unsafe_allow_html=True)

# Show all 24 solar terms for the year
with st.expander("📜 Voir les 24 Termes Solaires de l'année"):
    terms_dict = lunar.thisYearSolarTermsDic or {}
    cols = st.columns(4)
    for idx, (term_cn, (m, d)) in enumerate(terms_dict.items()):
        term_fr = SOLAR_TERMS_FR.get(term_cn, term_cn)
        try:
            term_date = date(selected_date.year, m, d)
            is_past = term_date < selected_date
            is_today_term = term_date == selected_date
            style = "color:#27ae60; font-weight:bold;" if is_today_term else (
                "color:#999;" if is_past else "color:#333;"
            )
            marker = " ◀ Aujourd'hui" if is_today_term else ""
        except Exception:
            style = "color:#333;"
            marker = ""

        with cols[idx % 4]:
            st.markdown(f'<div style="{style}">{term_fr}<br/><small>{d:02d}/{m:02d}</small>{marker}</div>',
                       unsafe_allow_html=True)


# ─── ADDITIONAL INFO ──────────────────────────────────

st.markdown('<div class="section-header">📖 Informations Complémentaires</div>', unsafe_allow_html=True)

col1, col2, col3 = st.columns(3)

with col1:
    moon_phase = lunar.phaseOfMoon if lunar.phaseOfMoon else "—"
    moon_fr = MOON_PHASES_FR.get(moon_phase, f"🌙 {moon_phase}" if moon_phase != "—" else "🌙 —")
    # Estimate moon phase from lunar day
    lunar_day = lunar.lunarDay
    if lunar_day == 1:
        moon_estimate = "🌑 Nouvelle Lune"
    elif lunar_day <= 7:
        moon_estimate = "🌒 Croissant"
    elif lunar_day <= 8:
        moon_estimate = "🌓 Premier Quartier"
    elif lunar_day <= 14:
        moon_estimate = "🌔 Gibbeuse Croissante"
    elif lunar_day == 15:
        moon_estimate = "🌕 Pleine Lune"
    elif lunar_day <= 22:
        moon_estimate = "🌖 Gibbeuse Décroissante"
    elif lunar_day <= 23:
        moon_estimate = "🌗 Dernier Quartier"
    else:
        moon_estimate = "🌘 Décroissant"

    st.markdown(f"""
    <div style="background:rgba(40,40,50,0.6); border:1px solid rgba(255,107,107,0.3); border-radius:12px; padding:15px; margin:8px 0;">
        <h4>🌙 Phase Lunaire</h4>
        <p style="font-size:1.5em; text-align:center;">{moon_estimate}</p>
        <p style="text-align:center; color:#888;">Jour lunaire : {lunar.lunarDay}</p>
    </div>
    """, unsafe_allow_html=True)

with col2:
    meridian = lunar.meridians if hasattr(lunar, 'meridians') and lunar.meridians else "—"
    meridian_fr = {
        "脾": "🟡 Rate (Pí) — Terre",
        "肺": "⚪ Poumon (Fèi) — Métal",
        "肾": "🔵 Rein (Shèn) — Eau",
        "心包": "🔴 Péricarde (Xīn Bāo) — Feu",
        "肝": "🟢 Foie (Gān) — Bois",
        "心": "🔴 Cœur (Xīn) — Feu",
        "小肠": "🔴 Intestin Grêle — Feu",
        "膀胱": "🔵 Vessie — Eau",
        "三焦": "🔴 Triple Réchauffeur — Feu",
        "胆": "🟢 Vésicule Biliaire — Bois",
        "胃": "🟡 Estomac (Wèi) — Terre",
        "大肠": "⚪ Gros Intestin — Métal",
    }
    st.markdown(f"""
    <div style="background:rgba(40,40,50,0.6); border:1px solid rgba(255,107,107,0.3); border-radius:12px; padding:15px; margin:8px 0;">
        <h4>🏥 Méridien du Jour</h4>
        <p style="font-size:1.1em; text-align:center;">
            {meridian_fr.get(meridian, meridian)}
        </p>
        <p style="text-align:center; color:#888; font-size:0.85em;">
            Organe actif selon la MTC
        </p>
    </div>
    """, unsafe_allow_html=True)

with col3:
    east_zodiac = lunar.todayEastZodiac if hasattr(lunar, 'todayEastZodiac') else "—"
    star_zodiac = STAR_ZODIAC_FR.get(lunar.starZodiac, lunar.starZodiac) if lunar.starZodiac else "—"
    st.markdown(f"""
    <div style="background:rgba(40,40,50,0.6); border:1px solid rgba(255,107,107,0.3); border-radius:12px; padding:15px; margin:8px 0;">
        <h4>⭐ Astrologie</h4>
        <p style="font-size:1.1em;">
            🌌 Zodiac Ouest : <strong>{star_zodiac}</strong><br/><br/>
            🐲 Année du : <strong>{ZODIAC_EMOJI[year_animal_idx]} {lunar.chineseYearZodiac}</strong><br/><br/>
            🌟 Demeure : <strong>{east_zodiac}</strong>
        </p>
    </div>
    """, unsafe_allow_html=True)


# ─── WU YUN LIU QI ──────────────────────────────────

if wyql:
    st.markdown('<div class="section-header">🌀 五运六气 Wǔ Yùn Liù Qì — Cinq Mouvements & Six Qi</div>',
                unsafe_allow_html=True)

    # Determine the Wu Yun Liu Qi year based on Li Chun boundary
    # Li Chun is around Feb 3-5 each year; before it, use previous year
    wyql_year = selected_date.year
    # Approximate Li Chun detection from solar terms
    try:
        terms_dict = lunar.thisYearSolarTermsDic or {}
        lichun_day = None
        for term_cn, (m, d) in terms_dict.items():
            if "立春" in term_cn:
                lichun_day = date(selected_date.year, m, d)
                break
        if lichun_day and selected_date < lichun_day:
            wyql_year = selected_date.year - 1
    except Exception:
        pass

    yi = wyql.get_year_info(wyql_year)
    liu_bu = wyql.get_liu_bu(yi["branch"])

    # Year classification badge
    cls = yi["tong_hua"] or yi["yi_hua"]
    cls_key = yi["tong_hua_key"] or yi["yi_hua_key"] or "—"
    cls_type = "运气同化" if yi["is_tong_hua"] else "运气异化"
    cls_type_fr = "Similitude" if yi["is_tong_hua"] else "Différence"

    yun_color = wyql.ELEMENTS_COLOR[yi["yun_element"]]
    st_color = wyql.ELEMENTS_COLOR[yi["sitian_elem"]]
    zq_color = wyql.ELEMENTS_COLOR[yi["zaiquan_elem"]]

    card_style = "background:rgba(40,40,50,0.6); border:1px solid rgba(255,107,107,0.3); border-radius:12px; padding:15px; margin:8px 0;"

    st.markdown(f"""
    <div style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:16px;">
        <div style="{card_style} flex:1; min-width:200px; border-top:4px solid {yun_color};">
            <div style="font-size:0.8em; color:#888;">岁运 Suì Yùn — Mouvement de l'Année</div>
            <div style="font-size:1.8em; font-weight:bold; color:{yun_color}; margin:6px 0;">
                {wyql.ELEMENTS_EMOJI[yi['yun_element']]} {yi['yun_name_cn']}
            </div>
            <div style="font-size:0.95em; color:{yun_color};">{yi['yun_name_fr']}</div>
            <div style="font-size:0.85em; color:#888; margin-top:4px;">
                {yi['chars']} · {yi['pinyin']} · {yi['emoji']} {yi['animal']}
            </div>
        </div>
        <div style="{card_style} flex:1; min-width:200px; border-top:4px solid {st_color};">
            <div style="font-size:0.8em; color:#888;">司天 Sī Tiān — Gouverneur du Ciel</div>
            <div style="font-size:1.5em; font-weight:bold; color:{st_color}; margin:6px 0;">
                {wyql.ELEMENTS_EMOJI[yi['sitian_elem']]} {yi['sitian_qi']}
            </div>
            <div style="font-size:0.9em; color:{st_color};">{yi['sitian_fr']}</div>
            <div style="font-size:0.8em; color:#888; margin-top:4px;">
                {wyql.SIX_QI[yi['sitian_qi']]['nature']}
            </div>
        </div>
        <div style="{card_style} flex:1; min-width:200px; border-top:4px solid {zq_color};">
            <div style="font-size:0.8em; color:#888;">在泉 Zài Quán — Gouverneur de la Terre</div>
            <div style="font-size:1.5em; font-weight:bold; color:{zq_color}; margin:6px 0;">
                {wyql.ELEMENTS_EMOJI[yi['zaiquan_elem']]} {yi['zaiquan_qi']}
            </div>
            <div style="font-size:0.9em; color:{zq_color};">{yi['zaiquan_fr']}</div>
            <div style="font-size:0.8em; color:#888; margin-top:4px;">
                {wyql.SIX_QI[yi['zaiquan_qi']]['nature']}
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # Classification badge
    if cls:
        st.markdown(f"""
        <div style="{card_style} border-left:6px solid {cls['color']}; padding:14px 18px;">
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                <span style="font-size:2em;">{cls['emoji']}</span>
                <div>
                    <div style="font-size:0.75em; color:#888;">{cls_type} · {cls_type_fr}</div>
                    <div style="font-size:1.4em; font-weight:bold; color:{cls['color']};">
                        {cls['cn']} — {cls['fr']}
                    </div>
                </div>
                <span style="background:{cls['color']}20; color:{cls['color']}; padding:3px 10px;
                       border-radius:12px; font-size:0.85em; font-weight:bold;
                       margin-left:auto;">{cls['short']}</span>
            </div>
            <div style="font-size:0.9em; color:#555; margin-top:8px; line-height:1.5;">
                {cls['desc']}
            </div>
        </div>
        """, unsafe_allow_html=True)

    # Liu Bu — Six Steps
    with st.expander("📊 六步 Liù Bù — Six Étapes du Qi Annuel"):
        REL_LABELS = {
            "same": ("≡ Même", "#9b59b6"),
            "generates": ("→ Engendre", "#27ae60"),
            "generated_by": ("← Engendré", "#2980b9"),
            "controls": ("⊳ Domine", "#e67e22"),
            "controlled_by": ("⊲ Dominé", "#c0392b"),
            "neutral": ("— Neutre", "#999"),
        }

        liu_bu_html = """
        <table style="width:100%; border-collapse:collapse; font-size:0.9em;">
        <thead>
            <tr style="background:#8b0000; color:white;">
                <th style="padding:8px; border-radius:8px 0 0 0;">Étape</th>
                <th style="padding:8px;">Période</th>
                <th style="padding:8px;">主气 Hôte</th>
                <th style="padding:8px;">客气 Invité</th>
                <th style="padding:8px; border-radius:0 8px 0 0;">Relation</th>
            </tr>
        </thead>
        <tbody>
        """

        # Determine current step based on selected month
        current_step = (selected_date.month - 1) // 2  # 0-5

        for step in liu_bu:
            is_current = (step["step"] - 1 == current_step)
            bg = "rgba(255,107,107,0.15)" if is_current else ("rgba(60,60,70,0.5)" if step["step"] % 2 == 0 else "rgba(40,40,50,0.5)")
            marker = ""
            if step["is_sitian"]:
                marker = '<span style="color:#8b0000; font-weight:bold;">👑 司天</span>'
            elif step["is_zaiquan"]:
                marker = '<span style="color:#2471a3; font-weight:bold;">🌍 在泉</span>'

            h_color = wyql.ELEMENTS_COLOR[step["host_elem"]]
            g_color = wyql.ELEMENTS_COLOR[step["guest_elem"]]
            rel_label, rel_color = REL_LABELS.get(step["relationship"], ("?", "#999"))

            current_marker = ' style="font-weight:bold;"' if is_current else ""
            border = "border-left:3px solid #8b0000;" if is_current else ""

            liu_bu_html += f"""
            <tr style="background:{bg}; {border}">
                <td style="padding:8px; text-align:center;"{current_marker}>
                    {step['step']} {marker}
                    {'<br/><small>▸ actuel</small>' if is_current else ''}
                </td>
                <td style="padding:8px; font-size:0.85em;">
                    {step['period_cn']}<br/>
                    <span style="color:#888; font-size:0.9em;">{step['period_fr']}</span>
                </td>
                <td style="padding:8px; text-align:center;">
                    <span style="color:{h_color}; font-weight:bold;">
                        {wyql.ELEMENTS_EMOJI[step['host_elem']]} {step['host_qi'][:4]}
                    </span>
                </td>
                <td style="padding:8px; text-align:center;">
                    <span style="color:{g_color}; font-weight:bold;">
                        {wyql.ELEMENTS_EMOJI[step['guest_elem']]} {step['guest_qi'][:4]}
                    </span>
                </td>
                <td style="padding:8px; text-align:center; color:{rel_color}; font-weight:bold;">
                    {rel_label}
                </td>
            </tr>
            """

        liu_bu_html += "</tbody></table>"
        st.html(liu_bu_html)

        st.markdown("""
        <div style="font-size:0.8em; color:#888; margin-top:10px; padding:8px; background:#f5f5f5; border-radius:6px;">
            <strong>Lecture :</strong> Chaque année est divisée en 6 étapes (~2 mois). Le Qi « Hôte » (主气) est fixe,
            le Qi « Invité » (客气) varie selon le 司天. Quand l'Invité domine l'Hôte = tensions climatiques et sanitaires.
            Quand l'Invité engendre l'Hôte = période harmonieuse.
        </div>
        """, unsafe_allow_html=True)


    # Full 60 Jiazi Wheel
    with st.expander("🔄 六十甲子 — Roue des 60 Jiazi & Classifications"):
        all_60 = wyql.get_60_jiazi()
        current_pos = wyql.year_to_position(wyql_year)

        # Render as HTML grid (avoid matplotlib CJK font issues)
        wheel_html = '<div style="display:flex; flex-wrap:wrap; gap:4px; justify-content:center;">'

        for j in all_60:
            pos = j["position"]
            is_current = (pos == current_pos)

            cls_info = j.get("tong_hua") or j.get("yi_hua")
            if cls_info:
                badge_color = cls_info["color"]
                badge_short = cls_info["short"]
                badge_emoji = cls_info["emoji"]
            else:
                badge_color = "#ccc"
                badge_short = "—"
                badge_emoji = ""

            yun_color = wyql.ELEMENTS_COLOR[j["yun_element"]]
            border = f"3px solid #8b0000" if is_current else f"1px solid {badge_color}40"
            bg = "rgba(255,107,107,0.15)" if is_current else "rgba(40,40,50,0.6)"
            shadow = "box-shadow:0 0 8px rgba(139,0,0,0.3);" if is_current else ""
            greg = wyql.get_gregorian_years(pos, start=1984, end=2103)
            greg_str = ", ".join(str(y) for y in greg[:3])

            wheel_html += f"""
            <div style="width:72px; padding:4px 2px; text-align:center; background:{bg};
                        border:{border}; border-radius:8px; font-size:0.7em; {shadow}
                        position:relative;">
                <div style="color:#888; font-size:0.85em;">{pos}</div>
                <div style="font-size:1.5em; font-weight:bold; color:{yun_color};">{j['chars']}</div>
                <div style="font-size:0.9em; color:#888;">{j['pinyin']}</div>
                <div style="font-size:1.2em;">{j['emoji']}</div>
                <div style="background:{badge_color}; color:white; border-radius:4px;
                            padding:1px 3px; font-size:0.85em; font-weight:bold;
                            margin-top:2px;">{badge_emoji} {badge_short}</div>
                <div style="color:#999; font-size:0.8em; margin-top:2px;">{greg_str}</div>
            </div>
            """

        wheel_html += '</div>'
        st.html(wheel_html)

        # Legend
        legend_th = " &nbsp;|&nbsp; ".join(
            f'<span style="color:{v["color"]}; font-weight:bold;">{v["emoji"]} {v["short"]} {v["cn"]} — {v["fr"]}</span>'
            for v in wyql.TONG_HUA.values()
        )
        legend_yh = " &nbsp;|&nbsp; ".join(
            f'<span style="color:{v["color"]}; font-weight:bold;">{v["emoji"]} {v["short"]} {v["cn"]} — {v["fr"]}</span>'
            for v in wyql.YI_HUA.values()
        )
        legend_elem = " &nbsp; ".join(
            f'<span style="color:{wyql.ELEMENTS_COLOR[e]};">● {e} {wyql.ELEMENTS_FR[e]}</span>'
            for e in wyql.ELEMENTS
        )

        st.markdown(f"""
        <div style="margin-top:16px; padding:12px; background:#f9f9f9; border-radius:8px;">
            <div style="font-size:0.8em; line-height:2;">
                <strong>运气同化 Similitude :</strong> {legend_th}<br/>
                <strong>运气异化 Différence :</strong> {legend_yh}<br/>
                <strong>五行 Cinq Éléments :</strong> {legend_elem}
            </div>
        </div>
        """, unsafe_allow_html=True)

        # Summary stats
        summary = wyql.get_summary()
        st.markdown(f"""
        <div style="font-size:0.8em; color:#888; margin-top:8px; text-align:center;">
            运气同化 : {summary['tong_hua_total']} années (TYTF:{summary['tong_hua_counts'].get('TYTF',0)},
            TF:{summary['tong_hua_counts'].get('TF',0)}, SH:{summary['tong_hua_counts'].get('SH',0)},
            TTF:{summary['tong_hua_counts'].get('TTF',0)}, TSH:{summary['tong_hua_counts'].get('TSH',0)})
            &nbsp;|&nbsp;
            运气异化 : {summary['yi_hua_total']} années
            &nbsp;|&nbsp; Total : 60/60
        </div>
        """, unsafe_allow_html=True)


# ─── MULTI-DAY VIEW ──────────────────────────────────

st.markdown('<div class="section-header">📊 Aperçu de la Semaine · 週覽</div>', unsafe_allow_html=True)

week_data = []
for i in range(-3, 4):
    d = selected_date + timedelta(days=i)
    try:
        l = get_lunar_data(d)
        off = l.today12DayOfficer
        off_info = DAY_OFFICERS.get(off, {"quality": "?", "color": "#666"})
        level = l.todayLevel
        level_info_d = QUALITY_LEVEL_FR.get(level, ("?", "#666"))
        week_data.append({
            "date": d.strftime("%d/%m"),
            "day": weekday_fr[d.weekday()][:3],
            "lunar": f"{l.lunarMonthCn} {l.lunarDayCn}",
            "pillar": l.day8Char,
            "officer": off,
            "quality": off_info["quality"],
            "color": off_info["color"],
            "is_selected": d == selected_date,
        })
    except Exception:
        pass

if week_data:
    week_html = '<div style="display:flex; gap:8px; overflow-x:auto; padding:10px 0;">'
    for wd in week_data:
        border = "3px solid #ff6b6b" if wd["is_selected"] else "1px solid rgba(255,107,107,0.3)"
        bg = "rgba(255,107,107,0.15)" if wd["is_selected"] else "rgba(40,40,50,0.6)"
        week_html += f"""
        <div style="min-width:100px; text-align:center; padding:12px 8px;
                    background:{bg}; border:{border}; border-radius:10px;">
            <div style="font-size:0.85em; color:#aaa;">{wd['day']}</div>
            <div style="font-size:1.1em; font-weight:bold; color:#eee;">{wd['date']}</div>
            <div style="font-size:0.8em; color:#999;">{wd['lunar']}</div>
            <div style="font-size:1.4em; color:{wd['color']}; font-weight:bold; margin:5px 0;">{wd['pillar']}</div>
            <div style="font-size:0.9em;">{wd['officer']}</div>
            <div style="font-size:0.75em;">{wd['quality']}</div>
        </div>
        """
    week_html += '</div>'
    st.html(week_html)


# ─── FOOTER ───────────────────────────────────────────

st.markdown(f"""
<div class="footer">
    通書 Tong Shu — Almanach Chinois Génératif<br/>
    🧙‍♂️ Créé par Gandalf des Conjureurs · CyberMind.FR<br/>
    Données basées sur le calendrier luni-solaire chinois traditionnel<br/>
    <small>Date générée : {datetime.now().strftime("%d/%m/%Y %H:%M")}</small>
</div>
""", unsafe_allow_html=True)
