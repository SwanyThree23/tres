import re

path = r"c:\safe\backend\models\entities.py"
with open(path, encoding="utf-8") as f:
    src = f.read()

# Fix double-quoted default values: default=''720p'' -> default='720p'
# This happens when the previous patch double-wrapped quotes
src = re.sub(r"default=''([^']+)''", r"default='\1'", src)

# Also fix any default=false/true/0/0.0 that need to be Python booleans/ints
# default='false' -> default=False
src = re.sub(r"default='false'", "default=False", src)
src = re.sub(r"default='true'", "default=True", src)
# default='0' -> default=0, default='0.0' -> default=0.0, default='1' -> default=1
src = re.sub(r"default='(\d+\.\d+)'", lambda m: f"default={m.group(1)}", src)
src = re.sub(r"default='(\d+)'", lambda m: f"default={int(m.group(1))}", src)

# Remove remaining 'text,' import if still there
src = re.sub(r"\n    text,", "", src)

with open(path, "w", encoding="utf-8") as f:
    f.write(src)

print("Patched OK. Lines:", src.count("\n"))
