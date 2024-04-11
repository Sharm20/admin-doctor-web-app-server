const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Fill in everything"],
    },

    password: {
      type: String,
      required: [true, "Fill in everything"],
    },
    last_name: {
      type: String,
      required: true,
    },
    first_name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: [true, "Fill in everything"],
    },

    dob: {
      type: Date,
      required: [true, "fill in everything"],
    },

    userType: { type: String, enum: ["clinic", "admin"], required: true },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctors",
      default: null,
    },
  },
  { timestamps: true }
);

const User = new mongoose.model("User", userSchema);
module.exports = User;
