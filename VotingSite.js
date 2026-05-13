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