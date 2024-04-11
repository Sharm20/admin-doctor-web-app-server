const zeropad = require("zeropad");

module.exports.generateReferenceNum = async (appointmentCount) => {
  const yearPart = new Date().getFullYear().toString().slice(-2);
  const monthPart = zeropad(new Date().getMonth() + 1, 2);
  const dayPart = zeropad(new Date().getDate(), 2);

  const paddedAppointmentCount = zeropad(appointmentCount, 3);

  //MA == Hospital Code, K == Appointment booked/created within the kiosk
  return (reference_num = `MAK${yearPart}${monthPart}${dayPart}${paddedAppointmentCount}`);
};
