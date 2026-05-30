require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = (...args) => import("node-fetch").then(({default: fetch}) => fetch(...args));
const path = require("path");
const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, "main")));
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
console.log("ID:", CLIENT_ID, "SECRET:", CLIENT_SECRET);
const PORT = process.env.PORT || 3000;
app.get("/api/token", async (req, res) => {
  try {
    const credentials = Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64");
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + credentials,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    });
    const data = await response.json();
    if (!data.access_token) { return res.status(500).json({ error: "Failed" }); }
    res.json({ access_token: data.access_token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.listen(PORT, () => { console.log("Muzec server running at http://localhost:" + PORT); });
