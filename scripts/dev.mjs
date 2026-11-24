import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const commands = [
  ["Backend/src/index.js"],
  [
    "node_modules/vite/bin/vite.js",
    "--host",
    "127.0.0.1",
    "--config",
    "Frontend/vite.config.js",
    "Frontend",
  ],
];
const children = commands.map((args) =>
  spawn(process.execPath, args, {
    cwd: root,
    stdio: "inherit",
    windowsHide: true,
  }),
);
let closing = false;
function stop(code = 0) {
  if (closing) return;
  closing = true;
  children.forEach((child) => child.kill());
  process.exitCode = code;
}
children.forEach((child) => child.on("exit", (code) => stop(code || 0)));
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
