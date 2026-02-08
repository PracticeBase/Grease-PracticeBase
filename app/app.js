import {
  auth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "../firebase.js";

const $ = id => document.getElementById(id);
const status = msg => $("status").textContent = msg;

/* ---------------------------
   SCREENS
---------------------------- */
const loginScreen = $("loginScreen");
const setupScreen = $("setupScreen");
const homeScreen = $("homeScreen");

function show(screen){
  loginScreen.style.display = "none";
  setupScreen.style.display = "none";
  homeScreen.style.display = "none";
  screen.style.display = "block";
}

/* ---------------------------
   BIOMETRIC STORAGE
---------------------------- */

const DEVICE_KEY = "pb_bio_key";

/* Check if biometrics are set up */
function hasBiometric(){
  return localStorage.getItem(DEVICE_KEY) !== null;
}

/* Save credential ID */
function saveBiometric(id){
  localStorage.setItem(DEVICE_KEY, id);
}

/* ---------------------------
   LOGIN FLOW
---------------------------- */

$("loginForm").onsubmit = async e => {
  e.preventDefault();
  status("Logging in…");

  try {
    const email = $("email").value;
    const password = $("password").value;

    await signInWithEmailAndPassword(auth, email, password);

    if (!hasBiometric()) {
      show(setupScreen);
    } else {
      show(homeScreen);
    }

    status("Logged in.");
  } catch (err) {
    status(err.message);
  }
};

/* ---------------------------
   BIOMETRIC LOGIN
---------------------------- */

$("bioLoginBtn").onclick = async () => {
  status("Authenticating…");

  try {
    const id = localStorage.getItem(DEVICE_KEY);
    if (!id) return status("No biometric key found.");

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: new Uint8Array(32),
        allowCredentials: [{ id: Uint8Array.from(atob(id), c => c.charCodeAt(0)), type: "public-key" }]
      }
    });

    // If we reach here, biometrics succeeded
    show(homeScreen);
    status("Biometric login successful.");
  } catch (err) {
    status("Biometric login failed.");
  }
};

/* ---------------------------
   ENABLE BIOMETRICS
---------------------------- */

$("enableBioBtn").onclick = async () => {
  status("Setting up biometrics…");

  try {
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: new Uint8Array(32),
        rp: { name: "PracticeBase" },
        user: {
          id: new Uint8Array(16),
          name: auth.currentUser.email,
          displayName: auth.currentUser.email
        },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }],
        authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" }
      }
    });

    const id = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
    saveBiometric(id);

    status("Biometrics enabled.");
    show(homeScreen);

  } catch (err) {
    status("Biometric setup failed.");
  }
};

$("skipBioBtn").onclick = () => {
  show(homeScreen);
};

/* ---------------------------
   SIGN OUT
---------------------------- */

$("logoutBtn").onclick = async () => {
  await signOut(auth);
  show(loginScreen);
  status("Signed out.");
};

/* ---------------------------
   INITIAL STATE
---------------------------- */

onAuthStateChanged(auth, user => {
  if (user) {
    if (hasBiometric()) {
      $("bioLoginBtn").style.display = "block";
    }
    show(loginScreen);
  } else {
    show(loginScreen);
  }
});
