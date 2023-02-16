const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
require("dotenv").config();

const app = express();

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(cors());
app.use(fileUpload());

app.get("/", (req, res) => {
  console.log("Here");
});

const videosRouter = require("./routes/videos");
const categoriesRouter = require("./routes/categories");
const actorsRouter = require("./routes/actors");
const tagsRouter = require("./routes/tags");

app.use("/videos", videosRouter);
app.use("/categories", categoriesRouter);
app.use("/actors", actorsRouter);
app.use("/tags", tagsRouter);

const URI = process.env.DB_URL;

async function connect() {
  try {
    await mongoose.set("strictQuery", false);
    await mongoose.connect(URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error(error);
  }
}
connect();

app.listen(3030, () => {
  console.log("Server started on port 3030");
});
