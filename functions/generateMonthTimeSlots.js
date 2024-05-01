const { startOfMonth, endOfMonth, eachDayOfInterval } = require("date-fns");

module.exports.generateTimeSlotsForCurrentMonth = async (
  operatingHours,
  defaultApptDuration,
  daysToGenerateFor
) => {
  const slotsByDay = {};

  const currentDate = new Date();
  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);

  // Generate an array of dates for the current month
  const datesInCurrentMonth = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  // Initialize slots for each day
  daysToGenerateFor.forEach((day) => {
    slotsByDay[day] = [];
  });

  // Loop through each operating hour entry
  operatingHours.forEach(({ day, start, end }) => {
    const startTime = parseTimeString(start);
    const endTime = parseTimeString(end);

    // Generate time slots for each day of the current month
    datesInCurrentMonth.forEach((date) => {
      // Check if the current date matches any of the specified days
      if (daysToGenerateFor.includes(date.getDay())) {
        // Check if the current date matches the day of the operating hour
        if (date.getDay() === day) {
          let currentTime = new Date(date);
          currentTime.setHours(startTime.getHours());
          currentTime.setMinutes(startTime.getMinutes());

          // Generate time slots based on default appointment duration
          while (
            currentTime <
            new Date(date).setHours(endTime.getHours(), endTime.getMinutes())
          ) {
            const slotEnd = new Date(
              currentTime.getTime() + defaultApptDuration * 60000
            );

            slotsByDay[day].push({
              date: date.toISOString(), // Store date as ISO string
              start: formatTime(currentTime),
              end: formatTime(slotEnd),
            });
            currentTime = slotEnd;
          }
        }
      }
    });
  });
  //   Object.keys(slotsByDay).forEach((day) => {
  //     // Convert the day value back to a number (from string)
  //     const dayNumber = parseInt(day, 10);

  //     // Convert the day number to its corresponding name (e.g., 0 -> Sunday, 1 -> Monday, etc.)
  //     const dayName = getDayName(dayNumber);

  //     // Print the day name
  //     console.log(`Time slots for ${dayName}:`);

  //     // Print the time slots for the day
  //     console.log(slotsByDay[day]);
  //   });

  return slotsByDay;
};

// Function to parse time strings with AM/PM
function parseTimeString(timeString) {
  const [hours, minutes] = timeString.split(":");
  return new Date(2000, 0, 1, parseInt(hours, 10), parseInt(minutes), 0);
}

// Function to format time to 12-hour format without AM/PM designation
function formatTime(date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const formattedHours = hours % 12 || 12; // Convert 0 to 12
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes; // Add leading zero for single digit minutes
  return `${formattedHours}:${formattedMinutes}`;
}

// Function to convert day number to day name
function getDayName(dayNumber) {
  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return daysOfWeek[dayNumber];
}
