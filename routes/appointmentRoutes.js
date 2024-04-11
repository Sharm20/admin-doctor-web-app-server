const express = require("express");
const router = express.Router();
const {
  createAppointment,
  getApointment,
  updateAppointment,
  deleteAppointment,
  allAppointments,
} = require("../controllers/appointmentController");

router.route("/create").post(createAppointment);
router.route("/").get(allAppointments);
router
  .route("/:id")
  .get(getApointment)
  .put(updateAppointment)
  .delete(deleteAppointment);

module.exports = router;
