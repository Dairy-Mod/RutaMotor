const Crud = require("./crud.service");
const Category = require("../models/category.model");
const Location = require("../models/location.model");
const AppError = require("../utils/appError");
class CategoriesService extends Crud {
  constructor() {
    super("categories", Category);
  }
  async beforeDelete(id) {
    if (await Location.exists({ category: id }))
      throw new AppError(
        409,
        "Esta categoría tiene ubicaciones. Reasígnalas antes de eliminarla.",
      );
  }
}
module.exports = new CategoriesService();
