from graphify.detect import load_manifest; m = load_manifest(); print("Manifest entries:", len(m)); keys = list(m.keys())[:3]; [print(k) for k in keys]
