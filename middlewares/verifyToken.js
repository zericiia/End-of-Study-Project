const jwt = require("jsonwebtoken");

//  verify Token
function verifyToken(req, res, next) {
  // 1. Get token from headers (standard: "Authorization: Bearer <token>")
  // const authHeader = req.headers.authorization;
  // console.log(authHeader);
  
  // const token = authHeader && authHeader.split(" ")[1]; // Extract token from "Bearer <token>"

  // if (!token) {
  //   return res.status(401).json({ message: "No token provided" }); // Early return
  // }
  // try {
  //   // 2. Verify token
  //   const decoded = jwt.verify(token, process.env.JWT_SECRET);
  //   req.user = decoded; // Attach decoded user data to request
  //   next(); // Proceed to next middleware
  // } catch (error) {
  //   // 3. Handle specific JWT errors 
  //   if (error.name === "TokenExpiredError") {
  //     return res.status(401).json({ message: "Token expired" });
  //   } else if (error.name === "JsonWebTokenError") {
  //     return res.status(401).json({ message: "Invalid token" });
  //   } else {
  //     return res.status(500).json({ message: "Failed to authenticate token" });
  //   }
  // }

  // old way
  const token = req.headers.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ message: "invalid token" });
    }
  } else {
    res.status(401).json({ message: "no token provided" });
  }
}

// Verify Token And Authorize The User
function verifyTokenAndAuthorizaton(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.id === req.params.id || req.user.isAdmin) {
      next();
    } else {
      return res
        .status(403)
        .json({
          message: `you are not allowed ${req.params.id} -------${req.user.id}`,
        });
    }
  });
}
// Verify Token And Admin
function verifyTokenAndAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.isAdmin) {
      next();
    } else {
      // 403 is forbiden
      return res
        .status(403)
        .json({ message: "you are not allowed, only Admins are allowed" });
    }
  });
}
module.exports = {
  verifyToken,
  verifyTokenAndAuthorizaton,
  verifyTokenAndAdmin,
};
