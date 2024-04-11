const asyncHandler = require("express-async-handler");
const AppointmentStatus = require("../models/appointmentStatusModel");
const Appointment = require("../models/appointmentModel");
const mongoose = require("mongoose");

// create

const createAppointmentStatus = async (req, res) => {
  const {
    appointment_id,
    status,
    old_date,
    new_date,
    requested_by,
    approved_by,
  } = req.body;

  try {
    const newAppointmentStatus = await AppointmentStatus.create({
      appointment_id,
      status,
    });

    await Appointment.updateOne(
      {
        _id: appointment_id,
      },
      {
        $push: {
          appointmentStatus: {
            $each: [{ _id: newAppointmentStatus._id, status }],
            $position: 0,
          },
        },
      }
    );

    return res.status(201).json({ ...newAppointmentStatus._doc });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};

// read

const getStatus = asyncHandler(async (req, res) => {
  const status = await AppointmentStatus.findById(req.params.id);
  if (!status) {
    res.status(404).json({ error: "Not Found" });
  }

  return res.status(200).json({ ...status._doc });
});
// update

const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const status = await AppointmentStatus.findById(req.params.id);
  if (!status) {
    res.status(404).json({ error: "Not Found" });
  }

  const updatedAppointmentStatus = await AppointmentStatus.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  return res.status(200).json(updatedAppointmentStatus);
});
// delete

const deleteStatus = asyncHandler(async (req, res) => {
  const status = await AppointmentStatus.findById(req.params.id);
  if (!status) {
    res.status(404).json({ error: "Not Found" });
  }

  await AppointmentStatus.findByIdAndDelete(req.params.id);
  return res
    .status(204)
    .json({ message: "Appointment status has been deleted" });
});

module.exports = {
  createAppointmentStatus,
  getStatus,
  updateAppointmentStatus,
  deleteStatus,
};
