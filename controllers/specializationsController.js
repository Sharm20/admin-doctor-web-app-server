const asyncHandler = require("express-async-handler");
const Specialization = require("../models/specializationModel");
const mongoose = require("mongoose");

// create
const createSpecialization = async (req, res) => {
  const { specialty_name, desc, doctors, is_active } = req.body;

  if (!specialty_name)
    return res.status(400).json({ error: "Fill in important information" });

  try {
    const specializationExistence = await Specialization.findOne({
      specialty_name,
    });

    if (specializationExistence)
      return res
        .status(400)
        .json({ error: "That specialization already exists" });

    const newSpecialization = await Specialization.create({
      specialty_name,
      desc,
      doctors,
      is_active,
    });
    return res.status(201).json({ ...newSpecialization._doc });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};
// read

const getSpecialization = asyncHandler(async (req, res) => {
  const specialization = await Specialization.findById(req.params.id);
  if (!specialization) {
    res.status(404);
    return res.status(404).json({ error: "Not found" });
  }

  return res.status(200).json({ ...specialization._doc });
});

const allSpecializations = asyncHandler(async (req, res) => {
  try {
    const { offset, limit, search } = req.query;
    const query = Specialization.find();
    if (offset) {
      query.skip(parseInt(offset));
    }
    if (limit) {
      query.limit(parseInt(limit));
    }
    if (search) {
      query.or([{ specialty_name: { $regex: new RegExp(search, "i") } }]);
    }
    const specialization = await query.exec();
    const array = specialization.map((specs) => ({
      ...specs.toObject(),
    }));
    return res.status(200).json(array);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

const specializationsByIds = asyncHandler(async (req, res) => {
  try {
    const { ids } = req.params;

    if (!ids) {
      return res.status(400).json({ error: "missing ids parameters" });
    }
    const specializationsIds = ids.split(",");
    const specializations = await Specialization.find({
      _id: { $in: specializationsIds },
    });
    res.json(specializations);
  } catch (error) {
    console.error("Error fetching specializations:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// update

const updateSpecialization = asyncHandler(async (req, res) => {
  try {
    const specialization = await Specialization.findById(req.params.id);
    if (!specialization) {
      return res.status(404).json({ error: "Not found" });
    }
    const { specialty_name } = req.body;
    const specializationExistence = await Specialization.findOne({
      specialty_name,
      _id: { $ne: specialization },
    });
    if (specializationExistence)
      return res.status(400).json({ error: "Already exists" });

    const updatedSpecialization = await Specialization.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    return res.status(200).json({ ...updatedSpecialization._doc });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
});
// delete

const deleteSpecialization = asyncHandler(async (req, res) => {
  const var_specialization = await Specialization.findById(req.params.id);
  if (!var_specialization) {
    return res.status(404).json({ error: "User not found" });
  }
  const deleted = await Specialization.findByIdAndDelete(req.params.id);

  return res.status(204).json({ message: "Specialization has been deleted" });
});

module.exports = {
  createSpecialization,
  getSpecialization,
  specializationsByIds,
  updateSpecialization,
  deleteSpecialization,
  allSpecializations,
};
