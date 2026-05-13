"use strict";

const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

require("dotenv").config({ //connect environment file
  path: path.resolve(__dirname, "./.env"),
  quiet: true
});

const app = express();
const port = 8000;

app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "templates")); //directory of templates

app.use(bodyParser.urlencoded({ extended: false })); //initialize request.body with post info
app.use(express.static(__dirname + '/templates')); //to access static CSS file
app.use(express.json());

mongoose
  .connect(process.env.MONGO_CONNECTION_STRING)
  .then(() => {
    console.log("Connected to MongoDB with Mongoose");

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

//home page, fresh load
app.get("/", (request, response) => {
  const variables = {
        img1url: "https://images.squarespace-cdn.com/content/v1/607f89e638219e13eee71b1e/1684821560422-SD5V37BAG28BURTLIXUQ/michael-sum-LEpfefQf4rU-unsplash.jpg",
        img2url: "https://images.squarespace-cdn.com/content/v1/607f89e638219e13eee71b1e/1684821560422-SD5V37BAG28BURTLIXUQ/michael-sum-LEpfefQf4rU-unsplash.jpg",
        img3url: "https://images.squarespace-cdn.com/content/v1/607f89e638219e13eee71b1e/1684821560422-SD5V37BAG28BURTLIXUQ/michael-sum-LEpfefQf4rU-unsplash.jpg",
        label1: "A",
        label2: "B",
        label3: "C"
  };
  response.render("homepage", variables);
});

//leaderboard page
app.get("/leaderboard", (request, response) => {
  const variables = {
        tableEntries: "<tr><td>Col1</td><td>Col2</td><td>Col3</td></tr>"
  };
  response.render("leaderboard", variables);
});

const boardSchema = new mongoose.Schema({
  name: String,
  id: String,
  wins: Number,
  losses: Number
});

const Board = mongoose.model("Board", boardSchema);


async function insertApplication(application) {
    const databaseName = "CMSC335DB";
    const collectionName = "campApplicants";
    const uri = process.env.MONGO_CONNECTION_STRING;

    const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
    await client.connect();
      const database = client.db(databaseName);
      const collection = database.collection(collectionName);

      const applicant = { name: application.name, email: application.email, gpa: Number(application.gpa), background: application.backgroundInfo };
      let result = await collection.insertOne(applicant);

}


async function getRandom() {
  try {
    const randoms = await Board.aggregate([
      { $sample: { size: 3 } }
    ]);

    if (randoms.length < 3) {
      return -1;
    }

    return json(randoms);
  } catch (err) {
    console.error(err);
    return 500
}
}

