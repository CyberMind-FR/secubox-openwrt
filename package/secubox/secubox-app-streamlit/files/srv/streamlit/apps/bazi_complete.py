"""
BaZi 八字 - Calculateur Complet des Quatre Piliers du Destin
Version Streamlit avancée avec 大运, 神煞, 藏干, 十神

(c) CyberMind.FR — Gandalf des Enchanteurs
"""

import streamlit as st
from datetime import datetime, date, timedelta
import math

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════

st.set_page_config(page_title="BaZi 八字 - Calculateur Complet", page_icon="☯️", layout="wide")

# ═══════════════════════════════════════════════════════════════
# DONNÉES BaZi COMPLÈTES
# ═══════════════════════════════════════════════════════════════

STEMS = [
    {"py": "Jiǎ", "cn": "甲", "el": "wood", "yy": "yang"},
    {"py": "Yǐ", "cn": "乙", "el": "wood", "yy": "yin"},
    {"py": "Bǐng", "cn": "丙", "el": "fire", "yy": "yang"},
    {"py": "Dīng", "cn": "丁", "el": "fire", "yy": "yin"},
    {"py": "Wù", "cn": "戊", "el": "earth", "yy": "yang"},
    {"py": "Jǐ", "cn": "己", "el": "earth", "yy": "yin"},
    {"py": "Gēng", "cn": "庚", "el": "metal", "yy": "yang"},
    {"py": "Xīn", "cn": "辛", "el": "metal", "yy": "yin"},
    {"py": "Rén", "cn": "壬", "el": "water", "yy": "yang"},
    {"py": "Guǐ", "cn": "癸", "el": "water", "yy": "yin"},
]

BRANCHES = [
    {"py": "Zǐ", "cn": "子", "el": "water", "animal": "Rat", "animal_fr": "Rat",
     "hidden": [9]},  # Gui
    {"py": "Chǒu", "cn": "丑", "el": "earth", "animal": "Ox", "animal_fr": "Buffle",
     "hidden": [5, 9, 7]},  # Ji, Gui, Xin
    {"py": "Yín", "cn": "寅", "el": "wood", "animal": "Tiger", "animal_fr": "Tigre",
     "hidden": [0, 2, 4]},  # Jia, Bing, Wu
    {"py": "Mǎo", "cn": "卯", "el": "wood", "animal": "Rabbit", "animal_fr": "Lièvre",
     "hidden": [1]},  # Yi
    {"py": "Chén", "cn": "辰", "el": "earth", "animal": "Dragon", "animal_fr": "Dragon",
     "hidden": [4, 1, 9]},  # Wu, Yi, Gui
    {"py": "Sì", "cn": "巳", "el": "fire", "animal": "Snake", "animal_fr": "Serpent",
     "hidden": [2, 4, 6]},  # Bing, Wu, Geng
    {"py": "Wǔ", "cn": "午", "el": "fire", "animal": "Horse", "animal_fr": "Cheval",
     "hidden": [3, 5]},  # Ding, Ji
    {"py": "Wèi", "cn": "未", "el": "earth", "animal": "Goat", "animal_fr": "Chèvre",
     "hidden": [5, 3, 1]},  # Ji, Ding, Yi
    {"py": "Shēn", "cn": "申", "el": "metal", "animal": "Monkey", "animal_fr": "Singe",
     "hidden": [6, 8, 4]},  # Geng, Ren, Wu
    {"py": "Yǒu", "cn": "酉", "el": "metal", "animal": "Rooster", "animal_fr": "Coq",
     "hidden": [7]},  # Xin
    {"py": "Xū", "cn": "戌", "el": "earth", "animal": "Dog", "animal_fr": "Chien",
     "hidden": [4, 7, 3]},  # Wu, Xin, Ding
    {"py": "Hài", "cn": "亥", "el": "water", "animal": "Pig", "animal_fr": "Cochon",
     "hidden": [8, 0]},  # Ren, Jia
]

NAYIN = [
    "Or dans la mer", "Feu du fourneau", "Bois de la grande forêt",
    "Feu au pied de la route", "Terre du bord du chemin", "Or du sable doré",
    "Feu au pied de la montagne", "Bois de l'arbre fruitier",
    "Eau du grand fleuve", "Terre des remparts de la cité",
    "Or de la cire blanche", "Bois du saule pleureur",
    "Eau de la source limpide", "Terre du toit de la maison",
    "Feu de la foudre", "Bois du mûrier sec",
    "Eau du grand ruisseau", "Terre du sable et de la poussière",
    "Or de l'épée tranchante", "Feu du sommet de la montagne",
    "Bois de l'arbre plat", "Eau de la source jaillissante",
    "Terre de la muraille", "Or blanc étincelant",
    "Feu du ciel (Rivière céleste)", "Eau de la grande rivière",
    "Terre du désert vaste", "Or des ornements précieux",
    "Feu du foyer domestique", "Bois du cèdre centenaire",
]

