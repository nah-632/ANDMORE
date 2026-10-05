#!/usr/bin/env python3
"""Sample dominant brand colors from the owner's logo assets.

Output: sorted clusters of quantized colors with hex + frequency share.
Excludes near-white and near-black photo noise for the accent table.
"""
import sys
from PIL import Image
from collections import Counter

def hexc(rgb):
    return "#{:02X}{:02X}{:02X}".format(*rgb[:3])

def is_extreme(rgb):
    r, g, b = rgb[:3]
    mx, mn = max(r, g, b), min(r, g, b)
    # near-white / near-gray-ish very light (paper) or very dark
    if mx > 235 and mx - mn < 25:
        return "paper"
    if mx < 45:
        return "black"
    return None

def sample(path, label, topn=14):
    im = Image.open(path).convert("RGB")
    im.thumbnail((320, 320))
    q = im.quantize(colors=32, method=Image.Quantize.MEDIANCUT).convert("RGB")
    counts = Counter(q.getdata())
    total = sum(counts.values())
    print(f"\n=== {label} ({path}) — top colors ===")
    seen_paper = False
    for (rgb, n) in counts.most_common(60):
        if len([1]) and topn <= 0:
            break
        tag = is_extreme(rgb)
        share = n / total * 100
        if tag == "paper":
            if not seen_paper:
                print(f"  paper/white   {hexc(rgb)}  {share:5.1f}%")
                seen_paper = True
            continue
        if tag == "black":
            print(f"  ink/near-black {hexc(rgb)}  {share:5.1f}%")
            topn -= 1
            continue
        if share < 0.8:
            continue
        print(f"  {hexc(rgb)}  {share:5.1f}%")
        topn -= 1
        if topn <= 0:
            break

sample("/var/minis/shared/andmore/public/assets/brand/logo-lockup.jpg", "logo-lockup")
sample("/var/minis/shared/andmore/public/assets/brand/logo-tagline.jpg", "logo-tagline")
sample("/var/minis/shared/andmore/public/assets/brand/brand-board.png", "brand-board")
