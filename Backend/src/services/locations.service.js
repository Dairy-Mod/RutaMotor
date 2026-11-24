const Crud = require("./crud.service");
const Location = require("../models/location.model");
const Category = require("../models/category.model");
const Business = require("../models/business.model");
const Zone = require("../models/zone.model");
const {
  objectId,
  validateQuery,
  text,
  enumValue,
  fail,
} = require("../utils/validation");
const { statuses } = require("../config/constants");
const AppError = require("../utils/appError");
class LocationsService extends Crud {
  constructor() {
    super("locations", Location, [
      { path: "category" },
      { path: "business", populate: { path: "specialties" } },
      { path: "createdBy", select: "name" },
    ]);
  }
  async references(data) {
    if (data.category && !(await Category.exists({ _id: data.category })))
      throw new AppError(400, "La categoría no existe.");
    if (data.business && !(await Business.exists({ _id: data.business })))
      throw new AppError(400, "El negocio no existe.");
  }
  async list(filters = {}) {
    validateQuery(filters, [
      "search",
      "category",
      "status",
      "zone",
      "specialty",
      "longitude",
      "latitude",
      "radius",
    ]);
    const query = {};
    if (filters.search)
      query.name = {
        $regex: text(filters.search, "Búsqueda", 1, 120).replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&",
        ),
        $options: "i",
      };
    if (filters.category)
      query.category = objectId(filters.category, "Categoría");
    if (filters.status)
      query.status = enumValue(filters.status, statuses, "Estado");
    if (filters.specialty) {
      const specialty = objectId(filters.specialty, "Especialidad");
      const businesses = await Business.find({ specialties: specialty }).select(
        "_id",
      );
      query.business = { $in: businesses.map((b) => b._id) };
    }
    if (filters.zone) {
      const zone = await Zone.findById(objectId(filters.zone, "Zona"));
      if (!zone) throw new AppError(404, "Zona no encontrada.");
      query.location = { $geoWithin: { $geometry: zone.geometry.toObject() } };
    }
    const nearKeys = ["longitude", "latitude", "radius"];
    if (nearKeys.some((k) => filters[k] !== undefined)) {
      if (
        nearKeys.some(
          (k) =>
            filters[k] === undefined ||
            !filters[k].trim() ||
            !Number.isFinite(Number(filters[k])),
        )
      )
        fail("Para cercanía envía longitud, latitud y radio numéricos.");
      const lng = Number(filters.longitude),
        lat = Number(filters.latitude),
        radius = Number(filters.radius);
      if (
        Math.abs(lng) > 180 ||
        Math.abs(lat) > 90 ||
        radius <= 0 ||
        radius > 100
      )
        fail("Cercanía inválida: radio mayor a 0 y máximo 100 km.");
      // $near y $geoWithin sobre el mismo campo no se pueden combinar: usa una conjunción.
      const nearby = {
        location: {
          $near: {
            $geometry: { type: "Point", coordinates: [lng, lat] },
            $maxDistance: radius * 1000,
          },
        },
      };
      if (query.location) {
        const within = query.location;
        delete query.location;
        query.$and = [{ location: within }, nearby];
      } else Object.assign(query, nearby);
      return Location.find(query).populate(this.populate);
    }
    return Location.find(query).sort({ name: 1 }).populate(this.populate);
  }
  async geojson(filters) {
    const docs = await this.list(filters);
    return {
      type: "FeatureCollection",
      features: docs.map((doc) => {
        const data = doc.toJSON();
        const geometry = data.location;
        delete data.location;
        return { type: "Feature", geometry, properties: data };
      }),
    };
  }
}
module.exports = new LocationsService();