HEXAGRAMS = [
    {"sym": "䷀", "n": "Qián — Le Créateur"}, {"sym": "䷁", "n": "Kūn — Le Réceptif"},
    {"sym": "䷂", "n": "Zhūn — Difficulté initiale"}, {"sym": "䷃", "n": "Méng — Folie juvénile"},
    {"sym": "䷄", "n": "Xū — L'Attente"}, {"sym": "䷅", "n": "Sòng — Le Conflit"},
    {"sym": "䷆", "n": "Shī — L'Armée"}, {"sym": "䷇", "n": "Bǐ — L'Union"},
    {"sym": "䷈", "n": "Xiǎo Chù — Petit Apprivoisement"}, {"sym": "䷉", "n": "Lǚ — La Marche"},
    {"sym": "䷊", "n": "Tài — La Paix"}, {"sym": "䷋", "n": "Pǐ — La Stagnation"},
    {"sym": "䷌", "n": "Tóng Rén — Communauté"}, {"sym": "䷍", "n": "Dà Yǒu — Grand Avoir"},
    {"sym": "䷎", "n": "Qiān — L'Humilité"}, {"sym": "䷏", "n": "Yù — L'Enthousiasme"},
    {"sym": "䷐", "n": "Suí — La Suite"}, {"sym": "䷑", "n": "Gǔ — Travail corrompu"},
    {"sym": "䷒", "n": "Lín — L'Approche"}, {"sym": "䷓", "n": "Guān — Contemplation"},
    {"sym": "䷔", "n": "Shì Kè — Mordre au travers"}, {"sym": "䷕", "n": "Bì — La Grâce"},
    {"sym": "䷖", "n": "Bō — L'Éclatement"}, {"sym": "䷗", "n": "Fù — Le Retour"},
    {"sym": "䷘", "n": "Wú Wàng — L'Innocence"}, {"sym": "䷙", "n": "Dà Chù — Grand Apprivoisement"},
    {"sym": "䷚", "n": "Yí — Les Commissures"}, {"sym": "䷛", "n": "Dà Guò — Excès du grand"},
    {"sym": "䷜", "n": "Kǎn — L'Insondable"}, {"sym": "䷝", "n": "Lí — Le Feu"},
    {"sym": "䷞", "n": "Xián — L'Influence"}, {"sym": "䷟", "n": "Héng — La Durée"},
    {"sym": "䷠", "n": "Dùn — La Retraite"}, {"sym": "䷡", "n": "Dà Zhuàng — Puissance"},
    {"sym": "䷢", "n": "Jìn — Le Progrès"}, {"sym": "䷣", "n": "Míng Yí — Obscurcissement"},
    {"sym": "䷤", "n": "Jiā Rén — La Famille"}, {"sym": "䷥", "n": "Kuí — L'Opposition"},
    {"sym": "䷦", "n": "Jiǎn — L'Obstacle"}, {"sym": "䷧", "n": "Xiè — La Libération"},
    {"sym": "䷨", "n": "Sǔn — La Diminution"}, {"sym": "䷩", "n": "Yì — L'Augmentation"},
    {"sym": "䷪", "n": "Guài — La Percée"}, {"sym": "䷫", "n": "Gòu — Venir à la rencontre"},
    {"sym": "䷬", "n": "Cuì — Le Rassemblement"}, {"sym": "䷭", "n": "Shēng — La Poussée"},
    {"sym": "䷮", "n": "Kùn — L'Accablement"}, {"sym": "䷯", "n": "Jǐng — Le Puits"},
    {"sym": "䷰", "n": "Gé — La Révolution"}, {"sym": "䷱", "n": "Dǐng — Le Chaudron"},
    {"sym": "䷲", "n": "Zhèn — L'Ébranlement"}, {"sym": "䷳", "n": "Gèn — Immobilisation"},
    {"sym": "䷴", "n": "Jiàn — Le Développement"}, {"sym": "䷵", "n": "Guī Mèi — L'Épousée"},
    {"sym": "䷶", "n": "Fēng — L'Abondance"}, {"sym": "䷷", "n": "Lǚ — Le Voyageur"},
    {"sym": "䷸", "n": "Xùn — Le Doux"}, {"sym": "䷹", "n": "Duì — Le Joyeux"},
    {"sym": "䷺", "n": "Huàn — La Dissolution"}, {"sym": "䷻", "n": "Jié — La Limitation"},
    {"sym": "䷼", "n": "Zhōng Fú — Vérité intérieure"}, {"sym": "䷽", "n": "Xiǎo Guò — Petit Excès"},
    {"sym": "䷾", "n": "Jì Jì — Après Accomplissement"}, {"sym": "䷿", "n": "Wèi Jì — Avant Accomplissement"},
]

