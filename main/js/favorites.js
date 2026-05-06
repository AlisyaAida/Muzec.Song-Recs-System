//temporary favorites logic for presentation and demo

document.addEventListener("DOMContentLoaded", function () {
    const container = document.getElementById("favoritesList");

    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

    function renderFavorites() {
        container.innerHTML = "";

        if (favorites.length === 0) {
            container.innerHTML = "<p class='text-center p-3'>No favorite songs yet.</p>";
            return;
        }

        favorites.forEach((fav, index) => {
            const songCard = `
                <li class="list-group-item d-flex justify-content-between align-items-center p-3">
                    <div>
                        <div class="fw-semibold text-dark">${fav.song}</div>
                        <small class="text-muted">${fav.artist}</small>
                    </div>
                    <button class="btn btn-sm btn-outline-danger remove-btn" data-index="${index}">
                        Remove
                    </button>
                </li>
            `;
            container.innerHTML += songCard;
        });

        // Attach remove button events
        const removeButtons = document.querySelectorAll(".remove-btn");

        removeButtons.forEach(button => {
            button.addEventListener("click", function () {
                const index = this.getAttribute("data-index");
                removeFavorite(index);
            });
        });
    }

    function removeFavorite(index) {
        favorites.splice(index, 1); // remove from array
        localStorage.setItem("favorites", JSON.stringify(favorites)); // update storage
        renderFavorites(); // re-render UI
    }

    renderFavorites();
});