const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
require("dotenv").config();
require('./scheduledJobs');
var cookieParser = require('cookie-parser')

const app = express();

app.use(cookieParser());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
const corsOptions = {
  origin: ["http://localhost:3000","http://localhost:3001", "http://skbj.tv", "https://skbj.tv", "http://sexkbj.tv", "https://sexkbj.tv"], // set the origin of the client
  credentials: true, // enable sending of new cookies
};

app.use(cors(corsOptions));
app.use(fileUpload());

app.get("/", (req, res) => {
  // console.log("Here");
});

const videosRouter = require("./routes/videos");
const galleriesRouter = require("./routes/galleries");
const paymentsRouter = require("./routes/payments");
const categoriesRouter = require("./routes/categories");
const actorsRouter = require("./routes/actors");
const tagsRouter = require("./routes/tags");
const usersRouter = require("./routes/users");
const commentsRouter = require("./routes/comments");

app.use("/api/videos", videosRouter);
app.use("/api/galleries", galleriesRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/actors", actorsRouter);
app.use("/api/tags", tagsRouter);
app.use("/api/users", usersRouter);
app.use("/api/comments", commentsRouter);

const URI = process.env.DB_URL;

async function connect() {
  try {
    await mongoose.set("strictQuery", false);
    await mongoose.connect(URI);
    // console.log("Connected to MongoDB");
  } catch (error) {
    console.error(error);
  }
}
connect();

app.listen(3030, () => {
  console.log("Server started on port 3030");
});
