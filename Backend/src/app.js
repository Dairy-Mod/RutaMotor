require("./config/database");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookies = require("cookie-parser");
const mongoose = require("mongoose");
const AppError = require("./utils/appError");
const { notFoundHandler, errorHandler } = require("./middlewares/error.handle");
const app = express();
app.disable("x-powered-by");
app.use(helmet());
const origins = (
  process.env.FRONTEND_ORIGINS || "http://127.0.0.1:5173,http://localhost:5173"
)
  .split(",")
  .map((s) => s.trim());
app.use(
  cors({
    credentials: true,
    origin(origin, cb) {
      cb(
        origin && !origins.includes(origin)
          ? new AppError(403, "Origen no permitido.")
          : null,
        true,
      );
    },
  }),
);
// También se comprueba Origin en escrituras para evitar CSRF con cookies.
app.use((req, res, next) => {
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    req.headers.origin &&
    !origins.includes(req.headers.origin)
  )
    return next(new AppError(403, "Origen no permitido."));
  next();
});
app.use(express.json({ limit: "100kb" }));
app.use(cookies());
app.get("/api/health", (req, res) =>
  res
    .status(mongoose.connection.readyState === 1 ? 200 : 503)
    .json({
      status: mongoose.connection.readyState === 1 ? "ok" : "unavailable",
      name: "RutaMotor API",
    }),
);
require("./routes")(app);
app.use(notFoundHandler);
app.use(errorHandler);
module.exports = app;
