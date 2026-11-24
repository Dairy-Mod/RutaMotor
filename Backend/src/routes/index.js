const express = require("express");
const requireAuth = require("../middlewares/auth");
const crud = require("./crud.router");
module.exports = function (app) {
  app.use("/api/auth", require("./auth.router"));
  const router = express.Router();
  router.use(requireAuth);
  for (const entity of [
    "categories",
    "specialties",
    "businesses",
    "locations",
    "zones",
  ])
    router.use(
      "/" + entity,
      crud(entity, require("../services/" + entity + ".service")),
    );
  app.use("/api", router);
};
