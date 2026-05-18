import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } 
  from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { doc, getDoc } 
  from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", function () {

  const profileName  = document.getElementById("profileName");
  const profileEmail = document.getElementById("profileEmail");
  const profileDate  = document.getElementById("profileDate");
  const navUsername  = document.getElementById("navUsername");
  const logoutBtn    = document.getElementById("logoutBtn");

  //Load user data 
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      // Not logged in — redirect to login
      window.location.href = "login.html";
      return;
    }

    try {
      // Fetch profile from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        const data = userDoc.data();

        const fullName = `${data.firstName} ${data.lastName}`;

        // Fill in profile card
        profileName.textContent  = fullName;
        profileEmail.textContent = data.email;

        // Format the createdAt timestamp
        if (data.createdAt) {
          const date = data.createdAt.toDate();
          profileDate.textContent = date.toLocaleDateString("en-US", {
            day: "numeric",
            year: "numeric",
            month: "long"
          });
        }

        // Update navbar username
        navUsername.textContent = data.firstName;

      } else {
        // Auth exists but no Firestore doc — fallback to Auth email
        profileName.textContent  = user.displayName || "User";
        profileEmail.textContent = user.email;
        profileDate.textContent  = "N/A";
        navUsername.textContent  = user.email;
      }

    } catch (err) {
      console.error("Error fetching profile:", err);
      profileName.textContent = "Error loading profile";
    }
  });

  //Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {
      logoutBtn.disabled = true;
      logoutBtn.textContent = "Logging out...";

      try {
        await signOut(auth);
        window.location.href = "login.html";
      } catch (err) {
        console.error("Logout error:", err);
        logoutBtn.disabled = false;
        logoutBtn.textContent = "Log out";
      }
    });
  }
});