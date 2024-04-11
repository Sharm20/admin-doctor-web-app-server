const asyncHandler = require("express-async-handler");
const Clinic = require("../models/clinicModel");
const mongoose = require("mongoose");

// Create

const createClinic = async (req, res) => {
  // console.log("The request body is", req.body);
  const { clinic_code, floor, room, doctors, is_active } = req.body;
  if (!clinic_code || !floor || !room) {
    res.status(400);
    throw new Error("clinics should have complete relevant info");
  }

  try {
    const exists = await Clinic.findOne({ clinic_code });
    if (exists) {
      return res.status(400).json({ error: "Clinic already exists" });
    }
    const newClinic = new Clinic({
      clinic_code,
      floor,
      room,
      doctors,
      is_active,
    });
    const result = await newClinic.save();
    return res.status(201).json({ ...result._doc });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};

// READ

// const getClinicFloor = asyncHandler(async (req, res) => {
//   const clinicsOnFloor = await Clinic.find({
//     floor_number: req.params.floor_number,
//   });

//   return res.status(200).json({ clinicsOnFloor });
// });

const getClinic = asyncHandler(async (req, res) => {
  const clinic = await Clinic.findById(req.params.id);

  if (!clinic) {
    res.status(404).json({ error: "Not Found" });
  }

  return res.status(200).json({ ...clinic._doc });
});

const allClinics = asyncHandler(async (req, res) => {
  try {
    const { offset, limit, search } = req.query;
    const query = Clinic.find();
    if (offset) {
      query.skip(parseInt(offset));
    }
    if (limit) {
      query.limit(parseInt(limit));
    }
    if (search) {
      query.or([{ clinic_code: { $regex: new RegExp(search, "i") } }]);
    }
    const clinics = await query.exec();
    const array = clinics.map((clinic) => ({
      ...clinic.toObject(),
    }));
    return res.status(200).json(array);
  } catch (error) {
    console.log(error);
  }
});

const clinicsByIds = asyncHandler(async (req, res) => {
  try {
    const { ids } = req.params;
    if (!ids) {
      return res.status(400).json({ error: "missing ids parameters" });
    }

    const clinicIds = ids.split(",");
    const clinics = await Clinic.find({ _id: { $in: clinicIds } });
    res.json(clinics);
  } catch (error) {
    console.error("Error fetching clinics", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update

const updateClinic = asyncHandler(async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.id);
    if (!clinic) {
      res.status(404).json({ error: "Not Found" });
    }

    const { clinic_code } = req.body;
    const exists = await Clinic.findOne({
      clinic_code,
      _id: { $ne: clinic },
    });
    if (exists) {
      return res.status(400).json({ error: "Clinic codes should be unique" });
    }
    const updatedClinic = await Clinic.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    return res.status(200).json({ ...updatedClinic._doc });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
});

// Delete

const deleteClinic = asyncHandler(async (req, res) => {
  const clinic = await Clinic.findById(req.params.id);
  if (!clinic) {
    res.status(404).json({ error: "Not Found" });
  }
  const deletedClinic = { ...clinic.toObject() };
  await Clinic.findByIdAndDelete(req.params.id);
  return res.status(204).json({ message: "Clinic has been deleted" });
});

module.exports = {
  createClinic,
  getClinic,
  updateClinic,
  deleteClinic,
  allClinics,
  clinicsByIds,
};
