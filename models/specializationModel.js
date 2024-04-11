const mongoose = require("mongoose");

const specializationSchema = mongoose.Schema(
  {
    specialty_name: {
      type: String,
      required: true,
    },

    desc: String,
    doctors: [
      {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Doctor",
        },
      },
    ],

    is_active: { type: Boolean, default: true },
  },
  { tiemstamps: true }
);

const specialization = new mongoose.model(
  "Specialization",
  specializationSchema
);

module.exports = specialization;
