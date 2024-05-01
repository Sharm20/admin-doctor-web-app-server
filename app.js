const express = require("express");
const http = require("http");
const errorHandler = require("./middlewares/errorHandler");
const connectDB = require("./config/dbConnection");
const dotenv = require("dotenv").config();
const morgan = require("morgan");
const auth = require("./middlewares/auth");
const bodyParser = require("body-parser");
const app = express();
const { smsScheduler, sendSMS } = require("./functions/scheduler");
const port = process.env.PORT || 8080;
const WSport = process.env.WSPORT || 3001;
const User = require("./models/User");
const mongoose = require("mongoose");
const setupSocketServer = require("./websocket/websocket");
const { receiveSMS } = require("./controllers/smsController");

// send texts to all appointments scheduled tommorow
smsScheduler();

// websocket
const server = http.createServer(app);
//set up websocket
const wss = setupSocketServer(server);
// middlewares
app.use(express.json());
app.use(errorHandler);
app.use(morgan("tiny"));
app.use(require("cors")());
app.use(bodyParser.json());
// connectDB();

// app.get("/login", (req, res) => {
//   res.send("this is log in");
// });
// routes
app.get("/protected", auth, (req, res) => {
  return res.status(200).json({ user: req.user }); // or it could be ({...req.use._doc})
});

// app.get("/api/all-users", async (req, res) => {
//   const users = await User.find();

//   return res.status(200).json({ ...users._doc });
// });

app.use("/api/appointments", require("./routes/appointmentRoutes"));
app.use("/api/appointment-status", require("./routes/appointmentStatus"));
app.use("/api/clinics", require("./routes/clinicRoutes"));
app.use("/api/doctors", require("./routes/doctorRoutes"));
app.use("/api/patients", require("./routes/patientRoutes"));
app.use("/api/specializations", require("./routes/specializationRoutes"));
app.use("/api/users", require("./routes/User"));
app.use("/api/sms", require("./routes/smsRoutes"));
app.use("/api/calendar", require("./routes/calendarRoute"));

app.listen(port, async () => {
  // sendSMS();
  await connectDB();
  console.log(`Server is running on ${port} \n`);
});

server.listen(WSport, async () => {
  await connectDB();
  console.log(`Websocket running on port ${WSport}`);
});

app.use(bodyParser.urlencoded({ extended: false }));

app.post("/sms", receiveSMS);
