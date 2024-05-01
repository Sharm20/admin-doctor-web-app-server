const mongoose = require("mongoose");

const calendarSchema = mongoose.Schema(
  {
    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },
    doctor_first_name: {
      type: mongoose.Schema.Types.String,
      ref: "Doctor",
    },
    doctor_last_name: {
      type: mongoose.Schema.Types.String,
      ref: "Doctor",
    },
    calendar_days: [
      {
        date: Date,
        day_index: Number,
        bookable_count: Number,
        walk_in_count: Number,
        bookable: [
          {
            clinic_id: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Clinic",
            },
            clinic_code: {
              type: mongoose.Schema.Types.String,
              ref: "Clinic",
            },
            timeslot_id: mongoose.Schema.Types.ObjectId,
            is_available: Boolean,
          },
        ],
        walk_in: [
          {
            clinic_id: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Clinic",
            },
            clinic_code: {
              type: mongoose.Schema.Types.String,
              ref: "Clinic",
            },
            timeslot_id: mongoose.Schema.Types.ObjectId,
            is_available: Boolean,
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Calendar", calendarSchema);
