const jwt = require("jsonwebtoken");
const dotenv = require("dotenv").config();
const adminUser = require("../models/User");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1]; // Bearer

    jwt.verify(token, process.env.JWT_SECRETKEY, async (err, payload) => {
      try {
        if (err) {
          return res.status(401).json({ error: "Unauthorized!" });
        }
        const user = await adminUser
          .findOne({ _id: payload._id })
          .select("-password");

        req.user = user;
        next();
      } catch (error) {
        console.log(error);
      }
    });
  } else {
    return res.status(403).json({ error: "Forbidden" });
  }
};
