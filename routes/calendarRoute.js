const express = require("express");
const {
  createCalendar,
  updateCalendar,
  getFullyBookedDays,
  getDoctorSchedulePerDay,
} = require("../controllers/calendar");
const router = express.Router();

router.route("/:id").post(createCalendar).put(updateCalendar);
router.route("/doctor-daily-schedule/:id").get(getDoctorSchedulePerDay);
router.route("/fully-booked/:id").get(getFullyBookedDays);

module.exports = router;
