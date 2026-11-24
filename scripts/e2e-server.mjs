import { createRequire } from "node:module";
import { spawn } from "node:child_process";
const require = createRequire(import.meta.url);
const {
  connectDatabase,
  disconnectDatabase,
} = require("../Backend/src/config/database");
const { mongoose } = require("../Backend/src/models/base");
const dbName = process.env.MONGODB_DB_NAME;
if (!dbName?.startsWith("pf_test_e2e_"))
  throw new Error("Las pruebas requieren una base aislada.");
process.env.MONGODB_URI =
  process.env.MONGODB_TEST_URI || "mongodb://127.0.0.1:27017";
const app = require("../Backend/src/app");
await require("../Backend/src/data/seed")();
await Promise.all(Object.values(mongoose.models).map((M) => M.init()));
const server = app.listen(3002, "127.0.0.1");
const vite = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "--host",
    "127.0.0.1",
    "--port",
    "5174",
    "--config",
    "Frontend/vite.config.js",
    "Frontend",
  ],
  { stdio: "inherit", env: process.env, windowsHide: true },
);
let closing = false;
async function close() {
  if (closing) return;
  closing = true;
  vite.kill();
  server.close();
  await disconnectDatabase();
}
process.on("SIGINT", close);
process.on("SIGTERM", close);
vite.on("exit", close);
