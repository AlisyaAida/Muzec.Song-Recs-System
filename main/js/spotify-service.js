// js/spotify-service.js

// ── GET TOKEN from local server (browser cannot call Spotify token endpoint directly) ──
export async function getSpotifyToken() {
  const token  = sessionStorage.getItem("spotify_token");
  const expiry = sessionStorage.getItem("spotify_expiry");

  // Reuse existing token if still valid
  if (token && expiry && Date.now() < parseInt(expiry)) {
    return token; // ← returns cached token, no new request
  }

  try {
    const response = await fetch("http://localhost:3000/api/token");
    const data     = await response.json();
    if (!data.access_token) return null;

    // Cache for 55 minutes
    sessionStorage.setItem("spotify_token",  data.access_token);
    sessionStorage.setItem("spotify_expiry", Date.now() + (55 * 60 * 1000));
    return data.access_token;

  } catch (err) {
    console.error("Auth error:", err);
    return null;
  }
}

// ── GENRE + MOOD MAPS ─────────────────────────────────────────────────────────
const GENRE_MAP = {
    'Any': 'pop', 'Pop': 'pop', 'Rock': 'rock', 'Hip-Hop': 'hiphop',
    'Jazz': 'jazz', 'Classical': 'classical', 'K-Pop': 'kpop',
    'R&B': 'rnb', 'Indie': 'indie'
};
const RANDOM_GENRES = ['pop','rock','hiphop','jazz','classical','kpop','rnb','indie'];
const MOOD_MAP = {
    'Happy':   'happy upbeat',
    'Neutral': 'popular',
    'Sad':     'sad emotional'
};

// Ask Gemini for a song recommendation
export async function getGeminiRecommendation(mood, genre, language, songAge, allowExplicit, songHistory=[]) {
  try {
    const response = await fetch("http://localhost:3000/api/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mood, genre, language, songAge, allowExplicit, songHistory })
    });

    const data = await response.json();
    if (data.error) { console.error("Gemini error:", data.error); return null; }
    return data; // { name, artist, reason }

  } catch (err) {
    console.error("Recommendation fetch error:", err);
    return null;
  }
}

// Search Spotify for the exact song Gemini suggested
export async function searchSpotifyForSong(songName, artistName) {
  const token = await getSpotifyToken();
  if (!token) return null;

  const query = encodeURIComponent(`track:${songName} artist:${artistName}`);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1&market=MY`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ── Handle rate limit ──────────────────────────────
      if (response.status === 429) {

        // READ the Retry-After header Spotify sends
        const retryAfter = response.headers.get("Retry-After");

        // Convert to milliseconds (header value is in seconds)
        const waitMs = retryAfter 
          ? parseInt(retryAfter) * 1000   // use Spotify's exact value
          : attempt * 2000;               // fallback: 2s, 4s, 6s

        console.warn(`Rate limited. Spotify says wait ${retryAfter || "unknown"}s. Waiting ${waitMs/1000}s (attempt ${attempt}/3)`);

        // Wait exactly as long as Spotify says
        await new Promise(resolve => setTimeout(resolve, waitMs));
        continue; // retry after waiting
      }
      // ──────────────────────────────────────────────────

      if (!response.ok) {
        console.error("Spotify search failed:", response.status);
        return null;
      }

      const data   = await response.json();
      const tracks = data.tracks?.items || [];
      return tracks[0] || null;

    } catch (err) {
      console.error(`Attempt ${attempt} failed:`, err.message);
      if (attempt === 3) return null;
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }

  return null;
}

// ── TOP CHARTS (keep your existing working version) ───────────────────────────
export async function fetchTopChartsByGenre(genre) {
    const token = await getSpotifyToken();
    if (!token) return [];

    const cleanGenre = genre.toLowerCase();
    const query = encodeURIComponent(`genre:"${cleanGenre}"`);
    const url = `https://api.spotify.com/v1/search?q=${query}&type=track&market=MY&limit=3`;

    try {
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) return [];
        const data = await response.json();
        return data.tracks?.items || [];
    } catch (error) {
        console.error(`Error loading top charts for ${genre}:`, error);
        return [];
    }
}