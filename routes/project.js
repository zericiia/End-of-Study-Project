const express = require("express");
const router = express.Router();
const { Project, validateProject } = require("../models/project");

// Create Project
router.post("/", async (req, res) => {
  const { error } = validateProject(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const project = new Project(req.body);
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get All Projects
router.get("/", async (req, res) => {
  const projects = await Project.find().populate("teacher", "username email");
  res.json(projects);
});

// Get Project by ID
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate("teacher", "username email");
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
