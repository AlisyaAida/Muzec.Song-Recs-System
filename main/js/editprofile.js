import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import {
  doc, getDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", function () {

  const firstNameInput       = document.getElementById("firstNameInput");
  const lastNameInput        = document.getElementById("lastNameInput");
  const emailInput           = document.getElementById("emailInput");
  const currentPasswordInput = document.getElementById("currentPasswordInput");
  const newPasswordInput     = document.getElementById("newPasswordInput");
  const saveBtn              = document.getElementById("saveBtn");
  const successDiv           = document.getElementById("editSuccess");
  const errorDiv             = document.getElementById("editError");
  const navUsername          = document.getElementById("navUsername");

  let currentUser = null;

  //Load current data into form
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    currentUser = user;

    // Fetch from Firestore and pre-fill form
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      firstNameInput.value = data.firstName || "";
      lastNameInput.value  = data.lastName  || "";
      emailInput.value     = data.email     || user.email;
      navUsername.textContent = data.firstName;
    }
  });

    //null preventation guard for currentUser in case save is clicked before auth loads
    saveBtn.addEventListener("click", async function () {
        clearMessages();

    //guard against clicking before auth loads
        if (!currentUser) {
        showError("User not loaded yet. Please wait a moment and try again.");
      return;
    }

  //Save changes
  saveBtn.addEventListener("click", async function () {
    clearMessages();

    const firstName       = firstNameInput.value.trim();
    const lastName        = lastNameInput.value.trim();
    const newEmail        = emailInput.value.trim();
    const currentPassword = currentPasswordInput.value.trim();
    const newPassword     = newPasswordInput.value.trim();

    // Validation
    if (!firstName || !lastName) {
      showError("Name cannot be empty.");
      return;
    }

    const emailChanged    = newEmail !== currentUser.email;
    const passwordChanged = newPassword.length > 0;

    // If changing email or password, current password is required
    if ((emailChanged || passwordChanged) && !currentPassword) {
      showError("Please enter your current password to change email or password.");
      return;
    }

    if (passwordChanged && newPassword.length < 6) {
      showError("New password must be at least 6 characters.");
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    try {
      // Step 1 — Re-authenticate if changing email or password
      if (emailChanged || passwordChanged) {
        const credential = EmailAuthProvider.credential(
          currentUser.email,
          currentPassword
        );
        await reauthenticateWithCredential(currentUser, credential);
      }

      // Step 2 — Update name in Firestore
      await updateDoc(doc(db, "users", currentUser.uid), {
        firstName,
        lastName,
        // Update email in Firestore too if changed
        ...(emailChanged && { email: newEmail })
      });

      // Step 3 — Update email in Firebase Auth
      if (emailChanged) {
        await updateEmail(currentUser, newEmail);
      }

      // Step 4 — Update password in Firebase Auth
      if (passwordChanged) {
        await updatePassword(currentUser, newPassword);
      }

      // Clear password fields after success
      currentPasswordInput.value = "";
      newPasswordInput.value     = "";

      showSuccess("Profile updated successfully!");

      // Go back to profile after 2 seconds
      setTimeout(() => {
        window.location.href = "profile.html";
      }, 2000);

    } catch (err) {
      console.error("Update error:", err);
      showError(getFriendlyError(err.code));
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Changes";
    }
  });

  //Helpers
  function showSuccess(msg) {
    successDiv.textContent  = msg;
    successDiv.style.display = "block";
    errorDiv.style.display   = "none";
  }

  function showError(msg) {
    errorDiv.textContent    = msg;
    errorDiv.style.display  = "block";
    successDiv.style.display = "none";
  }

  function clearMessages() {
    successDiv.style.display = "none";
    errorDiv.style.display   = "none";
  }

  function getFriendlyError(code) {
    switch (code) {
      case "auth/wrong-password":        return "Current password is incorrect.";
      case "auth/email-already-in-use":  return "This email is already used by another account.";
      case "auth/invalid-email":         return "Please enter a valid email address.";
      case "auth/weak-password":         return "New password is too weak.";
      case "auth/requires-recent-login": return "Session expired. Please log out and log in again.";
      default:                           return "Something went wrong. Please try again.";
    }
  }

    });
});