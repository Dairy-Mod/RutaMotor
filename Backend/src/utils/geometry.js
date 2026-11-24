const AppError = require("./appError");
const fail = (message) => {
  throw new AppError(400, message);
};
function coordinate(pair) {
  return (
    Array.isArray(pair) &&
    pair.length === 2 &&
    pair.every((n) => typeof n === "number" && Number.isFinite(n)) &&
    Math.abs(pair[0]) <= 180 &&
    Math.abs(pair[1]) <= 90
  );
}
function point(value) {
  if (!value || value.type !== "Point" || !coordinate(value.coordinates))
    fail(
      "Ubicación inválida: usa Point [longitud, latitud] con rangos válidos.",
    );
  return { type: "Point", coordinates: [...value.coordinates] };
}
function cross(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}
function onSegment(a, b, c) {
  return (
    Math.abs(cross(a, b, c)) < 1e-12 &&
    c[0] >= Math.min(a[0], b[0]) &&
    c[0] <= Math.max(a[0], b[0]) &&
    c[1] >= Math.min(a[1], b[1]) &&
    c[1] <= Math.max(a[1], b[1])
  );
}
function intersects(a, b, c, d) {
  const x = cross(a, b, c),
    y = cross(a, b, d),
    z = cross(c, d, a),
    w = cross(c, d, b);
  return (
    (x * y < 0 && z * w < 0) ||
    onSegment(a, b, c) ||
    onSegment(a, b, d) ||
    onSegment(c, d, a) ||
    onSegment(c, d, b)
  );
}
function polygon(value) {
  if (
    !value ||
    value.type !== "Polygon" ||
    !Array.isArray(value.coordinates) ||
    value.coordinates.length !== 1
  )
    fail("La zona debe ser un Polygon con un anillo exterior.");
  const ring = value.coordinates[0];
  if (
    !Array.isArray(ring) ||
    ring.length < 4 ||
    ring.length > 501 ||
    !ring.every(coordinate)
  )
    fail("La zona necesita entre 3 y 500 vértices válidos.");
  if (ring[0][0] !== ring.at(-1)[0] || ring[0][1] !== ring.at(-1)[1])
    fail("El anillo de la zona debe estar cerrado.");
  if (
    new Set(ring.slice(0, -1).map((p) => p.join(","))).size !==
    ring.length - 1
  )
    fail("La zona tiene vértices repetidos.");
  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
    for (let j = i + 2; j < ring.length - 1; j++) {
      if (i === 0 && j === ring.length - 2) continue;
      if (intersects(ring[i], ring[i + 1], ring[j], ring[j + 1]))
        fail("Los lados de la zona no pueden cruzarse ni tocarse.");
    }
  }
  if (Math.abs(area) < 1e-10) fail("La zona debe tener superficie.");
  return { type: "Polygon", coordinates: [ring.map((p) => [...p])] };
}
module.exports = { point, polygon, coordinate };
