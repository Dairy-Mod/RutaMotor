const { mongoose, options, name, ref } = require("./base");
const { coordinate } = require("../utils/geometry");
const point = new mongoose.Schema(
  {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: { type: [Number], required: true, validate: coordinate },
  },
  { _id: false },
);
const schema = new mongoose.Schema(
  {
    name,
    description: { type: String, required: true, maxlength: 1000 },
    address: { type: String, default: "" },
    category: ref("Category"),
    business: ref("Business"),
    status: {
      type: String,
      enum: require("../config/constants").statuses,
      required: true,
    },
    location: { type: point, required: true },
    createdBy: ref("User"),
  },
  options,
);
schema.index({ location: "2dsphere" });
module.exports = mongoose.model("Location", schema);
