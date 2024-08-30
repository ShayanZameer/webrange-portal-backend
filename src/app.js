const express = require("express");
const projectRoutes = require("./routes/projectRoutes");
const userRoutes = require("./routes/UserRoutes/Userroute");
const taskRoutes = require("./routes/TaskRoutes/taskRoutes");
const app = express();
var cors = require("cors");
require("dotenv").config();

app.use(cors());

app.get("/", (req, res) => {
  res.send("Welcome to Azure Team Project");
});

app.use(express.json());
app.use("/api/projects", projectRoutes);
app.use("/api/user", userRoutes);
app.use("/api/task", taskRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
