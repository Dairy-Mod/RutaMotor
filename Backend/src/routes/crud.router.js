const express = require("express");
const validate = require("../middlewares/validate");
// La ruta traduce HTTP; la lógica, referencias y MongoDB quedan en los servicios.
module.exports = function (entity, service) {
  const router = express.Router();
  router.get("/", async (req, res) => {
    const data = await service.list(req.query);
    res.json({ count: data.length, data });
  });
  if (service.geojson)
    router.get("/geojson", async (req, res) =>
      res.json(await service.geojson(req.query)),
    );
  router.get("/:id", async (req, res) =>
    res.json({ data: await service.get(req.params.id) }),
  );
  router.post("/", validate(entity), async (req, res) =>
    res.status(201).json({ data: await service.create(req.body, req.user) }),
  );
  router.patch("/:id", validate(entity, true), async (req, res) =>
    res.json({ data: await service.update(req.params.id, req.body) }),
  );
  router.delete("/:id", async (req, res) =>
    res.json({ data: await service.delete(req.params.id) }),
  );
  return router;
};
