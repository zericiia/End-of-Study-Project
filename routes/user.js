const express = require("express");
const mongoose = require("mongoose");
const { verifyTokenAndAuthorization, } = require("../middlewares/verifyToken");
const router = express.Router();
const { User, validateUpdateUser } = require("../models/user");

/**
 * @desc  Update User
 * @route /api/user:id
 * @method put
 * @access private (only admin and the same user)
 *
 **/
router.put("/:id",verifyTokenAndAuthorization({ roles: ["Admin", "Student","Teacher"], userIdParam: "id" }), async (req, res) => {
  // Validate ObjectId before querying
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid User ID" });
  }
  // check for empty req.body
  if (!req.body || Object.keys(req.body).length === 0) {
    return res
      .status(400)
      .json({ message: "Request body is empty or missing" });
  }
  // validtaion
  const { error } = validateUpdateUser(req.body);
  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      errors: error.details.map((detail) => detail.message),
    });
  }
  try {
    //   hash password if updated
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password, salt);
    }

    const UpdatedUser = await User.findByIdAndUpdate(
      id,
      {
        // $set: {
        //   email: req.body.email,
        //   fullname: req.body.fullname,
        //   username: req.body.username,
        //   password: req.body.password,
        // },
        $set: req.body,
      },
      { new: true }
    ).select("-password");
    res.status(200).json(UpdatedUser);
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
});
/**
 * @desc  Get All Users
 * @route /api/user
 * @method get
 * @access private (only admin)
 *
 **/
router.get("/",verifyTokenAndAuthorization({ roles: ["Admin"] }), async (req, res) => {
  try {
    const allusers = await User.find().select("-password");
    res.status(200).json(allusers);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

/**
 * @desc  Get User by id
 * @route /api/user/:id
 * @method get
 * @access private (only admin)
 *
 **/
router.get("/:id",verifyTokenAndAuthorization({ roles: ["Admin"] }), async (req, res) => {
  // Validate ObjectId before querying
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid User ID" });
  }
  try {
    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "user was not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
module.exports = router;
