import json, sys
from graphify.detect import detect, load_manifest
from pathlib import Path
root = Path(".")
detect_result = detect(root)
manifest = load_manifest()
all_files = [f for files in detect_result["files"].values() for f in files]
changed = []
for f in all_files:
    p = Path(f)
    if not p.exists(): continue
    mtime = p.stat().st_mtime
    rel = str(p)
    if rel not in manifest or abs(manifest[rel]["mtime"] - mtime) > 1: changed.append(f)
total = detect_result["total_files"]
print("Total: " + str(total) + ", Changed: " + str(len(changed)))
for f in changed[:20]: print("  " + f)
if len(changed) > 20: print("  ...and " + str(len(changed)-20) + " more")
