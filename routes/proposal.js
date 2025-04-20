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

/**
 * @desc  View your own proposal
 * @route /api/proposals/viewProposal/:id  id(for the student)
 * @method get
 * @access private (only admin and the same student)
 */
router.get("/viewProposal/:id",verifyTokenAndAuthorization({ roles: ["Admin", "Student"], userIdParam: "id" }), async (req, res) => {
  try {
    // Find the proposal by student ID
    const proposals = await Proposal.find({ students: req.params.id })
    .populate({
      path: "project",
      select: "title description teacher",
      populate: {
        path: "teacher",
        select: "email fullname",
      },
    })
    .populate("students", "username fullname email");

    // Check if the proposal exists
    if (!proposals || proposals.length === 0) {
      return res.status(404).json({ message: "No proposals found for this student" });
    }

    res.json(proposals);  // Send the proposals data
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


/**
 * @desc  Update your own proposal
 * @route PUT /api/proposals/:proposalId
 * * @method put
 * @access Private (only the student who submitted it)
 */
router.put(
  "/:proposalId",
  verifyTokenAndStudent,
  async (req, res) => {
    try {
      const { proposalId } = req.params;

      // Find the proposal 
      const proposal = await Proposal.findById(proposalId);
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }

      // Check if the logged-in student is part of the proposal
      if (!proposal.students.includes(req.user.id)) {
        return res.status(403).json({ message: "You are not allowed to update this proposal" });
      }

      // 
      const { error } = validateProposal(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      // Update only allowed fields
      if (req.body.message !== undefined) proposal.message = req.body.message;
      if (req.body.project !== undefined) proposal.project = req.body.project;

      await proposal.save();

      res.json({ message: "Proposal updated successfully", proposal });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);
/**
 * @desc  Delete your own proposal
 * @route DELETE /api/proposals/:proposalId
   @method delete
 * @access Private (only the student who submitted it or Admin)
 */
router.delete(
  "/:proposalId",
  verifyTokenAndStudent,
  async (req, res) => {
    try {
      const { proposalId } = req.params;

      const proposal = await Proposal.findById(proposalId);
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }

      // check if the logged-in student is part of the proposal
      if (!proposal.students.includes(req.user.id)) {
        return res.status(403).json({ message: "You are not allowed to delete this proposal" });
      }

      await Proposal.findByIdAndDelete(proposalId);
      res.json({ message: "Proposal deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);


module.exports = router;
