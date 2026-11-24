const { once } = require("node:events");
const { connectDatabase, disconnectDatabase } = require("./config/database");
const app = require("./app");
async function start() {
  await connectDatabase();
  // Los índices están listos antes de aceptar consultas geoespaciales.
  await Promise.all(
    Object.values(require("mongoose").models).map((Model) => Model.init()),
  );
  const port = Number(process.env.PORT) || 3001;
  const server = app.listen(port, "127.0.0.1");
  await once(server, "listening");
  console.log(
    "RutaMotor API: http://127.0.0.1:" +
      port +
      " | MongoDB: " +
      require("mongoose").connection.name,
  );
  let closing = false;
  async function close() {
    if (closing) return;
    closing = true;
    await new Promise((resolve) => server.close(resolve));
    await disconnectDatabase();
  }
  process.on("SIGINT", () => close());
  process.on("SIGTERM", () => close());
}
start().catch(async (error) => {
  console.error("No se pudo iniciar RutaMotor:", error.message);
  await disconnectDatabase();
  process.exitCode = 1;
});
