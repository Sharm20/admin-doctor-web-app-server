const axios = require("axios");
const cron = require("node-cron");
const { format } = require("date-fns");
const Appointment = require("../models/appointmentModel");
const Message = require("../models/messagesModel");
const { getTimeslotById } = require("../controllers/doctorsController");

const smsScheduler = () => {
  const time = "00 12 * * *";
  cron.schedule(time, async () => {
    try {
      sendSMS();
      console.log("Scheduled to run at 12 noon");
    } catch (error) {
      console.error("Error in scheduler:", error);
    }
  });
};

const sendSMS = async () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
  dayAfterTomorrow.setHours(0, 0, 0, 0);
  const appointmentsTomorrow = await Appointment.find({
    date: {
      $gte: tomorrow.toISOString(),
      $lt: dayAfterTomorrow.toISOString(),
    },
  });
  console.log("date value of today: ", today.toLocaleDateString());
  console.log("date value of tomorrow: ", tomorrow);
  console.log(
    "date value of the day after tomorrow: ",
    dayAfterTomorrow.toLocaleDateString()
  );

  const confirmedAppointmentsTomorrow = appointmentsTomorrow.filter(
    (at) => at.appointmentStatus[0].status === "Confirmed"
  );

  console.log(
    "ALL appointments scheduled tomorrow",
    appointmentsTomorrow.map((at) => at.patient.first_name)
  );
  console.log("CONFIRMED appointments tomorrow:");
  confirmedAppointmentsTomorrow.forEach(async (at) => {
    const timeslots = await getTimeslotById(at.doctor._id, at.timeslot);

    const date = at.date;
    console.log(
      "ID: ",
      at._id,
      " patient name:",
      at.patient.first_name,
      // "date",
      // format(at.date, "MMMM d, yyyy, HH:mm")
      "Appointments Status: ",
      at.appointmentStatus[0].status
    );

    const message = `Hello Mr./Ms. ${
      at.patient.last_name
    }, This  message is sent to remind you of your scheduled appointment tomorrow with Dr. ${
      at.doctor.last_name
    } at ${at.timeslot.start + " - " + at.timeslot.end}. See you at Clinic ${
      at.clinic.clinic_code
    }.  Should you wish to reach us regarding the status of your appointment, please message us at +639763177491. Message format: <Reference No.> <message>. 
          e.g. "MAK1234567 I Confirm."`;

    const payload = {
      messages: [
        {
          from: "ServiceSMS",
          destinations: [{ to: at.patient.contact_num }],
          text: message,
        },
      ],
    };

    try {
      const response = await axios.post(
        "https://rgxdn1.api.infobip.com/sms/2/text/advanced",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "App f137b8f5f60e3c8ba83ff05fd09277e0-5c40c0b2-0ee4-44d4-8435-cf6431a6c963", // Replace with your API key
          },
        }
      );
      // console.log(response);
      // console.log(payload);
      if (response.data) {
        try {
          const newMessage = await Message.create({
            sender: "System",
            receiver: at.patient,
            message: message,
            type: "outbound",
          });
          // console.log(message);
        } catch (error) {
          console.log(error);
        }
        console.log("messages send succesfully!", response.data, payload);
      }
    } catch (error) {
      console.log("ERROR SENDING MESSAGES: ", error);
    }
  });
};

module.exports = { smsScheduler, sendSMS };
