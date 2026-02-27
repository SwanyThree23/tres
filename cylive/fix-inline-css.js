const fs = require("fs");

function fixStyles(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  const org = content;

  // Generic replacements
  content = content.replace(
    /style=\{\{\s*color:\s*"var\(--text-muted\)"\s*\}\}/g,
    'className="text-text-muted"',
  );
  content = content.replace(
    /style=\{\{\s*color:\s*"var\(--text-secondary\)"\s*\}\}/g,
    'className="text-text-secondary"',
  );
  content = content.replace(
    /style=\{\{\s*color:\s*"var\(--text-dim\)"\s*\}\}/g,
    'className="text-text-dim"',
  );
  content = content.replace(
    /style=\{\{\s*color:\s*"var\(--accent\)"\s*\}\}/g,
    'className="text-accent"',
  );
  content = content.replace(
    /style=\{\{\s*color:\s*"var\(--red\)"\s*\}\}/g,
    'className="text-red"',
  );
  content = content.replace(
    /style=\{\{\s*color:\s*"var\(--green\)"\s*\}\}/g,
    'className="text-green"',
  );
  content = content.replace(
    /style=\{\{\s*color:\s*"var\(--cyan\)"\s*\}\}/g,
    'className="text-cyan"',
  );
  content = content.replace(
    /style=\{\{\s*background:\s*"var\(--bg-card-high\)"\s*\}\}/g,
    'className="bg-bg-card-high"',
  );

  content = content.replace(
    /style=\{\{\s*background:\s*"rgba\(255, 21, 100, 0\.1\)"\s*\}\}/g,
    'className="bg-accent/10"',
  );
  content = content.replace(
    /style=\{\{\s*background:\s*"rgba\(0, 229, 255, 0\.05\)"\s*\}\}/g,
    'className="bg-cyan/5"',
  );
  content = content.replace(
    /style=\{\{\s*borderTop:\s*"1px solid var\(--border\)"\s*\}\}/g,
    'className="border-t border-border"',
  );

  // Fix where className and style co-exist
  // e.g. className="text-readout-md" style={{ color: "var(--text-muted)" }}
  content = content.replace(
    /className="([^"]+)"\s*style=\{\{\s*color:\s*"var\(--text-muted\)"\s*\}\}/g,
    'className="$1 text-text-muted"',
  );
  content = content.replace(
    /className="([^"]+)"\s*style=\{\{\s*color:\s*"var\(--text-secondary\)"\s*\}\}/g,
    'className="$1 text-text-secondary"',
  );
  content = content.replace(
    /className="([^"]+)"\s*style=\{\{\s*color:\s*"var\(--text-dim\)"\s*\}\}/g,
    'className="$1 text-text-dim"',
  );
  content = content.replace(
    /className="([^"]+)"\s*style=\{\{\s*color:\s*"var\(--accent\)"\s*\}\}/g,
    'className="$1 text-accent"',
  );
  content = content.replace(
    /className="([^"]+)"\s*style=\{\{\s*color:\s*"var\(--red\)"\s*\}\}/g,
    'className="$1 text-red"',
  );
  content = content.replace(
    /className="([^"]+)"\s*style=\{\{\s*color:\s*"var\(--green\)"\s*\}\}/g,
    'className="$1 text-green"',
  );

  if (content !== org) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log("Fixed:", filePath);
  }
}

const filesToFix = [
  "c:/safe/cylive/src/app/(dashboard)/dashboard/page.tsx",
  "c:/safe/cylive/src/app/(auth)/register/page.tsx",
  "c:/safe/cylive/src/app/(dashboard)/analytics/page.tsx",
  "c:/safe/cylive/src/app/(dashboard)/layout.tsx",
];

for (const f of filesToFix) {
  try {
    fixStyles(f);
  } catch (e) {
    console.error("Error on", f, e);
  }
}
