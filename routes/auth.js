const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const {
  User,
  validateRegisterUser,
  validateLoginUser,
} = require("../models/user");

/**
 * @desc  Register New User
 * @route /api/auth/register
 * @method post
 * @access public
 *
 **/
router.post("/Register", async (req, res) => {
    // check for empty req.body
  if (!req.body || Object.keys(req.body).length === 0) {
    return res
      .status(400)
      .json({ message: "Request body is empty or missing" });
  }
  // validate req content
  const { error } = validateRegisterUser(req.body);
  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      errors: error.details.map((detail) => detail.message),
    });
  }

  try {
    //   check for dup emails
    let user = await User.findOne({ username: req.body.username });
    if (user) {
      return res.status(400).json({ message: "This user already exists" });
    }
    // Hashing password
    const salt = await bcrypt.genSalt(10);
    const hashedPasswod = await bcrypt.hash(req.body.password, salt);

    user = new User({
      email: req.body.email,
      fullname: req.body.fullname,
      username: req.body.username,
      password: hashedPasswod,
    });

    const result = await user.save();

    // gen token
    const token = user.generateToken();

    // Exclude password from response
    const { password, ...userData } = result._doc;
    userData.token = token;

    res.status(201).json(userData); // for testing
    // res.redirect("/homePage");
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "An internal server error occurred" });
  }
});

module.exports = router;
