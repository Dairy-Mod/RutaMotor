const express = require("express");
const { rateLimit } = require("express-rate-limit");
const auth = require("../services/auth.service");
const requireAuth = require("../middlewares/auth");
const { sessionCookie } = require("../config/constants");
const router = express.Router();
const limit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Demasiados intentos. Intenta de nuevo en 15 minutos." },
});
const options = {
  httpOnly: true,
  sameSite: "strict",
  secure: process.env.COOKIE_SECURE === "true",
  path: "/api",
};
for (const method of ["register", "login"])
  router.post("/" + method, limit, async (req, res) => {
    const { user, token, maxAge } = await auth[method](req.body);
    res
      .cookie(sessionCookie, token, { ...options, maxAge })
      .status(method === "register" ? 201 : 200)
      .json({ data: user });
  });
router.get("/me", requireAuth, (req, res) => res.json({ data: req.user }));
router.post("/logout", async (req, res) => {
  await auth.logout(req.cookies[sessionCookie]);
  res.clearCookie(sessionCookie, options).json({ message: "Sesión cerrada." });
});
module.exports = router;
