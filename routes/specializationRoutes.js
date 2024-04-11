const express = require("express");
const router = express.Router();
const {
  createSpecialization,
  getSpecialization,
  specializationsByIds,
  updateSpecialization,
  deleteSpecialization,
  allSpecializations,
} = require("../controllers/specializationsController");

router.route("/create").post(createSpecialization);
router.route("/specializations-id/:ids").get(specializationsByIds);
router.route("/").get(allSpecializations);
router
  .route("/:id")
  .get(getSpecialization)
  .put(updateSpecialization)
  .delete(deleteSpecialization);

module.exports = router;
