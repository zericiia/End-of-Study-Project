const mongoose = require("mongoose");
const Joi = require("joi");
const proposalSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    message: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Proposal = mongoose.model("Proposal", proposalSchema);

// Joi Validation
function validateProposal(obj) {
  const schema = Joi.object({
   // project: Joi.string().required(),
   // students: Joi.array().items(Joi.string()).min(1).max(2).required(),
    message: Joi.string().allow("").max(1000),
    // status: Joi.string().valid("pending", "accepted", "declined"),
  });
  return schema.validate(obj);
}

module.exports = { Proposal, validateProposal };
