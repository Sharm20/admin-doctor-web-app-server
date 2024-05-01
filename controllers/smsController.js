const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const twilio = require("twilio");
const axios = require("axios");
const Message = require("../models/messagesModel");
const Appointment = require("../models/appointmentModel");

const sendSMS = async (req, res) => {
  // const { recipeint, message, from } = req.body;

  try {
    // Retrieve data from request body
    const { phoneNumber, message, sender_id } = req.body;
    console.log("sms req body: ", phoneNumber, message);
    // Prepare request payload
    const payload = {
      messages: [
        {
          from: "ServiceSMS", // Replace with your sender ID
          destinations: [{ to: phoneNumber }],
          text: message,
        },
      ],
    };

    try {
      const newMessage = await Message.create({
        sender: sender_id,
        receiver: phoneNumber,
        message: message,
        type: "outbound",
      });
      return res.status(201).json({ ...newMessage._doc });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }

    // Send POST request to Infobip API
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

    // Handle response from Infobip API
    console.log("SMS sent successfully:", response.data);
    res.status(200).json({ success: true, message: "SMS sent successfully" });
  } catch (error) {
    console.error("Error sending SMS:", error.response?.data || error.message);
    res.status(500).json({ success: false, error: "Failed to send SMS" });
  }
};

const getSMS = async () => {
  const response = await axios({
    method: "GET",
    url: "https://rgxdn1.api.infobip.com/sms/1/inbox/reports",
    headers: {
      Authorization:
        "App f137b8f5f60e3c8ba83ff05fd09277e0-5c40c0b2-0ee4-44d4-8435-cf6431a6c963",
      Accept: "appication/json",
    },
  });

  console.log(response.data);
};

const receiveSMS = async (req, res) => {
  const accountSID = "AC3105abd4753cdda384af333bba85ab6c";
  const accountToken = "91580c328a6fc972405b2a3f6d6e3b9e";
  const client = twilio(accountSID, accountToken);
  const { Body, From } = req.body;
  console.log("Received Message: ", Body, "From: ", From);

  const reference_num = Body.split(" ")[0];
  console.log("reference number: ", reference_num);

  const sender_appointment = await Appointment.findOne({
    reference_num: reference_num,
  });
  console.log("Sender's appointment: ", sender_appointment);

  if (!sender_appointment) {
    console.log(
      `The appointment with a reference number ${reference_num} was not found`
    );
  }
  try {
    const newMessage = await Message.create({
      sender: sender_appointment
        ? {
            pnum: From,
            first_name: sender_appointment.patient.first_name,
            last_name: sender_appointment.patient.last_name,
          }
        : { pnum: From },
      receiver: {
        id: sender_appointment.doctor._id,
        first_name: sender_appointment.doctor.first_name,
        last_name: sender_appointment.doctor.last_name,
      },
      message: Body,
      type: "inbound",
    });
    return res.status(201).json({ ...newMessage._doc });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = { sendSMS, receiveSMS };
