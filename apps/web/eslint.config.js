import next from "eslint-config-next";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import baseConfig, { restrictEnvAccess } from "@kan/eslint-config/base";
import nextjsConfig from "@kan/eslint-config/nextjs";
import reactConfig from "@kan/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [...next, ...nextCoreWebVitals, ...nextTypescript, {
  ignores: [".next/**"],
}, ...baseConfig, ...reactConfig, ...nextjsConfig, ...restrictEnvAccess];
