// js/recommend.js
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import {
  collection, addDoc, query, where, getDocs, orderBy, serverTimestamp, getDoc, doc
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getGeminiRecommendation, searchSpotifyForSong } from "./spotify-service.js";

document.addEventListener("DOMContentLoaded", function () {
  let currentUser  = null;
  let currentTrack = null;
  let songHistory  = [];

// REPLACE WITH this
onAuthStateChanged(auth, async (user) => {
  if (!user) { 
    window.location.href = "login.html"; 
    return;
  }
  currentUser = user;

  // Fetch name from Firestore
  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      const navUsername = document.getElementById("navUsername");
      if (navUsername) navUsername.textContent = data.firstName || user.email;
    }
  } catch (err) {
    console.error("Error fetching username:", err);
  }
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
  const anotherBtn      = document.getElementById("anotherBtn");
  const spinner   = document.getElementById("loadingSpinner");
  const songImage = document.getElementById("songImage");
  const songYear  = document.getElementById("songYear");
  const aiReason  = document.getElementById("aiReason");

  songTitle.textContent  = "Ready to discover?";
  artistName.textContent = "Select your preferences and press button above!";

async function getRecommendation() {
  const mood     = document.getElementById("mood").value;
  const genre    = document.getElementById("genre").value;
  const language = document.getElementById("language").value;
  const songAge  = document.getElementById("songAge").value;
  const explicit = document.querySelector(
    'input[name="appropriate"]:checked'
  ).value === "explicit";

  spinner.style.display = "block";
  recommendBtn.disabled = true;

  try {
    // Step 1 — Ask Gemini what song to recommend
    const aiSuggestion = await getGeminiRecommendation(
      mood, genre, language, songAge, explicit, songHistory
    );

    if (!aiSuggestion) {
      alert("Could not get AI recommendation. Try again.");
      return;
    }
  

    console.log("Gemini suggests:", aiSuggestion);
    await new Promise(resolve => setTimeout(resolve, 500));
    // Step 2 — Find that song on Spotify for metadata
    const track = await searchSpotifyForSong(
      aiSuggestion.name,
      aiSuggestion.artist
    );

    resetFavBtn();
    resetRating();
    

    // Step 3 — Display result
    if (track) {
      //Spotify metadata to show info
      document.getElementById("songName").textContent   = track.name;
      document.getElementById("artistName").textContent = track.artists[0].name;

    const img1        = document.getElementById("songImage");
    const spotifyLink = document.getElementById("spotifyLink");
    const placeholder = document.getElementById("albumPlaceholder");

    if (track.album.images?.[0]?.url) {
      img1.src                    = track.album.images[0].url;
      spotifyLink.href           = track.external_urls?.spotify || "#";
      spotifyLink.style.display  = "block";
      placeholder.style.display  = "none";
    }

      const songYearEl = document.getElementById("songYear");
      if (songYearEl) songYearEl.textContent = track.album.release_date?.substring(0, 4) || "";

      const img = document.getElementById("songImage");
      if (img && track.album.images?.[0]?.url) {
      img.src           = track.album.images[0].url;
      img.style.display = "block";
    }
    
      const spotifyBtn = document.getElementById("spotifyBtn");
      if (spotifyBtn) {
      spotifyBtn.href = track.external_urls?.spotify || "#";
    }

    //  document.getElementById("youtubeBtn").href =
      //  `https://www.youtube.com/results?search_query=${ytQuery}`;

      currentTrack = track;

      if (aiSuggestion?.name) {
        songHistory.push(aiSuggestion.name);
        if (songHistory.length > 5) songHistory.shift(); // keep only last 5
}

    } else {
      // Spotify couldn't find it — show AI text only
      document.getElementById("songName").textContent   = aiSuggestion.name;
      document.getElementById("artistName").textContent = aiSuggestion.artist;
    }

    const reasonEl = document.getElementById("aiReason");
    if (reasonEl) reasonEl.textContent = `"${aiSuggestion.reason}"`;

    

  } catch (err) {
    console.error("Recommendation error:", err);
    alert("Something went wrong. Make sure your server is running.");
  } finally {
    spinner.style.display = "none";
    recommendBtn.disabled = false;
  }
}

  if (recommendBtn) {
    recommendBtn.addEventListener("click", getRecommendation);
  }

  //ANOTHER
  if (anotherBtn) {
    anotherBtn.addEventListener("click", getRecommendation);
  }

  if (likeBtn)    likeBtn.addEventListener("click", toggleLike);
  if (dislikeBtn) dislikeBtn.addEventListener("click", toggleDislike);

  //FAVORITES
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

  // SUBMIT REVIEW
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
          username: await getUserFullName(currentUser.uid),
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

  //VIEW REVIEWS
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

  //HELPERS 
  function resetRating() {
    likeBtn.classList.remove("btn-success");
    likeBtn.classList.add("btn-outline-success");
    dislikeBtn.classList.remove("btn-danger");
    dislikeBtn.classList.add("btn-outline-danger");
  }

  function resetFavBtn() {
  if (!addToFavBtn) return;
  addToFavBtn.innerHTML = '<i class="fas fa-heart"></i> Favorites';
  addToFavBtn.classList.replace("btn-success", "btn-outline-danger");
  //reset spotify link and image if new recommendation is pressed
    const spotifyLink = document.getElementById("spotifyLink");
    const placeholder = document.getElementById("albumPlaceholder");
    if (spotifyLink) spotifyLink.style.display = "none";
    if (placeholder) placeholder.style.display = "block";
  }

  //Get full name from Firestore
async function getUserFullName(uid) {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return `${data.firstName} ${data.lastName}`.trim() || "Anonymous";
    }
  } catch (err) {
    console.error("Error fetching name:", err);
  }
  return "Anonymous";
}

  async function toggleLike() {
  if (!currentUser) { showToast("Please log in first.", "danger"); return; }
  if (!currentTrack) { showToast("Get a recommendation first!", "warning"); return; }

  const isActive = likeBtn.classList.contains("btn-success");

  // Reset both buttons visually
  resetRating();

  if (!isActive) {
    // Activate like button
    likeBtn.classList.replace("btn-outline-success", "btn-success");

    // Save to Firestore
    try {
      const songKey    = buildSongKey(
        songTitle.textContent, 
        artistName.textContent
      );
      const reviewsRef = collection(db, "reviews", songKey, "entries");

      // Remove any previous like/dislike from this user for this song
      await removePreviousReaction(reviewsRef, currentUser.uid);

      // Add new like
      await addDoc(reviewsRef, {
        type:       "like",
        songName:   songTitle.textContent,
        artistName: artistName.textContent,
        username: await getUserFullName(currentUser.uid),
        uid:        currentUser.uid,
        createdAt:  serverTimestamp()
      });

      showToast("👍 Liked!", "success");

    } catch (err) {
      console.error("Like error:", err);
      showToast("Failed to save. Try again.", "danger");
    }
  }
}

