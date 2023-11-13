const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Database connected");
  })
  .catch((error) => {
    console.log("Error connecting to MongoDB:", error.message);
  });

const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String, required: true },
  count: { type: Number },
  log: [
    {
      description: { type: String, required: true },
      duration: { type: Number, required: true },
      date: { type: Date },
    },
  ],
});

const exerciseSchema = new Schema({
  username: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, required: true },
});

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.use(cors());
app.use(express.static("public"));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", async (req, res) => {
  const username = req.body.username;
  const newUser = new User({ username });
  try {
    const savedUser = await newUser.save();
    res.json({ username: savedUser.username, _id: savedUser._id });
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    let users = await User.find({});
    users = users.map((user) => ({
      username: user.username,
      _id: user._id,
    }));
    res.json(users);
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const { _id } = req.params;
  let date = req.body.date ? new Date(req.body.date) : new Date();

  try {
    let user = await User.findById({ _id });
    const newExercise = new Exercise({
      username: user.username,
      description: req.body.description,
      duration: req.body.duration,
      date,
    });
    const savedExercise = await newExercise.save();

    res.json({
      _id: user._id,
      username: user.username,
      date: savedExercise.date.toDateString(),
      duration: savedExercise.duration,
      description: savedExercise.description,
    });
  } catch (e) {
    res.json({ error: e.message });
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  try {
    const user = await User.findById({ _id });
    const logsByUser = await Exercise.find({
      username: user.username,
      date: {
        $gte: from ? new Date(from) : new Date(0),
        $lte: to ? new Date(to) : new Date(),
      },
    }).limit(limit ? Number(limit) : 0);
    res.json({
      _id: user._id,
      username: user.username,
      count: logsByUser.length,
      log: logsByUser.map((log) => ({
        description: log.description,
        duration: log.duration,
        date: log.date.toDateString(),
      })),
    });
  } catch (e) {
    res.json({ error: e.message });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
