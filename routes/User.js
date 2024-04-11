const router = require("express").Router();
const {
  login,
  register,
  logout,
  getUser,
  updateUser,
  deleteUser,
  allUsers,
} = require("../controllers/userController");

router.route("/login").post(login);
router.route("/register").post(register);
router.route("/logout").get(logout);
router.route("/").get(allUsers);
router.route("/:id").get(getUser).put(updateUser).delete(deleteUser);

module.exports = router;
