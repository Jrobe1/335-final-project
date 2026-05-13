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

const boardSchema = new mongoose.Schema({
  name: String,
  //id: String, //Joy's note: you can probably remove this field
  wins: Number,
  losses: Number
});

const Board = mongoose.model("Board", boardSchema);

//home page, fresh load
app.get("/", (request, response) => {
  /*
    Chris TODO:
    *this router is used when home page is opened outside of the context of a vote being submitted.
     (e.g., manually entering url, clicking home button on page)
    -Retrieve 3 random distinct entries from the collection. No other criteria are considered.
    -Populate the variables object with data from the 3 entries.
     The label 1-3 names can come directly from the entries 'name', the images should be obtained via API.
     See my Discord comment for my idea on how this will work and what API to consider.
     The variables obj is currently filled with "dummy" data so you can see the page render.
     Feel free to temporarily edit the code here to add entries for testing, it is currently empty.
  */
  /*
      //example code of adding entry to collection
      //(use for testing; not in final program, where we assume DB has all the entries needed beforehand)
      (async () => {
        const testentry = new Board({
            name: "test",
            wins: 0,
            losses: 0
          });
        await testentry.save();
      })();
  */
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

//home page, upon any vote submit (vote submits reload the home page)
app.post("/", (request, response) => {
  /*
    Chris TODO:
    *This router is used every time a vote is submitted, which is via POST.
    -obtain the radio button selection from the form (look at templates/homepage.ejs for reference).
    -based on the radio button selected, find which of the 3 options "won".
    -find the entries associated with the options (you can try by getting get the document label
     innerHTML as a search key, or any other method you think will work.)
    -update all 3 depicted entries in the collection according to which "won".
     the voted entry should have 'wins' incremented, and the other 2 should have 'losses' incremented.
    -refresh (re-render) the page with a new poll by editing the variables object.
     you can copy the code from the GET router above.
     The variables obj is currently filled with "dummy" data so you can see the page render.
  */
  const variables = {
        img1url: "https://www.pawsbyzann.com/wp-content/uploads/2019/02/Bruce-Final-small.jpg",
        img2url: "https://www.pawsbyzann.com/wp-content/uploads/2019/02/Bruce-Final-small.jpg",
        img3url: "https://www.pawsbyzann.com/wp-content/uploads/2019/02/Bruce-Final-small.jpg",
        label1: "A",
        label2: "B",
        label3: "C"
  };
  response.render("homepage", variables);
});

//leaderboard page
app.get("/leaderboard", (request, response) => {
  /*
    Chris TODO:
    *This router is used when showing the leaderboard table page 
     (access via "top winners" button)
    -retrieve all collection entries.
    -sort them by 'wins' in descending order.
    -generate a string of HTML to fill the variables field "tableEntries" below.
     It should be a sequence of <tr> table rows, each representing an entry.
     Fill each row with 3 cols: corresponding name, # of vote wins, and # of vote losses.
     You do not need to add the header or surrounding table (see templates/leaderboard.ejs).
     The top row should be the entry with the most wins; # of losses is irrelevent to the order.
     All existing entries should appear in the table.
     The variables obj is currently filled with "dummy" data so you can see the page render.
  */
  const variables = {
        tableEntries: "<tr><td>Col1</td><td>Col2</td><td>Col3</td></tr>"
  };
  response.render("leaderboard", variables);
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

