"""Build the Owl Foundations mockup: embed real bars AND generate the course map
from the bundle, so the mockup's lesson list can never drift from the content."""
import json, os, re, yaml

SP = r"C:\Users\deeps\AppData\Local\Temp\claude\c--Edgenative-repos\8f953bcb-fe6f-470a-b520-6c8437555486\scratchpad"
BUNDLE = r"C:\Edgenative\repos\ogt-coursecraft\courses\owl-foundations\bundle\course.yaml"
OUT = r"C:\Edgenative\repos\ogt-mockups\courses\owl-foundations-s2"

# An illustrative student: these lessons are done, 2.2 is where they are now.
DONE = {"1.1", "1.2", "1.3", "2.1", "2.3", "3.1", "5.4"}
CURRENT = "2.2"

def human(x):
    return str(x).replace("_", " ") if x else ""

def subtitle(l):
    c = l.get("check") or {}
    k = c.get("kind") or l.get("kind")
    if k == "reflect":
        return "reflect · no check" + ("" if l.get("label") is None else f" · {l['label']}")
    if k == "journal":
        return "journal · saved on this PC"
    if k == "drill":
        return f"drill · {c.get('set', 20)} bars vs {human(c.get('against'))}"
    if k == "checklist":
        n = len(c.get("points") or [])
        sr = c.get("self_reported") or []
        return f"checklist · {n} points" + (f" + {len(sr)} you report" if sr else "")
    if k == "frame":
        return f"frame · gate {c.get('gate_rr', 2.0)}"
    if k == "count":
        return f"count · window {c.get('window')}"
    return f"{k} · {human(c.get('expects'))}"

def course_map(path):
    c = yaml.safe_load(io._open(path)) if False else yaml.safe_load(open(path, encoding="utf-8"))
    units, lessons = c.get("units") or {}, c["lessons"]
    by_unit = {}
    for l in lessons:
        by_unit.setdefault(str(l["id"]).split(".")[0], []).append(l)
    done = sum(1 for l in lessons if str(l["id"]) in DONE)
    pct = round(100 * done / len(lessons))
    out = [f'            <div class="fine">{len(lessons)} lessons · {len(units)} units · {done} done</div>',
           f'            <div class="prog"><i style="width:{pct}%"></i></div>',
           '          </div>']
    for u in sorted(by_unit, key=int):
        ls = by_unit[u]
        d = sum(1 for l in ls if str(l["id"]) in DONE)
        out.append(f'          <div class="unit"><span>{u} · {units.get(int(u), "")}</span><span>{d}/{len(ls)}</span></div>')
        for l in ls:
            lid = str(l["id"])
            cls = "lrow on" if lid == CURRENT else "lrow"
            tab = ' tabindex="0"' if lid == CURRENT else ""
            ck = '<span class="ck done">✓</span>' if lid in DONE else (
                 '<span class="ck cur"></span>' if lid == CURRENT else '<span class="ck"></span>')
            out.append(f'          <div class="{cls}"{tab}><span class="no">{lid}</span>'
                       f'<span>{l["title"]}<small>{subtitle(l)}</small></span>{ck}</div>')
    return "\n".join(out), c["edition"], len(lessons)

bars = open(os.path.join(os.environ["TEMP"], "claude", "bars.json"), encoding="utf-8").read()
src = open(os.path.join(SP, "owl-foundations.html"), encoding="utf-8").read()
assert src.count("/*BARS*/{}") == 1
art = src.replace("/*BARS*/{}", bars)

cmap, edition, n = course_map(BUNDLE)
assert art.count("<!--COURSEMAP-->") == 1, "course map marker missing"
art = art.replace("            <!--COURSEMAP-->\n", cmap + "\n")
art = re.sub(r"(method pack <code>owl</code> 0\.2\.0)", r"\1", art)
art = art.replace("edition 2026.09 ·", f"edition {edition} ·")

open(os.path.join(SP, "owl-foundations-artifact.html"), "w", encoding="utf-8").write(art)
full = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        + art.replace('</style>', '</style>\n</head>\n<body>', 1) + '\n</body>\n</html>\n')
os.makedirs(OUT, exist_ok=True)
open(os.path.join(OUT, "index.html"), "w", encoding="utf-8").write(full)
print(f"built: edition {edition}, {n} lessons in the generated map")
