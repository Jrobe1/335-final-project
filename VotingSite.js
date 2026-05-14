"use strict";

const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

require("dotenv").config({
  path: path.resolve(__dirname, "./.env"),
  quiet: true
});

const app = express();
const port = 8000;

app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "templates")); 

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/templates')); 
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

const boardSchema = new mongoose.Schema({
  name: String,
  wins: Number,
  losses: Number
});

const Board = mongoose.model("Board", boardSchema);

populateBoard();
async function populateBoard() {
  try {
    const response = await fetch("https://dog.ceo/api/breeds/list/all");

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const jsonData = await response.json();

    // console.log(jsonData);
    const keys = Object.keys(jsonData.message);
    // console.log(jsonData.message);
    let breeds = [];
    keys.forEach((breed, i) => {
      if (jsonData.message[breed].length === 0) {
        breeds.push(breed);
      } else {
        jsonData.message[breed].forEach((subtype, i) =>
        breeds.push(subtype + " " + breed));
      }

    })


    const existingDocs = await Board.find({}, "name");
    const existingNames = new Set(
      existingDocs.map(doc => doc.name)
    );


    const documents = breeds
      .filter(breed => !existingNames.has(breed))
      .map(breed => ({
        name: breed,
        wins: 0,
        losses: 0
      }));


    if (documents.length > 0) {
      await Board.insertMany(documents);
      console.log(`Inserted ${documents.length} new breeds`);
    } else {
      console.log("No new breeds to insert");
    }

    // console.log(await Board.find({}).limit(10));



  } catch (err) {

      console.log("Failed to get breeds with error: ", err)

  }

}

async function getImage(breed) {
  const apiUrl = `https://dog.ceo/api/breed/${breed}/images/random`;
  console.log("Fetching image:", apiUrl);

  const apiResponse = await fetch(apiUrl);

  if (!apiResponse.ok) {
    throw new Error(`HTTP Error: ${apiResponse.status} for ${apiUrl}`);
  }

  const jsonData = await apiResponse.json();
  return jsonData.message;
}

function formatBreedForImage(name) {
  if (name.includes(" ")) {
    const [type, breed] = name.split(" ");
    return `${breed}/${type}`;
  }

  return name;
}

//home page, fresh load
app.get("/", async (request, response) => {
  /*
    *this router is used when home page is opened outside of the context of a vote being submitted.
     (e.g., manually entering url, clicking home button on page)
    -Retrieve 3 random distinct entries from the collection. No other criteria are considered.
      */ 
    const randomElements = await getRandom();


      /*
    -Populate the variables object with data from the 3 entries.
     */const variables = {
      label1: "",
      label2: "",
      label3: "",
      img1url: "", 
      img2url: "", 
      img3url: ""

     }
    console.log(randomElements);
    variables.label1 = randomElements[0].name;
    variables.label2 = randomElements[1].name;
    variables.label3 = randomElements[2].name;
    const formattedBreeds = randomElements.map((dog) => {
      return formatBreedForImage(dog.name);
    });

    variables.img1url = await getImage(formattedBreeds[0]);
    variables.img2url = await getImage(formattedBreeds[1]);
    variables.img3url = await getImage(formattedBreeds[2]);

  /*
     The label 1-3 names can come directly from the entries 'name', the images should be obtained via API.
  */
  response.render("homepage", variables);
});

//home page, upon any vote submit (vote submits reload the home page)
//     *This router is used every time a vote is submitted, which is via POST.
//     -obtain the radio button selection from the form (look at templates/homepage.ejs for reference).
//     -based on the radio button selected, find which of the 3 options "won".
//     -find the entries associated with the options (you can try by getting get the document label
//      innerHTML as a search key, or any other method you think will work.)
//     -update all 3 depicted entries in the collection according to which "won".
//      the voted entry should have 'wins' incremented, and the other 2 should have 'losses' incremented.
//     -refresh (re-render) the page with a new poll by editing the variables object.

app.post("/", async (request, response) => {
  try {
    console.log("POST body:", request.body);

    const vote = request.body.voteChoice;

    const labels = [
      request.body.label1,
      request.body.label2,
      request.body.label3
    ];

    let winnerIndex;

    if (vote === "choice1") winnerIndex = 0;
    else if (vote === "choice2") winnerIndex = 1;
    else if (vote === "choice3") winnerIndex = 2;
    else {
      return response.status(400).send("Invalid vote choice");
    }

    for (let i = 0; i < labels.length; i++) {
      if (i === winnerIndex) {
        await Board.updateOne(
          { name: labels[i] },
          { $inc: { wins: 1 } }
        );
      } else {
        await Board.updateOne(
          { name: labels[i] },
          { $inc: { losses: 1 } }
        );
      }
    }


    return response.redirect("/");

  } catch (err) {
    console.error("POST error:", err);
    return response.status(500).send("Error submitting vote");
  }
});

//leaderboard page
//     *This router is used when showing the leaderboard table page 
//      (access via "top winners" button)
//     -retrieve all collection entries.
//     -sort them by 'wins' in descending order.
//     -generate a string of HTML to fill the variables field "tableEntries" below.
//      It should be a sequence of <tr> table rows, each representing an entry.
//      Fill each row with 3 cols: corresponding name, # of vote wins, and # of vote losses.
//      You do not need to add the header or surrounding table (see templates/leaderboard.ejs).
//      The top row should be the entry with the most wins; # of losses is irrelevent to the order.
//      All existing entries should appear in the table.

app.get("/leaderboard", async (request, response) => {
  try {
    const entries = await Board.find({}).sort({ wins: -1 });

    let tableEntries = "";

    entries.forEach((entry) => {
      tableEntries += `
        <tr>
          <td>${entry.name}</td>
          <td>${entry.wins}</td>
          <td>${entry.losses}</td>
        </tr>
      `;
    });

    return response.render("leaderboard", { tableEntries });

  } catch (err) {
    console.error("Leaderboard error:", err);
    return response.status(500).send("Error loading leaderboard");
  }
});


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
      { $sample: { size: 3 } },
      {
        $project: {
          _id: 0,
          name: 1,
          wins: 1,
          losses: 1
        }
      }
    ]);

    if (randoms.length < 3) {
      return -1;
    }

    return randoms;

  } catch (err) {
    console.error(err);
    return -1;
  }
}

