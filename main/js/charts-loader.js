// js/charts-loader.js
import { fetchTopChartsByGenre } from "./spotify-service.js";
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { doc, getDoc }
  from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

async function populateChartCard(genreName, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const tracks = await fetchTopChartsByGenre(genreName);

    if (!tracks || tracks.length === 0) {
        container.innerHTML = `<li class="list-group-item text-danger small text-center">Charts offline</li>`;
        return;
    }

    container.innerHTML = ""; // Clear loader spinner

    tracks.forEach(track => {
        const itemRow = document.createElement("li");
        itemRow.className = "list-group-item d-flex justify-content-between align-items-start";
        itemRow.innerHTML = `
            <div class="ms-2 me-auto">
              <div class="fw-semibold text-dark">${track.name}</div>
              <small class="text-muted">${track.artists.map(a => a.name).join(", ")}</small>
            </div>
            <button class="btn btn-sm btn-outline-danger" title="Add to favorites"><i class="fas fa-heart"></i></button>
        `;
        container.appendChild(itemRow);
    });
}

document.addEventListener("DOMContentLoaded", () => {

  onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.href = "login.html"; return; }

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const navUsername = document.getElementById("navUsername");
        if (navUsername) navUsername.textContent = userDoc.data().firstName || user.email;
      }
    } catch (err) {
      console.error("Navbar error:", err);
    }
  });

    populateChartCard("Pop", "pop-chart-container");
    populateChartCard("Rock", "rock-chart-container");
    populateChartCard("Hip-Hop", "hiphop-chart-container");
    populateChartCard("Jazz", "jazz-chart-container");
    populateChartCard("Classical", "classical-chart-container");
    populateChartCard("K-Pop", "kpop-chart-container");
    populateChartCard("R&B", "rnb-chart-container");
    populateChartCard("Indie", "indie-chart-container");
});