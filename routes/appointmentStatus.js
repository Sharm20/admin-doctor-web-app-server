const express = require("express");
const router = express.Router();
const {
  createAppointmentStatus,
  getStatus,
  updateAppointmentStatus,
  deleteStatus,
} = require("../controllers/appointmentStatusController");

router.route("/add").post(createAppointmentStatus);
router.route("/:id").get(getStatus);
router.route("/:id").put(updateAppointmentStatus);
router.route("/:id").delete(deleteStatus);
module.exports = router;
