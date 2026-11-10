import { build } from "esbuild";
await build({
  entryPoints: ["src/plugin.mjs"],
  outfile: "dist/plugin.mjs",
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node24",
  legalComments: "eof",
});
