const Joi = require("joi");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const passwordComplexity = require("joi-password-complexity");
const { stdout } = require("process");
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 100,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },
    fullname:{
      type: String,
      required: true,
      minlength: 5,
      maxlength: 200,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
    },

    role: {
      type: String,
      enum:["Admin","Teacher","Student"],
      default: Student,
    },
  },
  { timestamps: true }
);
const complexityOptions = {
  min: 8,
  max: 30,
  lowerCase: 1,
  upperCase: 1,
  numeric: 1,
  // symbol: 1,
  requirementCount: 4,
};

// Generate Token
userSchema.methods.generateToken = function () {
  return jwt.sign(
    { id: this._id, isAdmin: this.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// validate update
function validateUpdateUser(obj) {
  const schema = Joi.object({
    email: Joi.string().trim().min(5).max(100).email(),
    username: Joi.string().trim().min(2).max(200),
    fullname: Joi.string().trim().min(2).max(200),
    password: passwordComplexity(complexityOptions)
  });
  return schema.validate(obj);
}
// validate Register user
function validateRegisterUser(obj) {
  const schema = Joi.object({
    email: Joi.string().trim().min(5).max(100).required().email(),
    fullname: Joi.string().trim().min(2).max(200).required(),
    username: Joi.string().trim().min(2).max(200).required(),
    password: passwordComplexity(complexityOptions).required(),
  });
  return schema.validate(obj);
}
// validate Login user
function validateLoginUser(obj) {
  const schema = Joi.object({
    username: Joi.string().trim().min(2).max(200).required(),
    password: Joi.string().trim().min(6).required(),
  });
  return schema.validate(obj);
}
// validate reset password
function validateResetPassword(obj) {
  const schema = Joi.object({
    password: passwordComplexity(complexityOptions).required(),
  });
  return schema.validate(obj);
}
const User = mongoose.model("User", userSchema);

module.exports = {
  User,
  validateRegisterUser,
  validateUpdateUser,
  validateLoginUser,
  validateResetPassword,
};
