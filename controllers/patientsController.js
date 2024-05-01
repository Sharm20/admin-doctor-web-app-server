const asyncHandler = require("express-async-handler");
const Patient = require("../models/patientModel");
const mongoose = require("mongoose");

// add Patient

const createPatient = asyncHandler(async (req, res) => {
  console.log("req.body is: ", req.body);
  const { first_name, last_name, date_of_birth, gender } = req.body;
  if (!first_name || !last_name || !date_of_birth || !gender) {
    res.status(400);
    throw new Error("All fields are Mandatory");
  }

  const patient = await Patient.create({
    first_name,
    last_name,
    date_of_birth,
    gender,
  });
  res.status(200).json(patient);
});

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
