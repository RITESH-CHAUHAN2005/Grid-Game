const express = require("express");
const { authRequired } = require("../middlewares/auth");
const { listMyActivity, listGlobalFeed } = require("../controllers/activityController");

const router = express.Router();

router.get("/me", authRequired, listMyActivity);
router.get("/feed", authRequired, listGlobalFeed);

module.exports = router;
