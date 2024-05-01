const mongoose = require("mongoose");

const doctorSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Fill in everything"],
    },
    password: { type: String, required: [true, "Fill in everything"] },
    last_name: {
      type: String,
      required: true,
    },
    first_name: {
      type: String,
      required: true,
    },
    dob: { type: Date, required: [true, "fill in dob"] },
    bio: String,
    default_appt_duration: String,
    phone_number: String,
    email: String,
    is_active: Boolean,
    is_in: Boolean,
    specializations: [
      {
        spe_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Specialization",
        },
      },
    ],
    clinics: [
      {
        clinic_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Clinic",
        },
      },
    ],

    operating_hours: [
      {
        day: Number,
        start: String,
        end: String,
      },
    ],

    timeslots: [{ day: Number, start: String, end: String }],

    schedule: [
      {
        clinic_id: { type: mongoose.Schema.Types.ObjectId, ref: "clinic" },
        day: [Number],
        walk_in: [
          {
            timeslot_id: { type: mongoose.Schema.Types.ObjectId },
            start: String,
            end: String,
            is_available: Boolean,
          },
        ],
        booking: [
          {
            timeslot_id: { type: mongoose.Schema.Types.ObjectId },
            start: String,
            end: String,
            is_available: Boolean,
          },
        ],
      },
    ],
    // occupied_slots: [{timeslot_id: { type: mongoose.Schema.Types.ObjectId }, date: date }]

    appointments: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Appointment",
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);
