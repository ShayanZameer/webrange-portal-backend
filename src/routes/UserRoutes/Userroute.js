const express = require("express");
const router = express.Router();
const Usercontroller = require("../../contollers/Usercontroller/Usercontroller");

router.post("/get-user-by-email", Usercontroller.getUserByEmail);

module.exports = router;
