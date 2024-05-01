const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: { pnum: String, first_name: String, last_name: String },
    receiver: {
      id: mongoose.Schema.Types.ObjectId,
      first_name: String,
      last_name: String,
    },
    message: String,
    type: {
      type: String,
      enum: ["inbound", "outbound"],
      required: true,
    },
  },
  { timestamps: true }
);

const messageModel = new mongoose.model("Message", messageSchema);

module.exports = messageModel;
