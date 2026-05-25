// js/recommend.js
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import {
  collection, addDoc, query, where, getDocs, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { fetchSpotifyRecommendations } from "./spotify-service.js";

document.addEventListener("DOMContentLoaded", function () {
  let currentUser  = null;
  let currentTrack = null;

  onAuthStateChanged(auth, (user) => {
    if (user) { currentUser = user; }
    else { window.location.href = "login.html"; }
  });

  const submitReviewBtn = document.getElementById("submitReviewBtn");
  const viewReviewsBtn  = document.getElementById("viewReviewsBtn");
  const reviewText      = document.getElementById("reviewText");
  const recommendBtn    = document.getElementById("recommendBtn");
  const songTitle       = document.getElementById("songName");
  const artistName      = document.getElementById("artistName");
  const likeBtn         = document.getElementById("likeBtn");
  const dislikeBtn      = document.getElementById("dislikeBtn");
  const addToFavBtn     = document.getElementById("favBtn");
  const youtubeBtn      = document.getElementById("youtubeBtn");
  const anotherBtn      = document.getElementById("anotherBtn");

  songTitle.textContent  = "Ready to discover?";
  artistName.textContent = "Select your preferences and press button above!";

  // ── RECOMMEND ───────────────────────────────────────────────────────────────
  if (recommendBtn) {
    recommendBtn.addEventListener("click", async function () {
      const chosenMood     = document.getElementById("mood").value;
      const chosenGenre    = document.getElementById("genre").value;
      const chosenSongAge  = document.getElementById("songAge").value;
      const allowExplicit  = document.getElementById("app2").checked;

      recommendBtn.disabled = true;
      recommendBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Analyzing Vibe...`;
      songTitle.textContent  = "Loading...";
      artistName.textContent = "";

      try {
        const track = await fetchSpotifyRecommendations(chosenGenre, chosenMood, chosenSongAge, allowExplicit);

        if (track) {
          currentTrack           = track;
          songTitle.textContent  = track.name;
          artistName.textContent = track.artists.map(a => a.name).join(', ');
          resetRating();

          // Reset fav button
          if (addToFavBtn) {
            addToFavBtn.innerHTML = '<i class="fas fa-heart"></i> Favorites';
            addToFavBtn.classList.replace("btn-success", "btn-outline-danger");
          }
        } else {
          songTitle.textContent  = "No song found.";
          artistName.textContent = "Try changing your genre or mood.";
        }
      } catch (err) {
        console.error(err);
        showToast("Failed to communicate with Spotify.", "danger");
      } finally {
        recommendBtn.disabled = false;
        recommendBtn.innerHTML = `<i class="fas fa-star"></i> Get Recommendation`;
      }
    });
  }

  // ── ANOTHER ─────────────────────────────────────────────────────────────────
  if (anotherBtn) {
    anotherBtn.addEventListener("click", function () {
      recommendBtn.click();
    });
  }

  // ── YOUTUBE ─────────────────────────────────────────────────────────────────
  if (youtubeBtn) {
    youtubeBtn.addEventListener("click", function (e) {
      e.preventDefault();
      if (!currentTrack) { showToast("Get a recommendation first!", "warning"); return; }
      const q = encodeURIComponent(`${currentTrack.name} ${currentTrack.artists[0].name} official`);
      window.open(`https://www.youtube.com/results?search_query=${q}`, "_blank");
    });
  }

  if (likeBtn)    likeBtn.addEventListener("click", toggleLike);
  if (dislikeBtn) dislikeBtn.addEventListener("click", toggleDislike);

  // ── FAVORITES ────────────────────────────────────────────────────────────────
  if (addToFavBtn) {
    addToFavBtn.addEventListener("click", async function () {
      if (!currentUser) { alert("You must be logged in."); return; }
      const name   = songTitle.textContent;
      const artist = artistName.textContent;
      if (!name || !artist || name === "Ready to discover?" || name === "No song found.") {
        alert("Get a recommendation first!"); return;
      }
      try {
        const favsRef  = collection(db, "users", currentUser.uid, "favorites");
        const existing = await getDocs(query(favsRef, where("name", "==", name)));
        if (!existing.empty) { alert(`"${name}" is already in your Favorites.`); return; }
        await addDoc(favsRef, {
          name, artist,
          albumArt:   currentTrack?.album?.images[0]?.url || "",
          spotifyUrl: currentTrack?.external_urls?.spotify || "",
          addedAt:    serverTimestamp()
        });
        addToFavBtn.innerHTML = '<i class="fas fa-heart"></i> Added!';
        addToFavBtn.classList.replace("btn-outline-danger", "btn-success");
        setTimeout(() => {
          addToFavBtn.innerHTML = '<i class="fas fa-heart"></i> Favorites';
          addToFavBtn.classList.replace("btn-success", "btn-outline-danger");
        }, 2000);
      } catch (err) {
        console.error("Error adding to favorites:", err);
        alert("Something went wrong. Try again.");
      }
    });
  }

  // ── SUBMIT REVIEW ────────────────────────────────────────────────────────────
  if (submitReviewBtn) {
    submitReviewBtn.addEventListener("click", async function () {
      if (!currentUser) { showToast("Please log in to submit a review.", "danger"); return; }
      const name   = songTitle.textContent.trim();
      const artist = artistName.textContent.trim();
      if (!name || !artist || name === "Ready to discover?") { showToast("Get a recommendation first!", "warning"); return; }
      const text = reviewText.value.trim();
      if (!text) { showToast("Please write something before submitting.", "warning"); return; }
      submitReviewBtn.disabled = true;
      submitReviewBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Submitting...`;
      try {
        const songKey    = buildSongKey(name, artist);
        const reviewsRef = collection(db, "reviews", songKey, "entries");
        await addDoc(reviewsRef, {
          songName: name, artistName: artist, reviewText: text,
          username: currentUser.displayName || currentUser.email || "Anonymous",
          uid: currentUser.uid, createdAt: serverTimestamp()
        });
        reviewText.value = "";
        showToast("Review submitted! 🎵", "success");
      } catch (err) {
        console.error("Error submitting review:", err);
        showToast("Failed to submit review. Please try again.", "danger");
      } finally {
        submitReviewBtn.disabled = false;
        submitReviewBtn.innerHTML = `<i class="fas fa-paper-plane"></i> Submit Review`;
      }
    });
  }

  // ── VIEW REVIEWS ─────────────────────────────────────────────────────────────
  if (viewReviewsBtn) {
    viewReviewsBtn.addEventListener("click", async function () {
      const name   = songTitle.textContent.trim();
      const artist = artistName.textContent.trim();
      if (!name || !artist || name === "Ready to discover?") { showToast("Get a recommendation first!", "warning"); return; }
      viewReviewsBtn.disabled = true;
      viewReviewsBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Loading...`;
      try {
        const songKey    = buildSongKey(name, artist);
        const reviewsRef = collection(db, "reviews", songKey, "entries");
        const snapshot   = await getDocs(query(reviewsRef, orderBy("createdAt", "desc")));
        renderReviewsModal(name, artist, snapshot.docs);
      } catch (err) {
        console.error("Error fetching reviews:", err);
        showToast("Failed to load reviews. Please try again.", "danger");
      } finally {
        viewReviewsBtn.disabled = false;
        viewReviewsBtn.innerHTML = `<i class="fas fa-cloud"></i> View other feedbacks`;
      }
    });
  }

  // ── HELPERS ───────────────────────────────────────────────────────────────────
  function resetRating() {
    likeBtn.classList.remove("btn-success");
    likeBtn.classList.add("btn-outline-success");
    dislikeBtn.classList.remove("btn-danger");
    dislikeBtn.classList.add("btn-outline-danger");
  }
  function toggleLike() {
    if (likeBtn.classList.contains("btn-success")) { resetRating(); return; }
    resetRating(); likeBtn.classList.replace("btn-outline-success", "btn-success");
  }
  function toggleDislike() {
    if (dislikeBtn.classList.contains("btn-danger")) { resetRating(); return; }
    resetRating(); dislikeBtn.classList.replace("btn-outline-danger", "btn-danger");
  }
  function buildSongKey(songName, artist) {
    return `${songName}__${artist}`.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 200);
  }
  function renderReviewsModal(songName, artist, docs) {
    document.getElementById("reviewsModal")?.remove();
    const reviewsHTML = docs.length === 0
      ? `<p class="text-muted text-center py-3">No reviews yet. Be the first!</p>`
      : docs.map(d => {
          const data = d.data();
          const date = data.createdAt?.toDate
            ? data.createdAt.toDate().toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })
            : "Just now";
          return `<div class="mb-3 p-3 rounded border bg-light">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <strong class="text-dark"><i class="fas fa-user-circle text-primary mr-1"></i>${escapeHTML(data.username)}</strong>
              <small class="text-muted">${date}</small>
            </div>
            <p class="mb-0 text-dark">${escapeHTML(data.reviewText)}</p>
          </div>`;
        }).join("");
    const modal = document.createElement("div");
    modal.id = "reviewsModal";
    modal.innerHTML = `
      <div class="modal fade" id="reviewsModalDialog" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog modal-dialog-scrollable" role="document">
          <div class="modal-content">
            <div class="modal-header" style="background: linear-gradient(90deg, #B379E3 50%, #6EE7F2 70%);">
              <h5 class="modal-title text-white"><i class="fas fa-comments mr-2"></i>Reviews — ${escapeHTML(songName)} by ${escapeHTML(artist)}</h5>
              <button type="button" class="close text-white" data-dismiss="modal"><span>&times;</span></button>
            </div>
            <div class="modal-body">
              <p class="text-muted small mb-3"><i class="fas fa-info-circle mr-1"></i>${docs.length} review${docs.length !== 1 ? "s" : ""}</p>
              ${reviewsHTML}
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);
    $("#reviewsModalDialog").modal("show");
    $("#reviewsModalDialog").on("hidden.bs.modal", () => modal.remove());
  }
  function escapeHTML(str) {
    return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }
  function showToast(message, type = "info") {
    document.getElementById("muzecToast")?.remove();
    const colours = { success:"#28a745", danger:"#dc3545", warning:"#ffc107", info:"#17a2b8" };
    const toast = document.createElement("div");
    toast.id = "muzecToast";
    toast.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;background:${colours[type]||colours.info};color:white;padding:12px 20px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.2);font-size:14px;max-width:320px;`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }
});