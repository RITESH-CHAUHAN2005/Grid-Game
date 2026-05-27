const express = require("express");
const { signup, login, guest, me, updateColor, logout } = require("../controllers/authController");
const { authRequired } = require("../middlewares/auth");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/guest", guest);
router.get("/me", authRequired, me);
router.post("/color", authRequired, updateColor);
router.post("/logout", authRequired, logout);

module.exports = router;
