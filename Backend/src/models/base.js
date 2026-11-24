const mongoose = require("mongoose");
const options = {
  timestamps: true,
  strict: "throw",
  toJSON: {
    versionKey: false,
    transform(doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.passwordHash;
      delete ret.tokenHash;
      return ret;
    },
  },
};
const name = { type: String, required: true, trim: true, maxlength: 120 };
const ref = (model) => ({
  type: mongoose.Schema.Types.ObjectId,
  ref: model,
  required: true,
});
module.exports = { mongoose, options, name, ref };
