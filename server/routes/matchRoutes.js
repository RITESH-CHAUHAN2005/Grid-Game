const express = require("express");
const { authRequired } = require("../middlewares/auth");
const {
  createMatch,
  joinMatch,
  getMatch,
  leaveMatch,
  listMyMatches,
} = require("../controllers/matchController");

const router = express.Router();

router.post("/", authRequired, createMatch);
router.get("/mine", authRequired, listMyMatches);
router.get("/:code", authRequired, getMatch);
router.post("/:code/join", authRequired, joinMatch);
router.post("/:code/leave", authRequired, leaveMatch);

module.exports = router;
