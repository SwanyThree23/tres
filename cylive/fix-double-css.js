const fs = require("fs");

const filesToFix = [
  "c:/safe/cylive/src/app/(dashboard)/dashboard/page.tsx",
  "c:/safe/cylive/src/app/(auth)/register/page.tsx",
  "c:/safe/cylive/src/app/(dashboard)/analytics/page.tsx",
  "c:/safe/cylive/src/app/(dashboard)/layout.tsx",
];

for (const f of filesToFix) {
  try {
    let content = fs.readFileSync(f, "utf8");
    const org = content;
    // Replace double className e.g., className="foo" className="bar" -> className="foo bar"
    content = content.replace(
      /className=\"([^\"]+)\"\s*className=\"([^\"]+)\"/g,
      'className=\"$1 $2\"',
    );
    // It's possible it happened three times: className="x" className="y" className="z" -> run again
    content = content.replace(
      /className=\"([^\"]+)\"\s*className=\"([^\"]+)\"/g,
      'className=\"$1 $2\"',
    );

    if (content !== org) {
      fs.writeFileSync(f, content, "utf8");
      console.log("Fixed double classes in:", f);
    }
  } catch (e) {
    console.error("Error on", f, e);
  }
}
