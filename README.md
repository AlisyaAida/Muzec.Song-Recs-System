# 🎵 Muzec – AI-Powered Song Recommendation System

## Overview

Muzec is a web-based music recommendation system that provides personalized song suggestions based on user preferences such as mood, genre, language, song age, and explicit content settings. The system integrates Google's Gemini AI to generate intelligent music recommendations and Spotify API to retrieve song metadata, album artwork, and Spotify links.

Users can create accounts, manage their profiles, save favorite songs, browse top charts by genre, and access song recommendations through an interactive and user-friendly interface.

---

## Features

### 🎧 AI-Powered Song Recommendation

* Generates personalized song recommendations using Gemini AI.
* Considers:

  * Mood
  * Genre
  * Language
  * Song age preference
  * Explicit content preference
* Avoids repeatedly recommending the same songs.

### 📈 Top Charts by Genre

* Displays trending songs across multiple genres:

  * Pop
  * Rock
  * Hip-Hop
  * Jazz
  * Classical
  * K-Pop
  * R&B
  * Indie
* Charts are generated through the Gemini AI service.
* Song details are enriched using Spotify metadata.

### ❤️ Favorites Management

* Save favorite songs to a personal collection.
* View saved songs with album artwork and Spotify links.
* Remove songs from favorites.

### 👤 User Account Management

* User registration and login.
* Profile management.
* Update personal information.
* Change email and password.
* Delete account securely.

### 🔒 Authentication and Security

* Firebase Authentication for secure user login and account management.
* Re-authentication required for sensitive actions such as password updates and account deletion.

---

## System Architecture

### Front-End

* HTML5
* CSS3
* Bootstrap 4
* JavaScript (ES6)

### Back-End

* Node.js
* Express.js

### External Services

* Gemini AI API
* Spotify Web API
* Firebase Authentication
* Firebase Firestore Database

---

## Technologies Used

| Technology              | Purpose                                        |
| ----------------------- | ---------------------------------------------- |
| HTML/CSS/Bootstrap      | User Interface                                 |
| JavaScript              | Client-side functionality                      |
| Node.js                 | Backend runtime                                |
| Express.js              | API endpoints                                  |
| Gemini AI               | Recommendation generation and chart generation |
| Spotify API             | Song metadata retrieval                        |
| Firebase Authentication | User authentication                            |
| Cloud Firestore         | User data storage                              |

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/muzec.git
cd muzec
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
GEMINI_API_KEY=your_gemini_api_key
PORT=3000
```

### 4. Start the Server

```bash
node server.js
```

or

```bash
npm start
```

### 5. Access the Application

Open:

```text
http://localhost:3000
```

---

## Project Structure

```text
Muzec/
│
├── main/
│   ├── css/
│   ├── js/
│   ├── img/
│   ├── index.html
│   └── other pages
│
├── server.js
├── package.json
├── .env
└── README.md
```

---

## Future Improvements

* Advanced recommendation personalization based on listening history.
* Playlist generation.
* Music review sentiment analysis.
* Recommendation explanation dashboard.
* Real-time trending charts integration.

---

## Authors

Developed as part of the System Analysis and Design / Web Development Project.

Universiti Malaya (UM)
Faculty of Computer Science and Information Technology (FCSIT)

---

## License

This project is developed for educational purposes.
