// js/charts.js
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { collection, addDoc, getDocs, query, where, serverTimestamp, getDoc, doc  } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { searchSpotifyForSong } from "./spotify-service.js";

//Session cache key
const CACHE_KEY    = "muzec_charts_cache";
const CACHE_EXPIRY = "muzec_charts_expiry";

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = "login.html"; return; }
  
  currentUser = user; 

  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const navUsername = document.getElementById("navUsername");
      if (navUsername) {
        navUsername.textContent = userDoc.data().firstName || user.email;
      }
    }
  } catch (err) {
    console.error("Navbar error:", err);
  }
});

//Load charts from server (cached per session)
async function loadAllCharts() {
  // Check session cache first
  const cached  = sessionStorage.getItem(CACHE_KEY);
  const expiry  = sessionStorage.getItem(CACHE_EXPIRY);
  if (cached && expiry && Date.now() < parseInt(expiry)) {
    return JSON.parse(cached);
  }

  try {
    const response = await fetch("http://localhost:3000/api/charts");
    const data     = await response.json();
    if (data.error) return null;

    // Cache for 1 hour
    sessionStorage.setItem(CACHE_KEY,    JSON.stringify(data));
    sessionStorage.setItem(CACHE_EXPIRY, Date.now() + (60 * 60 * 1000));
    return data;
  } catch (err) {
    console.error("Charts load error:", err);
    return null;
  }
}

//Populate table for the current genre page
export async function populateGenreChart(genre) {
  const tbody = document.getElementById("chartTableBody");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="5" class="text-center py-4">
        <i class="fas fa-spinner fa-spin mr-2"></i> Loading charts...
      </td>
    </tr>`;

  const allCharts = await loadAllCharts();
  if (!allCharts || !allCharts[genre]) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Failed to load charts.</td></tr>`;
    return;
  }

  const songs  = allCharts[genre];
  const tracks = await Promise.all(songs.map(s => searchSpotifyForSong(s.name, s.artist)));

  tbody.innerHTML = "";

  songs.forEach((song, i) => {
    const track     = tracks[i];
    const albumName = track?.album?.name || "—";
    const albumArt  = track?.album?.images?.[0]?.url || "";
    const spotifyUrl = track?.external_urls?.spotify || "";
    const trackId   = track?.id || "";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-center font-weight-bold">${i + 1}</td>
      <td>
        <div class="d-flex align-items-center">
          ${albumArt ? `<img src="${albumArt}" alt="art" class="rounded mr-2 flex-shrink-0" style="width:40px;height:40px;object-fit:cover;">` : ""}
          <span>${escapeHTML(song.name)}</span>
        </div>
      </td>
      <td>${escapeHTML(song.artist)}</td>
      <td>${escapeHTML(albumName)}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-outline-danger fav-btn" 
          data-name="${escapeHTML(song.name)}" 
          data-artist="${escapeHTML(song.artist)}"
          data-album-art="${albumArt}"
          data-spotify="${spotifyUrl}"
          title="Add to favorites">
          <i class="fas fa-heart"></i>
        </button>
      </td>`;
    tbody.appendChild(tr);
  });

  // Wire up favorite buttons after rows are rendered
  document.querySelectorAll(".fav-btn").forEach(btn => {
    btn.addEventListener("click", () => handleFavorite(btn));
  });
}

// ── Add to Favorites ──────────────────────────────────────────────────────────
async function handleFavorite(btn) {
  if (!currentUser) { alert("Please log in first."); return; }

  const name       = btn.dataset.name;
  const artist     = btn.dataset.artist;
  const albumArt   = btn.dataset.albumArt;
  const spotifyUrl = btn.dataset.spotify;

  btn.disabled = true;
  btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;

  try {
    const favsRef  = collection(db, "users", currentUser.uid, "favorites");
    const existing = await getDocs(query(favsRef, where("name", "==", name)));

    if (!existing.empty) {
      btn.innerHTML = `<i class="fas fa-heart"></i>`;
      btn.classList.replace("btn-outline-danger", "btn-danger");
      btn.disabled  = false;
      btn.title     = "Already in favorites";
      return;
    }

    await addDoc(favsRef, { name, artist, albumArt, spotifyUrl, addedAt: serverTimestamp() });

    btn.innerHTML = `<i class="fas fa-heart"></i>`;
    btn.classList.replace("btn-outline-danger", "btn-danger");
    btn.title    = "Added to favorites!";
    btn.disabled = false;

  } catch (err) {
    console.error("Favorite error:", err);
    btn.innerHTML = `<i class="fas fa-heart"></i>`;
    btn.disabled  = false;
  }
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}