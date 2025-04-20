const mongoose = require("mongoose");
const Joi = require("joi");
const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Project = mongoose.model("Project", projectSchema);

// Joi Validation
function validateProject(obj) {
  const schema = Joi.object({
    title: Joi.string().min(3).max(100).required(),
    description: Joi.string().min(10).required(),
    // teacher: Joi.string().required(), // ObjectId as string
  });
  return schema.validate(obj);
}
// Joi Validation
function validateUpdateProject(obj) {
  const schema = Joi.object({
    title: Joi.string().min(3).max(100),
    description: Joi.string().min(10)
    // teacher: Joi.string().required(), // ObjectId as string
  });
  return schema.validate(obj);
}

module.exports = { Project, validateProject,validateUpdateProject };
