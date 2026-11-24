const Crud = require("./crud.service");
const AppError = require("../utils/appError");
class SpecialtiesService extends Crud {
  constructor() {
    super("specialties", require("../models/specialty.model"));
  }
  async beforeDelete(id) {
    if (await require("../models/business.model").exists({ specialties: id }))
      throw new AppError(
        409,
        "La especialidad está asociada a un negocio. Retira la asociación primero.",
      );
  }
}
module.exports = new SpecialtiesService();
