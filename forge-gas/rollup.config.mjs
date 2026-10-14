import ts from "@rollup/plugin-typescript";
import gas from "rollup-plugin-gas";

export default {
  input: "src/main.ts",
  output: {
    dir: "build",
    format: "iife",
    name: "GasBundle",
    preserveModules: false,
    indent: "  ",
    sourcemap: true,
  },
  plugins: [
    ts({ tsconfig: "./tsconfig.json" }),
    gas(),
  ],
};
