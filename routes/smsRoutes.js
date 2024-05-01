const express = require("express");
const router = express.Router();
const { sendSMS } = require("../controllers/smsController");

router.route("/send-sms").post(sendSMS);

module.exports = router;
