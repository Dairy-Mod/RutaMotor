import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { mongoose } = require("../Backend/src/models/base");
require("../Backend/src/config/database");
export default async function () {
  const dbName = process.env.PF_E2E_DB;
  if (!dbName?.startsWith("pf_test_e2e_"))
    throw new Error("Se rechazó limpiar una base ajena a las pruebas.");
  try {
    await mongoose.connect(
      process.env.MONGODB_TEST_URI || "mongodb://127.0.0.1:27017",
      { dbName },
    );
    if (mongoose.connection.name !== dbName) throw new Error("Base incorrecta");
    await mongoose.connection.dropDatabase();
  } finally {
    await mongoose.disconnect();
  }
}
