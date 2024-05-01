const mongoose = require("mongoose");

const patientSchema = mongoose.Schema(
  {
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    date_of_birth: { type: String, required: true },
    gender: { type: String, required: true },
    contact_num: { type: String, required: true },
    contact_person: String,
    contact_p_number: String,
    contact_person_rel: String,
    appointments: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Appointment",
        },
        status: String,
      },
    ],
    contact_details: {
      phone_number: String,
      email: String,
    },
    // other patient details (maybe can be filled by the clinic only? or on the mobile app)
    title: String, //Mr, Miss, Mrs
    marital_status: String, //Single, Married
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

module.exports = mongoose.model("Patient", patientSchema);
