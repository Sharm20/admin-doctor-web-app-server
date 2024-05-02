const asyncHandler = require("express-async-handler");
const Appointment = require("../models/appointmentModel");
const Doctor = require("../models/doctorModel");
const AppointmentStatus = require("../models/appointmentStatusModel");
const Patient = require("../models/patientModel");
const Calendar = require("../models/calendar");
const { generateReferenceNum } = require("../functions/generateRefNum");
const mongoose = require("mongoose");
const { application } = require("express");

// create
const createAppointment = asyncHandler(async (req, res) => {
  const {
    date,
    timeslot: { id, start, end },
    appointment_notes,
    isBooking,
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
  console.log(date);

  //to restrict same schedule for the mean time

  // const appointmentExists = Appointment.findOne({
  //   date: date,
  //   "timeslot.id": id,
  // });

  // if (appointmentExists)
  //   return res.status(400).json({
  //     error:
  //       "An Appointment with the same schedule is found. Please choose another schedule.",
  //   });

  // const updateTimeslotAvailability = Ca

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

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const appointmentCount = await Appointment.countDocuments({
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  });

  const reference_num = await generateReferenceNum(appointmentCount);

  const appointment = await Appointment.create({
    reference_num,
    date,
    timeslot: {
      id: id,
      start: start,
      end: end,
    },
    isForBooking: isBooking,
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
  // console.log(appointment);

  await Patient.updateOne(
    { _id: newPatient._id },
    {
      $push: {
        appointments: {
          $each: [{ _id: appointment._id }],
          $position: 0,
        },
      },
    }
  );

  await Doctor.updateOne(
    { _id: doctor_id },
    {
      $push: {
        appointments: {
          $each: [{ _id: appointment._id }],
          $position: 0,
        },
      },
    }
  );

  await AppointmentStatus.updateOne(
    { _id: appointmentStatus._id },
    { $set: { appointment_id: appointment._id } }
  );

  try {
    console.log(doctor_id, id, date);
    const bookType = isBooking ? "bookable" : "walk-in";
    const updateCalendar = await Calendar.updateOne(
      {
        doctor_id: doctor_id,
        "calendar_days.date": new Date(date),
        "calendar_days.bookable.timeslot_id": id,
      },
      {
        $set: {
          "calendar_days.$[outer].bookable.$[inner].is_available": false,
        },
        $inc: {
          "calendar_days.$[outer].bookable_count": -1,
        },
      },
      {
        arrayFilters: [
          { "outer.date": new Date(date) },
          { "inner.timeslot_id": id },
        ],
      }
    );
    console.log("Update Result:", updateCalendar);
  } catch (error) {
    console.error("Error updating calendar:", error);
  }

  // await handlePrint({ appointment });

  res
    .status(201)
    .json({ message: `Appointment ${reference_num} created`, reference_num });
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
    const { offset, limit, search, month } = req.query;
    const query = Appointment.find();
    if (offset) {
      query.skip(parseInt(offset));
    }
    if (limit) {
      query.limit(parseInt(limit));
    }
    if (search) {
      query.or([{ "patient.first_name": { $regex: new RegExp(search, "i") } }]);
    }

    if (month) {
      const year = new Date().getFullYear(); // Assuming current year
      const monthNumber = parseInt(month); // Convert month to number
      const startDate = new Date(year, monthNumber - 1, 1, 0, 0, 0); // Start of month
      const endDate = new Date(year, monthNumber, 0, 23, 59, 59); // End of month
      console.log(startDate, endDate); // For debugging

      console.log("Start Date:", startDate);
      console.log("End Date:", endDate);

      query.limit(parseInt(limit)).where({
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      });
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

const reschedAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    res.status(400);
    throw new Error("Appointment not found");
  }
  const { date, timeslot_id, start, end } = req.body;
  console.log("request body: ", req.body);
  const appointmentExists = await Appointment.findOne({
    date,
    timeslot_id,
  });
  // console.log("appt exists: ", appointmentExists.data);

  console.log("cancelled appointment: ", appointment._id);
  console.log("cancelled appointment doctor: ", appointment.doctor._id);
  try {
    const updateCalendar = await Calendar.updateOne(
      {
        doctor_id: appointment.doctor._id,
        "calendar_days.date": new Date(appointment.date),
        "calendar_days.bookable.timeslot_id": appointment.timeslot.id,
      },
      {
        $set: {
          "calendar_days.$[outer].bookable.$[inner].is_available": true,
        },
        $inc: {
          "calendar_days.$[outer].bookable_count": +1,
        },
      },
      {
        arrayFilters: [
          { "outer.date": new Date(appointment.date) },
          { "inner.timeslot_id": appointment.timeslot.id },
        ],
      }
    );

    await Calendar.updateOne(
      {
        doctor_id: appointment.doctor._id,
        "calendar_days.date": new Date(date),
        "calendar_days.bookable.timeslot_id": timeslot_id,
      },
      {
        $set: {
          "calendar_days.$[outer].bookable.$[inner].is_available": false,
        },
        $inc: {
          "calendar_days.$[outer].bookable_count": +1,
        },
      },
      {
        arrayFilters: [
          { "outer.date": new Date(date) },
          { "inner.timeslot_id": timeslot_id },
        ],
      }
    );
    console.log("Update Result of old:", updateCalendar);
  } catch (error) {
    console.error("Error updating calendar:", error);
  }

  if (appointmentExists) {
    return res.status(400).json({
      error:
        "An Appointment with the same schedule is found. Please choose another schedule.",
    });
  }

  const updated = await Appointment.updateOne(
    { _id: req.params.id },
    {
      $set: {
        date: date,
        "timeslot.id": timeslot_id,
        "timeslot.start": start,
        "timeslot.end": end,
      },
    }
  );
  // .then(console.log("updated: ", appointment));

  res.status(200).json({ message: "Appointment rescheduled" });
});

module.exports = {
  createAppointment,
  getApointment,
  updateAppointment,
  deleteAppointment,
  allAppointments,
  reschedAppointment,
};
