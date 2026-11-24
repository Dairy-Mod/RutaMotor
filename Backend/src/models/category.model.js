const { mongoose, options, name } = require("./base");
const schema = new mongoose.Schema(
  {
    name: { ...name, unique: true },
    kind: {
      type: String,
      required: true,
      enum: require("../config/constants").kinds,
    },
    description: { type: String, default: "" },
  },
  options,
);
module.exports = mongoose.model("Category", schema);
