const AppError = require("../utils/appError");
function notFoundHandler(req, res, next) {
  next(new AppError(404, "Ruta no encontrada."));
}
function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  let status = error.status || 500,
    message = error.message;
  if (error.code === 11000) {
    status = 409;
    message = "Ya existe un registro con ese correo o nombre.";
  } else if (
    ["ValidationError", "CastError", "StrictModeError"].includes(error.name)
  ) {
    status = 400;
    message = "Datos inválidos. Revisa los campos y las coordenadas.";
  } else if (error.type === "entity.parse.failed") {
    status = 400;
    message = "El cuerpo JSON no es válido.";
  } else if (error.type === "entity.too.large") {
    status = 413;
    message = "La solicitud es demasiado grande.";
  }
  if (status >= 500) {
    console.error(error);
    message = "No se pudo completar la operación. Intenta de nuevo.";
  }
  res.status(status).json({ message });
}
module.exports = { notFoundHandler, errorHandler };
