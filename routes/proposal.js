const express = require("express");
const router = express.Router();
const Project = require("../models/project.js");
const {
  verifyToken,
  verifyTokenAndAuthorization,
  verifyTokenAndStudent,
} = require("../middlewares/verifyToken.js");
const { Proposal, validateProposal } = require("../models/proposal.js");

/**
 * @desc  create a Proposal
 * @route /api/proposals/:id/ id(for the project)
 * @method put
 * @access private (only admin and the student)
 *
 **/

router.post("/:id", verifyTokenAndStudent, async (req, res) => {
  // Check if the student has already submitted 3 proposals
  const studentProposals = await Proposal.find({
    students: req.user.id,
  }).countDocuments();
  if (studentProposals >= 3) {
    return res
      .status(403)
      .json({ message: "You can submit a maximum of 3 proposals" });
  }

  // Proceed with creating the proposal
  const { error } = validateProposal(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  try {
    const projectId = req.params.id;
    const proposal = new Proposal({
      project: projectId,
      students: [req.user.id], // Include student submitting the proposal
      message: req.body.message,
    });

    await proposal.save();
    res
      .status(201)
      .json({ message: "Proposal submitted successfully", proposal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get All Proposals
router.get("/", async (req, res) => {
  const proposals = await Proposal.find()
    .populate("project", "title")
    .populate("students", "username email");
  res.json(proposals);
});

// Update Proposal Status
router.put("/:id", async (req, res) => {
  const allowedStatuses = ["pending", "accepted", "declined"];
  const { status } = req.body;
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  try {
    const proposal = await Proposal.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!proposal)
      return res.status(404).json({ message: "Proposal not found" });
    res.json(proposal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
