// Wait until DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {

    const recommendBtn = document.getElementById("recommendBtn");
    const songTitle = document.getElementById("songName");
    const artistName = document.getElementById("artistName");

    const likeBtn = document.getElementById("likeBtn");
    const dislikeBtn = document.getElementById("dislikeBtn");

    songTitle.textContent = "";
    artistName.textContent = "";

    // Recommend button
    if (recommendBtn) {
        recommendBtn.addEventListener("click", function (event) {
            event.preventDefault();

            showSampleSong();
            resetRating(); // reset like/dislike when new song appears
        });
    }

    // Like button
    if (likeBtn) {
        likeBtn.addEventListener("click", function () {
            toggleLike();
        });
    }

    // Dislike button
    if (dislikeBtn) {
        dislikeBtn.addEventListener("click", function () {
            toggleDislike();
        });
    }

    function showSampleSong() {
        const sampleSong = {
            name: "Bad",
            artist: "Michael Jackson"
        };

        songTitle.textContent = sampleSong.name;
        artistName.textContent = sampleSong.artist;
    }

    function resetRating() {
        likeBtn.classList.remove("btn-success");
        likeBtn.classList.add("btn-outline-success");

        dislikeBtn.classList.remove("btn-danger");
        dislikeBtn.classList.add("btn-outline-danger");
    }

  function toggleLike() {
    const isActive = likeBtn.classList.contains("btn-success");

    if (isActive) {
        // If already liked → reset (turn off)
        resetRating();
    } else {
        // Otherwise → activate like and deactivate dislike
        resetRating();
        likeBtn.classList.remove("btn-outline-success");
        likeBtn.classList.add("btn-success");
    }
}

function toggleDislike() {
    const isActive = dislikeBtn.classList.contains("btn-danger");

    if (isActive) {
        // If already disliked → reset (turn off)
        resetRating();
    } else {
        // Otherwise → activate dislike and deactivate like
        resetRating();
        dislikeBtn.classList.remove("btn-outline-danger");
        dislikeBtn.classList.add("btn-danger");
    }
}

//temporary favorite button
const favBtn = document.getElementById("favBtn");

if (favBtn) {
    favBtn.addEventListener("click", function () {
        addToFavorites();
    });
}

function addToFavorites() {
    const song = songTitle.textContent;
    const artist = artistName.textContent;

    if (!song || !artist) {
        alert("No song to add!");
        return;
    }

    const newFav = { song, artist };

    // Get existing favorites
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    
    const exists = favorites.some(f => f.song === song && f.artist === artist);

    if (!exists) {
        favorites.push(newFav);
        localStorage.setItem("favorites", JSON.stringify(favorites));
        alert("Added to favorites ❤️");
    } else {
        alert("Already in favorites!");
    }
    }


});