// Fills gaps in Next.js's standalone build output (used for the cPanel/
// Passenger deploy — see next.config.ts's `output: "standalone"` comment).
//
// Two things standalone mode never includes on its own:
//   1. .next/static and public/ — the standalone server.js expects these
//      alongside it, but the build doesn't copy them there itself.
//   2. pdfkit (used for dues-payment PDF receipts, see src/lib/receipts.ts)
//      — its file-tracing is incomplete for this package. pdfkit loads its
//      font-metric (.afm) files with a runtime fs.readFileSync rather than
//      a static import, which the tracer can't follow, so it silently
//      drops the *entire* pdfkit package (and everything it depends on)
//      from .next/standalone/node_modules. Computed recursively from each
//      package's own package.json rather than a hardcoded list, so a
//      future pdfkit version bump that changes its dependency tree doesn't
//      quietly reintroduce this bug.
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const standaloneDir = path.join(root, ".next", "standalone");

if (!fs.existsSync(standaloneDir)) {
  console.log("postbuild: no .next/standalone directory — skipping (not a standalone build)");
  process.exit(0);
}

fs.cpSync(path.join(root, ".next", "static"), path.join(standaloneDir, ".next", "static"), { recursive: true });
fs.cpSync(path.join(root, "public"), path.join(standaloneDir, "public"), { recursive: true });

function resolvePackageDir(name, fromDir) {
  const nested = path.join(fromDir, "node_modules", name);
  if (fs.existsSync(nested)) return nested;
  const topLevel = path.join(root, "node_modules", name);
  if (fs.existsSync(topLevel)) return topLevel;
  return null;
}

function collectDependencyTree(name, fromDir, found) {
  if (found.has(name)) return;
  const dir = resolvePackageDir(name, fromDir);
  if (!dir) {
    console.warn(`postbuild: could not resolve "${name}" while tracing pdfkit's dependencies — skipping it`);
    return;
  }
  found.set(name, dir);
  const pkgJsonPath = path.join(dir, "package.json");
  if (!fs.existsSync(pkgJsonPath)) return;
  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
  for (const dep of Object.keys(pkgJson.dependencies || {})) {
    collectDependencyTree(dep, dir, found);
  }
}

const pdfkitTree = new Map();
collectDependencyTree("pdfkit", root, pdfkitTree);

for (const [name, dir] of pdfkitTree) {
  const dest = path.join(standaloneDir, "node_modules", name);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(dir, dest, { recursive: true });
}

console.log(
  `postbuild: copied .next/static, public/, and ${pdfkitTree.size} pdfkit-related package(s) into .next/standalone`
);
