const { validateData, objectId } = require("../utils/validation");
module.exports = (entity, partial = false) =>
  function (req, res, next) {
    try {
      if (req.params.id) objectId(req.params.id);
      validateData(entity, req.body, partial);
      next();
    } catch (error) {
      next(error);
    }
  };
