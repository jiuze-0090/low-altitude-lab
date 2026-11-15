# -*- coding: utf-8 -*-
"""按编号精确导出题目全文（题干 + 选项 + 答案 + 解析）。"""
import csv, io, sys

PATH = r"C:/Users/Jiuze/Desktop/all-questions-verified.csv"
nums = [int(x) for x in sys.argv[1].split(",")]

with io.open(PATH, "r", encoding="utf-8-sig", newline="") as f:
    rows = {int(r["编号"]): r for r in csv.DictReader(f)}

for n in nums:
    r = rows.get(n)
    if not r:
        print("=== %d 未找到 ===" % n)
        continue
    print("=== [%d] %s | 难度%s | %s ===" % (n, r.get("subject"), r.get("difficulty"), r.get("knowledge_point")))
    print("Q: %s" % r.get("stem"))
    for k in ("option_a", "option_b", "option_c"):
        if r.get(k):
            print("   %s. %s" % (k[-1].upper(), r[k]))
    print("答案: %s" % r.get("answer"))
    print("解析: %s" % (r.get("analysis") or ""))
    print()
