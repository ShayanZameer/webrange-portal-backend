const azureDevOpsService = require("../services/azureServices");

const calculateWorkHours = (startDate, endDate) => {
  const workStart = 9; // 9 AM
  const workEnd = 17; // 5 PM
  const millisecondsInHour = 3600000; // 1 hour in milliseconds
  let totalHours = 0;

  let current = new Date(startDate);
  while (current < endDate) {
    if (current.getDay() >= 1 && current.getDay() <= 5) {
      // Monday to Friday
      let dayStart = new Date(current);
      let dayEnd = new Date(current);
      dayStart.setHours(workStart, 0, 0, 0);
      dayEnd.setHours(workEnd, 0, 0, 0);

      if (current < dayStart) {
        current = new Date(dayStart);
      }

      if (endDate < dayEnd) {
        dayEnd = new Date(endDate);
      }

      if (current < dayEnd) {
        totalHours += (dayEnd - current) / millisecondsInHour;
      }
    }
    current.setDate(current.getDate() + 1);
    current.setHours(workStart, 0, 0, 0);
  }

  return totalHours;
};

exports.getAllProjects = async (req, res) => {
  try {
    const projects = await azureDevOpsService.getProjects();
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getWorkItems = async (req, res) => {
  const { project, ids } = req.body;

  if (!project || !ids) {
    return res
      .status(400)
      .json({ message: "Project and IDs are required parameters." });
  }

  try {
    const workItems = await azureDevOpsService.getWorkItems(project, ids);
    res.status(200).json(workItems);
  } catch (error) {
    console.error(`Controller error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

exports.getWorkItemHistory = async (req, res) => {
  const { project, id } = req.body;

  if (!project) {
    console.error("Missing project parameter");
    return res
      .status(400)
      .json({ message: "Project is a required parameter." });
  }

  if (!id) {
    console.error("Missing id parameter");
    return res.status(400).json({ message: "ID is a required parameter." });
  }

  try {
    const data = await azureDevOpsService.getWorkItemHistory(project, id);
    let stateChanges = [];

    const workStartHour = 11;
    const workEndHour = 19;
    const workDays = [1, 2, 3, 4, 5, 6];

    data.value.forEach((update) => {
      const rev = update.rev;
      const newState = update.fields["System.State"]
        ? update.fields["System.State"].newValue
        : null;
      const changeDate = update.fields["Microsoft.VSTS.Common.StateChangeDate"]
        ? new Date(
            update.fields["Microsoft.VSTS.Common.StateChangeDate"].newValue
          )
        : null;

      if (newState && changeDate) {
        stateChanges.push({
          revision: rev,
          state: newState,
          changeDate: changeDate,
        });
      }
    });

    // Sort state changes by change date
    stateChanges.sort((a, b) => a.changeDate - b.changeDate);

    let timeInState = {};
    let previousState = null;
    let lastChangeDate = null;

    stateChanges.forEach((change) => {
      const currentState = change.state;
      const changeDate = change.changeDate;

      // Calculate working time only within working hours and workdays
      if (currentState !== previousState) {
        if (previousState !== null && lastChangeDate !== null) {
          if (!timeInState[previousState]) {
            timeInState[previousState] = 0;
          }
          timeInState[previousState] += calculateWorkingTime(
            lastChangeDate,
            changeDate,
            workStartHour,
            workEndHour,
            workDays
          );
        }
        previousState = currentState;
        lastChangeDate = changeDate;
      }
    });

    // Calculate time from the last state change to the current time
    if (previousState !== null && lastChangeDate !== null) {
      if (!timeInState[previousState]) {
        timeInState[previousState] = 0;
      }
      timeInState[previousState] += calculateWorkingTime(
        lastChangeDate,
        new Date(),
        workStartHour,
        workEndHour,
        workDays
      );
    }

    let timeInStateSeconds = {
      "To Do": 0,
      Doing: 0,
      TESTING: 0,
      Done: 0,
      DevDone: 0, // Add Dev Done here
    };

    Object.keys(timeInState).forEach((state) => {
      timeInStateSeconds[state] = timeInState[state]; // Time is already in seconds
    });

    res.status(200).json({
      data: timeInStateSeconds,
    });
  } catch (error) {
    console.error(`Controller error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Calculate working time between two dates, considering only office hours and workdays.
 * @param {Date} startDate - The start date.
 * @param {Date} endDate - The end date.
 * @param {number} workStartHour - The hour office starts (24-hour format).
 * @param {number} workEndHour - The hour office ends (24-hour format).
 * @param {Array<number>} workDays - The days of the week that are working days (0 = Sunday, 6 = Saturday).
 * @returns {number} - The total working time in seconds.
 */
const calculateWorkingTime = (
  startDate,
  endDate,
  workStartHour,
  workEndHour,
  workDays
) => {
  let totalTime = 0;
  let currentDate = new Date(startDate);

  while (currentDate < endDate) {
    // Skip non-working days
    if (workDays.includes(currentDate.getDay())) {
      const workStart = new Date(currentDate);
      workStart.setHours(workStartHour, 0, 0, 0);

      const workEnd = new Date(currentDate);
      workEnd.setHours(workEndHour, 0, 0, 0);

      // Calculate time for the current day within working hours
      if (currentDate < workStart) {
        currentDate = workStart;
      }

      if (currentDate < workEnd && currentDate < endDate) {
        const end = new Date(Math.min(workEnd, endDate));
        totalTime += (end - currentDate) / 1000; // Time in seconds
        currentDate = end;
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
    currentDate.setHours(0, 0, 0, 0);
  }

  return totalTime;
};

exports.getTotalWorkItems = async (req, res) => {
  try {
    const totalWorkItem = await azureDevOpsService.getTotalWorkItems();
    res.status(200).json({
      data: totalWorkItem,
    });
  } catch (error) {
    console.error(`Controller error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

exports.getProjectsAndWorkItems = async (req, res) => {
  try {
    const projects = await azureDevOpsService.getProjects();
    console.log("Projects response:", projects); // Log the response

    if (!projects || !projects.value) {
      throw new Error(
        "Projects response does not have the expected structure."
      );
    }

    const projectPromises = projects.value.map((project) => {
      return azureDevOpsService
        .getProjectWorkItems(project.name)
        .then((workItems) => ({
          project: project.name,
          id: project.id,
          state: project.state,
          workItems,
        }));
    });

    const projectsWithWorkItems = await Promise.all(projectPromises);

    res.status(200).json(projectsWithWorkItems);
  } catch (error) {
    console.error(`Controller error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

// exports.getProjectsAndWorkItems = async (req, res) => {
//   try {
//     const projects = await azureDevOpsService.getProjects();
//     console.log("pp", projects);

//     const projectPromises = projects.value.map((project) => {
//       return azureDevOpsService
//         .getProjectWorkItems(project.name)
//         .then((workItems) => ({
//           project: project.name,
//           id: project.id,
//           state: project.state,
//           workItems,
//         }));
//     });

//     // Resolve all promises concurrently
//     const projectsWithWorkItems = await Promise.all(projectPromises);

//     res.status(200).json(projectsWithWorkItems);
//   } catch (error) {
//     console.error(`Controller error: ${error.message}`);
//     res.status(500).json({ message: error.message });
//   }
// };

exports.getProjectWorkItems = async (req, res) => {
  const { projectName } = req.body;

  try {
    const workItems = await azureDevOpsService.getProjectWorkItems(projectName);
    if (!workItems) {
      return res
        .status(404)
        .json({ message: "No work items found for the project" });
    }

    res.status(200).json(workItems);
  } catch (error) {
    console.error(`Controller error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

exports.getProjectWorkItemsById = async (req, res) => {
  const { projectId } = req.params; // Extract projectId from route parameters

  try {
    const project = await azureDevOpsService.getProjectById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const workItems = await azureDevOpsService.getProjectWorkItems(
      project.name
    );

    res.status(200).json({
      project: {
        name: project.name,
        id: project.id,
        state: project.state,
      },
      workItems,
    });
  } catch (error) {
    console.error(`Controller error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

exports.getAllWorkItemsHistory = async (req, res) => {
  const { project } = req.body;

  if (!project) {
    console.error("Missing project parameter");
    return res
      .status(400)
      .json({ message: "Project is a required parameter." });
  }

  try {
    const workItemsResponse = await azureDevOpsService.getProjectWorkItems(
      project
    );
    const workItems = workItemsResponse.workItems;

    const workStartHour = 11;
    const workEndHour = 19;
    const workDays = [1, 2, 3, 4, 5, 6];

    // Store state times for each work item separately
    let workItemsStateTimes = [];

    for (const workItem of workItems) {
      const workItemId = workItem.id;

      try {
        const data = await azureDevOpsService.getWorkItemHistory(
          project,
          workItemId
        );

        let stateChanges = [];

        data.value.forEach((update) => {
          const rev = update.rev;
          const newState = update.fields["System.State"]
            ? update.fields["System.State"].newValue
            : null;
          const changeDate = update.fields[
            "Microsoft.VSTS.Common.StateChangeDate"
          ]
            ? new Date(
                update.fields["Microsoft.VSTS.Common.StateChangeDate"].newValue
              )
            : null;

          if (newState && changeDate) {
            stateChanges.push({
              revision: rev,
              state: newState,
              changeDate: changeDate,
            });
          }
        });

        // Sort state changes by change date
        stateChanges.sort((a, b) => a.changeDate - b.changeDate);

        let timeInState = {
          "To Do": 0,
          Doing: 0,
          TESTING: 0,
          Done: 0,
          "Dev-Done": 0,
        }; // Default structure for all states

        let previousState = null;
        let lastChangeDate = null;

        stateChanges.forEach((change) => {
          const currentState = change.state;
          const changeDate = change.changeDate;

          if (currentState !== previousState) {
            if (previousState !== null && lastChangeDate !== null) {
              if (!timeInState[previousState]) {
                timeInState[previousState] = 0;
              }
              timeInState[previousState] += calculateWorkingTime(
                lastChangeDate,
                changeDate,
                workStartHour,
                workEndHour,
                workDays
              );
            }
            previousState = currentState;
            lastChangeDate = changeDate;
          }
        });

        // Add time in the last state until now
        if (previousState !== null && lastChangeDate !== null) {
          if (!timeInState[previousState]) {
            timeInState[previousState] = 0;
          }
          timeInState[previousState] += calculateWorkingTime(
            lastChangeDate,
            new Date(),
            workStartHour,
            workEndHour,
            workDays
          );
        }

        const finalTimeInState = {
          "To Do": timeInState["To Do"] || 0,
          Doing: timeInState["Doing"] || 0,
          TESTING: timeInState["TESTING"] || 0,
          Done: timeInState["Done"] || 0,
          "Dev-Done": timeInState["Dev-Done"] || 0,
        };

        // Push the timeInState for each work item
        workItemsStateTimes.push({
          workItemId: workItemId,
          timeInState: finalTimeInState,
        });
      } catch (error) {
        console.error(
          `Error processing work item ${workItemId}: ${error.message}`
        );
      }
    }

    res.status(200).json({
      workItemsStateTimes,
    });
  } catch (error) {
    console.error(`Controller error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};