ELEMENTS = {
    "wood":  {"emoji": "🌳", "fr": "Bois", "cn": "木", "bg": "#a5d6a7", "grad": "linear-gradient(135deg,#a5d6a7,#4caf50)", "txt": "#000"},
    "fire":  {"emoji": "🔥", "fr": "Feu", "cn": "火", "bg": "#ef9a9a", "grad": "linear-gradient(135deg,#ef9a9a,#e53935)", "txt": "#fff"},
    "earth": {"emoji": "🏔️", "fr": "Terre", "cn": "土", "bg": "#ffcc80", "grad": "linear-gradient(135deg,#ffcc80,#ff9800)", "txt": "#000"},
    "metal": {"emoji": "⚙️", "fr": "Métal", "cn": "金", "bg": "#ffd54f", "grad": "linear-gradient(135deg,#ffd54f,#ffb300)", "txt": "#000"},
    "water": {"emoji": "💧", "fr": "Eau", "cn": "水", "bg": "#b39ddb", "grad": "linear-gradient(135deg,#b39ddb,#7e57c2)", "txt": "#fff"},
}

# Dix Dieux 十神
TEN_GODS = {
    "same_yang":   {"cn": "比肩", "fr": "Épaule", "code": "BR", "desc": "Ami, compétition"},
    "same_yin":    {"cn": "劫財", "fr": "Rob Richesse", "code": "RW", "desc": "Rivalité, perte"},
    "produce_yang":{"cn": "食神", "fr": "Dieu Nourriture", "code": "EG", "desc": "Talent, expression"},
    "produce_yin": {"cn": "傷官", "fr": "Blessure Officier", "code": "HO", "desc": "Rébellion, créativité"},
    "wealth_yang":  {"cn": "偏財", "fr": "Richesse Partiale", "code": "PW", "desc": "Gains inattendus"},
    "wealth_yin":   {"cn": "正財", "fr": "Richesse Directe", "code": "DW", "desc": "Revenus stables"},
    "power_yang":   {"cn": "七殺", "fr": "7ème Tueur", "code": "7K", "desc": "Pression, autorité"},
    "power_yin":    {"cn": "正官", "fr": "Officier Direct", "code": "DO", "desc": "Discipline, statut"},
    "resource_yang":{"cn": "偏印", "fr": "Sceau Partiel", "code": "PR", "desc": "Savoir non-conventionnel"},
    "resource_yin": {"cn": "正印", "fr": "Sceau Direct", "code": "DR", "desc": "Éducation, soutien"},
}

# Cycle productif: wood->fire->earth->metal->water->wood
PRODUCTION_CYCLE = {"wood": "fire", "fire": "earth", "earth": "metal", "metal": "water", "water": "wood"}
CONTROL_CYCLE = {"wood": "earth", "fire": "metal", "earth": "water", "metal": "wood", "water": "fire"}

MONTHS_FR = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
             'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

# ═══════════════════════════════════════════════════════════════
# MOTEUR DE CALCUL
# ═══════════════════════════════════════════════════════════════

def year_pillar(y):
    return (y - 4) % 10, (y - 4) % 12

def month_pillar(y, m):
    ys = (y - 4) % 10
    return (ys * 2 + m) % 10, (m + 1) % 12

def day_pillar(y, m, d):
    base = date(1900, 1, 1)
    diff = (date(y, m, d) - base).days
    return (diff + 10) % 10, (diff + 10) % 12

def hour_pillar(day_stem, hour_branch):
    return (day_stem * 2 + hour_branch) % 10, hour_branch

def hour_to_branch(h):
    return ((h + 1) % 24) // 2

