// ESLint flat config: correctness, not style. The agent MUST keep this green.
// `any` is banned: use precise types, or `unknown` + narrowing. Deps are in devDependencies.
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = [
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**', '.next/**', '**/*.config.js', '**/*.config.mjs', '**/*.config.cjs'] },
  {
    files: ["src/**/*.ts"],
    languageOptions: { parser: tsParser, parserOptions: { sourceType: "module", ecmaFeatures: { jsx: true } } },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
    },
  },
];
