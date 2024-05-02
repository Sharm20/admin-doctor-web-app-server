const http = require("http");
const WebSocket = require("ws");
const Appointment = require("../models/appointmentModel");
const Doctor = require("../models/doctorModel");
const Message = require("../models/messagesModel");
const Patient = require("../models/patientModel");
const mongoose = require("mongoose");

const setupSocketServer = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws) => {
    console.log("Websocket connected");

    // sendDoctorAppointments();

    ws.on("message", (message) => {
      const data = JSON.parse(message);
      if (data.doctor_id) {
        console.log(`Doctor id received: ${data.doctor_id}`);
        changeStreamSetup(data.doctor_id);
        sendDoctorAppointments(data.doctor_id);
      }
      if (data.doctor_receiver) {
        messageStream(data.doctor_receiver);
        sendDoctorMessages(data.doctor_receiver);
      }
    });

    ws.on("close", () => {
      console.log("Websocket connection terminated");
    });
  });

  const changeStreamSetup = async (doctor_id) => {
    // const doctorObjectID = mongoose.Types.ObjectId(doctor_id);
    const doctorChangeStream = Doctor.watch({ $match: { _id: doctor_id } });
    console.log(doctor_id);
    doctorChangeStream.on("change", async (change) => {
      // console.log("Changes to Doctor's collection detected: ", change);
      await sendDoctorAppointments(doctor_id);
    });
    await sendDoctorAppointments(doctor_id);
  };
  const messageStream = async (doctor_id) => {
    const doctorMessageStream = Message.watch();
    doctorMessageStream.on("change", async (change) => {
      if (
        change.operationType === "insert" &&
        change.fullDocument.receiver.id === doctor_id
      ) {
        // Call sendDoctorMessages to send the new message to the client
        await sendDoctorMessages(doctor_id);
      }
    });
  };

  const sendDoctorAppointments = async (doctor_id) => {
    try {
      const doctor = await Doctor.findById(doctor_id).lean();

      const appointment_ids = doctor.appointments.map(
        (appointment) => appointment._id
      );

      const doctorAppointments = await Appointment.find({
        _id: { $in: appointment_ids },
      });

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && doctor_id) {
          client.send(
            JSON.stringify({
              type: "doctor data",
              doctor: doctor,
              appointments: doctorAppointments,
            })
          );
          // console.log(doctor);
        }
      });
    } catch (error) {
      console.log(
        "Error sending appointments through websocket, error:  ",
        error
      );
    }
  };

  const sendDoctorMessages = async (doctor_id) => {
    try {
      // console.log("doctor id for messages: ", doctor_id);
      const messages = await Message.find({
        "receiver.id": doctor_id,
      }).sort({ createdAt: -1 });
      // console.log(messages);

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && doctor_id) {
          client.send(
            JSON.stringify({
              type: "doctor messages",
              message: messages,
            })
          );
        }
      });
    } catch (error) {
      console.log("Error sending messages through websocket, error:  ", error);
    }
  };

  return wss;
};

module.exports = setupSocketServer;
