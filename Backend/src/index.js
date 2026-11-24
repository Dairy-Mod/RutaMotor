const { once } = require("node:events");
const { connectDatabase, disconnectDatabase } = require("./config/database");
const app = require("./app");

const entities = [
  { name: "Categorías", path: "categories" },
  { name: "Especialidades", path: "specialties" },
  { name: "Negocios", path: "businesses" },
  { name: "Ubicaciones", path: "locations", geojson: true },
  { name: "Zonas de servicio", path: "zones", geojson: true },
];

async function start() {
  await connectDatabase();
  // Los índices están listos antes de aceptar consultas geoespaciales.
  await Promise.all(
    Object.values(require("mongoose").models).map((Model) => Model.init()),
  );
  const port = Number(process.env.PORT) || 3001;
  const host = process.env.HOST || "127.0.0.1";
  const server = app.listen(port, host);
  await once(server, "listening");

  const urlHost = ["0.0.0.0", "::"].includes(host) ? "localhost" : host;
  const baseUrl = `http://${urlHost.includes(":") ? `[${urlHost}]` : urlHost}:${port}`;
  console.log("");
  console.log("========================================================");
  console.log("API DE RUTAMOTOR");
  console.log(`Servidor: ${baseUrl}`);
  console.log(`Host de escucha: ${host}`);
  console.log(`MongoDB: ${require("mongoose").connection.name}`);
  console.log(`Health: ${baseUrl}/api/health`);
  console.log("");
  console.log("Autenticación:");
  console.log(`  POST   ${baseUrl}/api/auth/register`);
  console.log(`  POST   ${baseUrl}/api/auth/login`);
  console.log(`  GET    ${baseUrl}/api/auth/me`);
  console.log(`  POST   ${baseUrl}/api/auth/logout`);

  for (const { name, path, geojson } of entities) {
    const url = `${baseUrl}/api/${path}`;
    console.log("");
    console.log(`${name}:`);
    console.log(`  GET    ${url}`);
    console.log(`  POST   ${url}`);
    if (geojson) console.log(`  GET    ${url}/geojson`);
    console.log(`  GET    ${url}/:id`);
    console.log(`  PATCH  ${url}/:id`);
    console.log(`  DELETE ${url}/:id`);
  }
  console.log("");
  console.log("Las rutas de entidades requieren iniciar sesión.");
  console.log("========================================================");
  console.log("");

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
