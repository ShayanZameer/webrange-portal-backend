const express = require("express");
const router = express.Router();
const projectController = require("../contollers/projectController");

router.get("/getAllProjects", projectController.getAllProjects);
router.get("/getWorkItems", projectController.getWorkItems);
router.post("/getWorkItemHistory", projectController.getWorkItemHistory);
router.get("/getTotalWorkItem", projectController.getTotalWorkItems);
router.post("/getProjectWorkItems", projectController.getProjectWorkItems);
router.get("/projects-work-items", projectController.getProjectsAndWorkItems);

router.get("/:projectId/work-items", projectController.getProjectWorkItemsById);
router.post("/all-workitems-history", projectController.getAllWorkItemsHistory);

module.exports = router;
