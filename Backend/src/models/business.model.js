const { mongoose, options, name } = require("./base");
module.exports = mongoose.model(
  "Business",
  new mongoose.Schema(
    {
      name,
      phone: { type: String, default: "" },
      hours: { type: String, default: "" },
      website: { type: String, default: "" },
      specialties: [{ type: mongoose.Schema.Types.ObjectId, ref: "Specialty" }],
    },
    options,
  ),
);
