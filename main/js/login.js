// This file handles the login functionality using Firebase Authentication. It listens for the login button click, 
// validates user input, and attempts to sign in with email and password. On success, it redirects to the home page; 
// on failure, it shows an error message.

import { auth } from "./firebase-config.js";
import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", function () {
  const loginBtn   = document.getElementById("loginBtn");
  const emailInput = document.getElementById("emailInput");
  const passInput  = document.getElementById("passwordInput");
  const errorDiv   = document.getElementById("loginError");

  loginBtn.addEventListener("click", async function () {
    const email    = emailInput.value.trim();
    const password = passInput.value.trim();

    // Basic validation
    if (!email || !password) {
      showError("Please fill in both fields.");
      return;
    }

    // Disable button while logging in
    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in...";

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Success — redirect to home
      window.location.href = "index.html";

    } catch (error) {
      loginBtn.disabled = false;
      loginBtn.textContent = "Login";
      showError(getFriendlyError(error.code));
    }
  });

  function showError(message) {
    errorDiv.textContent = message;
    errorDiv.style.display = "block";
  }

  // Convert Firebase error codes to readable messages
  function getFriendlyError(code) {
    switch (code) {
      case "auth/user-not-found":    return "No account found with this email.";
      case "auth/wrong-password":    return "Incorrect password. Try again.";
      case "auth/invalid-email":     return "Please enter a valid email address.";
      case "auth/too-many-requests": return "Too many attempts. Try again later.";
      case "auth/invalid-credential": return "Wrong email or password.";
      default:                       return "Login failed. Please try again.";
    }
  }
});