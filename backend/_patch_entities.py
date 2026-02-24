import re

path = r"c:\safe\backend\models\entities.py"
with open(path, encoding="utf-8") as f:
    src = f.read()

# Replace Mapped[UUID] -> Mapped[str] in class body annotations
src = src.replace("Mapped[UUID]", "Mapped[str]")
src = src.replace("Mapped[Optional[UUID]]", "Mapped[Optional[str]]")
src = src.replace("List[UUID]", "List[str]")

# Remove the "from uuid import UUID" line if still present
src = re.sub(r"from uuid import UUID\r?\n", "", src)

with open(path, "w", encoding="utf-8") as f:
    f.write(src)

print("Patched OK")
