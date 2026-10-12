// monitor.js - Secure Data Sync, Health Check & History Log
import { auth, db } from "./config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let userApiKey = null;

// 1. SESSION GUARD: Check if user is authorized
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "index.html";
    } else {
        try {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                // IMPORTANT: Ensure the field name matches what you used in auth.js
                userApiKey = docSnap.data().thingspeakKey || docSnap.data().tsKey;
                
                injectChart(userApiKey);
                
                fetchData(); 
                setInterval(fetchData, 5000);
            } else {
                alert("No hardware linked to this account!");
            }
        } catch (error) {
            console.error("Error fetching user config:", error);
        }
    }
});

function injectChart(key) {
    const chartContainer = document.getElementById('chartContainer');
    chartContainer.innerHTML = `
        <iframe width="100%" height="300" frameborder="0" 
        src="https://thingspeak.com/channels/3172093/charts/1?api_key=${key}&dynamic=true&results=60&type=line">
        </iframe>`;
}

// 2. TELEMETRY FETCH WITH OFFLINE LOGIC
async function fetchData() {
    if (!userApiKey) return;

    const URL = `https://api.thingspeak.com/channels/3172093/feeds/last.json?api_key=${userApiKey}`;
    
    try {
        const response = await fetch(URL);
        const data = await response.json();
        
        const gasADC = parseInt(data.field1);
        const lastEntryTime = new Date(data.created_at);
        const currentTime = new Date();
        
        // --- CHANGE 5: REAL HEALTH CHECK ---
        // Calculate difference in seconds between current time and last data point
        const diffSeconds = Math.floor((currentTime - lastEntryTime) / 1000);
        const healthEl = document.getElementById("systemHealth");

        if (diffSeconds > 20) { // If data is older than 40 seconds, hardware is likely offline
            healthEl.innerText = "🔴 SYSTEM OFFLINE";
            healthEl.className = "health offline";
        } else {
            healthEl.innerText = "🟢 SYSTEM ONLINE";
            healthEl.className = "health online";
        }

        updateDashboardUI(gasADC, lastEntryTime);
        updateHistoryTable(gasADC, lastEntryTime); // --- NEW: Update History ---

    } catch (error) {
        console.warn("Telemetry Sync Error:", error);
    }
}

// 3. PRESENTATION LAYER
function updateDashboardUI(adc, time) {
    const gasEl = document.getElementById("gasValue");
    const statusEl = document.getElementById("statusText");
    const solEl = document.getElementById("solutionText");
    const alertSound = document.getElementById("alertSound");

    gasEl.innerText = adc || "0";
    document.getElementById("lastUpdated").innerText = time.toLocaleString();
    
    document.body.classList.remove("blink-danger");
    alertSound.pause();

    if (adc < 40) {
        statusEl.innerText = "SAFE";
        statusEl.className = "card-value safe";
        solEl.innerText = "Air quality is within normal limits.";
    } else if (adc >= 40 && adc < 100) {
        statusEl.innerText = "WARNING";
        statusEl.className = "card-value medium";
        solEl.innerText = "Minor gas detected. Exhaust fan is active.";
    } else {
        statusEl.innerText = "CRITICAL";
        statusEl.className = "card-value high";
        solEl.innerText = "DANGER! Critical leak. Evacuate immediately.";
        document.body.classList.add("blink-danger");
        alertSound.play().catch(() => {});
    }
}

// 4. HISTORY TABLE LOGIC
function updateHistoryTable(adc, time) {
    const tableBody = document.getElementById("historyTableBody");
    if (!tableBody) return;

    const statusLabel = adc < 40 ? "SAFE" : (adc < 100 ? "WARNING" : "CRITICAL");
    const statusClass = adc < 40 ? "safe" : (adc < 100 ? "medium" : "high");

    const row = `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px;">${time.toLocaleTimeString()}</td>
            <td style="padding: 10px;">${adc}</td>
            <td style="padding: 10px;" class="${statusClass}"><strong>${statusLabel}</strong></td>
        </tr>
    `;

    // Add new row at the top (afterbegin)
    tableBody.insertAdjacentHTML('afterbegin', row);

    // Limit table to 10 rows for performance
    if (tableBody.rows.length > 5) {
        tableBody.deleteRow(5);
    }
}

// 5. UTILITY LOGIC
document.getElementById('logoutBtn').onclick = () => {
    signOut(auth).then(() => window.location.href = "index.html");
};

document.getElementById('themeToggle').onclick = () => {
    document.body.classList.toggle('dark');
};