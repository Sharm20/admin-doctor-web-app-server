const asyncHandler = require("express-async-handler");
const Appointment = require("../models/appointmentModel");
const AppointmentStatus = require("../models/appointmentStatusModel");
const Patient = require("../models/patientModel");
const { generateReferenceNum } = require("../functions/generateRefNum");
const mongoose = require("mongoose");

// create
const createAppointment = asyncHandler(async (req, res) => {
  const {
    date,
    timeslot,
    appointment_notes,
    patient: {
      first_name,
      last_name,
      contact_num,
      date_of_birth,
      gender,
      contact_person,
      contact_p_number,
    },
    clinic: { clinic_id, clinic_code },
    doctor: { doctor_id, doctor_first_name, doctor_last_name },
  } = req.body;

  const newPatient = await Patient.create({
    first_name,
    last_name,
    date_of_birth,
    gender,
    contact_num,
    contact_person,
    contact_p_number,
  });

  const appointmentStatus = await AppointmentStatus.create({
    status: "Pending",
  });

  const startOfDay = new Date(); // Set to the start of the day
  const endOfDay = new Date(); // Set to the end of the day
  endOfDay.setHours(23, 59, 59, 999);

  const appointmentCount = await Appointment.countDocuments({
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  });
  console.log(appointmentCount);
  const reference_num = await generateReferenceNum(appointmentCount);

  const appointment = await Appointment.create({
    reference_num,
    date,
    timeslot,
    patient: {
      _id: newPatient._id,
      first_name: newPatient.first_name,
      last_name: newPatient.last_name,
      contact_num: newPatient.contact_num,
      date_of_birth: newPatient.date_of_birth,
      gender: newPatient.gender,
      contact_person: newPatient.contact_person,
      contact_p_number: newPatient.contact_p_number,
    },
    appointment_notes,
    appointmentStatus: [
      {
        _id: appointmentStatus._id,
        status: appointmentStatus.status,
      },
    ],
    clinic: {
      _id: clinic_id,
      clinic_code,
    },
    doctor: {
      _id: doctor_id,
      last_name: doctor_last_name,
      first_name: doctor_first_name,
    },
  });

  await Patient.updateOne(
    { _id: newPatient._id },
    { $push: { appointments: appointment._id } }
  );

  await AppointmentStatus.updateOne(
    { _id: appointmentStatus._id },
    { $set: { appointment_id: appointment._id } }
  );

  res.status(201).json({ message: "Appointment created", appointment });
});

// read
const getApointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    res.status(404).json({ error: "Appointment Not Found" });
  }
  return res.status(200).json({ ...appointment._doc });
});

const allAppointments = asyncHandler(async (req, res) => {
  try {
    const { offset, limit, search } = req.query;
    const query = Appointment.find();
    if (offset) {
      query.skip(parseInt(offset));
    }
    if (limit) {
      query.limit(parseInt(limit));
    }
    if (search) {
      query.or([{ "patient.name": { $regex: new RegExp(search, "i") } }]);
    }
    const appointments = await query.exec();
    const array = appointments.map((appt) => ({ ...appt.toObject() }));
    return res.status(200).json(array);
  } catch (error) {
    console.log(error);
  }
});

// update
const updateAppointment = async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    res.status(404).json({ error: "Appointment Not Found" });
  }

  const updatedAppointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  return res.status(200).json({ ...updatedAppointment._doc });
};

const acceptAppointment = async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);

  const status_id = appointment.appointmentStatus.map((as) => as._id);
  const accept = await AppointmentStatus.findByIdAndUpdate(status_id, {
    status: "accepted",
  });
};

// delete
const deleteAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    res.status(404).json({ error: "Appointment Not Found" });
  }

  await Appointment.findByIdAndDelete(req.params.id);
  return res.status(204).json({ message: "Appointment has been deleted" });
});

module.exports = {
  createAppointment,
  getApointment,
  updateAppointment,
  deleteAppointment,
  allAppointments,
};
