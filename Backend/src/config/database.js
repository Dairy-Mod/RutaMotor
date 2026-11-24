const path = require("node:path");
require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
  quiet: true,
});
const mongoose = require("mongoose");
const dns = require("node:dns");
async function connectDatabase(uri = process.env.MONGODB_URI) {
  if (!uri)
    throw new Error(
      "Define MONGODB_URI en Backend/.env. Ejecuta npm run setup.",
    );
  // Algunos proveedores DNS locales no resuelven los registros SRV de Atlas.
  const dnsServers = (process.env.MONGODB_DNS_SERVERS || "")
    .split(",")
    .map((server) => server.trim())
    .filter(Boolean);
  if (uri.startsWith("mongodb+srv://") && dnsServers.length) {
    dns.setServers(dnsServers);
  }
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,
    dbName: process.env.MONGODB_DB_NAME || undefined,
  });
}
module.exports = {
  connectDatabase,
  disconnectDatabase: () => mongoose.disconnect(),
};
