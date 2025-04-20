const express = require("express")
const router = express.Router()
const { verifyToken } = require("../middlewares/verifyToken")
const { Project } = require("../models/project")
const { Proposal } = require("../models/proposal")
const { FinalSelection } = require("../models/finalSelection")
const jwt = require("jsonwebtoken");



// Login page (root route)
router.get("/", (req, res) => {
  // If user is already logged in, redirect based on role
   if (req.cookies.token) {
    try {
      const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
      if (decoded.role === "Teacher") {
        return res.redirect("/teacher/dashboard");
      } else if (decoded.role === "Student") {
        return res.redirect("/student/dashboard");
      } else if (decoded.role === "Admin") {
        return res.redirect("/admin/dashboard");
      }
    } catch (error) {
      // If token is invalid, clear it and show login page
      res.clearCookie("token");
    }
  }
  
  // Otherwise show login page
  res.render("index");
});

// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
  if (req.cookies.token) {
    next()
  } else {
    res.redirect("/")
  }
}

// Middleware to check user role
const checkRole = (roles) => {
  return (req, res, next) => {
    if (roles.includes(req.user.role)) {
      next()
    } else {
      res.status(403).render("error", {
        message: "غير مصرح لك بالوصول إلى هذه الصفحة",
        user: req.user,
      })
    }
  }
}

// Login page (already defined in app.js)
// Register page
router.get("/register", (req, res) => {
  if (req.cookies.token) {
    return res.redirect("/")
  }
  res.render("register")
})

// Logout route
router.get("/logout", (req, res) => {
  res.clearCookie("token")
  res.redirect("/")
})

// Profile page
router.get("/profile", verifyToken, (req, res) => {
  res.render("profile", { user: req.user })
})

// Student Dashboard
router.get("/student/dashboard", verifyToken, checkRole(["Student"]), async (req, res) => {
  try {
    // Get counts and latest data
    const projectsCount = await Project.countDocuments()
    const proposalsCount = await Proposal.countDocuments({ students: req.user.id })
    const acceptedProposals = await Proposal.countDocuments({
      students: req.user.id,
      status: "accepted",
    })

    // Get latest projects
    const latestProjects = await Project.find().populate("teacher", "fullname email").sort({ createdAt: -1 }).limit(3)

    res.render("student/dashboard", {
      user: req.user,
      projectsCount,
      proposalsCount,
      hasAcceptedProposals: acceptedProposals > 0,
      latestProjects,
    })
  } catch (err) {
    res.status(500).render("error", {
      message: "حدث خطأ في الخادم",
      user: req.user,
    })
  }
})

// Teacher Dashboard
router.get("/teacher/dashboard", verifyToken, checkRole(["Teacher"]), async (req, res) => {
  try {
    // Get counts
    const projectsCount = await Project.countDocuments({ teacher: req.user.id })

    // Get projects IDs for this teacher
    const teacherProjects = await Project.find({ teacher: req.user.id }).select("_id")
    const projectIds = teacherProjects.map((project) => project._id)

    // Count pending proposals for teacher's projects
    const pendingProposalsCount = await Proposal.countDocuments({
      project: { $in: projectIds },
      status: "pending",
    })

    // Get latest proposals
    const latestProposals = await Proposal.find({ project: { $in: projectIds } })
      .populate("project", "title")
      .populate("students", "fullname email")
      .sort({ createdAt: -1 })
      .limit(5)

    res.render("teacher/dashboard", {
      user: req.user,
      projectsCount,
      pendingProposalsCount,
      latestProposals,
    })
  } catch (err) {
    res.status(500).render("error", {
      message: "حدث خطأ في الخادم",
      user: req.user,
    })
  }
})

// Projects listing
router.get("/projects", verifyToken, async (req, res) => {
  try {
    const projects = await Project.find().populate("teacher", "fullname email")
    res.render("projects/index", { user: req.user, projects })
  } catch (err) {
    res.status(500).render("error", {
      message: "حدث خطأ في الخادم",
      user: req.user,
    })
  }
})

// Project details
router.get("/projects/:id", verifyToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate("teacher", "fullname email")

    if (!project) {
      return res.status(404).render("error", {
        message: "المشروع غير موجود",
        user: req.user,
      })
    }

    // For students, check if they already submitted a proposal for this project
    let hasProposal = false
    let proposalCount = 0

    if (req.user.role === "Student") {
      hasProposal = await Proposal.exists({
        project: req.params.id,
        students: req.user.id,
      })

      proposalCount = await Proposal.countDocuments({ students: req.user.id })
    }

    res.render("projects/show", {
      user: req.user,
      project,
      hasProposal,
      proposalCount,
    })
  } catch (err) {
    res.status(500).render("error", {
      message: "حدث خطأ في الخادم",
      user: req.user,
    })
  }
})

// Teacher's projects
router.get("/teacher/projects", verifyToken, checkRole(["Teacher"]), async (req, res) => {
  try {
    const projects = await Project.find({ teacher: req.user.id })

    // Count proposals for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const proposalCount = await Proposal.countDocuments({ project: project._id })
        return {
          ...project.toObject(),
          proposalCount,
        }
      }),
    )

    res.render("teacher/projects", { user: req.user, projects: projectsWithCounts })
  } catch (err) {
    res.status(500).render("error", {
      message: "حدث خطأ في الخادم",
      user: req.user,
    })
  }
})

// New project form
router.get("/teacher/projects/new", verifyToken, checkRole(["Teacher"]), (req, res) => {
  res.render("teacher/project-form", { user: req.user, isEdit: false, project: {} })
})

