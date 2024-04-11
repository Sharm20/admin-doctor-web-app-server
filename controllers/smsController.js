const asyncHandler = require("express-async-handler");
const twilio = require("twilio");

const sendSMS = async (req, res) => {
  const { recipeint, message, from } = req.body;

  const sendMessage = async () => {
    const client = new twilio();
  };
};

module.exports = { sendSMS };
