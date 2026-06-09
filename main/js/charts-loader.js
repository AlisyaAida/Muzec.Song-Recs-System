// js/charts-loader.js
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const CACHE_KEY    = "muzec_charts_cache";
const CACHE_EXPIRY = "muzec_charts_expiry";

let currentUser = null;

onAuthStateChanged(auth, (user) => {
  if (!user) { window.location.href = "login.html"; return; }
  currentUser = user;
  loadTopChartsPage();
});

async function loadAllCharts() {
  const cached = sessionStorage.getItem(CACHE_KEY);
  const expiry = sessionStorage.getItem(CACHE_EXPIRY);
  if (cached && expiry && Date.now() < parseInt(expiry)) {
    return JSON.parse(cached);
  }
  try {
    const response = await fetch("http://localhost:3000/api/charts");
    const data     = await response.json();
    if (data.error) return null;
    sessionStorage.setItem(CACHE_KEY,    JSON.stringify(data));
    sessionStorage.setItem(CACHE_EXPIRY, Date.now() + (60 * 60 * 1000));
    return data;
  } catch (err) {
    console.error("Charts load error:", err);
    return null;
  }
}

async function loadTopChartsPage() {
  const allCharts = await loadAllCharts();

  const containers = {
    "Pop":       "pop-chart-container",
    "Rock":      "rock-chart-container",
    "Hip-Hop":   "hiphop-chart-container",
    "Jazz":      "jazz-chart-container",
    "Classical": "classical-chart-container",
    "K-Pop":     "kpop-chart-container",
    "R&B":       "rnb-chart-container",
    "Indie":     "indie-chart-container",
  };

  for (const [genre, containerId] of Object.entries(containers)) {
    const container = document.getElementById(containerId);
    if (!container) continue;

    if (!allCharts || !allCharts[genre]) {
      container.innerHTML = `<li class="list-group-item text-danger small text-center">Charts offline</li>`;
      continue;
    }

    // Show only top 3 on the overview page
    const songs = allCharts[genre].slice(0, 3);
    container.innerHTML = "";
    songs.forEach(song => {
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";
      li.innerHTML = `
        <div>
          <div class="fw-semibold text-dark small">${escapeHTML(song.name)}</div>
          <small class="text-muted">${escapeHTML(song.artist)}</small>
        </div>
        <button class="btn btn-sm btn-outline-danger fav-btn flex-shrink-0"
          data-name="${escapeHTML(song.name)}"
          data-artist="${escapeHTML(song.artist)}"
          title="Add to favorites">
          <i class="fas fa-heart"></i>
        </button>`;
      container.appendChild(li);
    });

    // Wire up favorite buttons for this container
    container.querySelectorAll(".fav-btn").forEach(btn => {
      btn.addEventListener("click", () => handleFavorite(btn));
    });
  }
}

async function handleFavorite(btn) {
  if (!currentUser) { alert("Please log in first."); return; }

  const name   = btn.dataset.name;
  const artist = btn.dataset.artist;

  btn.disabled = true;
  btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;

  try {
    const favsRef  = collection(db, "users", currentUser.uid, "favorites");
    const existing = await getDocs(query(favsRef, where("name", "==", name)));

    if (!existing.empty) {
      btn.innerHTML = `<i class="fas fa-heart"></i>`;
      btn.classList.replace("btn-outline-danger", "btn-danger");
      btn.disabled = false;
      btn.title    = "Already in favorites";
      return;
    }

    await addDoc(favsRef, {
      name, artist,
      albumArt:   "",
      spotifyUrl: "",
      addedAt:    serverTimestamp()
    });

    btn.innerHTML = `<i class="fas fa-heart"></i>`;
    btn.classList.replace("btn-outline-danger", "btn-danger");
    btn.title    = "Added!";
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