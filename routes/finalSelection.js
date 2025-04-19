const express = require("express");
const router = express.Router();
const { FinalSelection, validateFinalSelection } = require("../models/finalSelection.js");

// Submit Final Selection
router.post("/", async (req, res) => {
  const { error } = validateFinalSelection(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const final = new FinalSelection(req.body);
    await final.save();
    res.status(201).json(final);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get All Final Selections
router.get("/", async (req, res) => {
  const selections = await FinalSelection.find()
    .populate("studentGroup", "username email")
    .populate("selectedProject", "title");
  res.json(selections);
});

module.exports = router;
