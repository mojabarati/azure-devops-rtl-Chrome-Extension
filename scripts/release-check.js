"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const manifestPath = path.join(projectRoot, "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const errors = [];

function check(condition, message) {
  if (!condition) {
    errors.push(message);
  }
}

function resolveProjectPath(relativePath) {
  return path.join(projectRoot, relativePath.replaceAll("/", path.sep));
}

function readPngDimensions(filePath) {
  const data = fs.readFileSync(filePath);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  check(data.subarray(0, 8).equals(signature), `${path.relative(projectRoot, filePath)} is not a valid PNG.`);
  check(data.toString("ascii", 12, 16) === "IHDR", `${path.relative(projectRoot, filePath)} has no PNG IHDR chunk.`);
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
}

check(manifest.manifest_version === 3, "manifest_version must be 3.");
check(manifest.name === "Azure DevOps RTL Fixer", "Unexpected extension name.");
check(/^\d+(?:\.\d+){0,3}$/.test(manifest.version), "Manifest version is invalid.");
check(typeof manifest.description === "string" && manifest.description.length > 0, "Manifest description is required.");
check(manifest.description.length <= 132, "Manifest description exceeds 132 characters.");
check(JSON.stringify(manifest.permissions) === JSON.stringify(["storage"]), "Only the storage permission is allowed.");
check(manifest.host_permissions === undefined, "host_permissions must be omitted.");
check(!JSON.stringify(manifest).includes("<all_urls>"), "<all_urls> is prohibited.");

const expectedMatches = ["https://dev.azure.com/*", "https://*.visualstudio.com/*"];
check(
  JSON.stringify(manifest.content_scripts?.[0]?.matches) === JSON.stringify(expectedMatches),
  "Content-script matches must remain limited to supported Azure DevOps hosts."
);

const runtimeReferences = [
  manifest.background?.service_worker,
  manifest.action?.default_popup,
  ...Object.values(manifest.icons || {}),
  ...Object.values(manifest.action?.default_icon || {}),
  ...(manifest.content_scripts || []).flatMap((entry) => [...(entry.js || []), ...(entry.css || [])])
].filter(Boolean);

for (const reference of runtimeReferences) {
  check(fs.existsSync(resolveProjectPath(reference)), `Manifest reference is missing: ${reference}`);
}

for (const [size, iconPath] of Object.entries(manifest.icons || {})) {
  const absolutePath = resolveProjectPath(iconPath);
  if (!fs.existsSync(absolutePath)) {
    continue;
  }
  const dimensions = readPngDimensions(absolutePath);
  check(dimensions.width === Number(size) && dimensions.height === Number(size), `${iconPath} must be ${size}x${size}.`);
}

const runtimeTextFiles = runtimeReferences
  .filter((reference) => /\.(?:js|html|css)$/u.test(reference))
  .map((reference) => ({ reference, source: fs.readFileSync(resolveProjectPath(reference), "utf8") }));

const remoteCodePattern = /(?:<script[^>]+src\s*=\s*["']https?:\/\/|import\s*\(\s*["']https?:\/\/|\beval\s*\(|\bnew\s+Function\s*\()/iu;
const networkApiPattern = /\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon)\s*\(/u;
for (const file of runtimeTextFiles) {
  check(!remoteCodePattern.test(file.source), `Remote or dynamic executable code found in ${file.reference}.`);
  check(!networkApiPattern.test(file.source), `Network API found in ${file.reference}; review before release.`);
}

function walk(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if ([".git", "dist", "node_modules"].includes(entry.name)) {
      continue;
    }
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(absolutePath));
    } else {
      files.push(absolutePath);
    }
  }
  return files;
}

const secretAssignmentPattern = /(?:API[_-]?KEY|SECRET|PASSWORD|TOKEN)\s*[:=]\s*["'][^"']{8,}["']/iu;
const privateKeyPattern = /-----BEGIN [A-Z ]*PRIVATE KEY-----/u;
for (const filePath of walk(projectRoot)) {
  if (!/\.(?:js|json|html|css|md|ps1|txt|yml|yaml)$/iu.test(filePath) || filePath === __filename) {
    continue;
  }
  const source = fs.readFileSync(filePath, "utf8");
  check(!secretAssignmentPattern.test(source) && !privateKeyPattern.test(source), `Possible secret found in ${path.relative(projectRoot, filePath)}.`);
}

if (errors.length > 0) {
  console.error("Release validation failed:\n- " + errors.join("\n- "));
  process.exit(1);
}

const tests = spawnSync(process.execPath, ["--test"], { cwd: projectRoot, stdio: "inherit" });
if (tests.status !== 0) {
  process.exit(tests.status || 1);
}

const packageResult = spawnSync(
  "powershell.exe",
  ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", path.join(projectRoot, "scripts", "package.ps1")],
  { cwd: projectRoot, stdio: "inherit" }
);
if (packageResult.status !== 0) {
  process.exit(packageResult.status || 1);
}

console.log(`Release validation passed for Azure DevOps RTL Fixer v${manifest.version}.`);
