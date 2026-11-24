const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const mongoose = require("mongoose");
const {
  connectDatabase,
  disconnectDatabase,
} = require("../src/config/database");
const app = require("../src/app");
const { polygon } = require("../src/utils/geometry");
const User = require("../src/models/user.model");
const Session = require("../src/models/session.model");
const dbName = "pf_test_" + randomUUID().replaceAll("-", "").slice(0, 20);
let server, base, cookie;
async function request(path, method = "GET", body, auth = true) {
  const response = await fetch(base + "/api" + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(auth && cookie ? { Cookie: cookie } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const json = await response.json();
  return { response, ...json };
}
before(async () => {
  const uri = process.env.MONGODB_TEST_URI || "mongodb://127.0.0.1:27017";
  // El dbName explícito evita que una URI configure la base real durante las pruebas.
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 8000 });
  await Promise.all(Object.values(mongoose.models).map((M) => M.init()));
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  base = "http://127.0.0.1:" + server.address().port;
});
after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  try {
    if (mongoose.connection.readyState === 1) {
      assert.equal(mongoose.connection.name, dbName);
      assert.ok(dbName.startsWith("pf_test_"));
      await mongoose.connection.dropDatabase();
    }
  } finally {
    await disconnectDatabase();
  }
});
test("acceso protegido, registro cifrado, duplicados, sesión y credenciales incorrectas", async () => {
  assert.equal(
    (await request("/locations", "GET", undefined, false)).response.status,
    401,
  );
  const created = await request(
    "/auth/register",
    "POST",
    {
      name: "Usuario prueba",
      email: "PRUEBA@example.com",
      password: "PasswordTest123!",
    },
    false,
  );
  assert.equal(created.response.status, 201);
  assert.equal(created.data.email, "prueba@example.com");
  assert.equal(created.data.passwordHash, undefined);
  cookie = created.response.headers.get("set-cookie").split(";")[0];
  assert.match(created.response.headers.get("set-cookie"), /HttpOnly/);
  assert.match(created.response.headers.get("set-cookie"), /SameSite=Strict/);
  const stored = await User.findOne({ email: "prueba@example.com" }).select(
    "+passwordHash",
  );
  assert.notEqual(stored.passwordHash, "PasswordTest123!");
  assert.match(stored.passwordHash, /^\$2[aby]\$/);
  assert.equal(
    (
      await request(
        "/auth/register",
        "POST",
        {
          name: "Otro",
          email: "prueba@example.com",
          password: "PasswordTest123!",
        },
        false,
      )
    ).response.status,
    409,
  );
  assert.equal(
    (
      await request(
        "/auth/login",
        "POST",
        { email: "prueba@example.com", password: "ClaveIncorrecta!" },
        false,
      )
    ).response.status,
    401,
  );
  assert.equal((await request("/auth/me")).response.status, 200);
});
test("tres CRUD completos, referencias, Point, filtros combinados, GeoJSON y borrado protegido", async () => {
  const category = (
    await request("/categories", "POST", {
      name: "Taller pruebas",
      kind: "taller",
    })
  ).data;
  const specialty = (
    await request("/specialties", "POST", {
      name: "Frenos pruebas",
      description: "Revisión",
    })
  ).data;
  const business = (
    await request("/businesses", "POST", {
      name: "Negocio pruebas",
      specialties: [specialty.id],
    })
  ).data;
  assert.equal(business.specialties[0].name, specialty.name);
  const body = {
    name: "Taller [Centro]",
    description: "Prueba georreferenciada",
    address: "León",
    category: category.id,
    business: business.id,
    status: "disponible",
    location: { type: "Point", coordinates: [-101.68, 21.12] },
  };
  const result = await request("/locations", "POST", body);
  assert.equal(result.response.status, 201);
  const location = result.data;
  assert.equal(location.category.name, category.name);
  assert.equal(location.createdBy.name, "Usuario prueba");
  assert.equal(
    (
      await request(
        "/locations?search=%5Bcentro%5D&category=" +
          category.id +
          "&status=disponible",
      )
    ).count,
    1,
  );
  assert.equal((await request("/locations?search=Noexiste")).count, 0);
  assert.equal((await request("/locations?search=.*")).count, 0);
  const nearby = await request(
    "/locations?longitude=-101.68&latitude=21.12&radius=1",
  );
  assert.equal(nearby.count, 1);
  const geometry = {
    type: "Polygon",
    coordinates: [
      [
        [-101.69, 21.11],
        [-101.67, 21.11],
        [-101.67, 21.13],
        [-101.69, 21.13],
        [-101.69, 21.11],
      ],
    ],
  };
  const zone = (
    await request("/zones", "POST", { name: "Zona pruebas", geometry })
  ).data;
  const filtered = await request(
    "/locations?zone=" + zone.id + "&longitude=-101.68&latitude=21.12&radius=1",
  );
  assert.equal(filtered.response.status, 200);
  assert.equal(filtered.count, 1);
  const geo = await request("/locations/geojson?category=" + category.id);
  assert.equal(geo.type, "FeatureCollection");
  assert.deepEqual(geo.features[0].geometry.coordinates, [-101.68, 21.12]);
  const changed = await request("/locations/" + location.id, "PATCH", {
    location: { type: "Point", coordinates: [0, 0] },
    name: "Ubicación editada",
  });
  assert.equal(changed.response.status, 200);
  assert.deepEqual(changed.data.location.coordinates, [0, 0]);
  assert.equal((await request("/locations?zone=" + zone.id)).count, 0);
  assert.equal(
    (await request("/locations?specialty=" + specialty.id)).count,
    1,
  );
  for (const [entity, id] of [
    ["categories", category.id],
    ["businesses", business.id],
    ["specialties", specialty.id],
  ])
    assert.equal(
      (await request("/" + entity + "/" + id, "DELETE")).response.status,
      409,
    );
  for (const [entity, id, change] of [
    ["categories", category.id, { name: "Categoría actualizada" }],
    ["specialties", specialty.id, { description: "Cambio de descripción" }],
    ["businesses", business.id, { hours: "09–18" }],
    ["zones", zone.id, { name: "Zona actualizada" }],
  ]) {
    assert.equal(
      (await request("/" + entity + "/" + id, "PATCH", change)).response.status,
      200,
    );
    assert.equal((await request("/" + entity + "/" + id)).response.status, 200);
    assert.ok((await request("/" + entity)).count > 0);
  }
  const locIndexes = await mongoose.models.Location.collection.indexes(),
    zoneIndexes = await mongoose.models.Zone.collection.indexes();
  assert.ok(locIndexes.some((i) => i.key.location === "2dsphere"));
  assert.ok(zoneIndexes.some((i) => i.key.geometry === "2dsphere"));
  for (const [entity, id] of [
    ["locations", location.id],
    ["zones", zone.id],
    ["businesses", business.id],
    ["specialties", specialty.id],
    ["categories", category.id],
  ]) {
    assert.equal(
      (await request("/" + entity + "/" + id, "DELETE")).response.status,
      200,
    );
    assert.equal((await request("/" + entity + "/" + id)).response.status, 404);
  }
});
test("validación, entradas maliciosas, IDs y errores HTTP", async () => {
  for (const body of [
    { name: "X", kind: "taller" },
    { name: "Correcto", kind: "otro" },
    { name: "Correcto", kind: "taller", admin: true },
    {},
  ])
    assert.equal(
      (await request("/categories", "POST", body)).response.status,
      400,
    );
  assert.equal((await request("/locations/no-es-id")).response.status, 400);
  assert.equal(
    (await request("/locations?status=imposible")).response.status,
    400,
  );
  assert.equal(
    (await request("/locations?search[$ne]=x")).response.status,
    400,
  );
  assert.equal(
    (await request("/locations?radius=5&latitude=1")).response.status,
    400,
  );
  assert.equal(
    (
      await request("/businesses", "POST", {
        name: "Malo",
        website: "javascript:alert(1)",
      })
    ).response.status,
    400,
  );
  assert.equal(
    (
      await request("/businesses", "POST", {
        name: "Malo",
        specialties: ["a".repeat(24)],
      })
    ).response.status,
    400,
  );
  assert.equal((await request("/no-existe")).response.status, 404);
  const invalid = await fetch(base + "/api/categories", {
    method: "POST",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: "{",
  });
  assert.equal(invalid.status, 400);
  const csrf = await fetch(base + "/api/categories", {
    method: "POST",
    headers: {
      Cookie: cookie,
      "Content-Type": "application/json",
      Origin: "https://otro.example",
    },
    body: JSON.stringify({ name: "Malo", kind: "taller" }),
  });
  assert.equal(csrf.status, 403);
  const polygons = [
    {
      type: "Polygon",
      coordinates: [
        [
          [0, 0],
          [1, 1],
          [1, 0],
          [0, 1],
          [0, 0],
        ],
      ],
    },
    {
      type: "Polygon",
      coordinates: [
        [
          [0, 0],
          [1, 0],
          [2, 0],
          [0, 0],
        ],
      ],
    },
    {
      type: "Polygon",
      coordinates: [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [2, 2],
        ],
      ],
    },
    {
      type: "Polygon",
      coordinates: [
        [
          [0, 91],
          [1, 0],
          [1, 1],
          [0, 91],
        ],
      ],
    },
  ];
  polygons.forEach((p) => assert.throws(() => polygon(p)));
});
test("sesión expirada y cierre invalidan el acceso en servidor", async () => {
  await Session.updateMany(
    {},
    { $set: { expiresAt: new Date(Date.now() - 10000) } },
  );
  assert.equal((await request("/auth/me")).response.status, 401);
  const login = await request(
    "/auth/login",
    "POST",
    { email: "prueba@example.com", password: "PasswordTest123!" },
    false,
  );
  assert.equal(login.response.status, 200);
  cookie = login.response.headers.get("set-cookie").split(";")[0];
  assert.equal(
    (await request("/auth/logout", "POST", {})).response.status,
    200,
  );
  assert.equal((await request("/locations")).response.status, 401);
});
