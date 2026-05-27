const express = require("express");
const { authRequired } = require("../middlewares/auth");
const { getDashboard } = require("../controllers/dashboardController");

const router = express.Router();
router.get("/", authRequired, getDashboard);

module.exports = router;
