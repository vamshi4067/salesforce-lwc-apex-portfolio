import lwc from "@lwc/rollup-plugin";
import replace from "@rollup/plugin-replace";
import { nodeResolve } from "@rollup/plugin-node-resolve";
export default {
  input: "src/main.js",
  output: { file: "dist/assets/app.js", format: "esm", sourcemap: true },
  plugins: [
    replace({
      "process.env.NODE_ENV": JSON.stringify("production"),
      preventAssignment: true,
    }),
    lwc({ modules: [{ dir: "modules" }] }),
    nodeResolve(),
  ],
};
