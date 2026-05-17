import { auth, db } from "./js/firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import {
  collection, getDocs, deleteDoc, doc, orderBy, query
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", function () {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    await loadFavorites(user.uid);
  });
});

async function loadFavorites(userId) {
  const container = document.getElementById("favoritesContainer");
  const favsRef   = collection(db, "users", userId, "favorites");
  const snapshot  = await getDocs(query(favsRef, orderBy("addedAt", "desc")));

  if (snapshot.empty) {
    container.innerHTML = `
      <div class="text-center text-muted py-5">
        <i class="bi bi-heart display-3"></i>
        <p class="mt-3">No favorites yet. Go get some recommendations!</p>
      </div>`;
    return;
  }

  snapshot.forEach((docSnap) => {
    const song = docSnap.data();
    const id   = docSnap.id;

    container.innerHTML += `
      <div class="card mb-3 shadow-sm" id="fav-${id}">
        <div class="card-body d-flex justify-content-between align-items-center">
          <div>
            <h5 class="mb-0">${song.name}</h5>
            <p class="text-muted mb-0 small">${song.artist}</p>
          </div>
          <button class="btn btn-outline-danger btn-sm"
            onclick="removeFavorite('${userId}', '${id}')">
            <i class="bi bi-trash"></i> Remove
          </button>
        </div>
      </div>`;
  });
}

window.removeFavorite = async function (userId, docId) {
  await deleteDoc(doc(db, "users", userId, "favorites", docId));
  document.getElementById(`fav-${docId}`).remove();
};