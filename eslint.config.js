import js from "@eslint/js";
import tseslint from "typescript-eslint";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [".next/*", "node_modules/*", "public/sw.js"],
  },
  {
    rules: {
      "no-unused-vars": "off", // Handled by @typescript-eslint/no-unused-vars
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
      "no-console": ["warn", { "allow": ["warn", "error"] }],
      "@typescript-eslint/no-explicit-any": "warn"
    },
  },
  {
    files: ["lib/logger.ts"],
    rules: {
      "no-console": "off"
    }
  }
);
