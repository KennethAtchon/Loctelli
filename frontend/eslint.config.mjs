import eslintConfigPrettier from "eslint-config-prettier";

/**
 * ESLint configuration with relaxed rules for gradual migration
 * - Most rules set to "warn" instead of "error" to allow gradual fixing
 * - TypeScript files are ignored (TypeScript compiler handles those)
 * - Focuses on JavaScript files for now
 */
const eslintConfig = [
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // General JavaScript rules - set to warn for gradual migration
      "no-unused-vars": "warn", // TypeScript will catch most of these, but warn on JS files
      "no-console": "warn", // Allow console but warn
      "no-debugger": "warn", // Allow debugger but warn
      "prefer-const": "warn",
      "no-var": "error", // Keep this as error - use const/let
      "no-undef": "off", // TypeScript handles this

      // Allow common patterns during migration - set to warn
      "no-empty": "warn",
      "no-empty-function": "warn",
      "no-unreachable": "warn",
      "no-fallthrough": "warn",
      "no-case-declarations": "warn",
      "no-useless-escape": "warn",
      "no-prototype-builtins": "warn",
      "no-constant-condition": "warn",
      "no-redeclare": "warn",
      "no-self-assign": "warn",
      "no-sparse-arrays": "warn",
      "no-unused-labels": "warn",
      "no-useless-catch": "warn",
      "no-useless-return": "warn",
      "no-void": "warn",
      "no-with": "error", // Keep this as error
      "no-eval": "error", // Keep this as error
      "no-implied-eval": "error", // Keep this as error

      // Allow some patterns that are common in React/TypeScript
      "no-unused-expressions": "warn",
      "no-sequences": "warn",
      "no-throw-literal": "warn",
      "prefer-promise-reject-errors": "warn",
    },
  },
  // Prettier integration - must be last
  eslintConfigPrettier,
  {
    ignores: [
      "dist/**",
      ".vite/**",
      "node_modules/**",
      "build/**",
      "coverage/**",
      "**/*.ts",
      "**/*.tsx",
      "**/*.d.ts",
      "routeTree.gen.ts",
      "src/**", // Ignore src for now since it's all TypeScript
      "jest.setup.js", // Test setup with intentional mocks
    ],
  },
];

export default eslintConfig;

