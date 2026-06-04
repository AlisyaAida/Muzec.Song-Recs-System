require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const fetch   = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const path    = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "main")));

const CLIENT_ID     = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PORT          = process.env.PORT || 3000;

console.log("ID:", CLIENT_ID, "SECRET:", CLIENT_SECRET);

// ── Spotify Token ─────────────────────────────────────────────────────────────
app.get("/api/token", async (req, res) => {
  try {
    const credentials = Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64");
    const response    = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + credentials,
        "Content-Type":  "application/x-www-form-urlencoded"
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



//Gemini Recommendation Promt
app.post("/api/recommend", async (req, res) => {
  const { mood, genre, language, songAge, allowExplicit, songHistory } = req.body;

  console.log("=== GEMINI DEBUG ===");
  console.log("Request body:", req.body);
  console.log("GEMINI_API_KEY exists:", !!GEMINI_API_KEY);

const randomSeed  = Math.floor(Math.random() * 10000);
const avoidList = songHistory && songHistory.length > 0
  ? `- Do NOT recommend any of these songs you already recommended:\n${songHistory.map(s => `  * "${s}"`).join("\n")}`
  : "";

  const prompt = `You are a music recommendation expert.

Recommend ONE real song based on these preferences:
- Mood: ${mood}
- Genre: ${genre}
- Language: ${language}
- Song Age: ${songAge}
- Explicit allowed: ${allowExplicit ? "Yes" : "No"}
- Variation seed: ${randomSeed}

Rules:
- The song MUST actually exist on Spotify
- Match the mood genuinely, not just by song title
- If language is "Malay", recommend a Malay song
- If language is "Korean", recommend a Korean song
- If language is "Japanese", recommend a Japanese song
- If explicit is No, only recommend clean songs
- If song age is "Up to 10 years", only songs from 2015 onwards
- If song age is "Up to 20 years", only songs from 2005 onwards
- If song age is "Up to 30 years", only songs from 1995 onwards
- Do NOT always recommend the most popular or well-known song
- Vary your recommendations — explore deeper cuts and hidden gems
${avoidList}

Respond ONLY in this exact JSON format, nothing else, no markdown:
{
  "name": "Song Name",
  "artist": "Artist Name",
  "reason": "One sentence why this fits the mood"
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents:         [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8 }
        })
      }
    );

    const data = await response.json();
    console.log("Gemini status:", response.status);
    console.log("Gemini raw response:", JSON.stringify(data, null, 2));

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log("Extracted text:", text);

    if (!text) {
      return res.status(500).json({ error: "No response from Gemini" });
    }

    const clean  = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    res.json(parsed);

  } catch (err) {
    console.error("Gemini error:", err);
    res.status(500).json({ error: "Gemini request failed" });
  }
});

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log("Muzec server running at http://localhost:" + PORT);
});