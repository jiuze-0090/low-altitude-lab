# -*- coding: utf-8 -*-
"""在题库里检索与 E4~E7 相关的题目，输出「编号 | subject | 题干 | 答案 | 解析首句」。"""
import csv, io, re, sys

PATH = r"C:/Users/Jiuze/Desktop/all-questions-verified.csv"

KEYWORDS = sys.argv[1].split(",") if len(sys.argv) > 1 else []
LIMIT = int(sys.argv[2]) if len(sys.argv) > 2 else 40

with io.open(PATH, "r", encoding="utf-8-sig", newline="") as f:
    rows = list(csv.DictReader(f))

hits = []
for r in rows:
    stem = r.get("stem") or ""
    kp = r.get("knowledge_point") or ""
    subj = r.get("subject") or ""
    hay = stem + " || " + kp + " || " + subj + " || " + (r.get("analysis") or "")
    for kw in KEYWORDS:
        if kw in hay:
            hits.append((int(r["编号"]), subj, stem, r.get("answer", ""), (r.get("analysis") or "")[:90], kw))
            break

hits.sort()
print("命中 %d 条" % len(hits))
for n, subj, stem, ans, ana, kw in hits[:LIMIT]:
    print("[%s] %s | %s | 答案%s | %s" % (kw, n, subj, ans, stem.replace("\n", " ")[:90]))
