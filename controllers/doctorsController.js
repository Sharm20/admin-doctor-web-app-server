const asyncHandler = require("express-async-handler");
const Doctor = require("../models/doctorModel");
const Specialization = require("../models/specializationModel");
const Clinic = require("../models/clinicModel");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { generateTimeSlots } = require("../functions/generateTimeSlots");
const {
  generateTimeSlotsForCurrentMonth,
} = require("../functions/generateMonthTimeSlots");
const {
  getActualDatesForCurrentMonth,
} = require("../functions/getActualDates");
const { format } = require("date-fns");

//login

const doctorLogin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res
      .status(400)
      .json({ error: "Please input username and password." });

  try {
    const userExistsinDB = await Doctor.findOne({ username });
    if (!userExistsinDB)
      return res.status(400).json({ error: "User not in our database." });

    const passwordMatch = await bcrypt.compare(
      password,
      userExistsinDB.password
    );

    const spe_ids = userExistsinDB.specializations.map((s) => s.spe_id);
    const clinic_ids = userExistsinDB.clinics.map((c) => c.clinic_id);

    console.log(spe_ids);
    const specializations = await Specialization.find({
      _id: { $in: spe_ids },
    });

    const clinics = await Clinic.find({ _id: { $in: clinic_ids } });

    // console.log(passwordMatch);
    if (!passwordMatch)
      return res.status(400).json({ error: "Incorrect password." });

    const payload = { _id: userExistsinDB._id };
    const token = jwt.sign(payload, process.env.JWT_SECRETKEY, {
      expiresIn: "1h",
    });
    res.cookie("jwt", token, { expire: new Date() + 999, httpOnly: true });
    const user = {
      ...userExistsinDB._doc,
      password: undefined,
    };
    return res.status(200).json({
      token,
      user,
      specializations,
      clinics,
      message: "Login Successful",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};

// create

const createDoctor = async (req, res) => {
  const {
    username,
    password,
    last_name,
    first_name,
    dob,
    bio,
    default_appt_duration,
    phone_number,
    email,
    is_active,
    is_in,
    specializations,
    clinics,
    weekly_schedule,
    appointments,
  } = req.body;

  if (
    !username ||
    !password ||
    !last_name ||
    !first_name ||
    !dob ||
    !email ||
    !phone_number
  ) {
    return res
      .status(400)
      .json({ error: "Important informations should be present" });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const doctorExists = await Doctor.findOne({ first_name, last_name });
    if (doctorExists) {
      return res.status(400).json({ error: "This Doctor already exists" });
    }
    const newDoctor = await Doctor.create({
      username,
      password: hashedPassword,
      last_name,
      first_name,
      dob,
      bio,
      default_appt_duration,
      phone_number,
      email,
      is_active,
      is_in,
      specializations,
      clinics,
      weekly_schedule,
      appointments,
    });

    if (specializations && specializations.length > 0) {
      for (const specialization of specializations) {
        const { spe_id } = specialization;
        await Specialization.updateOne(
          {
            _id: spe_id,
          },
          { $push: { doctors: { id: newDoctor._id } } },
          { $position: 0 }
        );
      }
    }

    if (clinics && clinics.length > 0) {
      for (const clinic of clinics) {
        const { clinic_id } = clinic;
        await Clinic.updateOne(
          {
            _id: clinic_id,
          },
          { $push: { doctors: { id: newDoctor._id } } },
          { $position: 0 }
        );
      }
    }

    return res.status(201).json({ ...newDoctor._doc });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};

// READ

const getDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    res.status(404).json({ error: "Not Found" });
  }

  const clinic_ids = doctor.clinics.map((clinic) => clinic.clinic_id);

  const clinics = await Clinic.find({ _id: { $in: clinic_ids } });
  const spec_ids = doctor.specializations.map((s) => s.spe_id);

  const specializations = await Specialization.find({ _id: { $in: spec_ids } });

  return res.status(200).json({
    doctor: doctor,
    clinics: clinics,
    specializations: specializations,
  });
});

const allDoctors = asyncHandler(async (req, res) => {
  try {
    const { offset, limit, search } = req.query;

    const query = Doctor.find();
    if (offset) {
      query.skip(parseInt(offset));
    }
    if (limit) {
      query.limit(parseInt(limit));
    }
    if (search) {
      query.or([
        { first_name: { $regex: new RegExp(search, "i") } },
        { last_name: { $regex: new RegExp(search, "i") } },
      ]);
    }
    const doctors = await query.exec();
    const array = doctors.map((doctor) => ({
      ...doctor.toObject(),
    }));
    return res.status(200).json(array);
  } catch (error) {
    console.log(error);
  }
});

