const auth = require("../services/auth.service");
const { sessionCookie } = require("../config/constants");
module.exports = async function (req, res, next) {
  try {
    req.user = await auth.userFromToken(req.cookies[sessionCookie]);
    next();
  } catch (error) {
    next(error);
  }
};
