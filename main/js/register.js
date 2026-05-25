
import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import {
  doc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", function () {
  const registerBtn       = document.getElementById("registerBtn");
  const firstNameInput    = document.getElementById("firstNameInput");
  const lastNameInput     = document.getElementById("lastNameInput");
  const emailInput        = document.getElementById("emailInput");
  const passwordInput     = document.getElementById("passwordInput");
  const repeatPassInput   = document.getElementById("repeatPasswordInput");
  const errorDiv          = document.getElementById("registerError");
  const successDiv        = document.getElementById("registerSuccess");

  registerBtn.addEventListener("click", async function () {
    // Clear previous messages
    errorDiv.style.display   = "none";
    successDiv.style.display = "none";

    const firstName  = firstNameInput.value.trim();
    const lastName   = lastNameInput.value.trim();
    const email      = emailInput.value.trim();
    const password   = passwordInput.value.trim();
    const repeatPass = repeatPassInput.value.trim();

    //Validation
    if (!firstName || !lastName || !email || !password || !repeatPass) {
      showError("Please fill in all fields.");
      return;
    }

    if (password !== repeatPass) {
      showError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      showError("Password must be at least 6 characters.");
      return;
    }

    //Firebase signup
    registerBtn.disabled     = true;
    registerBtn.textContent  = "Creating account...";

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Save user profile to Firestore under users/{uid}
      await setDoc(doc(db, "users", user.uid), {
        firstName,
        lastName,
        email,
        createdAt: serverTimestamp()
      });

      // 3. Show success then redirect to login
      successDiv.textContent  = "Account created! Redirecting to login...";
      successDiv.style.display = "block";

      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);

    } catch (error) {
      registerBtn.disabled    = false;
      registerBtn.textContent = "Register Account";
      showError(getFriendlyError(error.code));
    }
  });

  function showError(message) {
    errorDiv.textContent    = message;
    errorDiv.style.display  = "block";
  }

  function getFriendlyError(code) {
    switch (code) {
      case "auth/email-already-in-use":  return "This email is already registered. Try logging in.";
      case "auth/invalid-email":         return "Please enter a valid email address.";
      case "auth/weak-password":         return "Password is too weak. Use at least 6 characters.";
      default:                           return "Registration failed. Please try again.";
    }
  }
});