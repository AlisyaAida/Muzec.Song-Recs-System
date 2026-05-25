// js/spotify-service.js

// ── GET TOKEN from local server (browser cannot call Spotify token endpoint directly) ──
export async function getSpotifyToken() {
    const token  = sessionStorage.getItem('spotify_token');
    const expiry = sessionStorage.getItem('spotify_expiry');
    if (token && expiry && Date.now() < parseInt(expiry)) return token;

    try {
        const response = await fetch('http://localhost:3000/api/token');
        const data = await response.json();
        if (!data.access_token) { console.error('Token error:', data); return null; }
        sessionStorage.setItem('spotify_token',  data.access_token);
        sessionStorage.setItem('spotify_expiry', Date.now() + (55 * 60 * 1000));
        return data.access_token;
    } catch (err) {
        console.error('Auth error:', err);
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

// ── RECOMMENDATIONS (uses Search API — Recommendations API is deprecated) ─────
export async function fetchSpotifyRecommendations(genre, mood, songAge, allowExplicit) {
    const token = await getSpotifyToken();
    if (!token) return null;

    const genreWord = genre === 'Any'
        ? RANDOM_GENRES[Math.floor(Math.random() * RANDOM_GENRES.length)]
        : (GENRE_MAP[genre] || 'pop');

    const moodWord = MOOD_MAP[mood] || 'popular';
    const q        = encodeURIComponent(`${genreWord} ${moodWord}`);

    try {
        const response = await fetch(
            `https://api.spotify.com/v1/search?q=${q}&type=track&limit=10`,
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (!response.ok) { console.error('Search error:', await response.text()); return null; }

        const data = await response.json();
        let tracks = data.tracks?.items || [];
        if (tracks.length === 0) return null;

        // Filter by song age
        if (songAge && !songAge.includes('Any')) {
            const minYear  = new Date().getFullYear() - (parseInt(songAge) || 10);
            const filtered = tracks.filter(t => parseInt(t.album.release_date?.substring(0,4)||0) >= minYear);
            if (filtered.length > 0) tracks = filtered;
        }

        // Filter explicit
        if (!allowExplicit) {
            const filtered = tracks.filter(t => !t.explicit);
            if (filtered.length > 0) tracks = filtered;
        }

        // Return single random track from top 10
        return tracks[Math.floor(Math.random() * Math.min(tracks.length, 10))];

    } catch (err) {
        console.error('Recommendation error:', err);
        return null;
    }
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