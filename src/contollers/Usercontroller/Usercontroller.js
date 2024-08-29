const azureService = require("../../services/azureServices");

exports.getUserByEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const { user, projects } = await azureService.getUserByEmail(email);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      user,
      projectCount: projects.length,
      projects: projects.map((project) => ({
        projectName: project,
      })),
    });
  } catch (error) {
    console.error("Error in controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
