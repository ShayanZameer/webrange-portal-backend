const axios = require("axios");
const { get } = require("../routes/projectRoutes");

const AZURE_ORGANIZATION_URL = `https://vssps.dev.azure.com/webrange/_apis/graph/users?api-version=7.1-preview.1`;

const AZURE_MEMBERSHIP_URL = `https://vssps.dev.azure.com/webrange/_apis/graph/memberships/`;

const AZURE_PROJECTS_URL = `https://dev.azure.com/webrange/_apis/projects?api-version=7.1-preview.4`;

const AZURE_TEAM_URL = `https://dev.azure.com/webrange/_apis/projects?api-version=6.0`;

const getProjects = async () => {
  const orgUrl = process.env.AZURE_DEVOPS_ORG_URL;
  const token = process.env.AZURE_DEVOPS_PERSONAL_ACCESS_TOKEN;

  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`:${token}`).toString("base64")}`,
    },
  };

  try {
    const response = await axios.get(
      `${orgUrl}/_apis/projects?api-version=6.0`,
      config
    );
    console.log("resrponse value ", response.data);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch projects: ${error.message}`);
  }
};

const getProjectById = async (projectId) => {
  const token = process.env.AZURE_DEVOPS_PERSONAL_ACCESS_TOKEN;

  try {
    const response = await axios.get(
      `https://dev.azure.com/webrange/_apis/projects/${projectId}?api-version=7.1-preview.4`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(":" + token).toString("base64")}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(`Error fetching project by ID: ${error.message}`);
    throw error;
  }
};

const getWorkItems = async (project, ids) => {
  const orgUrl = process.env.AZURE_DEVOPS_ORG_URL;
  const token = process.env.AZURE_DEVOPS_PERSONAL_ACCESS_TOKEN;

  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`:${token}`).toString("base64")}`,
    },
  };

  try {
    const response = await axios.get(
      `${orgUrl}/${project}/_apis/wit/workitems?ids=${ids}&api-version=7.1-preview.3`,
      config
    );
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch work itmes: ${error.message}`);
  }
};

const getWorkItemHistory = async (project, id) => {
  const orgUrl = process.env.AZURE_DEVOPS_ORG_URL;
  const token = process.env.AZURE_DEVOPS_PERSONAL_ACCESS_TOKEN;

  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`:${token}`).toString("base64")}`,
    },
  };

  try {
    const response = await axios.get(
      `${orgUrl}/${project}/_apis/wit/workItems/${id}/updates?api-version=7.1-preview.3`,
      config
    );
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(
        `Error response: ${error.response.status} - ${error.response.statusText}`
      );
      console.error(`Error details: ${JSON.stringify(error.response.data)}`);
      throw new Error(
        `Failed to fetch work item history: ${error.response.status} - ${error.response.statusText}`
      );
    } else if (error.request) {
      console.error("Error request: No response received");
      console.error(error.request);
      throw new Error(
        "Failed to fetch work item history: No response received"
      );
    } else {
      console.error("Error message:", error.message);
      throw new Error(`Failed to fetch work item history: ${error.message}`);
    }
  }
};

const getTotalWorkItems = async (req, res) => {
  const orgUrl = process.env.AZURE_DEVOPS_ORG_URL;
  const token = process.env.AZURE_DEVOPS_PERSONAL_ACCESS_TOKEN;

  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`:${token}`).toString("base64")}`,
    },
  };

  let totalWorkItemsCount = 0;

  try {
    const projectsResponse = await axios.get(
      `${orgUrl}/_apis/projects?api-version=6.0`,
      config
    );
    const projects = projectsResponse.data.value;

    for (const project of projects) {
      const projectName = project.name;

      const wiqlQuery = {
        query: `
                    SELECT [System.Id]
                    FROM WorkItems
                    WHERE [System.TeamProject] = '${projectName}'
                `,
        parameters: [{ name: "projectName", value: projectName }],
      };

      const response = await axios.post(
        `${orgUrl}/${encodeURIComponent(
          projectName
        )}/_apis/wit/wiql?api-version=7.1`,
        wiqlQuery,
        config
      );

      const workItems = response.data.workItems;

      //   for (const workItem of workItems) {
      //     const workItemId = workItem.id;

      //     const workItemResponse = await axios.get(`${orgUrl}/${encodeURIComponent(projectName)}/_apis/wit/workitems/${workItemId}?$expand=all&api-version=7.1`, config);
      //     const detailedWorkItem = workItemResponse.data;

      //     // Push detailed work item information to totalWorkItems array
      //     console.log(detailedWorkItem);
      // }
      totalWorkItemsCount += workItems.length;
    }

    return totalWorkItemsCount;
  } catch (error) {
    // Handle errors
    if (error.response) {
      console.error(
        `Error response: ${error.response.status} - ${error.response.statusText}`
      );
      console.error(`Error details: ${JSON.stringify(error.response.data)}`);
      res.status(error.response.status).json({
        error: `Failed to fetch total work items: ${error.response.status} - ${error.response.statusText}`,
      });
    } else if (error.request) {
      console.error("Error request: No response received");
      console.error(error.request);
      res.status(500).json({
        error: "Failed to fetch total work items: No response received",
      });
    } else {
      console.error("Error message:", error.message);
      res
        .status(500)
        .json({ error: `Failed to fetch total work items: ${error.message}` });
    }
  }
};

