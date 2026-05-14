"use strict";

const path = require("path");
const mongoose = require("mongoose");

require("dotenv").config({
  path: path.resolve(__dirname, "./.env"),
});

const boardSchema = new mongoose.Schema({
  name: String,
  wins: Number,
  losses: Number
});

const Board = mongoose.model("Board", boardSchema);

async function resetBoard() {
  try {
    await mongoose.connect(process.env.MONGO_CONNECTION_STRING);

    const result = await Board.updateMany(
      {},
      {
        $set: {
          wins: 0,
          losses: 0
        }
      }
    );

    console.log("Reset complete.");
    console.log("Modified documents:", result.modifiedCount);

    await mongoose.disconnect();

  } catch (err) {
    console.error("Reset failed:", err);
    process.exit(1);
  }
}

resetBoard();