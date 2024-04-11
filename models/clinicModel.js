const mongoose = require("mongoose");

const clinicSchema = mongoose.Schema(
  {
    clinic_code: {
      type: String,
      required: true,
    },
    floor: {
      type: Number,
      required: true,
    },
    room: {
      type: Number,
      required: true,
    },
    doctors: [
      {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Doctor",
        },
      },
    ],
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Clinic", clinicSchema);
