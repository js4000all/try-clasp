import ts from "@rollup/plugin-typescript";
import gas from "rollup-plugin-gas";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "src/main.ts",
  output: {
    dir: "build",
    format: "iife",
    name: "GasBundle",
    preserveModules: false,
    indent: "  ",
    sourcemap: true,
    intro: "var self = globalThis;",
  },
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false,
    }),
    commonjs(),
    ts({ tsconfig: "./tsconfig.json" }),
    gas(),
  ],
};
