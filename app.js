const express = require("express");
const path = require("path");
const { ConnectToLocalDB, ConnectToOnlineDB } = require("./config/db/localDB");
const cookieParser = require("cookie-parser");

// mdlw
const logger = require("./middlewares/logger");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
require("dotenv").config();

// Connect to MongoDB
ConnectToLocalDB();
// Initialize app
const app = express();
// Serve static files from the "pages" directory
app.use(express.static(path.resolve(__dirname, "pages")));

// apply middleware
app.use(cookieParser());
app.use(express.json());
app.use(logger);
app.set("view engine", "ejs");
//  allow to send data from the field
app.use(express.urlencoded({ extended: false }));

// Login route form
app.get("/", (req, res) => {
  res.render("index");
});

// Routes
app.use("/api/user", require("./routes/user"));
app.use("/api/projects", require("./routes/project"));
app.use("/api/proposals", require("./routes/proposal"));
app.use("/api/final-selections", require("./routes/finalSelection"));
app.use("/api/auth", require("./routes/auth"));

// Error handler middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const Port = process.env.PORT || 7600;
app.listen(Port, () => {
  console.log(
    `Server is running in ${process.env.NODE_ENV || "development"} mode`
  );
  console.log(`http://localhost:${Port}`);
});
