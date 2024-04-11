const asyncHandler = require("express-async-handler");
const Patient = require("../models/patientModel");
const mongoose = require("mongoose");

// add Patient

const createPatient = async (req, res) => {
  const {
    first_name,
    last_name,
    dob,
    sex,
    appointments,
    contact_details,
    title,
    marital_status,
    religion,
    occupation,
    address,
    emergency_contact,
    philhealth_no,
    employer,
  } = req.body;

  // //  extracted contact details request body
  // const { phone_number: phoneNumber, email: Email } = req.body.contact_details;

  // //   extracted address request body
  // const {
  //   street_name: streetName,
  //   barangay: Barangay,
  //   city: City,
  //   zip_code: zipCode,
  // } = req.body.address;

  // //   extracted emergency contact request body
  // const {
  //   name: Name,
  //   number: Number,
  //   relationship: Relationship,
  // } = req.body.emergency_contact;

  if (!first_name || !last_name || !dob || !sex || !contact_details) {
    return res
      .status(400)
      .json({ error: "Important informations should be present" });
  }

  try {
    const patientExistence = await Patient.findOne({ first_name, last_name });

    if (patientExistence)
      return res.status(400).json({ error: "Patient profile already exists " });

    const newPatient = await Patient.create({
      first_name,
      last_name,
      dob,
      sex,
      appointments,
      contact_details,
      title,
      marital_status,
      religion,
      occupation,
      address,
      emergency_contact,
      philhealth_no,
      employer,
    });

    return res.status(201).json({ ...newPatient._doc });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};

// get Patient

const getPatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    res.status(404);
    res.status(404).json({ error: "Not Found" });
  }

  return res.status(200).json({ ...patient._doc });
});

const allPatients = asyncHandler(async (req, res) => {
  try {
    const patients = await Patient.find();
    const array = patients.map((patient) => ({
      ...patient.toObject(),
    }));
    return res.status(200).json(array);
  } catch (error) {
    console.log(error);
  }
});

// update Patient
const updatePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    res.status(404);
    res.status(404).json({ error: "Not Found" });
  }

  const updatedPatient = await Patient.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  return res.status(200).json({ ...updatedPatient._doc });
});

// remove Patient

const deletePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    res.status(404).json({ error: "Not Found" });
  }

  await Patient.findByIdAndDelete(req.params.id);
  return res.status(204).json({ message: "Patient has been deleted" });
});

module.exports = {
  createPatient,
  getPatient,
  updatePatient,
  deletePatient,
  allPatients,
};
