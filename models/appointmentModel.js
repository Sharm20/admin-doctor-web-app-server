const mongoose = require("mongoose");

const appointmentSchema = mongoose.Schema(
  {
    reference_num: String,
    date: Date,
    timeslot: mongoose.Schema.Types.ObjectId, //index of timestamp
    appointment_notes: String,
    patient: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
      },
      first_name: String,
      last_name: String,
      contact_num: String,
      date_of_birth: Date,
      gender: String,
      contact_person: String,
      contact_p_number: String,
    },
    appointmentStatus: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "AppointmentStatus",
        },
        status: String,
      },
    ],
    clinic: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Clinic",
      },
      clinic_code: String,
    },
    doctor: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
      },
      last_name: String,
      first_name: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
