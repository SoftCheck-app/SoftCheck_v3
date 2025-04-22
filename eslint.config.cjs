const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const i18Next = require("eslint-plugin-i18next");
const globals = require("globals");
const tsParser = require("@typescript-eslint/parser");
const js = require("@eslint/js");

const {
    FlatCompat,
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = [{
    ignores: [
        ".next",
        "**/node_modules",
        "eslint.config.cjs"
    ],
}, ...compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
    "next/core-web-vitals",
    "plugin:i18next/recommended",
), {
    plugins: {
        "@typescript-eslint": typescriptEslint,
        i18next: i18Next,
    },

    languageOptions: {
        globals: {
            ...globals.node,
        },

        parser: tsParser,
        ecmaVersion: 13,
        sourceType: "module",
    },
    rules: {
        "@typescript-eslint/no-explicit-any": "off",
        // Añade aquí más reglas para deshabilitar globalmente
        // Ejemplos:
        "@typescript-eslint/no-unused-vars": "off",
        "react/no-unescaped-entities": "off",
        "react-hooks/exhaustive-deps": "off",
        "eslint-comments/no-unused-disable": "off",
    },
    typescript: {
        // !! AVISO !!
        // Peligrosamente permite que las compilaciones de producción se completen correctamente incluso si
        // tu proyecto tiene errores de tipo.
        // !! AVISO !!
        ignoreBuildErrors: true,
      },
      eslint: {
        ignoreDuringBuilds: true,
      },
}, {
    files: ["**/*.js"],

    rules: {
        "@typescript-eslint/no-require-imports": "off",
    },
}, {
    files: ["**/seed.ts"],

    rules: {
        "@typescript-eslint/no-require-imports": "off",
    },
}, {
    files: [
        "components/defaultLanding/**/*.tsx",
        "components/emailTemplates/**/*.tsx",
        "pages/index.tsx",
    ],

    rules: {
        "i18next/no-literal-string": "off",
    },
}];