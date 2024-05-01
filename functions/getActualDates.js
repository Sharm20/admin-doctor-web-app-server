const mongoose = require("mongoose");

// Function to get the actual dates for the current month
function getActualDatesForCurrentMonth(schedule) {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const actualDates = [];

  schedule.forEach((entry) => {
    entry.day.forEach((day) => {
      // Get the date of the first occurrence of the specified day in the current month
      const date = new Date(currentYear, currentMonth, 1);
      while (date.getDay() !== day) {
        date.setDate(date.getDate() + 1);
      }

      // Add dates for the entire month
      while (date.getMonth() === currentMonth) {
        actualDates.push(new Date(date));
        date.setDate(date.getDate() + 7); // Move to the next occurrence of the same day
      }
    });
  });

  return actualDates;
}

module.exports = { getActualDatesForCurrentMonth };

// Example schedule data
// const schedule = [
//   {
//     day: [0], // 0 represents Sunday
//     // other fields...
//   },
//   {
//     day: [1, 3], // 1 represents Monday, 3 represents Wednesday
//     // other fields...
//   },
//   // Add more schedule entries as needed
// ];

// // Call the function to get actual dates for the current month
// const actualDates = getActualDatesForCurrentMonth(schedule);

// // Output the actual dates
// console.log(actualDates);
