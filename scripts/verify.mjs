import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import plugin from "../dist/plugin.mjs";
const manifest = JSON.parse(await readFile("t3-plugin.json"));
const pkg = JSON.parse(await readFile("package.json"));
assert.equal(manifest.version, pkg.version);
for (const key of ["id", "version", "apiVersion", "name"]) assert.equal(plugin[key], manifest[key]);
assert.equal(manifest.main, "dist/plugin.mjs");
console.log("Manifest, bundle and package agree:", manifest.version);