def get_nayin(si, bi):
    return NAYIN[(si // 2 + (bi // 2) * 5) % 30]

def get_hexagram(si, bi):
    return HEXAGRAMS[(si + bi) % 64]

def get_ten_god(dm_el, dm_yy, target_el, target_yy):
    """Calcule la relation des Dix Dieux entre le Maître du Jour et un autre Tronc"""
    if target_el == dm_el:
        return TEN_GODS["same_yang"] if target_yy == dm_yy else TEN_GODS["same_yin"]
    elif PRODUCTION_CYCLE[dm_el] == target_el:
        return TEN_GODS["produce_yang"] if target_yy == dm_yy else TEN_GODS["produce_yin"]
    elif PRODUCTION_CYCLE[PRODUCTION_CYCLE[dm_el]] == target_el:
        return TEN_GODS["wealth_yang"] if target_yy != dm_yy else TEN_GODS["wealth_yin"]
    elif CONTROL_CYCLE[target_el] == dm_el:
        return TEN_GODS["power_yang"] if target_yy != dm_yy else TEN_GODS["power_yin"]
    else:
        return TEN_GODS["resource_yang"] if target_yy != dm_yy else TEN_GODS["resource_yin"]

def get_symbolic_stars(day_branch, year_branch):
    """Calcule les étoiles symboliques principales"""
    stars = []
    
    # 桃花 Fleur de Pêcher (Peach Blossom)
    peach = {0: 9, 1: 6, 2: 0, 3: 9, 4: 6, 5: 0, 6: 9, 7: 6, 8: 0, 9: 6, 10: 0, 11: 9}
    pb = peach.get(day_branch, -1)
    stars.append({"cn": "桃花", "fr": "Fleur de Pêcher", "branch": pb,
                  "desc": "Charme, relations, arts", "present": False})
    
    # 天乙貴人 Noble Céleste (Heavenly Noble)
    noble_map = {
        0: [1, 7], 1: [0, 8], 2: [11, 9], 3: [11, 9],
        4: [1, 7], 5: [0, 8], 6: [1, 7], 7: [2, 6],
        8: [3, 5], 9: [3, 5]
    }
    
    # 驛馬 Cheval de Poste (Traveling Horse)
    horse_map = {0: 2, 1: 11, 2: 8, 3: 5, 4: 2, 5: 11, 6: 8, 7: 5, 8: 2, 9: 11, 10: 8, 11: 5}
    hm = horse_map.get(year_branch, -1)
    stars.append({"cn": "驛馬", "fr": "Cheval de Poste", "branch": hm,
                  "desc": "Voyages, mobilité, changements", "present": False})
    
    # 文昌 Étoile de l'Intelligence (Academic Star)
    academic_map = {0: 5, 1: 6, 2: 8, 3: 9, 4: 8, 5: 9, 6: 11, 7: 0, 8: 2, 9: 3}
    day_stem_idx = day_branch  # approximation
    
    # 華蓋 Dais de Fleurs (Canopy Star) 
    canopy_map = {0: 4, 1: 1, 2: 10, 3: 7, 4: 4, 5: 1, 6: 10, 7: 7, 8: 4, 9: 1, 10: 10, 11: 7}
    cn = canopy_map.get(year_branch, -1)
    stars.append({"cn": "華蓋", "fr": "Dais de Fleurs", "branch": cn,
                  "desc": "Spiritualité, solitude, sagesse", "present": False})
    
    # 天德 Vertu Céleste
    stars.append({"cn": "天德", "fr": "Vertu Céleste", "branch": -1,
                  "desc": "Protection, bienveillance", "present": False})
    
    # 紅鸞 Phénix Rouge (Red Phoenix)
    phoenix_map = {0: 3, 1: 2, 2: 1, 3: 0, 4: 11, 5: 10, 6: 9, 7: 8, 8: 7, 9: 6, 10: 5, 11: 4}
    ph = phoenix_map.get(year_branch, -1)
    stars.append({"cn": "紅鸞", "fr": "Phénix Rouge", "branch": ph,
                  "desc": "Amour, mariage, romance", "present": False})
    
    # 天喜 Joie Céleste
    joy_map = {0: 9, 1: 8, 2: 7, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2, 8: 1, 9: 0, 10: 11, 11: 10}
    jy = joy_map.get(year_branch, -1)
    stars.append({"cn": "天喜", "fr": "Joie Céleste", "branch": jy,
                  "desc": "Bonheur, célébrations", "present": False})
    
    return stars

def calc_luck_pillars(year, month, day_stem, year_stem, gender):
    """Calcule les Grandes Fortunes (大运)"""
    is_yang_male = (year_stem % 2 == 0 and gender == "M")
    is_yin_female = (year_stem % 2 == 1 and gender == "F")
    forward = is_yang_male or is_yin_female
    
    ms, mb = month_pillar(year, month)
    
    luck_pillars = []
    for i in range(9):
        offset = i + 1
        if forward:
            ls = (ms + offset) % 10
            lb = (mb + offset) % 12
        else:
            ls = (ms - offset) % 10
            lb = (mb - offset) % 12
        
        start_age = 2 + i * 10  # approximation simplifiée
        start_year = year + start_age
        
        luck_pillars.append({
            "stem": ls, "branch": lb,
            "start_age": start_age, "end_age": start_age + 9,
            "start_year": start_year, "end_year": start_year + 9
        })
    
    return luck_pillars

# ═══════════════════════════════════════════════════════════════
# CSS
# ═══════════════════════════════════════════════════════════════

st.markdown("""
<style>
    .main-title { text-align: center; font-size: 2.5em; margin-bottom: 0.3em; }
    .sub-title { text-align: center; color: #888; font-size: 0.95em; margin-bottom: 1em; }
    .date-banner {
        text-align: center; font-size: 1.2em; color: #5e35b1;
        background: #ede7f6; padding: 12px; border-radius: 10px; margin: 10px 0;
    }
    .pillar-card {
        border-radius: 12px; overflow: hidden;
        box-shadow: 0 3px 10px rgba(0,0,0,0.12); margin-bottom: 10px;
    }
    .pillar-header {
        background: #e9ecef; padding: 10px; text-align: center;
        font-weight: 700; font-size: 1em;
    }
    .stem-box, .branch-box { padding: 12px 8px; text-align: center; }
    .chinese-char { font-size: 3em; font-weight: bold; line-height: 1.2; }
    .pinyin-label { font-size: 0.9em; font-weight: 600; }
    .god-label {
        font-size: 0.75em; padding: 3px 8px; border-radius: 4px;
        display: inline-block; margin-top: 4px; background: rgba(255,255,255,0.4);
    }
    .nayin-box {
        background: rgba(60,60,70,0.5); padding: 8px; text-align: center;
        font-size: 0.78em; color: #aaa;
    }
    .hidden-box {
        background: rgba(50,50,60,0.5); padding: 8px; text-align: center;
        font-size: 0.85em; color: #999; border-top: 1px dashed rgba(255,255,255,0.2);
    }
    .hex-card {
        text-align: center; padding: 15px; background: rgba(40,40,50,0.6);
        border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    }
    .hex-sym { font-size: 3em; line-height: 1; }
    .hex-name { font-size: 0.8em; color: #666; margin-top: 5px; }
    .el-card { padding: 12px; border-radius: 10px; text-align: center; }
    .el-emoji { font-size: 1.6em; }
    .el-count { font-size: 1.4em; font-weight: bold; }
    .el-name { font-size: 0.8em; }
    .dm-box {
        background: rgba(30,60,40,0.8); padding: 15px; border-radius: 10px;
        border-left: 4px solid #4caf50; color: #e0e0e0;
    }
    .dm-box strong { color: #8bc34a; }
    .luck-card {
        text-align: center; padding: 10px; border-radius: 8px;
        background: rgba(40,40,50,0.6); box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        transition: transform 0.2s; border: 1px solid rgba(255,255,255,0.1);
    }
    .luck-card:hover { transform: translateY(-3px); }
    .luck-current {
        border: 3px solid #ff6b6b; box-shadow: 0 4px 15px rgba(255,107,107,0.3);
    }
    .luck-stem, .luck-branch {
        display: inline-block; padding: 8px; border-radius: 6px;
        margin: 2px; font-size: 1.4em; font-weight: bold; min-width: 40px;
    }
    .luck-years { font-size: 0.75em; color: #999; }
    .luck-age { font-size: 0.85em; font-weight: 600; }
    .star-badge {
        display: inline-block; padding: 6px 12px; border-radius: 20px;
        margin: 3px; font-size: 0.85em;
    }
    .star-present { background: rgba(39,174,96,0.3); color: #7dcea0; border: 1px solid rgba(39,174,96,0.5); }
    .star-absent { background: rgba(60,60,70,0.5); color: #888; border: 1px solid rgba(255,255,255,0.1); }
    .section-sep {
        border: none; border-top: 2px solid #ede7f6; margin: 25px 0;
    }
</style>
""", unsafe_allow_html=True)

# ═══════════════════════════════════════════════════════════════
# INTERFACE
# ═══════════════════════════════════════════════════════════════

st.markdown("<div class='main-title'>☯️ BaZi 八字</div>", unsafe_allow_html=True)
st.markdown("<div class='sub-title'>Calculateur Complet des Quatre Piliers du Destin</div>", unsafe_allow_html=True)

# Formulaire
now = datetime.now()

with st.container():
    c1, c2, c3, c4, c5 = st.columns([2, 1, 1, 1, 1])
    
    with c1:
        hour_opts = [f"{b['hours']} ({b['py']} {b['cn']})" 
                     for b in [{"hours": "23-01", **BRANCHES[0]}, {"hours": "01-03", **BRANCHES[1]},
                               {"hours": "03-05", **BRANCHES[2]}, {"hours": "05-07", **BRANCHES[3]},
                               {"hours": "07-09", **BRANCHES[4]}, {"hours": "09-11", **BRANCHES[5]},
                               {"hours": "11-13", **BRANCHES[6]}, {"hours": "13-15", **BRANCHES[7]},
                               {"hours": "15-17", **BRANCHES[8]}, {"hours": "17-19", **BRANCHES[9]},
                               {"hours": "19-21", **BRANCHES[10]}, {"hours": "21-23", **BRANCHES[11]}]]
        sel_hour = st.selectbox("⏰ Heure", hour_opts, index=hour_to_branch(now.hour))
        h_branch = hour_opts.index(sel_hour)
    with c2:
        day_val = st.number_input("📅 Jour", 1, 31, now.day)
    with c3:
        month_val = st.number_input("📅 Mois", 1, 12, now.month)
    with c4:
        year_val = st.number_input("📅 Année", 1900, 2100, now.year)
    with c5:
        gender = st.selectbox("👤 Genre", ["M", "F"], index=0)

    col_btn1, col_btn2 = st.columns(2)
    with col_btn1:
        if st.button("📅 Aujourd'hui", use_container_width=True):
            st.rerun()
    with col_btn2:
        calc = st.button("🔮 Calculer", use_container_width=True, type="primary")

st.markdown("<hr class='section-sep'>", unsafe_allow_html=True)

# ═══════════════════════════════════════════════════════════════
# CALCULS
# ═══════════════════════════════════════════════════════════════

try:
    ys, yb = year_pillar(year_val)
    ms, mb = month_pillar(year_val, month_val)
    ds, db = day_pillar(year_val, month_val, day_val)
    hs, hb = hour_pillar(ds, h_branch)
    
    dm = STEMS[ds]  # Maître du Jour
    
    pillars = [
        {"title": "Heure 時", "s": hs, "b": hb},
        {"title": "Jour 日", "s": ds, "b": db},
        {"title": "Mois 月", "s": ms, "b": mb},
        {"title": "Année 年", "s": ys, "b": yb},
    ]
    
    # Date bannière
    st.markdown(f"""
    <div class="date-banner">
        📅 <strong>{int(day_val)} {MONTHS_FR[int(month_val)]} {int(year_val)}</strong> — 
        {BRANCHES[h_branch]['animal_fr']} ({BRANCHES[h_branch]['cn']}) — 
        Année du {BRANCHES[yb]['animal_fr']}
    </div>
    """, unsafe_allow_html=True)

    # ═══════════════════════════════════════════
    # LES 4 PILIERS
    # ═══════════════════════════════════════════
    
    st.markdown("### 🏛️ Les Quatre Piliers 四柱")
    
    cols = st.columns(4)
    el_count = {"wood": 0, "fire": 0, "earth": 0, "metal": 0, "water": 0}
    hex_data = []
    
    for i, p in enumerate(pillars):
        stem = STEMS[p["s"]]
        branch = BRANCHES[p["b"]]
        nayin = get_nayin(p["s"], p["b"])
        hexagram = get_hexagram(p["s"], p["b"])
        hex_data.append(hexagram)
        
        el_count[stem["el"]] += 1
        el_count[branch["el"]] += 1
        
        sc = ELEMENTS[stem["el"]]
        bc = ELEMENTS[branch["el"]]
        
        # Dix Dieux (pas pour le MJ lui-même)
        if i == 1:  # Jour
            god_html = '<div class="god-label">日主 Maître</div>'
        else:
            god = get_ten_god(dm["el"], dm["yy"], stem["el"], stem["yy"])
            god_html = f'<div class="god-label">{god["code"]} {god["cn"]}</div>'
        
        # Troncs cachés
        hidden = branch["hidden"]
        hidden_str = " ".join([f'{STEMS[h]["cn"]}' for h in hidden])
        hidden_el = " ".join([f'{ELEMENTS[STEMS[h]["el"]]["emoji"]}' for h in hidden])
        
        with cols[i]:
            st.markdown(f"""
            <div class="pillar-card">
                <div class="pillar-header">{p['title']}</div>
                <div class="stem-box" style="background:{sc['grad']}; color:{sc['txt']};">
                    <div class="pinyin-label">{stem['py']}</div>
                    <div class="chinese-char">{stem['cn']}</div>
                    {god_html}
                </div>
                <div class="branch-box" style="background:{bc['grad']}; color:{bc['txt']};">
                    <div class="pinyin-label">{branch['py']} — {branch['animal_fr']}</div>
                    <div class="chinese-char">{branch['cn']}</div>
                </div>
                <div class="hidden-box">藏干 {hidden_str}<br>{hidden_el}</div>
                <div class="nayin-box">🎵 {nayin}</div>
            </div>
            """, unsafe_allow_html=True)

    st.markdown("<hr class='section-sep'>", unsafe_allow_html=True)

    # ═══════════════════════════════════════════
    # HEXAGRAMMES
    # ═══════════════════════════════════════════
    
    st.markdown("### ☰ Hexagrammes Yi Jing 易經")
    hcols = st.columns(4)
    for i, hx in enumerate(hex_data):
        with hcols[i]:
            st.markdown(f"""
            <div class="hex-card">
                <div class="hex-sym">{hx['sym']}</div>
                <div class="hex-name">{hx['n']}</div>
            </div>
            """, unsafe_allow_html=True)

    st.markdown("<hr class='section-sep'>", unsafe_allow_html=True)

    # ═══════════════════════════════════════════
    # CINQ ÉLÉMENTS
    # ═══════════════════════════════════════════
    
    st.markdown("### 🔥 Cinq Éléments 五行 et Maître du Jour 日主")
    
    ce, ca = st.columns([1, 1])
    
    with ce:
        ecols = st.columns(5)
        for j, (ek, ei) in enumerate(ELEMENTS.items()):
            with ecols[j]:
                st.markdown(f"""
                <div class="el-card" style="background:{ei['bg']};">
                    <div class="el-emoji">{ei['emoji']}</div>
                    <div class="el-count">{el_count[ek]}</div>
                    <div class="el-name">{ei['fr']} {ei['cn']}</div>
                </div>
                """, unsafe_allow_html=True)
        
        # Barres proportionnelles
        total = sum(el_count.values())
        st.markdown("<br>", unsafe_allow_html=True)
        for ek, ei in ELEMENTS.items():
            pct = (el_count[ek] / total * 100) if total > 0 else 0
            st.markdown(f"""
            <div style="display:flex; align-items:center; margin:4px 0;">
                <span style="width:80px; font-size:0.85em;">{ei['emoji']} {ei['fr']}</span>
                <div style="flex:1; background:rgba(60,60,70,0.8); border-radius:4px; height:18px; margin:0 8px;">
                    <div style="width:{pct}%; background:{ei['bg']}; height:100%; border-radius:4px;"></div>
                </div>
                <span style="font-size:0.85em; width:40px;">{pct:.0f}%</span>
            </div>
            """, unsafe_allow_html=True)
    
    with ca:
        dm_info = ELEMENTS[dm["el"]]
        yy_label = "Yang ☀️" if dm["yy"] == "yang" else "Yin 🌙"
        
        st.markdown(f"""
        <div class="dm-box">
            <div style="font-size:0.95em; color:#8bc34a; font-weight:600;">Maître du Jour 日主</div>
            <div style="font-size:3em; text-align:center; color:#fff; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">{dm['cn']}</div>
            <div style="text-align:center; font-size:1.2em; font-weight:700; color:#e0e0e0;">
                {dm['py']} — {dm_info['fr']} {yy_label}
            </div>
            <hr style="border:none;border-top:1px solid rgba(139,195,74,0.4); margin:10px 0;">
            <div style="font-size:0.85em; line-height:1.7;">
                {dm_info['emoji']} <strong>Élément :</strong> {dm_info['fr']} ({dm_info['cn']})<br>
                🔄 <strong>Produit :</strong> {ELEMENTS[PRODUCTION_CYCLE[dm['el']]]['fr']} {ELEMENTS[PRODUCTION_CYCLE[dm['el']]]['emoji']}<br>
                ⚔️ <strong>Contrôle :</strong> {ELEMENTS[CONTROL_CYCLE[dm['el']]]['fr']} {ELEMENTS[CONTROL_CYCLE[dm['el']]]['emoji']}<br>
                🌱 <strong>Nourri par :</strong> {ELEMENTS[[k for k,v in PRODUCTION_CYCLE.items() if v==dm['el']][0]]['fr']}
                    {ELEMENTS[[k for k,v in PRODUCTION_CYCLE.items() if v==dm['el']][0]]['emoji']}<br>
                🗡️ <strong>Contrôlé par :</strong> {ELEMENTS[CONTROL_CYCLE[[k for k,v in PRODUCTION_CYCLE.items() if v==dm['el']][0]]]['fr']}
                    {ELEMENTS[CONTROL_CYCLE[[k for k,v in PRODUCTION_CYCLE.items() if v==dm['el']][0]]]['emoji']}
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        # Élément dominant / absent
        dominant = max(el_count, key=el_count.get)
        absent = [k for k, v in el_count.items() if v == 0]
        
        di = ELEMENTS[dominant]
        st.markdown(f"""
        <div style="background:rgba(255,152,0,0.15); padding:12px; border-radius:8px; border-left:4px solid #ff9800; margin-top:10px;">
            <strong>📊 Dominant :</strong> {di['emoji']} {di['fr']} ({el_count[dominant]})<br>
            {"<strong>⚠️ Absent :</strong> " + ", ".join([ELEMENTS[a]['emoji']+" "+ELEMENTS[a]['fr'] for a in absent]) if absent else "✅ Tous les éléments sont présents"}
        </div>
        """, unsafe_allow_html=True)

    st.markdown("<hr class='section-sep'>", unsafe_allow_html=True)

    # ═══════════════════════════════════════════
    # ÉTOILES SYMBOLIQUES 神煞
    # ═══════════════════════════════════════════
    
    st.markdown("### ⭐ Étoiles Symboliques 神煞")
    
    stars = get_symbolic_stars(db, yb)
    all_branches = [hb, db, mb, yb]
    
    star_html = '<div style="display:flex; flex-wrap:wrap; gap:5px;">'
    for star in stars:
        present = star["branch"] in all_branches
        cls = "star-present" if present else "star-absent"
        icon = "✨" if present else "○"
        star_html += f'<span class="star-badge {cls}">{icon} {star["cn"]} {star["fr"]}</span>'
    star_html += '</div>'
    st.markdown(star_html, unsafe_allow_html=True)
    
    # Détails des étoiles
    with st.expander("📖 Détail des Étoiles Symboliques"):
        for star in stars:
            present = star["branch"] in all_branches
            status = "✅ Présente" if present else "—"
            br_name = BRANCHES[star["branch"]]["cn"] + " " + BRANCHES[star["branch"]]["animal_fr"] if star["branch"] >= 0 else "—"
            st.markdown(f"**{star['cn']} {star['fr']}** | {br_name} | {status} | _{star['desc']}_")

    st.markdown("<hr class='section-sep'>", unsafe_allow_html=True)

    # ═══════════════════════════════════════════
    # GRANDES FORTUNES 大运
    # ═══════════════════════════════════════════
    
    st.markdown("### 🔮 Grandes Fortunes 大运")
    
    luck = calc_luck_pillars(year_val, month_val, ds, ys, gender)
    current_year = now.year
    
    # Calcul de l'âge actuel
    current_age = current_year - year_val
    
    lcols = st.columns(len(luck))
    
    for i, lp in enumerate(luck):
        ls = STEMS[lp["stem"]]
        lb = BRANCHES[lp["branch"]]
        lsc = ELEMENTS[ls["el"]]
        lbc = ELEMENTS[lb["el"]]
        
        is_current = lp["start_year"] <= current_year <= lp["end_year"]
        card_cls = "luck-card luck-current" if is_current else "luck-card"
        marker = " ★" if is_current else ""
        
        with lcols[i]:
            st.markdown(f"""
            <div class="{card_cls}">
                <div class="luck-age">{lp['start_age']}-{lp['end_age']} ans{marker}</div>
                <div>
                    <span class="luck-stem" style="background:{lsc['bg']}; color:{lsc['txt']};">{ls['cn']}</span>
                    <span class="luck-branch" style="background:{lbc['bg']}; color:{lbc['txt']};">{lb['cn']}</span>
                </div>
                <div class="luck-years">{lp['start_year']}-{lp['end_year']}</div>
                <div style="font-size:0.7em; color:#999;">{lb['animal_fr']}</div>
            </div>
            """, unsafe_allow_html=True)

    st.markdown("<hr class='section-sep'>", unsafe_allow_html=True)

    # ═══════════════════════════════════════════
    # ANNÉE EN COURS 流年
    # ═══════════════════════════════════════════
    
    st.markdown(f"### 📆 Année en cours {current_year} 流年")
    
    cy_s, cy_b = year_pillar(current_year)
    cy_stem = STEMS[cy_s]
    cy_branch = BRANCHES[cy_b]
    cy_god = get_ten_god(dm["el"], dm["yy"], cy_stem["el"], cy_stem["yy"])
    cy_nayin = get_nayin(cy_s, cy_b)
    cy_sc = ELEMENTS[cy_stem["el"]]
    cy_bc = ELEMENTS[cy_branch["el"]]
    
    yc1, yc2 = st.columns([1, 2])
    
    with yc1:
        st.markdown(f"""
        <div style="text-align:center; background:rgba(40,40,50,0.6); padding:20px; border-radius:12px;
                    box-shadow: 0 3px 15px rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1);">
            <div style="font-size:0.9em; color:#aaa;">Année {current_year}</div>
            <div>
                <span style="display:inline-block; font-size:2.5em; font-weight:bold;
                    background:{cy_sc['grad']}; color:{cy_sc['txt']};
                    padding:10px 15px; border-radius:8px; margin:5px;">{cy_stem['cn']}</span>
                <span style="display:inline-block; font-size:2.5em; font-weight:bold;
                    background:{cy_bc['grad']}; color:{cy_bc['txt']};
                    padding:10px 15px; border-radius:8px; margin:5px;">{cy_branch['cn']}</span>
            </div>
            <div style="font-size:1.1em; margin-top:8px;">
                <strong>{cy_stem['py']} {cy_branch['py']}</strong>
            </div>
            <div style="font-size:0.9em; color:#aaa;">
                {ELEMENTS[cy_stem['el']]['fr']} {cy_stem['yy'].capitalize()} / {cy_branch['animal_fr']}
            </div>
            <div style="font-size:0.85em; margin-top:8px;">🎵 {cy_nayin}</div>
        </div>
        """, unsafe_allow_html=True)
    
    with yc2:
        st.markdown(f"""
        <div style="background:rgba(40,40,50,0.6); padding:20px; border-radius:12px;
                    box-shadow: 0 3px 15px rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1);">
            <strong>Relation avec le Maître du Jour :</strong><br>
            <span style="font-size:1.3em;">{cy_god['cn']} ({cy_god['code']})</span> — {cy_god['fr']}<br>
            <em>{cy_god['desc']}</em>
            <hr style="border:none; border-top:1px solid rgba(255,255,255,0.2); margin:10px 0;">
            <strong>Interactions :</strong><br>
            • Tronc annuel {cy_stem['cn']} ({ELEMENTS[cy_stem['el']]['fr']}) → 
              {cy_god['fr']} pour {dm['cn']} ({ELEMENTS[dm['el']]['fr']})<br>
            • Branche annuelle {cy_branch['cn']} ({cy_branch['animal_fr']}) — 
              {ELEMENTS[cy_branch['el']]['fr']}
        </div>
        """, unsafe_allow_html=True)

except ValueError as e:
    st.error(f"❌ Date invalide : {e}")
except Exception as e:
    st.error(f"❌ Erreur de calcul : {e}")

# Footer
st.markdown("<hr class='section-sep'>", unsafe_allow_html=True)
st.caption("☯️ BaZi 八字 — Calculateur Complet | (c) CyberMind.FR — Gandalf des Enchanteurs")