// Edit project form
router.get("/teacher/projects/edit/:id", verifyToken, checkRole(["Teacher"]), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)

    if (!project) {
      return res.status(404).render("error", {
        message: "المشروع غير موجود",
        user: req.user,
      })
    }

    // Check if the teacher owns this project
    if (project.teacher.toString() !== req.user.id) {
      return res.status(403).render("error", {
        message: "غير مصرح لك بتعديل هذا المشروع",
        user: req.user,
      })
    }

    res.render("teacher/project-form", { user: req.user, project, isEdit: true })
  } catch (err) {
    res.status(500).render("error", {
      message: "حدث خطأ في الخادم",
      user: req.user,
    })
  }
})

// View proposals for a specific project
router.get("/teacher/projects/:id/proposals", verifyToken, checkRole(["Teacher"]), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)

    if (!project) {
      return res.status(404).render("error", {
        message: "المشروع غير موجود",
        user: req.user,
      })
    }

    // Check if the teacher owns this project
    if (project.teacher.toString() !== req.user.id) {
      return res.status(403).render("error", {
        message: "غير مصرح لك بعرض مقترحات هذا المشروع",
        user: req.user,
      })
    }

    const proposals = await Proposal.find({ project: req.params.id })
      .populate("students", "fullname email")
      .sort({ createdAt: -1 })

    res.render("teacher/project-proposals", {
      user: req.user,
      project,
      proposals,
    })
  } catch (err) {
    res.status(500).render("error", {
      message: "حدث خطأ في الخادم",
      user: req.user,
    })
  }
})

// Student proposals
router.get("/student/proposals", verifyToken, checkRole(["Student"]), async (req, res) => {
  try {
    const proposals = await Proposal.find({ students: req.user.id })
      .populate({
        path: "project",
        select: "title description teacher",
        populate: {
          path: "teacher",
          select: "fullname",
        },
      })
      .sort({ createdAt: -1 })

    res.render("student/proposals", { user: req.user, proposals })
  } catch (err) {
    res.status(500).render("error", {
      message: "حدث خطأ في الخادم",
      user: req.user,
    })
  }
})

// Final selection
router.get("/student/final-selection", verifyToken, checkRole(["Student"]), async (req, res) => {
  try {
    console.log('Fetching final selection for student:', req.user.id);
    
    // Get accepted proposals
    const acceptedProposals = await Proposal.find({
      students: req.user.id,
      status: "accepted",
    }).populate({
      path: "project",
      select: "title description teacher",
      populate: {
        path: "teacher",
        select: "fullname",
      },
    });

    console.log('Found accepted proposals:', acceptedProposals.length);

    // Check if student already made a final selection
    const finalSelection = await FinalSelection.findOne({
      studentGroup: { $in: [req.user.id] }
    }).populate({
      path: "selectedProject",
      select: "title description teacher",
      populate: {
        path: "teacher",
        select: "fullname",
      },
    });

    console.log('Final selection found:', !!finalSelection);

    // Prepare the data for the view
    const viewData = {
      user: req.user,
      acceptedProposals,
      hasSelectedProject: !!finalSelection,
      selectedProject: finalSelection ? finalSelection.selectedProject : null
    };

    console.log('Rendering view with data:', viewData);

    res.render("student/final-selection", viewData);
  } catch (err) {
    console.error('Error in final selection route:', err);
    console.error('Error stack:', err.stack);
    res.status(500).render("error", {
      message: "حدث خطأ في الخادم",
      user: req.user,
    });
  }
})
//  addded new
// Teacher: View all proposals across all projects
router.get("/teacher/proposals", verifyToken, checkRole(["Teacher"]), async (req, res) => {
  try {
    // Get projects IDs for this teacher
    const teacherProjects = await Project.find({ teacher: req.user.id }).select("_id title");
    const projectIds = teacherProjects.map((project) => project._id);
    
    // Get all proposals for teacher's projects
    const proposals = await Proposal.find({ project: { $in: projectIds } })
      .populate({
        path: "project",
        select: "title description"
      })
      .populate("students", "fullname email")
      .sort({ createdAt: -1 });
    
    // Group proposals by project
    const projectsMap = {};
    teacherProjects.forEach(project => {
      projectsMap[project._id] = {
        _id: project._id,
        title: project.title,
        proposals: []
      };
    });
    
    proposals.forEach(proposal => {
      const projectId = proposal.project._id.toString();
      if (projectsMap[projectId]) {
        projectsMap[projectId].proposals.push(proposal);
      }
    });
    
    // Convert map to array
    const projectsWithProposals = Object.values(projectsMap);
    
    res.render("teacher/all-proposals", {
      user: req.user,
      projectsWithProposals
    });
  } catch (err) {
    console.error(err);
    res.status(500).render("error", {
      message: "حدث خطأ في الخادم",
      user: req.user,
    });
  }
});

// Teacher: View specific proposal
router.get("/teacher/proposals/:id", verifyToken, checkRole(["Teacher"]), async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id)
      .populate({
        path: "project",
        select: "title description teacher"
      })
      .populate("students", "fullname email");
    
    if (!proposal) {
      return res.status(404).render("error", {
        message: "المقترح غير موجود",
        user: req.user,
      });
    }
    
    // Check if the teacher owns the project
    if (proposal.project.teacher.toString() !== req.user.id) {
      return res.status(403).render("error", {
        message: "غير مصرح لك بعرض هذا المقترح",
        user: req.user,
      });
    }
    
    res.render("teacher/proposal-details", {
      user: req.user,
      proposal
    });
  } catch (err) {
    console.error(err);
    res.status(500).render("error", {
      message: "حدث خطأ في الخادم",
      user: req.user,
    });
  }
});

// Error page
router.get("/error", (req, res) => {
  res.render("error", {
    message: req.query.message || "حدث خطأ غير معروف",
    user: req.user,
  })
})

module.exports = router
