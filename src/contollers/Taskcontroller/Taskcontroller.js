const azureService = require("../../services/azureServices");
exports.getTaskActivitiesController = async (req, res) => {
  const { taskId } = req.params; // Get task ID from route parameter
  const { project } = req.body;
  const orgName = process.env.AZURE_ORG_NAME;
  const patToken = process.env.AZURE_DEVOPS_PERSONAL_ACCESS_TOKEN;

  try {
    const activities = await azureService.getTaskActivities(
      orgName,
      project,
      taskId,
      patToken
    );
    res.status(200).json(activities);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching task activities",
      error: error.message,
    });
  }
};
