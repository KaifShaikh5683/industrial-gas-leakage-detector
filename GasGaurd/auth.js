// auth.js - Secure Authentication & Validator Logic
import { auth, db } from "./config.js";
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- 1. PASSWORD VISIBILITY TOGGLE ---
const setupPasswordToggle = (inputId, iconId) => {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (input && icon) {
        icon.onclick = () => {
            const isPassword = input.type === "password";
            input.type = isPassword ? "text" : "password";
            icon.classList.toggle("fa-eye");
            icon.classList.toggle("fa-eye-slash");
        };
    }
};

setupPasswordToggle("password", "togglePassword"); // For Login
setupPasswordToggle("sPass", "toggleSPass");      // For Signup

// --- 2. VALIDATION LOGIC ---
function validatePassword(pass) {
    /** * Requirements: 
     * 6-8 characters, 1 Uppercase, 1 Lowercase, 1 Number, 1 Special Char
     */
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,8}$/;
    return regex.test(pass);
}

function showError(elementId, message) {
    const errEl = document.getElementById(elementId);
    if (errEl) {
        errEl.innerText = message;
        errEl.style.display = "block";
    }
}

// --- 3. SIGNUP LOGIC (signup.html) ---
if (document.getElementById('signupBtn')) {
    document.getElementById('signupBtn').onclick = async () => {
        const email = document.getElementById('sEmail').value;
        const pass = document.getElementById('sPass').value;
        const tsKey = document.getElementById('sApiKey').value;
        const errorElId = 'sErrorMessage';

        // Reset error message
        document.getElementById(errorElId).style.display = "none";

        // Validator: Empty check
        if (!email || !pass || !tsKey) {
            showError(errorElId, "Error: All fields are required.");
            return;
        }

        // Validator: Password Complexity
        if (!validatePassword(pass)) {
            showError(errorElId, "Invalid Password! Use 6-8 chars with Uppercase, Lowercase, Number, and Special Character.");
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            await setDoc(doc(db, "users", userCredential.user.uid), {
                thingspeakKey: tsKey,
                createdAt: new Date()
            });
            alert("Registration Successful!");
            window.location.href = "index.html";
        } catch (error) {
            showError(errorElId, "Signup Failed: " + error.message);
        }
    };
}

// --- 4. LOGIN LOGIC (index.html) ---
if (document.getElementById('loginBtn')) {
    document.getElementById('loginBtn').onclick = async () => {
        const email = document.getElementById('email').value;
        const pass = document.getElementById('password').value;
        const errorElId = 'errorMessage';

        document.getElementById(errorElId).style.display = "none";

        try {
            await signInWithEmailAndPassword(auth, email, pass);
            window.location.href = "dashboard.html";
        } catch (error) {
            // Requirement 4: Custom Error Message for Wrong Credentials
            showError(errorElId, "Invalid email or password. Please try again.");
            console.error("Login Error:", error.code);
        }
    };
}

// --- FORGOT PASSWORD LOGIC (index.html) ---
if (document.getElementById('forgotBtn')) {
    document.getElementById('forgotBtn').onclick = async (e) => {
        e.preventDefault(); // Prevents the page from reloading
        
        const emailField = document.getElementById('email').value;
        const errorElId = 'errorMessage'; // Targets the error <p> in index.html

        // Reset error display
        document.getElementById(errorElId).style.display = "none";

        if (!emailField) {
            showError(errorElId, "Please enter your email address first.");
            return;
        }

        try {
            await sendPasswordResetEmail(auth, emailField);
            alert("Success! A password reset link has been sent to your email.");
        } catch (error) {
            showError(errorElId, "Error: " + error.message);
        }
    };
}