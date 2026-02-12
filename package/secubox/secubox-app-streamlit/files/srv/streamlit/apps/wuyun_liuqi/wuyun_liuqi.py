#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
五运六气 Wu Yun Liu Qi — Module de calcul
Cinq Mouvements et Six Qi · Classification des 60 Jiazi

Classifications validated against traditional reference:
- 运气同化 (26 years): TYTF(4), TF(8), SH(2), TTF(6), TSH(6)
- 运气异化 (34 years): ShunHua(10), TianXing(7), XiaoNi(~10), BuHe(~7)
"""

HEAVENLY_STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]
EARTHLY_BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]

STEM_PINYIN = {"甲":"Jiǎ","乙":"Yǐ","丙":"Bǐng","丁":"Dīng","戊":"Wù",
               "己":"Jǐ","庚":"Gēng","辛":"Xīn","壬":"Rén","癸":"Guǐ"}
BRANCH_PINYIN = {"子":"Zǐ","丑":"Chǒu","寅":"Yín","卯":"Mǎo","辰":"Chén",
                 "巳":"Sì","午":"Wǔ","未":"Wèi","申":"Shēn","酉":"Yǒu",
                 "戌":"Xū","亥":"Hài"}

ZODIAC = {"子":"鼠 Rat","丑":"牛 Bœuf","寅":"虎 Tigre","卯":"兔 Lapin",
          "辰":"龍 Dragon","巳":"蛇 Serpent","午":"馬 Cheval","未":"羊 Chèvre",
          "申":"猴 Singe","酉":"雞 Coq","戌":"狗 Chien","亥":"豬 Cochon"}
ZODIAC_EMOJI = {"子":"🐀","丑":"🐂","寅":"🐅","卯":"🐇","辰":"🐉","巳":"🐍",
                "午":"🐴","未":"🐐","申":"🐒","酉":"🐓","戌":"🐕","亥":"🐷"}

ELEMENTS = ["木", "火", "土", "金", "水"]
ELEMENTS_FR = {"木":"Bois","火":"Feu","土":"Terre","金":"Métal","水":"Eau"}
ELEMENTS_EMOJI = {"木":"🌳","火":"🔥","土":"🏔️","金":"⚔️","水":"💧"}
ELEMENTS_COLOR = {"木":"#2d8a4e","火":"#c0392b","土":"#b8860b","金":"#7f8c8d","水":"#2471a3"}
ELEMENTS_COLOR_LIGHT = {"木":"#c8e6c9","火":"#ffcdd2","土":"#ffe0b2","金":"#e0e0e0","水":"#bbdefb"}

STEM_TO_YUN = {"甲":"土","己":"土","乙":"金","庚":"金","丙":"水","辛":"水",
               "丁":"木","壬":"木","戊":"火","癸":"火"}
STEM_POLARITY = {"甲":"yang","丙":"yang","戊":"yang","庚":"yang","壬":"yang",
                 "乙":"yin","丁":"yin","己":"yin","辛":"yin","癸":"yin"}

SITIAN_QI = {"子":"少阴君火","午":"少阴君火","丑":"太阴湿土","未":"太阴湿土",
             "寅":"少阳相火","申":"少阳相火","卯":"阳明燥金","酉":"阳明燥金",
             "辰":"太阳寒水","戌":"太阳寒水","巳":"厥阴风木","亥":"厥阴风木"}
SITIAN_ELEM = {"子":"火","午":"火","丑":"土","未":"土","寅":"火","申":"火",
               "卯":"金","酉":"金","辰":"水","戌":"水","巳":"木","亥":"木"}

ZAIQUAN_QI = {"子":"阳明燥金","午":"阳明燥金","丑":"太阳寒水","未":"太阳寒水",
              "寅":"厥阴风木","申":"厥阴风木","卯":"少阴君火","酉":"少阴君火",
              "辰":"太阴湿土","戌":"太阴湿土","巳":"少阳相火","亥":"少阳相火"}
ZAIQUAN_ELEM = {"子":"金","午":"金","丑":"水","未":"水","寅":"木","申":"木",
                "卯":"火","酉":"火","辰":"土","戌":"土","巳":"火","亥":"火"}

BRANCH_ELEM = {"子":"水","丑":"土","寅":"木","卯":"木","辰":"土","巳":"火",
               "午":"火","未":"土","申":"金","酉":"金","戌":"土","亥":"水"}

SIX_QI = {
    "厥阴风木":  {"elem":"木","nature":"风 Vent","fr":"Jue Yin — Vent/Bois"},
    "少阴君火":  {"elem":"火","nature":"热 Chaleur","fr":"Shao Yin — Feu Souverain"},
    "少阳相火":  {"elem":"火","nature":"暑 Canicule","fr":"Shao Yang — Feu Ministériel"},
    "太阴湿土":  {"elem":"土","nature":"湿 Humidité","fr":"Tai Yin — Humidité/Terre"},
    "阳明燥金":  {"elem":"金","nature":"燥 Sécheresse","fr":"Yang Ming — Sécheresse/Métal"},
    "太阳寒水":  {"elem":"水","nature":"寒 Froid","fr":"Tai Yang — Froid/Eau"},
}

GENERATES = {"木":"火","火":"土","土":"金","金":"水","水":"木"}
CONTROLS  = {"木":"土","土":"水","水":"火","火":"金","金":"木"}

TONG_HUA = {
    "TYTF": {"cn":"太乙天符","fr":"Suprême Conformité au Ciel","short":"TYTF",
             "color":"#9b59b6","emoji":"👑",
             "desc":"Triple concordance suprême : Mouvement = Ciel = Branche. Énergie la plus puissante du cycle."},
    "TF":   {"cn":"天符","fr":"Conformité au Ciel","short":"TF",
             "color":"#e74c3c","emoji":"🔴",
             "desc":"Le mouvement annuel et le Qi du Ciel partagent le même élément. Force amplifiée."},
    "SH":   {"cn":"岁会","fr":"Réunion de l'Année","short":"SH",
             "color":"#2980b9","emoji":"🔵",
             "desc":"Le mouvement arrive à sa position naturelle (正位). Harmonie avec la Terre."},
    "TTF":  {"cn":"同天符","fr":"Conformité Similaire au Ciel","short":"TTF",
             "color":"#e67e22","emoji":"🟠",
             "desc":"Le mouvement correspond au Qi de la Source (在泉). Écho par la Terre."},
    "TSH":  {"cn":"同岁会","fr":"Conformité Similaire à la Réunion","short":"TSH",
             "color":"#27ae60","emoji":"🟢",
             "desc":"Le Qi du Ciel correspond à l'élément de la Branche Terrestre."},
}

YI_HUA = {
    "ShunHua":  {"cn":"顺化","fr":"Transformation Conforme","short":"SH",
                 "color":"#27ae60","emoji":"🌿",
                 "desc":"Le mouvement engendre le Qi du Ciel (运生气). Flux harmonieux."},
    "TianXing": {"cn":"天刑","fr":"Punition Céleste","short":"TX",
                 "color":"#c0392b","emoji":"⚡",
                 "desc":"Le Qi du Ciel domine le mouvement (气克运). Tension céleste."},
    "XiaoNi":   {"cn":"小逆","fr":"Petit Contre-courant","short":"XN",
                 "color":"#f39c12","emoji":"🔄",
                 "desc":"Le mouvement domine le Qi du Ciel (运克气). Inversion légère."},
    "BuHe":     {"cn":"不和","fr":"Dysharmonie","short":"BH",
                 "color":"#8e44ad","emoji":"💔",
                 "desc":"Le Qi du Ciel engendre le mouvement (气生运). Déséquilibre subtil."},
}


def classify_jiazi(stem, branch):
    """Classify a stem-branch pair according to Wu Yun Liu Qi."""
    yun = STEM_TO_YUN[stem]
    pol = STEM_POLARITY[stem]
    st = SITIAN_ELEM[branch]
    zq = ZAIQUAN_ELEM[branch]
    br = BRANCH_ELEM[branch]

    is_tf = (yun == st)
    is_sh_broad = (yun == br)
    is_sh_strict = (yun == "木" and branch == "卯") or (yun == "水" and branch == "子")
    is_tytf = is_tf and is_sh_broad

    is_ttf_cand = (yun == zq) and not is_tf and not is_sh_broad
    is_tsh_cand = (st == br) and branch in ["午","酉"] and not is_tf and not is_sh_broad

    is_ttf = is_ttf_cand and (pol == "yin" or is_tsh_cand)
    is_tsh = is_tsh_cand and not is_ttf

    tong_hua = None
    if is_tytf:        tong_hua = "TYTF"
    elif is_tf:        tong_hua = "TF"
    elif is_sh_strict: tong_hua = "SH"
    elif is_ttf:       tong_hua = "TTF"
    elif is_tsh:       tong_hua = "TSH"

    yi_hua = None
    if tong_hua is None:
        if GENERATES.get(yun) == st:   yi_hua = "ShunHua"
        elif CONTROLS.get(st) == yun:  yi_hua = "TianXing"
        elif CONTROLS.get(yun) == st:  yi_hua = "XiaoNi"
        elif GENERATES.get(st) == yun: yi_hua = "BuHe"

    return {
        "stem": stem, "branch": branch, "chars": f"{stem}{branch}",
        "pinyin": f"{STEM_PINYIN[stem]} {BRANCH_PINYIN[branch]}",
        "animal": ZODIAC[branch], "emoji": ZODIAC_EMOJI[branch],
        "yun_element": yun, "yun_fr": ELEMENTS_FR[yun],
        "yun_excess": pol == "yang",
        "yun_excess_cn": "太过" if pol == "yang" else "不及",
        "yun_excess_fr": "Excès" if pol == "yang" else "Insuffisance",
        "yun_name_cn": f"{yun}运{('太过' if pol == 'yang' else '不及')}",
        "yun_name_fr": f"{ELEMENTS_FR[yun]} en {'Excès' if pol == 'yang' else 'Insuffisance'}",
        "sitian_qi": SITIAN_QI[branch], "sitian_elem": st,
        "sitian_fr": SIX_QI[SITIAN_QI[branch]]["fr"],
        "zaiquan_qi": ZAIQUAN_QI[branch], "zaiquan_elem": zq,
        "zaiquan_fr": SIX_QI[ZAIQUAN_QI[branch]]["fr"],
        "branch_elem": br,
        "tong_hua_key": tong_hua,
        "tong_hua": TONG_HUA.get(tong_hua),
        "yi_hua_key": yi_hua,
        "yi_hua": YI_HUA.get(yi_hua),
        "is_tong_hua": tong_hua is not None,
    }


def get_60_jiazi():
    """Get classified data for all 60 Jiazi years."""
    return [
        {"position": i + 1, **classify_jiazi(HEAVENLY_STEMS[i % 10], EARTHLY_BRANCHES[i % 12])}
        for i in range(60)
    ]


def year_to_position(year):
    """Convert Gregorian year to Jiazi position (1984 = position 1 = 甲子)."""
    return ((year - 1984) % 60) + 1


def get_year_info(year):
    """Get complete Wu Yun Liu Qi info for a Gregorian year."""
    pos = year_to_position(year)
    data = get_60_jiazi()[pos - 1]
    data["gregorian_year"] = year
    base = 1984 + (pos - 1)
    all_y = set()
    y = base
    while y >= 1924: all_y.add(y); y -= 60
    y = base + 60
    while y <= 2103: all_y.add(y); y += 60
    data["all_years"] = sorted(all_y)
    return data


def get_gregorian_years(position, start=1984, end=2103):
    """Get Gregorian years for a Jiazi position."""
    base = 1984 + (position - 1)
    years = []
    y = base
    while y > start: y -= 60
    while y < start: y += 60
    while y <= end:
        years.append(y)
        y += 60
    return years


def get_liu_bu(branch):
    """Get the Six Steps (六步) qi division for a year."""
    HOST = ["厥阴风木","少阴君火","少阳相火","太阴湿土","阳明燥金","太阳寒水"]
    PERIODS_CN = ["大寒→春分","春分→小满","小满→大暑","大暑→秋分","秋分→小雪","小雪→大寒"]
    PERIODS_FR = [
        "Grand Froid → Équinoxe Printemps",
        "Équinoxe Printemps → Petit Plein",
        "Petit Plein → Grande Chaleur",
        "Grande Chaleur → Équinoxe Automne",
        "Équinoxe Automne → Petite Neige",
        "Petite Neige → Grand Froid",
    ]
    MONTHS = ["1-2","3-4","5-6","7-8","9-10","11-12"]
    QI_ORDER = ["厥阴风木","少阴君火","太阴湿土","少阳相火","阳明燥金","太阳寒水"]
    st_name = SITIAN_QI[branch]
    st_idx = QI_ORDER.index(st_name)

    steps = []
    for i in range(6):
        guest = QI_ORDER[(st_idx + i - 2) % 6]
        h_elem = SIX_QI[HOST[i]]["elem"]
        g_elem = SIX_QI[guest]["elem"]
        rel = ("same" if h_elem == g_elem else
               "generates" if GENERATES.get(g_elem) == h_elem else
               "generated_by" if GENERATES.get(h_elem) == g_elem else
               "controls" if CONTROLS.get(g_elem) == h_elem else
               "controlled_by" if CONTROLS.get(h_elem) == g_elem else "neutral")
        steps.append({
            "step": i + 1, "host_qi": HOST[i], "host_elem": h_elem,
            "guest_qi": guest, "guest_elem": g_elem,
            "period_cn": PERIODS_CN[i], "period_fr": PERIODS_FR[i],
            "months": MONTHS[i], "relationship": rel,
            "is_sitian": (i == 2), "is_zaiquan": (i == 5),
        })
    return steps


def get_summary():
    """Get classification summary statistics."""
    from collections import Counter
    all_data = get_60_jiazi()
    th = Counter(d["tong_hua_key"] for d in all_data if d["tong_hua_key"])
    yh = Counter(d["yi_hua_key"] for d in all_data if d["yi_hua_key"])
    return {
        "tong_hua_counts": dict(th), "yi_hua_counts": dict(yh),
        "tong_hua_total": sum(th.values()), "yi_hua_total": sum(yh.values()),
        "tong_hua_years": {k: [d for d in all_data if d["tong_hua_key"] == k] for k in TONG_HUA},
        "yi_hua_years": {k: [d for d in all_data if d["yi_hua_key"] == k] for k in YI_HUA},
    }


if __name__ == "__main__":
    summary = get_summary()
    print("运气同化:", summary["tong_hua_counts"], f"= {summary['tong_hua_total']}")
    print("运气异化:", summary["yi_hua_counts"], f"= {summary['yi_hua_total']}")
    info = get_year_info(2026)
    print(f"\n2026: {info['chars']} {info['emoji']} — {info['yun_name_fr']}")
    print(f"  司天: {info['sitian_qi']} ({info['sitian_fr']})")
    print(f"  在泉: {info['zaiquan_qi']} ({info['zaiquan_fr']})")
    cls = info['tong_hua'] or info['yi_hua']
    print(f"  Classification: {cls['cn']} — {cls['fr']}")
