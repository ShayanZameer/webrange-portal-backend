const express = require("express");
const router = express.Router();
const taskController = require("../../contollers/Taskcontroller/Taskcontroller");

router.post("/:taskId/activities", taskController.getTaskActivitiesController);

module.exports = router;
