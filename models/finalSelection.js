const mongoose = require("mongoose");
const Joi = require("joi");

const finalSelectionSchema = new mongoose.Schema(
  {
    studentGroup: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    selectedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
  },
  { timestamps: true }
);

const FinalSelection = mongoose.model("FinalSelection", finalSelectionSchema);

// Joi Validation
function validateFinalSelection(obj) {
  const schema = Joi.object({
    studentGroup: Joi.array().items(Joi.string()).min(1).max(2).required(),
    selectedProject: Joi.string().required(),
  });
  return schema.validate(obj);
}

module.exports = { FinalSelection, validateFinalSelection };
