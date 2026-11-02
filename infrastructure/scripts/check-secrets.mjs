#!/usr/bin/env node
// Scans files that git would include for obvious committed secrets.
// Not a replacement for a full scanner; it catches the common accidents.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const SKIP_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".pdf",
  ".zip",
  ".gz",
]);
const SKIP_FILES = new Set(["pnpm-lock.yaml", "package-lock.json", "yarn.lock", "uv.lock"]);

const PATTERNS = [
  { name: "private key block", regex: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/ },
  { name: "AWS access key", regex: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "GitHub token", regex: /\bgh[pousr]_[A-Za-z0-9]{30,}\b/ },
  { name: "Slack token", regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { name: "OpenAI-style key", regex: /\bsk-[A-Za-z0-9_-]{32,}\b/ },
  { name: "JWT", regex: /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\./ },
  {
    name: "Supabase service role value",
    regex: /\bSUPABASE_SERVICE_ROLE_KEY\s*=\s*[A-Za-z0-9._-]{20,}/,
  },
];

const files = execFileSync(
  "git",
  ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter(Boolean);

const findings = [];

for (const file of files) {
  if (file === ".env" || (file.startsWith(".env.") && file !== ".env.example")) {
    findings.push(`${file}: committed environment file`);
    continue;
  }
  if (SKIP_FILES.has(file) || SKIP_EXTENSIONS.has(file.slice(file.lastIndexOf(".")))) continue;

  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  if (content.includes("\0")) continue;

  content.split("\n").forEach((line, index) => {
    if (line.includes("secret-scan:allow")) return;
    for (const { name, regex } of PATTERNS) {
      if (regex.test(line)) findings.push(`${file}:${index + 1}: ${name}`);
    }
  });
}

if (findings.length > 0) {
  console.error("Potential secrets found:\n" + findings.map((f) => `  ${f}`).join("\n"));
  console.error("\nRemove the value, rotate it, and use an environment variable.");
  process.exit(1);
}

console.log(`Secret scan clean (${files.length} files checked).`);
