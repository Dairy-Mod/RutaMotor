const Crud = require("./crud.service");
const AppError = require("../utils/appError");
class BusinessesService extends Crud {
  constructor() {
    super("businesses", require("../models/business.model"), ["specialties"]);
  }
  async references(data) {
    if (
      data.specialties &&
      (await require("../models/specialty.model").countDocuments({
        _id: { $in: data.specialties },
      })) !== data.specialties.length
    )
      throw new AppError(400, "Alguna especialidad no existe.");
  }
  async beforeDelete(id) {
    if (await require("../models/location.model").exists({ business: id }))
      throw new AppError(
        409,
        "Este negocio tiene ubicaciones asociadas. Elimínalas o reasígnalas primero.",
      );
  }
}
module.exports = new BusinessesService();
