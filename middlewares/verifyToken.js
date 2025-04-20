const jwt = require("jsonwebtoken");

//  Verify Token Middleware
function verifyToken(req, res, next) {
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ message: "Invalid token" });
    }
  } else {
    res.status(401).json({ message: "No token provided" });
  }
}
// verify if student or admin 
function verifyTokenAndStudent(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.role === "Student") {
      next();
    } else {
      return res.status(403).json({ message: "Only students can submit proposals" });
    }
  });
}

// Generic Authorization Middleware (Handles Roles and Conditions)
function verifyTokenAndAuthorization(options = {}) {
  return (req, res, next) => {
    const { roles = [], userIdParam = "id" } = options;  // roles array and the ID param to check

    verifyToken(req, res, () => {
      // Check if the user has one of the allowed roles (if any)
      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({
          message: `Access denied. Required role(s): ${roles.join(", ")}. You have: ${req.user.role}`,
        });
      }

      // Check if the user is trying to access their own profile or is an admin
      if (req.user.id !== req.params[userIdParam] && req.user.role !== "Admin") {
        return res.status(403).json({
          message: `You are not allowed to access this resource. User ID in params: ${req.params[userIdParam]}. Your ID: ${req.user.id}`,
        });
      }

      next();
    });
  };
}

function verifyTokenAndTeacher(options = {}) {
  return (req, res, next) => {
    const { roles = [], userIdParam = "id" } = options;  // roles array and the ID param to check

    verifyToken(req, res, () => {
      // Check if the user has one of the allowed roles (if any)
      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({
          message: `Access denied. Required role(s): ${roles.join(", ")}. You have: ${req.user.role}`,
        });
      }

      // Check if the user is trying to access their own profile or is an admin
      // if (req.user.id !== req.params[userIdParam] && req.user.role !== "Admin") {
      //   return res.status(403).json({
      //     message: `You are not allowed to access this resource. User ID in params: ${req.params[userIdParam]}. Your ID: ${req.user.id}`,
      //   });
      // }

      next();
    });
  };
}
module.exports = {
  verifyToken,
  verifyTokenAndAuthorization,
  verifyTokenAndTeacher,
  verifyTokenAndStudent,

};
