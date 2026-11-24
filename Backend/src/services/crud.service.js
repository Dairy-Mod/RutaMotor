const {
  objectId,
  validateData,
  validateQuery,
} = require("../utils/validation");
const AppError = require("../utils/appError");
// Comparte operaciones mecánicas; cada servicio declara sus relaciones y reglas.
class CrudService {
  constructor(entity, Model, populate = []) {
    Object.assign(this, { entity, Model, populate });
  }
  async list(query = {}) {
    validateQuery(query, []);
    return this.Model.find().sort({ name: 1 }).populate(this.populate);
  }
  async get(id) {
    objectId(id);
    const doc = await this.Model.findById(id).populate(this.populate);
    if (!doc) throw new AppError(404, "Registro no encontrado.");
    return doc;
  }
  async references() {}
  async beforeDelete() {}
  async create(data, user) {
    const clean = validateData(this.entity, data);
    await this.references(clean);
    if (["locations", "zones"].includes(this.entity)) clean.createdBy = user.id;
    const doc = await this.Model.create(clean);
    return this.get(doc.id);
  }
  async update(id, data) {
    const clean = validateData(this.entity, data, true);
    const doc = await this.get(id);
    await this.references(clean);
    doc.set(clean);
    await doc.save();
    return this.get(id);
  }
  async delete(id) {
    const doc = await this.get(id);
    await this.beforeDelete(id);
    await doc.deleteOne();
    return doc;
  }
}
module.exports = CrudService;
