const { mongoose, ref } = require("./base");
const schema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  user: ref("User"),
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});
module.exports = mongoose.model("Session", schema);
