# -*- coding: utf-8 -*-
"""列出题库中某个 knowledge_point 分类下的全部题目（编号 + 题干 + 答案）。"""
import csv, io, sys

PATH = r"C:/Users/Jiuze/Desktop/all-questions-verified.csv"
targets = sys.argv[1].split(",")
fuzzy = len(sys.argv) > 2 and sys.argv[2] == "fuzzy"

with io.open(PATH, "r", encoding="utf-8-sig", newline="") as f:
    rows = list(csv.DictReader(f))

for r in rows:
    kp = (r.get("knowledge_point") or "").strip()
    hit = any(kp == t for t in targets)
    if not hit and fuzzy:
        hit = any(t in kp for t in targets)
    if not hit:
        continue
    stem = (r.get("stem") or "").replace("\n", " ")
    print("%s\t%s\t%s\t%s" % (r["编号"], r.get("subject", ""), r.get("answer", ""), stem[:70]))
