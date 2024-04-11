const mongoose = require("mongoose");

const patientSchema = mongoose.Schema(
  {
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    dob: { type: String, required: true },
    sex: { type: String, required: true },
    appointments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment",
      },
    ],

    contact_details: {
      phone_number: { type: String, required: true },
      email: String,
    },
    title: String,
    marital_status: String,
    religion: String,
    occupation: String,
    address: {
      street_name: String,
      barangay: String,
      city: String,
      zip_code: String,
    },
    philhealth_no: String,
    employer: String,
    emergency_contact: [
      {
        name: String,
        number: String,
        relationship: String,
      },
    ],
  },
  { timestamps: true }
);

const patientModel = new mongoose.model("Patient", patientSchema);
module.exports = patientModel;
