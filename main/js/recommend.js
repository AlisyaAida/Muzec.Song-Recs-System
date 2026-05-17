import { auth, db } from "./js/firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import {
  collection, addDoc, query, where,
  getDocs, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", function () {
  let currentUser = null;

  // Track who's logged in
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
    } else {
      // Redirect to login if not authenticated
      window.location.href = "login.html";
    }
  });

  const recommendBtn = document.getElementById("recommendBtn");
  const songTitle    = document.getElementById("songName");
  const artistName   = document.getElementById("artistName");
  const likeBtn      = document.getElementById("likeBtn");
  const dislikeBtn   = document.getElementById("dislikeBtn");
  const addToFavBtn  = document.getElementById("addToFavBtn");

  songTitle.textContent = "";
  artistName.textContent = "";

  if (recommendBtn) {
    recommendBtn.addEventListener("click", function (e) {
      e.preventDefault();
      showSampleSong();
      resetRating();
    });
  }

  if (likeBtn) likeBtn.addEventListener("click", toggleLike);
  if (dislikeBtn) dislikeBtn.addEventListener("click", toggleDislike);

  //Add to Favorites
  if (addToFavBtn) {
    addToFavBtn.addEventListener("click", async function () {
      if (!currentUser) {
        alert("You must be logged in.");
        return;
      }

      const name   = songTitle.textContent;
      const artist = artistName.textContent;

      if (!name || !artist) {
        alert("Get a recommendation first!");
        return;
      }

      try {
        const favsRef = collection(db, "users", currentUser.uid, "favorites");

        // Check for duplicates
        const existing = await getDocs(query(favsRef, where("name", "==", name)));
        if (!existing.empty) {
          alert(`"${name}" is already in your Favorites.`);
          return;
        }

        // Save to Firestore
        await addDoc(favsRef, {
          name,
          artist,
          addedAt: serverTimestamp()
        });

        // Visual feedback
        addToFavBtn.innerHTML = '<i class="bi bi-heart-fill"></i> Added!';
        addToFavBtn.classList.replace("btn-primary", "btn-success");
        setTimeout(() => {
          addToFavBtn.innerHTML = '<i class="bi bi-heart-fill"></i> Add to Favorites';
          addToFavBtn.classList.replace("btn-success", "btn-primary");
        }, 2000);

      } catch (err) {
        console.error("Error adding to favorites:", err);
        alert("Something went wrong. Try again.");
      }
    });
  }

  //Helpers
  function showSampleSong() {
    songTitle.textContent  = "Bad";
    artistName.textContent = "Michael Jackson";

    addToFavBtn.innerHTML = '<i class="bi bi-heart-fill"></i> Add to Favorites';
    addToFavBtn.classList.replace("btn-success", "btn-primary");
  }

  function resetRating() {
    likeBtn.classList.remove("btn-success");
    likeBtn.classList.add("btn-outline-success");
    dislikeBtn.classList.remove("btn-danger");
    dislikeBtn.classList.add("btn-outline-danger");
  }

  function toggleLike() {
    if (likeBtn.classList.contains("btn-success")) { resetRating(); return; }
    resetRating();
    likeBtn.classList.replace("btn-outline-success", "btn-success");
  }

  function toggleDislike() {
    if (dislikeBtn.classList.contains("btn-danger")) { resetRating(); return; }
    resetRating();
    dislikeBtn.classList.replace("btn-outline-danger", "btn-danger");
  }
});