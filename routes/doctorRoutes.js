const express = require("express");
const router = express.Router();
const {
  createDoctor,
  getDoctor,
  updateDoctor,
  deleteDoctor,
  allDoctors,
  doctorsByIds,
  doctorLogin,
} = require("../controllers/doctorsController");

router.route("/login").post(doctorLogin);
router.route("/").get(allDoctors);
router.route("/doctors-id/:ids").get(doctorsByIds);
router.route("/create").post(createDoctor);
router.route("/:id").get(getDoctor).put(updateDoctor).delete(deleteDoctor);

module.exports = router;