async function toggleDislike() {
  if (!currentUser) { showToast("Please log in first.", "danger"); return; }
  if (!currentTrack) { showToast("Get a recommendation first!", "warning"); return; }

  const isActive = dislikeBtn.classList.contains("btn-danger");

  resetRating();

  if (!isActive) {
    // Activate dislike button
    dislikeBtn.classList.replace("btn-outline-danger", "btn-danger");

    // Save to Firestore
    try {
      const songKey    = buildSongKey(
        songTitle.textContent,
        artistName.textContent
      );
      const reviewsRef = collection(db, "reviews", songKey, "entries");

      // Remove any previous like/dislike from this user
      await removePreviousReaction(reviewsRef, currentUser.uid);

      // Add new dislike
      await addDoc(reviewsRef, {
        type:       "dislike",
        songName:   songTitle.textContent,
        artistName: artistName.textContent,
        username:   await getUserFullName(currentUser.uid),
        uid:        currentUser.uid,
        createdAt:  serverTimestamp()
      });

      showToast("👎 Disliked!", "info");

    } catch (err) {
      console.error("Dislike error:", err);
      showToast("Failed to save. Try again.", "danger");
    }
  }
}

// ── Remove previous reaction from same user
async function removePreviousReaction(reviewsRef, uid) {
  const existing = await getDocs(
    query(reviewsRef, where("uid", "==", uid), where("type", "in", ["like", "dislike"]))
  );
  existing.forEach(async (docSnap) => {
    await deleteDoc(doc(db, reviewsRef.path, docSnap.id));
  });
}


  function buildSongKey(songName, artist) {
    return `${songName}__${artist}`.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 200);
  }


