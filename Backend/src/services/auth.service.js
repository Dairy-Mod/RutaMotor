const bcrypt = require("bcryptjs");
const { randomBytes, createHash } = require("node:crypto");
const User = require("../models/user.model");
const Session = require("../models/session.model");
const { email, password, text, fail } = require("../utils/validation");
const AppError = require("../utils/appError");
const digest = (token) => createHash("sha256").update(token).digest("hex");
const dummyHash = bcrypt.hashSync("invalid-password-for-timing", 12);
function validate(body, registration) {
  if (!body || typeof body !== "object" || Array.isArray(body))
    fail("Envía credenciales válidas.");
  const allowed = registration
    ? ["name", "email", "password"]
    : ["email", "password"];
  if (Object.keys(body).some((k) => !allowed.includes(k)))
    fail("Campo no permitido.");
  return {
    email: email(body.email),
    password: password(body.password),
    ...(registration ? { name: text(body.name, "Nombre", 2, 80) } : {}),
  };
}
async function issue(user) {
  const token = randomBytes(32).toString("hex");
  const hours = Number(process.env.SESSION_HOURS) || 12;
  const maxAge = Math.max(1, Math.min(hours, 168)) * 3600000;
  await Session.create({
    tokenHash: digest(token),
    user: user.id,
    expiresAt: new Date(Date.now() + maxAge),
  });
  return { user, token, maxAge };
}
module.exports = {
  async register(body) {
    const data = validate(body, true);
    if (await User.exists({ email: data.email }))
      throw new AppError(409, "Ya existe una cuenta con ese correo.");
    const user = await User.create({
      name: data.name,
      email: data.email,
      passwordHash: await bcrypt.hash(data.password, 12),
    });
    return issue(user);
  },
  async login(body) {
    const data = validate(body, false);
    const user = await User.findOne({ email: data.email }).select(
      "+passwordHash",
    );
    const match = await bcrypt.compare(
      data.password,
      user?.passwordHash || dummyHash,
    );
    if (!user || !match)
      throw new AppError(401, "Correo o contraseña incorrectos.");
    return issue(user);
  },
  async userFromToken(token) {
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token))
      throw new AppError(401, "Inicia sesión para continuar.");
    const session = await Session.findOne({
      tokenHash: digest(token),
      expiresAt: { $gt: new Date() },
    }).populate("user");
    if (!session?.user)
      throw new AppError(401, "Tu sesión terminó. Inicia sesión de nuevo.");
    return session.user;
  },
  async logout(token) {
    if (token) await Session.deleteOne({ tokenHash: digest(token) });
  },
};
