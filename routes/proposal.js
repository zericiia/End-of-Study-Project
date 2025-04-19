const express = require("express");
const router = express.Router();
const { Proposal, validateProposal } = require("../models/proposal.js");

// Submit Proposal
router.post("/", async (req, res) => {
  const { error } = validateProposal(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const proposal = new Proposal(req.body);
    await proposal.save();
    res.status(201).json(proposal);
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
    if (!proposal) return res.status(404).json({ message: "Proposal not found" });
    res.json(proposal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
