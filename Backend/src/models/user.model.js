const { mongoose, options, name } = require("./base");
const schema = new mongoose.Schema(
  {
    name,
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
  },
  options,
);
module.exports = mongoose.model("User", schema);