function renderReviewsModal(songName, artist, docs) {
  document.getElementById("reviewsModal")?.remove();

  // Separate likes, dislikes and reviews
  const likes    = docs.filter(d => d.data().type === "like");
  const dislikes = docs.filter(d => d.data().type === "dislike");
  const reviews  = docs.filter(d => d.data().type === "review" || !d.data().type);

  // Build likes/dislikes summary
  const reactionHTML = (likes.length > 0 || dislikes.length > 0) ? `
    <div class="mb-3 p-3 rounded border bg-light">
      <strong class="text-dark">
        <i class="fas fa-thumbs-up text-success mr-1"></i>${likes.length} Liked
        &nbsp;&nbsp;
        <i class="fas fa-thumbs-down text-danger mr-1"></i>${dislikes.length} Disliked
      </strong>
    </div>` : "";

  // Build individual reaction entries
  const reactionEntriesHTML = [...likes, ...dislikes].map(d => {
    const data = d.data();
    const date = data.createdAt?.toDate
      ? data.createdAt.toDate().toLocaleDateString("en-GB", {
          day: "numeric", month: "short", year: "numeric"
        })
      : "Just now";

    const icon   = data.type === "like"
      ? `<i class="fas fa-thumbs-up text-success mr-1"></i>`
      : `<i class="fas fa-thumbs-down text-danger mr-1"></i>`;

    const action = data.type === "like" ? "liked" : "disliked";

    return `
      <div class="mb-2 p-2 rounded border bg-light">
        <div class="d-flex justify-content-between align-items-center">
          <span class="text-dark">
            ${icon}
            <strong>${escapeHTML(data.username)}</strong> 
            ${action} this song
          </span>
          <small class="text-muted">${date}</small>
        </div>
      </div>`;
  }).join("");

  // Build review entries
  const reviewsHTML = reviews.length === 0
    ? `<p class="text-muted text-center py-2">No reviews yet. Be the first!</p>`
    : reviews.map(d => {
        const data = d.data();
        const date = data.createdAt?.toDate
          ? data.createdAt.toDate().toLocaleDateString("en-GB", {
              day: "numeric", month: "short", year: "numeric"
            })
          : "Just now";
        return `
          <div class="mb-3 p-3 rounded border bg-light">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <strong class="text-dark">
                <i class="fas fa-user-circle text-primary mr-1"></i>
                ${escapeHTML(data.username)}
              </strong>
              <small class="text-muted">${date}</small>
            </div>
            <p class="mb-0 text-dark">${escapeHTML(data.reviewText)}</p>
          </div>`;
      }).join("");

  const totalCount = docs.length;

  const modal = document.createElement("div");
  modal.id = "reviewsModal";
  modal.innerHTML = `
    <div class="modal fade" id="reviewsModalDialog" tabindex="-1" role="dialog" aria-hidden="true">
      <div class="modal-dialog modal-dialog-scrollable" role="document">
        <div class="modal-content">
          <div class="modal-header" 
               style="background: linear-gradient(90deg, #B379E3 50%, #6EE7F2 70%);">
            <h5 class="modal-title text-white">
              <i class="fas fa-comments mr-2"></i>
              Feedbacks — ${escapeHTML(songName)} by ${escapeHTML(artist)}
            </h5>
            <button type="button" class="close text-white" data-dismiss="modal">
              <span>&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <p class="text-muted small mb-3">
              <i class="fas fa-info-circle mr-1"></i>
              ${totalCount} feedback${totalCount !== 1 ? "s" : ""}
            </p>

            <!-- Likes/Dislikes Summary -->
            ${reactionHTML}

            <!-- Individual Reactions -->
            ${reactionEntriesHTML}

            <!-- Divider if both reactions and reviews exist -->
            ${reactionEntriesHTML && reviews.length > 0 
              ? `<hr><p class="text-muted small mb-2">
                   <i class="fas fa-comment mr-1"></i>Reviews
                 </p>` 
              : ""}

            <!-- Reviews -->
            ${reviewsHTML}
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" 
                    data-dismiss="modal">Close</button>
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