const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema({
  lastExecuted: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Schedule", scheduleSchema);
