const mongoose = require("mongoose");
const AppError = require("./appError");
const { point, polygon } = require("./geometry");
const { kinds, statuses } = require("../config/constants");
const fail = (message) => {
  throw new AppError(400, message);
};
const objectId = (value, field = "ID") => {
  if (typeof value !== "string" || !/^[a-f0-9]{24}$/i.test(value))
    fail(field + " no válido.");
  return value;
};
function text(value, field, min = 1, max = 200) {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max
  )
    fail(field + ": ingresa entre " + min + " y " + max + " caracteres.");
  return value.trim();
}
const optionalText = (v, f, max = 300) => text(v, f, 0, max);
const enumValue = (v, values, field) =>
  values.includes(v) ? v : fail(field + " no válido.");
function email(v) {
  const result = text(v, "Correo", 3, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result))
    fail("Ingresa un correo válido.");
  return result;
}
function password(v) {
  if (
    typeof v !== "string" ||
    v.length < 10 ||
    Buffer.byteLength(v, "utf8") > 72
  )
    fail("La contraseña requiere al menos 10 caracteres y máximo 72 bytes.");
  return v;
}
const fields = {
  categories: {
    name: (v) => text(v, "Nombre", 2, 80),
    kind: (v) => enumValue(v, kinds, "Tipo"),
    description: (v) => optionalText(v, "Descripción", 500),
  },
  specialties: {
    name: (v) => text(v, "Nombre", 2, 80),
    description: (v) => optionalText(v, "Descripción", 500),
  },
  businesses: {
    name: (v) => text(v, "Nombre", 2, 120),
    phone: (v) => {
      const s = optionalText(v, "Teléfono", 25);
      if (s && !/^\+?[\d\s()-]{7,25}$/.test(s)) fail("Teléfono no válido.");
      return s;
    },
    hours: (v) => optionalText(v, "Horario", 160),
    website: (v) => {
      const s = optionalText(v, "Sitio web", 300);
      if (s) {
        try {
          if (!["https:", "http:"].includes(new URL(s).protocol))
            fail("Usa una URL http o https.");
        } catch {
          fail("Sitio web no válido.");
        }
      }
      return s;
    },
    specialties: (v) => {
      if (!Array.isArray(v) || v.length > 30)
        fail("Especialidades no válidas.");
      return [...new Set(v.map((x) => objectId(x, "Especialidad")))];
    },
  },
  locations: {
    name: (v) => text(v, "Nombre", 2, 120),
    description: (v) => text(v, "Descripción", 3, 1000),
    address: (v) => optionalText(v, "Dirección", 250),
    category: (v) => objectId(v, "Categoría"),
    business: (v) => objectId(v, "Negocio"),
    status: (v) => enumValue(v, statuses, "Estado"),
    location: point,
  },
  zones: {
    name: (v) => text(v, "Nombre", 2, 100),
    description: (v) => optionalText(v, "Descripción", 500),
    geometry: polygon,
  },
};
const required = {
  categories: ["name", "kind"],
  specialties: ["name"],
  businesses: ["name"],
  locations: [
    "name",
    "description",
    "category",
    "business",
    "status",
    "location",
  ],
  zones: ["name", "geometry"],
};
function validateData(entity, data, partial = false) {
  if (!data || typeof data !== "object" || Array.isArray(data))
    fail("Envía un objeto JSON.");
  const keys = Object.keys(data),
    rules = fields[entity];
  if (!keys.length) fail("Envía al menos un campo.");
  for (const key of keys)
    if (!Object.hasOwn(rules, key)) fail("Campo no permitido: " + key);
  if (!partial)
    for (const key of required[entity])
      if (data[key] === undefined) fail("Falta el campo " + key + ".");
  return Object.fromEntries(keys.map((key) => [key, rules[key](data[key])]));
}
function validateQuery(query, allowed) {
  for (const [k, v] of Object.entries(query))
    if (!allowed.includes(k) || typeof v !== "string")
      fail("Filtro no válido: " + k);
}
module.exports = {
  validateData,
  validateQuery,
  objectId,
  text,
  email,
  password,
  enumValue,
  fail,
};
