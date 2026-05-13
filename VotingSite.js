"use strict";

const fs = require('fs');
const ejs = require('ejs');
const path = require("path");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
process.stdin.setEncoding("utf8");
require("dotenv").config({
   path: path.resolve(__dirname, "./.env"),
});
const { MongoClient, ServerApiVersion } = require("mongodb");

const port = 8000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

app.get("/", (request, response) => {
  response.render("index");
});

app.get("/leaderboard", (request, response) => {
  response.render("leaderboard");
});

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:false}));
/* Directory where templates will reside */
app.set("views", path.resolve(__dirname, "templates"));

