const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { Project, validateProject,validateUpdateProject } = require("../models/project");
const {
  verifyTokenAndAuthorization,
  verifyToken,
  verifyTokenAndTeacher
} = require("../middlewares/verifyToken");

/**
 * @desc  create project
 * @route api/projects/:id   id(for teacher)
 * @method post
 * @access private (only admin and the same teacher)
 *
 **/
router.post(
  "/:id",
  verifyTokenAndAuthorization({
    roles: ["Admin", "Teacher"],
    userIdParam: "id",
  }),
  async (req, res) => {
    // check for empty req.body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .json({ message: "Request body is empty or missing" });
    }
    const { error } = validateProject(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    try {
      req.body.teacher = req.params.id;
      const project = new Project(req.body);
      await project.save();
      res.status(201).json(project);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);
/**
 * @desc  update  project
 * @route api/projects/:id   the id is for the project
 * @method put
 * @access private (only admin and the same teacher)
 *
 **/
router.put(
  "/:id",
  verifyTokenAndTeacher({
    roles: ["Admin", "Teacher"],
    userIdParam: "id", // Not used for project, but for validation of teacher/role
  }),
  async (req, res) => {
    // Validate ObjectId before querying
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Project ID" });
    }

    // check for empty req.body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Request body is empty or missing" });
    }

    // Validation for updated project data
    const { error } = validateUpdateProject(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    try {
      // Find the project by its ID
      const project = await Project.findById(id);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }


      // Admins , teachers can only update their own project "user.id"
      if (req.user.role === "Teacher" && project.teacher.toString() !== req.user.id) {
        return res.status(403).json({ message: "You are not allowed to update this project" });
      }

      // Perform the update operation
      const updatedProject = await Project.findByIdAndUpdate(
        id,
        { $set: req.body },
        { new: true }
      );

      res.status(200).json(updatedProject);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);


/**
 * @desc  Get All Projects
 * @route api/projects
 * @method get
 * @access private (all users)
 *
 **/
//
router.get("/", verifyToken, async (req, res) => {
  const projects = await Project.find().populate("teacher", "fullname email");
  res.json(projects);
});

/**
 * @desc  Get Project by id
 * @route api/projects:id
 * @method get
 * @access private (all users)
 *
 **/
//
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      "teacher",
      "username email"
    );
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
