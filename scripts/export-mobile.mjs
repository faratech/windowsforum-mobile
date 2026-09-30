#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(scriptPath), "..");
const source = path.join(root, "dist/client");
const output = path.join(root, "dist/mobile");
const staging = path.join(root, `dist/mobile.tmp-${process.pid}`);
const rootAssetPattern = /(?<![A-Za-z0-9_./-])\/assets\//g;
const textExtensions = new Set([".html", ".js", ".css", ".svg", ".json", ".txt"]);
const requiredRuntimeAssets = [
  "iphone/Bezel.png",
  "iphone/Keyboard.png",
  "android/Pixel10.png",
  "android/Keyboard.png",
  "android/navigation-bar.svg",
  "status/status-icons.svg",
  "status/ios-status-icons.svg",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function readTree(directory, prefix = "") {
  const files = [];
  for (const entry of (await fs.readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const name = path.posix.join(prefix, entry.name);
    assert(!entry.isSymbolicLink(), `Unexpected symlink in build: ${name}`);
    if (entry.isDirectory()) files.push(...await readTree(path.join(directory, entry.name), name));
    else if (entry.isFile()) files.push({ name, bytes: await fs.readFile(path.join(directory, entry.name)) });
  }
  return files;
}

async function main() {
  assert(process.argv.length === 2, "This exporter has no deploy mode or arguments; it only stages dist/mobile.");
  execFileSync(process.execPath, [path.join(root, "scripts/check-mobile-runtime.mjs")], { stdio: "inherit" });
  const files = await readTree(source);
  const originalIndex = files.find(file => file.name === "index.html")?.bytes.toString("utf8");
  assert(originalIndex, "Missing dist/client/index.html. Run npx vite build --base=/mobile/ first.");
  assert(/(?:src|href)=["']\/mobile\/assets\//.test(originalIndex), "Build must use --base=/mobile/.");
  const robotsTag = originalIndex.match(/<meta\b[^>]*\bname=["']robots["'][^>]*>/i)?.[0];
  assert(robotsTag && /\bnoindex\b/i.test(robotsTag), "Preview index must retain its noindex robots meta tag.");
  assert(!/<link\b[^>]*\brel=["']manifest["']/i.test(originalIndex), "Preview must not install a web app manifest.");
  for (const file of files) {
    assert(file.name === "index.html" || file.name.startsWith("assets/"), `Unexpected top-level build file: ${file.name}`);
    assert(!/(?:^|\/)(?:sw|service-worker)\.[cm]?js$|\.webmanifest$/i.test(file.name), `Preview cannot export a service worker or manifest: ${file.name}`);
  }
  const assetNames = new Set(files.filter(file => file.name.startsWith("assets/")).map(file => file.name.slice(7)));
  for (const asset of requiredRuntimeAssets) assert(assetNames.has(asset), `Required runtime asset is missing: assets/${asset}`);

  // Version the entire asset namespace, including copied public assets. This
  // changes every rewritten bundle URL without recursively renaming JS chunks
  // that import one another. Relative imports remain within this namespace.
  const hash = createHash("sha256").update(await fs.readFile(scriptPath));
  for (const file of files) hash.update(JSON.stringify([file.name, file.bytes.length])).update(file.bytes);
  const version = hash.digest("hex").slice(0, 20);
  const assetBase = `/mobile/assets/${version}/`;
  const assetReference = new RegExp(`${assetBase}([A-Za-z0-9_./%+-]+)`, "g");
  const exported = [];
  let rewrittenFiles = 0;

  for (const file of files) {
    let bytes = file.bytes;
    if (textExtensions.has(path.extname(file.name))) {
      const original = bytes.toString("utf8");
      // The protected runtime uses absolute /assets/ URLs. Only the exported
      // build changes; protected sources and dist/client remain byte-identical.
      const content = original.replaceAll("/mobile/assets/", assetBase).replace(rootAssetPattern, assetBase);
      const normalized = content.replaceAll("\\/", "/");
      assert(!/(?<![A-Za-z0-9_./-])\/assets\//.test(normalized), `Unrebased root asset URL in ${file.name}`);
      assert(!/\bserviceWorker\b/.test(content), `Service worker API found in ${file.name}; preview must not register one.`);
      const allMobileAssetUrls = normalized.matchAll(/\/mobile\/assets\/[^\s"'`<>)]*/g);
      for (const match of allMobileAssetUrls) assert(match[0].startsWith(assetBase), `Unversioned mobile asset URL in ${file.name}: ${match[0]}`);
      for (const match of normalized.matchAll(assetReference)) {
        const asset = decodeURIComponent(match[1]);
        assert(assetNames.has(asset), `Missing asset referenced from ${file.name}: ${asset}`);
      }
      if (content !== original) rewrittenFiles++;
      bytes = Buffer.from(content);
    }
    const name = file.name === "index.html" ? file.name : `assets/${version}/${file.name.slice(7)}`;
    exported.push({ name, bytes });
  }

  const exportedIndex = exported.find(file => file.name === "index.html").bytes.toString("utf8");
  assert(exportedIndex.includes(assetBase), "Exported HTML does not reference the versioned assets.");
  assert(rewrittenFiles > 0, "No asset paths were rewritten.");
  await fs.rm(staging, { recursive: true, force: true });
  try {
    for (const file of exported) {
      const target = path.join(staging, file.name);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, file.bytes);
    }
    await fs.rm(output, { recursive: true, force: true });
    await fs.rename(staging, output);
  } finally {
    await fs.rm(staging, { recursive: true, force: true });
  }
  console.log(`Staged ${exported.length} files in ${output}`);
  console.log(`Immutable asset base: ${assetBase}`);
  console.log(`Rebased ${rewrittenFiles} text files; runtime assets, references, noindex and absence of service workers verified.`);
  console.log("No live files were changed. Publish assets first and index.html last.");
}

main().catch(error => {
  console.error(`Mobile export failed: ${error.message}`);
  process.exitCode = 1;
});
