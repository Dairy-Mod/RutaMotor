const { connectDatabase, disconnectDatabase } = require("../config/database");
const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const Category = require("../models/category.model");
const Specialty = require("../models/specialty.model");
const Business = require("../models/business.model");
const Location = require("../models/location.model");
const Zone = require("../models/zone.model");
const { email, password } = require("../utils/validation");
async function seed() {
  await connectDatabase();
  await Promise.all(
    [User, Category, Specialty, Business, Location, Zone].map((M) => M.init()),
  );
  const demoEmail = email(process.env.DEMO_EMAIL),
    demoPassword = password(process.env.DEMO_PASSWORD);
  let user = await User.findOne({ email: demoEmail });
  if (!user)
    user = await User.create({
      name: "Explorador de RutaMotor",
      email: demoEmail,
      passwordHash: await bcrypt.hash(demoPassword, 12),
    });
  const categoryData = [
    ["Taller mecánico", "taller", "Mantenimiento, diagnóstico y reparación."],
    [
      "Refaccionaria",
      "refacciones",
      "Repuestos y accesorios para tu vehículo.",
    ],
    [
      "Agencia automotriz",
      "agencia",
      "Venta de vehículos y servicio de agencia.",
    ],
    [
      "Tienda de autos",
      "tienda",
      "Lotes y comercios de vehículos nuevos o seminuevos.",
    ],
  ];
  const categories = [];
  for (const [name, kind, description] of categoryData)
    categories.push(
      await Category.findOneAndUpdate(
        { name },
        { $setOnInsert: { kind, description } },
        { upsert: true, returnDocument: "after" },
      ),
    );
  const specialties = [];
  for (const [name, description] of [
    ["Mecánica general", "Revisión y mantenimiento preventivo."],
    ["Diagnóstico electrónico", "Lectura de códigos y revisión de sistemas."],
    ["Frenos y suspensión", "Revisión de frenos, amortiguadores y dirección."],
    ["Llantas y alineación", "Presión, balanceo y alineación."],
    ["Sistema eléctrico", "Diagnóstico de batería y sistema de carga."],
    ["Venta de refacciones", "Piezas, consumibles y accesorios."],
    ["Venta de vehículos", "Asesoría para compra de vehículos."],
  ])
    specialties.push(
      await Specialty.findOneAndUpdate(
        { name },
        { $setOnInsert: { description } },
        { upsert: true, returnDocument: "after" },
      ),
    );
  const examples = [
    [
      "Taller del Parque",
      0,
      [-101.686, 21.126],
      "Col. Jardines del Moral, León",
      [0, 1, 2],
      "disponible",
    ],
    [
      "AutoServicio Norte",
      0,
      [-101.672, 21.146],
      "Zona norte, León",
      [0, 3, 4],
      "por_confirmar",
    ],
    [
      "Refacciones Central",
      1,
      [-101.674, 21.119],
      "Zona centro, León",
      [5, 4],
      "disponible",
    ],
    [
      "Motores del Bajío",
      0,
      [-101.696, 21.111],
      "Col. San Juan Bosco, León",
      [0, 1],
      "disponible",
    ],
    [
      "Agencia Horizonte",
      2,
      [-101.649, 21.135],
      "Blvd. Adolfo López Mateos, León",
      [6, 0],
      "por_confirmar",
    ],
    [
      "Repuestos del Sur",
      1,
      [-101.665, 21.1],
      "Zona sur, León",
      [5, 3],
      "cerrado",
    ],
    [
      "Agencia Camino",
      2,
      [-101.701, 21.138],
      "Blvd. Campestre, León",
      [6, 1],
      "disponible",
    ],
    [
      "Frenos y Más",
      0,
      [-101.654, 21.112],
      "Col. La Martinica, León",
      [2, 3],
      "disponible",
    ],
    [
      "Refacciones Oriente",
      1,
      [-101.636, 21.119],
      "Zona oriente, León",
      [5],
      "por_confirmar",
    ],
    [
      "Autos Alameda",
      3,
      [-101.683, 21.139],
      "Col. Arbide, León",
      [6],
      "disponible",
    ],
    [
      "Seminuevos del Centro",
      3,
      [-101.661, 21.129],
      "Zona centro, León",
      [6],
      "por_confirmar",
    ],
  ];
  for (const [name, cat, coordinates, address, skills, status] of examples) {
    let business = await Business.findOne({ name: name + " · Demo" });
    if (!business)
      business = await Business.create({
        name: name + " · Demo",
        phone: "",
        hours: "Lun–vie 09:00–18:00 (ejemplo; confirmar)",
        specialties: skills.map((i) => specialties[i].id),
      });
    if (!(await Location.exists({ name: name + " · Demo" })))
      await Location.create({
        name: name + " · Demo",
        description:
          "Registro ficticio para demostrar la aplicación. No corresponde a un establecimiento verificado.",
        address: address + " (ubicación de ejemplo)",
        category: categories[cat].id,
        business: business.id,
        status,
        location: { type: "Point", coordinates },
        createdBy: user.id,
      });
  }
  if (!(await Zone.exists({ name: "Zona centro · Demo" })))
    await Zone.create({
      name: "Zona centro · Demo",
      description: "Área ficticia para probar el filtro por zona.",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-101.694, 21.108],
            [-101.657, 21.108],
            [-101.657, 21.134],
            [-101.694, 21.134],
            [-101.694, 21.108],
          ],
        ],
      },
      createdBy: user.id,
    });
  console.log(
    "Datos de demostración listos. Cuenta: " +
      demoEmail +
      " | contraseña: la definida en Backend/.env. No se reemplazaron registros existentes.",
  );
}
if (require.main === module)
  seed()
    .catch((e) => {
      console.error(e.message);
      process.exitCode = 1;
    })
    .finally(disconnectDatabase);
module.exports = seed;
