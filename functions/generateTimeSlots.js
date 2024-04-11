const { format } = require("date-fns");

module.exports.generateTimeSlots = async (
  operatingHours,
  defaultApptDuration
) => {
  const slots = [];

  // Loop through each operating hour entry
  operatingHours.forEach(({ day, start, end }) => {
    // Parse start and end times
    const startTime = parseTimeString(start);
    const endTime = parseTimeString(end);

    const durationInMinutes = defaultApptDuration; // Extract the duration in minutes

    let currentTime = new Date(startTime);
    while (currentTime < endTime) {
      const slotEnd = new Date(
        currentTime.getTime() + durationInMinutes * 60000
      );
      const formattedStart = formatTime(currentTime);
      const formattedEnd = formatTime(slotEnd);
      slots.push({
        day: day,
        start: formattedStart,
        end: formattedEnd,
      });
      currentTime = slotEnd;
    }
  });

  return slots;
};

// Function to parse time strings with AM/PM
function parseTimeString(timeString) {
  const [hoursMinutes, period] = timeString.split(" ");
  let [hours, minutes] = hoursMinutes.split(":");
  hours = parseInt(hours, 10);
  if (period === "PM" && hours !== 12) {
    hours += 12;
  } else if (period === "AM" && hours === 12) {
    hours = 0;
  }
  return new Date(2000, 0, 1, hours, parseInt(minutes), 0);
}

// Function to format time to 12-hour format without AM/PM designation
function formatTime(date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const amOrPm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12; // Convert 0 to 12
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes; // Add leading zero for single digit minutes
  return `${formattedHours}:${formattedMinutes} ${amOrPm}`;
}
