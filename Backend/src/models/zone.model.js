const { mongoose, options, name, ref } = require("./base");
const geometry = new mongoose.Schema(
  {
    type: { type: String, enum: ["Polygon"], required: true },
    coordinates: { type: [[[Number]]], required: true },
  },
  { _id: false },
);
const schema = new mongoose.Schema(
  {
    name,
    description: { type: String, default: "" },
    geometry: { type: geometry, required: true },
    createdBy: ref("User"),
  },
  options,
);
schema.index({ geometry: "2dsphere" });
module.exports = mongoose.model("Zone", schema);
