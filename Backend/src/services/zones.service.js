const Crud = require("./crud.service");
class ZonesService extends Crud {
  constructor() {
    super("zones", require("../models/zone.model"), [
      { path: "createdBy", select: "name" },
    ]);
  }
  async geojson(query) {
    const docs = await this.list(query);
    return {
      type: "FeatureCollection",
      features: docs.map((doc) => ({
        type: "Feature",
        geometry: doc.geometry.toObject(),
        properties: {
          id: doc.id,
          name: doc.name,
          description: doc.description,
        },
      })),
    };
  }
}
module.exports = new ZonesService();
