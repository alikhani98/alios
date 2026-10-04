import { readdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const distDirectory = "dist";
const assetsDirectory = join(distDirectory, "assets");
const outputPath = join(distDirectory, "precache-manifest.json");
const productionBasePath = "/alios/";

const criticalChunkPatterns = [
  /^react-vendor-.*\.js$/,
  /^icons-vendor-.*\.js$/,
  /^date-vendor-.*\.js$/,
  /^react-vendor-.*\.css$/,
  /^index-.*\.js$/,
];

const chunks = readdirSync(assetsDirectory)
  .filter((fileName) =>
    criticalChunkPatterns.some((pattern) => pattern.test(fileName))
  )
  .sort()
  .map((fileName) => `${productionBasePath}assets/${fileName}`);

const manifest = {
  version: 1,
  chunks,
};

for (const chunk of chunks) {
  console.log(`Added to precache manifest: ${chunk}`);
}

writeFileSync(`${outputPath}`, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(
  `Wrote ${basename(outputPath)} with ${chunks.length} critical chunk${
    chunks.length === 1 ? "" : "s"
  }.`
);