// accepts array of doctors id
const doctorsByIds = asyncHandler(async (req, res) => {
  try {
    const { ids } = req.params;

    if (!ids) {
      return res.status(400).json({ error: "missing ids parameters" });
    }
    const doctorIds = ids.split(",");
    const doctors = await Doctor.find({ _id: { $in: doctorIds } });
    res.json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// update

const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  // const updatedDoctorData = req.body;
  if (!doctor) {
    res.status(404).json({ error: "Not Found" });
  }

  // if a clinic is removed

  const removedClinics = doctor.clinics?.filter(
    (clinic) => !req.body.clinics?.find((c) => c.clinic_id === clinic.clinic_id)
  );

  if (removedClinics.length > 0) {
    for (const clinic of removedClinics) {
      await Clinic.findByIdAndUpdate(clinic.clinic_id, {
        $pull: { doctors: { id: req.params.id } },
      });
    }
  }

  // if a specialization is removed

  const removedSpecs = doctor.specializations?.filter(
    (specialization) =>
      !req.body.specializations?.find((s) => s.spe_id === specialization.spe_id)
  );

  if (removedSpecs.length > 0) {
    for (const spec of removedSpecs) {
      await Specialization.findByIdAndUpdate(spec.spe_id, {
        $pull: { doctors: { id: req.params.id } },
      });
    }
  }

  //if password is changed

  const { confirmPassword, password, newPassword } = req.body;

  if (password) {
    const passwordMatch = await bcrypt.compare(password, doctor.password);
    if (!passwordMatch)
      return res.status(400).json({ error: "Password is incorrect." });
  }

  if (newPassword) {
    const samePassword = await bcrypt.compare(newPassword, doctor.password);
    console.log("same pass: ", samePassword);
    if (samePassword)
      return res.status(400).json({
        error: "New password cannot be the same as the old password.",
      });
    if (!confirmPassword)
      return res.status(400).json({
        error: "Please confirm your new password.",
      });

    if (!password) {
      return res.status(400).json({
        error:
          "Please provide your old password if you want to create a new one",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error:
          "New password does not match the confirmation. Please confirm your password.",
      });
    }
  }

  try {
    const updatedDoctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          username: req.body.username || doctor.username,
          last_name: req.body.last_name || doctor.last_name,
          first_name: req.body.first_name || doctor.first_name,
          dob: req.body.dob || doctor.dob,
          bio: req.body.bio || doctor.bio,
          default_appt_duration:
            req.body.default_appt_duration || doctor.default_appt_duration,
          phone_number: req.body.phone_number || doctor.phone_number,
          email: req.body.email || doctor.email,
          is_active: req.body.is_active || doctor.is_active,
          is_in: req.body.is_in || doctor.is_in,
          specializations: req.body.specializations || doctor.specializations,
          clinics: req.body.clinics || doctor.clinics,
          operating_hours: req.body.operating_hours || doctor.operating_hours,
          schedule: req.body.schedule || doctor.schedule,
          timeslots: req.body.timeslots || doctor.timeslots,
          weekly_schedule: req.body.weekly_schedule || doctor.weekly_schedule,
          appointments: req.body.appointments || doctor.appointments,
        },
      },
      {
        new: true,
      }
    );

    // const ohsample = doctor.operating_hours;
    // const dfdsample = doctor.default_appt_duration;
    // const days = doctor.operating_hours.map((oh) => oh.day);

    console.log(doctor.schedule);
    const dates = getActualDatesForCurrentMonth(doctor.schedule);

    console.log(
      "dates: ",
      dates.map((d) => format(d, "MMMM d, yyyy"))
    );

    if (req.body.operating_hours) {
      console.log(req.body.operating_hours);
      const slots = await generateTimeSlots(
        req.body.operating_hours,
        doctor.default_appt_duration
      );
      // console.log(slots);
      const formattedSlots = (await slots).map((slot) => ({
        day: slot.day,
        start: slot.start,
        end: slot.end,
      }));

      console.log(formattedSlots);

      // updatedDoctor.timeslots = formattedSlots;
      await Doctor.updateOne(
        { _id: doctor._id },
        { $push: { timeslots: { $each: formattedSlots } } }
      );
      // console.log(formattedSlots);
      // console.log(doctor._id);
    }

    if (req.body.specializations && req.body.specializations.length > 0) {
      for (const specialization of req.body.specializations) {
        const { spe_id } = specialization;
        await Specialization.updateOne(
          {
            _id: spe_id,
          },
          { $push: { doctors: { id: updatedDoctor._id } } },
          { $position: 0 }
        );
      }
    }

    if (req.body.clinics && req.body.clinics.length > 0) {
      for (const clinic of req.body.clinics) {
        const { clinic_id } = clinic;
        await Clinic.updateOne(
          {
            _id: clinic_id,
          },
          { $push: { doctors: { id: updatedDoctor._id } } },
          { $position: 0 }
        );
      }
    }

    if (newPassword) {
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      updatedDoctor.password = hashedNewPassword;
      await updatedDoctor.save();
    }
    return res.status(200).json({ ...updatedDoctor._doc });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
});
// delete

const deleteDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);

  const specializations = doctor.specializations.map((s) => s.spe_id);
  const clinics = doctor.clinics.map((c) => c.clinic_id);

  if (!doctor) {
    res.status(404).json({ error: "Not Found" });
  }

  await Doctor.findByIdAndDelete(req.params.id);

  try {
    await Specialization.updateMany(
      { _id: { $in: specializations } },
      { $pull: { doctors: { id: req.params.id } } }
    );

    await Clinic.updateMany(
      { _id: { $in: clinics } },
      { $pull: { doctors: { id: req.params.id } } }
    );
    return res.status(204).json({ message: "Doctor has been deleted" });
  } catch (error) {
    console.error(
      "Error removing doctor from specializations and clinics:",
      error
    );
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

const getTimeslotById = async (doctor_id, timeslot_id) => {
  try {
    const doctor = await Doctor.findOne({ _id: doctor_id });
    // console.log(doctor.first_name, doctor.last_name);
    if (!doctor) {
      console.log("ERROR! Cannot find Doctor with ID: " + doctor_id);
    }

    const timeslot = doctor.timeslots.find((ts) => ts._id.equals(timeslot_id));

    if (!timeslot) {
      console.log("Cannot find timeslot.");
    }
    // console.log(timeslot);
    return timeslot;
  } catch (error) {
    console.log("Failed to execute getTimeslotById", error);
  }
};

module.exports = {
  doctorLogin,
  createDoctor,
  getDoctor,
  updateDoctor,
  deleteDoctor,
  allDoctors,
  doctorsByIds,
  getTimeslotById,
};
