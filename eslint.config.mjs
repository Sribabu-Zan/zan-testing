import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored, minified Draco decoder (three/examples/jsm/libs/draco), served
    // from /public so the laptop model decodes locally instead of from a CDN.
    // Third-party build output: not ours to lint.
    "public/draco/**",
  ]),
]);

export default eslintConfig;