const getProjectWorkItems = async (projectName) => {
  const orgUrl = process.env.AZURE_DEVOPS_ORG_URL;
  const token = process.env.AZURE_DEVOPS_PERSONAL_ACCESS_TOKEN;

  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`:${token}`).toString("base64")}`,
    },
  };

  try {
    // WIQL query to get work item IDs
    const wiqlQuery = {
      query: `
        SELECT [System.Id]
        FROM WorkItems
        WHERE [System.TeamProject] = '${projectName}'
      `,
    };

    // Get the list of work item IDs
    const response = await axios.post(
      `${orgUrl}/${encodeURIComponent(
        projectName
      )}/_apis/wit/wiql?api-version=7.1`,
      wiqlQuery,
      config
    );
    const workItems = response.data.workItems;

    // Extract work item IDs
    const workItemIds = workItems.map((item) => item.id);

    // Batch request to get details for all work items
    if (workItemIds.length > 0) {
      const batchRequest = {
        ids: workItemIds,
        $expand: "all", // Expand to get full details
      };

      const batchResponse = await axios.post(
        `${orgUrl}/_apis/wit/workitemsbatch?api-version=7.1`,
        batchRequest,
        config
      );

      return { workItems: batchResponse.data.value };
    } else {
      return { workItems: [] };
    }
  } catch (error) {
    // Handle errors
    if (error.response) {
      console.error(
        `Error response: ${error.response.status} - ${error.response.statusText}`
      );
      console.error(`Error details: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error("Error request: No response received");
      console.error(error.request);
    } else {
      console.error("Error message:", error.message);
    }
  }
};

const getUserByEmail = async (email) => {
  try {
    const token = process.env.AZURE_DEVOPS_PERSONAL_ACCESS_TOKEN;

    const userresponse = await axios.get(AZURE_ORGANIZATION_URL, {
      headers: {
        Authorization: `Basic ${Buffer.from(":" + token).toString("base64")}`,
      },
    });

    const users = userresponse.data.value;

    const user = users.find(
      (u) => u.mailAddress.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      throw new Error("User not found");
    }

    // Step 2: Fetch all projects (remains unchanged)
    const response = await axios.get(
      `https://dev.azure.com/webrange/_apis/projects?api-version=7.1-preview.4`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(":" + token).toString("base64")}`,
        },
      }
    );

    const projects = response.data.value;

    const projectPromises = projects.map(async (project) => {
      try {
        const projectTeamsResponse = await axios.get(
          `https://dev.azure.com/webrange/_apis/projects/${project.id}/teams?api-version=7.0`,
          {
            headers: {
              Authorization: `Basic ${Buffer.from(":" + token).toString(
                "base64"
              )}`,
            },
          }
        );

        const teams = projectTeamsResponse.data.value;

        const teamMemberPromises = teams.map(async (team) => {
          const teamMembersResponse = await axios.get(
            `https://dev.azure.com/webrange/_apis/projects/${project.id}/teams/${team.id}/members?api-version=7.0`,
            {
              headers: {
                Authorization: `Basic ${Buffer.from(":" + token).toString(
                  "base64"
                )}`,
              },
            }
          );
          return teamMembersResponse.data.value;
        });

        const teamMembers = await Promise.all(teamMemberPromises);

        const allMembers = teamMembers.flat();
        const isMember = allMembers.some(
          (member) => member.identity.displayName === user.displayName
        );

        return {
          projectName: project.name,
          isMember,
        };
      } catch (err) {
        console.error(
          `Error checking membership for project ${project.name}:`,
          err
        );
        return {
          projectName: project.name,
          isMember: false,
        };
      }
    });

    const userProjects = await Promise.all(projectPromises);
    const enrolledProjects = userProjects.filter((p) => p.isMember);

    return { user, projects: enrolledProjects };
  } catch (error) {
    console.error("Error fetching users or projects:", error);
    throw error;
  }
};

// const getTaskActivities = async (orgName, project, taskId, patToken) => {
//   const url = `https://dev.azure.com/${orgName}/${project}/_apis/wit/workitems/${taskId}/revisions?api-version=7.0`;

//   try {
//     const response = await fetch(url, {
//       method: "GET",
//       headers: {
//         Authorization: `Basic ${Buffer.from(`:${patToken}`).toString(
//           "base64"
//         )}`, // Encodes PAT
//         "Content-Type": "application/json",
//       },
//     });

//     if (!response.ok) {
//       throw new Error(`Error fetching activities: ${response.statusText}`);
//     }

//     const data = await response.json();
//     return data;
//   } catch (error) {
//     console.error("Error fetching task activities:", error);
//     throw error;
//   }
// };

const getTaskActivities = async (orgName, project, taskId, patToken) => {
  const url = `https://dev.azure.com/${orgName}/${project}/_apis/wit/workitems/${taskId}/revisions?api-version=7.0`;

  try {
    console.log("Request URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(`:${patToken}`).toString(
          "base64"
        )}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Response Status:", response.status);
    console.log("Response Status Text:", response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error Response:", errorText);
      throw new Error(`Error fetching activities: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching task activities:", error);
    throw error;
  }
};

module.exports = {
  getProjects,
  getWorkItems,
  getWorkItemHistory,
  getTotalWorkItems,
  getProjectWorkItems,
  getUserByEmail,
  getProjectById,
  getTaskActivities,
};
