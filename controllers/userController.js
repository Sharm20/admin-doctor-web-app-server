const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Doctor = require("../models/doctorModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: "input everything" });

  try {
    const userExistsinDB = await User.findOne({ username });
    if (!userExistsinDB)
      return res.status(400).json({ error: "User not in our database" });

    const passwordMatch = await bcrypt.compare(
      password,
      userExistsinDB.password
    );
    if (!passwordMatch)
      return res.status(400).json({ error: "incorrect password" });

    const payload = { _id: userExistsinDB._id };
    const token = jwt.sign(payload, process.env.JWT_SECRETKEY, {
      expiresIn: "1h",
    });
    res.cookie("jwt", token, { expire: new Date() + 999, httpOnly: true });
    const user = { ...userExistsinDB._doc, password: undefined };
    return res.status(200).json({ token, user, message: "Login Successful" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }

  //   res.send("login page");
};

const logout = (req, res) => {
  res.clearCookie("jwt");
  return res.json({ message: "Logout Successfull" });
};

const register = async (req, res) => {
  const {
    username,
    password,
    last_name,
    first_name,
    email,
    dob,
    userType,
    doctor,
  } = req.body;

  if (!username || !first_name || !last_name || !dob || !password)
    return res.status(400).json({ error: "Please fill in everything" });

  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    const userExists = await User.findOne({ first_name, last_name });

    if (userExists)
      return res.status(400).json({ error: "User already exists" });

    const newUser = await User.create({
      username,
      password: hashedPassword,
      last_name,
      first_name,
      email,
      dob,
      userType,
      doctor,
    });
    return res.status(201).json({ ...newUser._doc, password: undefined });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};

// read user

const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    return res.status(404).json({ error: "User not found" });
  }

  return res.status(200).json({ ...user._doc });
});

const allUsers = asyncHandler(async (req, res) => {
  const { search } = req.query;

  const query = User.find();
  if (search) {
    query.or([
      { first_name: { $regex: new RegExp(search, "i") } },
      { last_name: { $regex: new RegExp(search, "i") } },
    ]);
  }
  const users = await query.exec();
  const modifiedUsers = users.map((user) => ({
    ...user.toObject(),
  }));

  return res.status(200).json(modifiedUsers);
});

// update user

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    return res.status(404).json({ error: "User not found" });
  }

  const { password, newPassword } = req.body;

  if (password) {
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch)
      return res.status(400).json({ error: "current password is incorrect" });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          username: req.body.username || user.username,
          first_name: req.body.first_name || user.first_name,
          last_name: req.body.last_name || user.last_name,
          email: req.body.email || user.email,
          dob: req.body.dob || user.dob,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (newPassword) {
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      updatedUser.password = hashedNewPassword;
      await updatedUser.save();
    }

    console.log(req.body);
    console.log(updatedUser);

    return res.status(200).json({ ...updatedUser._doc });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
});

// delete user

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  await User.findByIdAndDelete(req.params.id);
  return res.status(200).json({ message: "User has been deleted" });
});

module.exports = {
  login,
  register,
  logout,
  getUser,
  updateUser,
  deleteUser,
  allUsers,
};
