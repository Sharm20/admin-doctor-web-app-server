const express = require("express");
const router = express.Router();
const {
  createPatient,
  getPatient,
  updatePatient,
  deletePatient,
  allPatients,
} = require("../controllers/patientsController");

router.route("/create").post(createPatient);
router.route("/").get(allPatients);
router.route("/:id").get(getPatient).put(updatePatient).delete(deletePatient);

module.exports = router;
