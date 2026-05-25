//this is the firebase configuration file, it is used to initialize the firebase app and export the auth and firestore instances

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCeHsOk7jo1NuW60OHLT2OP_C2YK_s9wO4",
  authDomain: "muzec-webprog.firebaseapp.com",
  projectId: "muzec-webprog",
  storageBucket: "muzec-webprog.firebasestorage.app",
  messagingSenderId: "424489914317",
  appId: "1:424489914317:web:14a017db1e0baafd85be84",
  measurementId: "G-4PV6T955BN"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

//Connection test, just remove after this yezz
console.log("Firebase app initialized:", app.name);
console.log("Auth instance ready:", auth ? "Yes" : "No");
console.log("Firestore instance ready:", db ? "Yes" : "No");