import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import {
  collection, getDocs, deleteDoc, doc, orderBy, query
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", function () {
  onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.href = "login.html"; return; }
    await loadFavorites(user.uid);
  });
});

// ── LOAD FAVORITES ────────────────────────────────────────────────────────────

async function loadFavorites(userId) {
  const list       = document.getElementById("favoritesList");
  const emptyState = document.getElementById("emptyState");
  list.innerHTML   = "";

  try {
    const favsRef  = collection(db, "users", userId, "favorites");
    const snapshot = await getDocs(query(favsRef, orderBy("addedAt", "desc")));

    if (snapshot.empty) {
      list.closest(".card").classList.add("d-none");
      emptyState.classList.remove("d-none");
      return;
    }

    list.closest(".card").classList.remove("d-none");
    emptyState.classList.add("d-none");

    snapshot.forEach((docSnap) => {
      const song = docSnap.data();
      const id   = docSnap.id;
      list.appendChild(buildFavCard(userId, id, song));
    });

  } catch (err) {
    console.error("Error loading favorites:", err);
    list.innerHTML = `<li class="list-group-item text-danger">Failed to load favorites. Please refresh.</li>`;
  }
}

// ── BUILD CARD ────────────────────────────────────────────────────────────────

function buildFavCard(userId, docId, song) {
  const li = document.createElement("li");
  li.className = "list-group-item px-3 py-3";
  li.id = `fav-${docId}`;

  const albumArt = song.albumArt
    ? `<img src="${song.albumArt}" alt="Album art"
          class="rounded mr-3 flex-shrink-0"
          style="width:56px;height:56px;object-fit:cover;"
          onerror="this.style.display='none'">`
    : `<div class="rounded mr-3 flex-shrink-0 d-flex align-items-center justify-content-center bg-light"
            style="width:56px;height:56px;">
         <i class="fas fa-music text-muted"></i>
       </div>`;

  const spotifyBtn = song.spotifyUrl
    ? `<a href="${song.spotifyUrl}" target="_blank"
          class="btn btn-sm btn-outline-success mr-2">
         <i class="fab fa-spotify"></i> Spotify
       </a>`
    : "";

  li.innerHTML = `
    <div class="d-flex align-items-center">
      ${albumArt}
      <div class="flex-grow-1 min-width-0">
        <h6 class="mb-0 text-truncate font-weight-bold">${escapeHTML(song.name)}</h6>
        <small class="text-muted text-truncate d-block">${escapeHTML(song.artist)}</small>
      </div>
      <div class="d-flex align-items-center ml-3 flex-shrink-0">
        ${spotifyBtn}
        <button class="btn btn-sm btn-outline-danger" id="remove-${docId}">
          <i class="fas fa-trash"></i> Remove
        </button>
      </div>
    </div>`;

  li.querySelector(`#remove-${docId}`)
    .addEventListener("click", () => removeFavorite(userId, docId));

  return li;
}

// ── REMOVE FAVORITE ───────────────────────────────────────────────────────────

async function removeFavorite(userId, docId) {
  const el  = document.getElementById(`fav-${docId}`);
  const btn = document.getElementById(`remove-${docId}`);

  btn.disabled = true;
  btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;

  try {
    await deleteDoc(doc(db, "users", userId, "favorites", docId));
    el.style.transition = "opacity 0.3s";
    el.style.opacity    = "0";
    setTimeout(() => {
      el.remove();
      const list = document.getElementById("favoritesList");
      if (!list.children.length) {
        list.closest(".card").classList.add("d-none");
        document.getElementById("emptyState").classList.remove("d-none");
      }
    }, 300);
  } catch (err) {
    console.error("Error removing favorite:", err);
    btn.disabled = false;
    btn.innerHTML = `<i class="fas fa-trash"></i> Remove`;
  }
}

// ── UTILITY ───────────────────────────────────────────────────────────────────

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
