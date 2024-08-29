const azureService = require("../../services/azureServices");

// exports.getUserByEmail = async (req, res) => {
//   try {
//     const { email } = req.body; // Email provided in the request body
//     if (!email) {
//       return res.status(400).json({ error: "Email is required" });
//     }

//     // Fetch user and project details from azureService
//     const { user, projects } = await azureService.getUserByEmail(email);
//     // console.log("User details:", user);
//     // console.log("Projects:", projects);

//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     // Return the user details along with project assignments
//     res.status(200).json({
//       user,
//       projectCount: projects.length,
//       projects: projects.map((project) => ({
//         projectDescriptor: project.containerDescriptor,
//         role: project.role, // You can include additional project-specific details here
//       })),
//     });
//   } catch (error) {
//     console.error("Error in controller:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

exports.getUserByEmail = async (req, res) => {
  try {
    const { email } = req.body; // Email provided in the request body
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Fetch user and project details from azureService
    const { user, projects } = await azureService.getUserByEmail(email);
    // console.log("User details:", user);
    // console.log("Projects:", projects);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return the user details along with project assignments
    res.status(200).json({
      user,
      projectCount: projects.length,
      projects: projects.map((project) => ({
        projectName: project, // You can include more project-specific details if needed
      })),
    });
  } catch (error) {
    console.error("Error in controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
