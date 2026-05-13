"use strict";

const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

require("dotenv").config({
  path: path.resolve(__dirname, "./.env"),
});

const app = express();
const port = 8000;

app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "templates"));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB with Mongoose");

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

app.get("/", (request, response) => {
  response.render("index");
});

app.get("/leaderboard", (request, response) => {
  response.render("leaderboard");
});

const boardSchema = new mongoose.Schema({
  name: String,
  id: Number,
  yesVotes: Number,
  noVotes: Number
});

const board = mongoose.model("board", boardSchema);


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
    const randoms = await board.aggregate([
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

