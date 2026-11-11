import { readdir, readFile, writeFile } from "node:fs/promises";
import { zipSync } from "fflate";
const entries = {};
async function collect(path) {
  const files = await readdir(path, { withFileTypes: true });
  for (const file of files) {
    const name = path + "/" + file.name;
    if (file.isDirectory()) await collect(name);
    else entries[name] = new Uint8Array(await readFile(name));
  }
}
for (const path of ["src", "scripts", "salesforce", "tests", "public"])
  await collect(path);
for (const path of [
  "package.json",
  "package-lock.json",
  "rollup.config.mjs",
  "netlify.toml",
  "README.md",
  "DESIGN.md",
  "PRODUCT.md",
  ".prettierrc.json",
  ".gitignore",
])
  entries[path] = new Uint8Array(await readFile(path));
await writeFile("dist/service-studio-source.zip", zipSync(entries));
