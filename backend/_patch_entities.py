import re

path = r"c:\safe\backend\models\entities.py"
with open(path, encoding="utf-8") as f:
    src = f.read()

# Replace server_default=text("'value'") -> default='value'
src = re.sub(r"server_default=text\(\"'([^']+)'\"\)", r"default='\1'", src)
# Replace server_default=text("value") with unquoted value like "0" "0.0" "false" "true"
src = re.sub(r"server_default=text\(\"([^\"]+)\"\)", lambda m: f"default={m.group(1)}", src)
# Remove any leftover "text," from imports
src = re.sub(r"\n    text,", "", src)

with open(path, "w", encoding="utf-8") as f:
    f.write(src)

print("Patched OK. Lines:", src.count("\n"))
