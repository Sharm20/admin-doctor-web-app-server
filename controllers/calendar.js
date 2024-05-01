const asyncHandler = require("express-async-handler");
const Calendar = require("../models/calendar");
const Doctor = require("../models/doctorModel");
const Clinic = require("../models/clinicModel");

const { isSameDay } = require("date-fns");

// trigger the creation of the calendar

const createCalendar = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id)
    .select("first_name last_name schedule")
    .exec();

  console.log(doctor);
  const { _id, first_name, last_name, schedule } = doctor;

  // check if doctor already has a calendar
  const doctorCalendarExists = await Calendar.findOne({
    doctor_id: _id,
  });
  if (doctorCalendarExists) {
    res.status(403);
    throw new Error("Doctor Calendar already exists");
  }

  const calendar = await Calendar.create({
    doctor_id: _id,
    doctor_first_name: first_name,
    doctor_last_name: last_name,
    calendar_days: [],
  });

  function extractUniqueDayIndicesAndGenerateDates(thisSchedule) {
    let uniqueDayIndices = [];

    thisSchedule.forEach((entry) => {
      const { day } = entry;
      day.forEach((index) => {
        if (!uniqueDayIndices.includes(index)) {
          uniqueDayIndices.push(index);
        }
      });
    });

    const dates = [];

    // change this to a static date, otherwise, you'll run the risk of a stack overflow
    const currentDate = new Date();

    for (let i = 0; i < 90; i++) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() + i);

      const dayIndex = date.getDay();

      if (uniqueDayIndices.includes(dayIndex)) {
        dates.push({
          date: date.toISOString(), // Format the date as ISO string
          day_index: dayIndex,
        });
      }
    }

    return dates;
  }

  const generatedDates = extractUniqueDayIndicesAndGenerateDates(schedule);
  const calendarDays = [];

  for (const date of generatedDates) {
    const dayEntry = {
      date: date.date,
      day_index: date.day_index,
      bookable_count: 0,
      walk_in_count: 0,
      bookable: [],
      walk_in: [],
    };

    for (const item of schedule) {
      const { clinic_id, day, booking, walk_in } = item;

      const clinic = await Clinic.findById(clinic_id).select("clinic_code");
      if (!clinic) {
        res.status(404);
        throw new Error("Clinic not found");
      }

      for (const index of day) {
        if (index === date.day_index) {
          if (booking && booking.length > 0) {
            for (const bookItem of booking) {
              dayEntry.bookable.push({
                clinic_id: clinic_id,
                clinic_code: clinic.clinic_code,
                timeslot_id: bookItem.timeslot_id,
                is_available: bookItem.is_available,
              });
            }
            dayEntry.bookable_count += booking.length;
          }

          if (walk_in && walk_in.length > 0) {
            for (const walkInItem of walk_in) {
              dayEntry.walk_in.push({
                clinic_id: clinic_id,
                clinic_code: clinic.clinic_code,
                timeslot_id: walkInItem.timeslot_id,
                is_available: walkInItem.is_available,
              });
            }
            dayEntry.walk_in_count += walk_in.length;
          }
        }
      }
    }
    calendarDays.push(dayEntry);
  }

  calendar.calendar_days = calendarDays;
  await calendar.save();

  res.status(200).json({ message: "Calendar created successfully" });
});

// trigger the update of calendar for when doctor updates their schedule

const updateCalendar = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
});

// returns an array of dates that are fully booked to use in date picker

const getFullyBookedDays = asyncHandler(async (req, res) => {
  const doctorId = req.params.id;

  try {
    const calendar = await Calendar.findOne({ doctor_id: doctorId });

    if (!calendar) {
      return res.status(404).json({ message: "Calendar not found" });
    }

    const today = new Date();
    const unavailableDates = calendar.calendar_days.filter((day) => {
      const dateOfTheDay = new Date(day.date);
      return dateOfTheDay > today && day.bookable_count === 0;
    });

    const resultDates = unavailableDates.map((day) => ({
      date: day.date,
      day_index: day.day_index,
      day_id: day._id,
    }));

    res.status(200).json(resultDates);
  } catch (error) {
    console.error("Error retrieving unavailable dates:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// returns array of bookable and walk-in time slots with availability and clinic

const getDoctorSchedulePerDay = asyncHandler(async (req, res) => {
  try {
    const requestDate = req.query.date;

    const doctorCalendar = await Calendar.findOne({ doctor_id: req.params.id });
    if (!doctorCalendar) {
      return res.status(404).json({ message: "Calendar not found" });
    }

    const calendarDay = doctorCalendar.calendar_days.find((day) => {
      const calendarDate = day.date.toISOString().split("T")[0];
      const reqDate = new Date(requestDate).toISOString().split("T")[0];
      return calendarDate === reqDate;
    });

    if (!calendarDay) {
      return res
        .status(404)
        .json({ message: "Appointment slots not found for the chosen date" });
    }

    res.status(200).json(calendarDay);
  } catch (error) {
    console.error("Error retrieving calendar day:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = {
  createCalendar,
  updateCalendar,
  getDoctorSchedulePerDay,
  getFullyBookedDays,
};
