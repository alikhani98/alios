import { readFileSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

// Keep the guard aligned with the current verified production build output.
const MAX_ENTRY_BYTES = 300_000;
const rootDirectory = process.cwd();
const pnpmExecutable =
  process.env.npm_execpath && process.env.npm_execpath.length > 0
    ? process.execPath
    : "pnpm";
const pnpmArgs =
  process.env.npm_execpath && process.env.npm_execpath.length > 0
    ? [process.env.npm_execpath, "exec", "vite", "build", "--manifest"]
    : ["exec", "vite", "build", "--manifest"];
const run = spawnSync(pnpmExecutable, pnpmArgs, {
  cwd: rootDirectory,
  encoding: "utf8",
});
const output = `${run.stdout}\n${run.stderr}`;

if (run.status !== 0) {
  process.stderr.write(output);
  throw new Error("Performance verification could not produce a build.");
}

if (output.includes("Some chunks are larger than 500 kB after minification")) {
  throw new Error("Vite emitted a chunk-size warning.");
}

const manifestPath = resolve(rootDirectory, "dist/.vite/manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const entry = manifest["index.html"];

if (!entry?.file || !Array.isArray(entry.imports)) {
  throw new Error("The Vite manifest does not contain a valid index.html entry.");
}

const entrySize = statSync(resolve(rootDirectory, "dist", entry.file)).size;
const entryImports = entry.imports.join(" ");
const html = readFileSync(resolve(rootDirectory, "dist/index.html"), "utf8");

if (entrySize > MAX_ENTRY_BYTES) {
  throw new Error(
    `Initial entry is ${entrySize} bytes; the Stage 86 budget is ${MAX_ENTRY_BYTES} bytes.`
  );
}

if (entryImports.includes("forms-vendor") || html.includes("forms-vendor")) {
  throw new Error("Form and validation code is preloaded by the application entry.");
}

if (!Object.keys(manifest).some((key) => key.includes("forms-vendor"))) {
  throw new Error("The expected forms vendor chunk was not produced.");
}

console.log(
  `Performance check passed: entry ${entrySize} bytes; forms vendor is not entry-preloaded.`
);
