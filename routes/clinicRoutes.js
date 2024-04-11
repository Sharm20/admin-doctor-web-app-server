const express = require("express");
const router = express.Router();
const {
  createClinic,
  getClinic,
  updateClinic,
  deleteClinic,
  allClinics,
  clinicsByIds,
} = require("../controllers/clinicController");

router.route("/").get(allClinics);
router.route("/clinics-id/:ids").get(clinicsByIds);
router.route("/create").post(createClinic);
router.route("/:id").get(getClinic).put(updateClinic).delete(deleteClinic);

module.exports = router;
