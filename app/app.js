import {
  auth,
  db,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  collection,
  query,
  orderBy,
  limit,
  getDocs
} from "/PracticeBase/firebase.js";

const $ = id => document.getElementById(id);
const status = msg => $("status").textContent = msg;

/* ---------------------------
   SCREENS
---------------------------- */
const screens = {
  loginScreen: $("loginScreen"),
  setupScreen: $("setupScreen"),
  homeScreen: $("homeScreen"),
  scheduleScreen: $("scheduleScreen"),
  mediaScreen: $("mediaScreen"),
  profileScreen: $("profileScreen")
};

function show(screenName){
  Object.values(screens).forEach(s => s.classList.add("hidden"));
  screens[screenName].classList.remove("hidden");
}

/* ---------------------------
   BIOMETRIC STORAGE
---------------------------- */
const DEVICE_KEY = "pb_bio_key";

function hasBiometric(){
  return localStorage.getItem(DEVICE_KEY) !== null;
}
function saveBiometric(id){
  localStorage.setItem(DEVICE_KEY, id);
}

/* ---------------------------
   LOGIN
---------------------------- */

$("loginForm").onsubmit = async e => {
  e.preventDefault();
  status("Logging in…");

  try {
    const email = $("email").value;
    const password = $("password").value;

    await signInWithEmailAndPassword(auth, email, password);

    if (!hasBiometric()) {
      show("setupScreen");
    } else {
      loadHome();
      show("homeScreen");
      $("bottomNav").classList.remove("hidden");
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

    await navigator.credentials.get({
      publicKey: {
        challenge: new Uint8Array(32),
        allowCredentials: [{ id: Uint8Array.from(atob(id), c => c.charCodeAt(0)), type: "public-key" }]
      }
    });

    loadHome();
    show("homeScreen");
    $("bottomNav").classList.remove("hidden");
    status("Biometric login successful.");
  } catch {
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

    loadHome();
    show("homeScreen");
    $("bottomNav").classList.remove("hidden");
    status("Biometrics enabled.");
  } catch {
    status("Biometric setup failed.");
  }
};

$("skipBioBtn").onclick = () => {
  loadHome();
  show("homeScreen");
  $("bottomNav").classList.remove("hidden");
};

/* ---------------------------
   LOAD HOME DATA
---------------------------- */

async function loadHome(){
  $("profileEmail").textContent = auth.currentUser.email;

  // Latest announcement
  const annQ = query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(1));
  const annSnap = await getDocs(annQ);
  $("latestAnnouncement").textContent = annSnap.empty
    ? "No announcements yet."
    : annSnap.docs[0].data().message;

  // Next rehearsal
  const schQ = query(collection(db, "schedule"), orderBy("sortTimestamp", "asc"), limit(1));
  const schSnap = await getDocs(schQ);
  $("nextRehearsal").textContent = schSnap.empty
    ? "No rehearsals scheduled."
    : `${schSnap.docs[0].data().title} — ${schSnap.docs[0].data().date}`;
}

/* ---------------------------
   BOTTOM NAV
---------------------------- */

document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const target = btn.dataset.target;
    show(target);
  };
});

/* ---------------------------
   SIGN OUT
---------------------------- */

$("logoutBtn").onclick = async () => {
  await signOut(auth);
  show("loginScreen");
  $("bottomNav").classList.add("hidden");
  status("Signed out.");
};

/* ---------------------------
   INITIAL STATE
---------------------------- */

onAuthStateChanged(auth, user => {
  if (user) {
    if (hasBiometric()) $("bioLoginBtn").classList.remove("hidden");
    show("loginScreen");
  } else {
    show("loginScreen");
  }
});
