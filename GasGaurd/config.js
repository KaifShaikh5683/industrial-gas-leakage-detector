// config.js - Central Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// REPLACE THE VALUES BELOW with the code you found in your Firebase Project Settings
const firebaseConfig = {
  apiKey: "AIzaSyAZbz8e7YCA2jC1a7jqXfdNwJ-SIOebie8",
  authDomain: "gas-monitoring-system-76407.firebaseapp.com",
  projectId: "gas-monitoring-system-76407",
  storageBucket: "gas-monitoring-system-76407.firebasestorage.app",
  messagingSenderId: "974052445225",
  appId: "1:974052445225:web:019031be4d317093e7a038",
 
};


// Initialize the Firebase App
const app = initializeApp(firebaseConfig);

// Export services to be used in other files
export const auth = getAuth(app);
export const db = getFirestore(app);