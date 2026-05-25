// js/charts-loader.js
import { fetchTopChartsByGenre } from "./spotify-service.js";

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
    populateChartCard("Pop", "pop-chart-container");
    populateChartCard("Rock", "rock-chart-container");
    populateChartCard("Hip-Hop", "hiphop-chart-container");
});