import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Disable ALL warnings and errors
      "react/no-unescaped-entities": "off",
    },
  },
  {
    ignores: [
      // Dependencies
      "node_modules/**",
      ".next/**",
      "out/**",
      // Testing
      "coverage/**",
      "__tests__/**",
      "jest.config.js",
      "jest.setup.js",
      // Build files
      "dist/**",
      "build/**",
      // Generated files
      "types/generated/**",
      "*.d.ts",
      "next-env.d.ts",
      // UI components (shadcn/ui)
      "components/ui/**",
      // Config files
      "next.config.ts",
      "tailwind.config.ts",
      "postcss.config.mjs",
      "*.config.js",
      "*.config.mjs",
      "*.config.ts",
      // Logs
      "*.log",
    ],
  },
];

export default eslintConfig;
