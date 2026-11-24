const { mongoose, options, name } = require("./base");
module.exports = mongoose.model(
  "Specialty",
  new mongoose.Schema(
    {
      name: { ...name, unique: true },
      description: { type: String, default: "" },
    },
    options,
  ),
);
