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
} from "../firebase.js";

const $ = id => document.getElementById(id);
const status = msg => $("status").textContent = msg;

/* SCREENS */
const screens = {
  loginScreen: $("loginScreen"),
  setupScreen: $("setupScreen"),
  homeScreen: $("homeScreen"),
  scheduleScreen: $("scheduleScreen"),
  mediaScreen: $("mediaScreen"),
  profileScreen: $("profileScreen")
};

let currentScreen = "loginScreen";

/* LOCAL STORAGE KEYS */
const DEVICE_KEY = "pb_bio_key";
const THEME_KEY = "pb_theme";
const PRACTICE_TODAY_KEY = "pb_practice_today";
const PRACTICE_DATE_KEY = "pb_practice_date";
const PRACTICE_GOAL_KEY = "pb_practice_goal";
const STREAK_KEY = "pb_streak_days"; // JSON array of dates
const NOTIF_ENABLED_KEY = "pb_notif_enabled";

let practiceTimer = null;
let reminderTimer = null;
let deferredPrompt = null;

/* SHOW WITH ANIMATION + NAV VISIBILITY */
function show(screenName) {
  currentScreen = screenName;

  Object.entries(screens).forEach(([name, el]) => {
    if (name === screenName) {
      el.classList.remove("hidden");
      requestAnimationFrame(() => el.classList.add("active"));
    } else {
      el.classList.remove("active");
      setTimeout(() => el.classList.add("hidden"), 300);
    }
  });

  const hideNavScreens = ["loginScreen", "setupScreen"];
  if (hideNavScreens.includes(screenName)) {
    $("bottomNav").classList.add("hidden");
  } else {
    $("bottomNav").classList.remove("hidden");
  }

  maybeShowInstallModal();
}

/* BIOMETRIC HELPERS */
function hasBiometric(){
  return localStorage.getItem(DEVICE_KEY) !== null;
}
function saveBiometric(id){
  localStorage.setItem(DEVICE_KEY, id);
}

/* THEME */
function applyTheme(theme){
  if (theme === "dark") {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }
}
function toggleTheme(){
  const current = localStorage.getItem(THEME_KEY) || "light";
  const next = current === "light" ? "dark" : "light";
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}
applyTheme(localStorage.getItem(THEME_KEY) || "light");
$("themeToggle")?.addEventListener("click", toggleTheme);

/* LOGIN */
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
      await loadHome();
      show("homeScreen");
      setActiveNav(0);
    }

    status("Logged in.");
  } catch (err) {
    status(err.message);
  }
};

/* BIOMETRIC LOGIN */
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

    await loadHome();
    show("homeScreen");
    setActiveNav(0);
    status("Biometric login successful.");
  } catch {
    status("Biometric login failed.");
  }
};

/* ENABLE BIOMETRICS */
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

    await loadHome();
    show("homeScreen");
    setActiveNav(0);
    status("Biometrics enabled.");
  } catch {
    status("Biometric setup failed.");
  }
};

$("skipBioBtn").onclick = async () => {
  await loadHome();
  show("homeScreen");
  setActiveNav(0);
};

/* HOME DATA + DASHBOARD */
async function loadHome(){
  if (!auth.currentUser) return;

  $("welcomeText").textContent = auth.currentUser.email;
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

  if (schSnap.empty) {
    $("nextRehearsal").textContent = "No rehearsals scheduled.";
    $("nextRehearsalTime").textContent = "";
    updateCountdown(null);
  } else {
    const s = schSnap.docs[0].data();
    $("nextRehearsal").textContent = s.title || "Rehearsal";
    $("nextRehearsalTime").textContent = `${s.date || ""} ${s.time || ""}`;
    updateCountdown(s.date);
  }

  // Practice goal input
  const goal = parseInt(localStorage.getItem(PRACTICE_GOAL_KEY) || "60", 10);
  $("practiceGoalInput").value = goal;

  updatePracticeProgress();
  updateStreakDisplay();
}

/* COUNTDOWN RING */
function updateCountdown(dateStr){
  const ring = $("countdownRing");
  const text = $("countdownText");

  if (!dateStr) {
    ring.style.background = "conic-gradient(var(--accent) 0deg, rgba(0,0,0,0.08) 0deg)";
    text.textContent = "--";
    return;
  }

  const target = new Date(dateStr.replace(/-/g, "/"));
  if (isNaN(target.getTime())) {
    text.textContent = "--";
    return;
  }

  const now = new Date();
  const diff = target - now;
  const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));

  const maxDays = 30;
  const pct = Math.min(1, days / maxDays);
  const angle = 360 - pct * 360;

  ring.style.background = `conic-gradient(var(--accent) 0deg, var(--accent) ${angle}deg, rgba(0,0,0,0.08) ${angle}deg)`;
  text.textContent = days;
}

/* PRACTICE PROGRESS */
function updatePracticeProgress(){
  const ring = $("progressRing");
  const text = $("progressText");

  const goal = parseInt(localStorage.getItem(PRACTICE_GOAL_KEY) || "60", 10);
  const today = new Date().toDateString();
  const storedDate = localStorage.getItem(PRACTICE_DATE_KEY);
  if (storedDate !== today) {
    localStorage.setItem(PRACTICE_DATE_KEY, today);
    localStorage.setItem(PRACTICE_TODAY_KEY, "0");
  }

  const minutes = parseInt(localStorage.getItem(PRACTICE_TODAY_KEY) || "0", 10);
  const pct = Math.min(1, minutes / goal);
  const angle = pct * 360;

  ring.style.background = `conic-gradient(#4caf50 0deg, #4caf50 ${angle}deg, rgba(0,0,0,0.08) ${angle}deg)`;
  text.textContent = `${minutes}/${goal} min`;

  updateStreak(minutes, goal);
}

/* PRACTICE TIMER (BACKGROUND) */
function startPracticeTimer(){
  if (practiceTimer) return;

  practiceTimer = setInterval(() => {
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem(PRACTICE_DATE_KEY);

    if (storedDate !== today) {
      localStorage.setItem(PRACTICE_DATE_KEY, today);
      localStorage.setItem(PRACTICE_TODAY_KEY, "0");
    }

    let minutes = parseInt(localStorage.getItem(PRACTICE_TODAY_KEY) || "0", 10);
    minutes += 1;
    localStorage.setItem(PRACTICE_TODAY_KEY, String(minutes));

    updatePracticeProgress();
  }, 60000);
}

/* WEEKLY STREAK */
function getStreakArray(){
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveStreakArray(arr){
  localStorage.setItem(STREAK_KEY, JSON.stringify(arr));
}
function updateStreak(minutesToday, goal){
  const today = new Date().toDateString();
  let streakDays = getStreakArray();

  // Ensure today is in list if goal met
  if (minutesToday >= goal) {
    if (!streakDays.includes(today)) {
      streakDays.push(today);
    }
  }

  // Keep only last 7 days
  streakDays = streakDays.slice(-7);
  saveStreakArray(streakDays);
  updateStreakDisplay();
}
function updateStreakDisplay(){
  const streakDays = getStreakArray();
  const today = new Date().toDateString();

  // Compute consecutive days ending today
  let streak = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toDateString();
    if (streakDays.includes(ds)) {
      streak++;
    } else {
      if (ds === today) continue;
      break;
    }
  }

  $("streakText").textContent = `${streak} day${streak === 1 ? "" : "s"}`;
}

/* SCHEDULE LIST */
async function loadSchedule(){
  const box = $("scheduleList");
  box.textContent = "Loading…";

  const qSch = query(collection(db, "schedule"), orderBy("sortTimestamp", "asc"), limit(50));
  const snap = await getDocs(qSch);

  if (snap.empty) {
    box.textContent = "No schedule yet.";
    return;
  }

  box.innerHTML = "";
  snap.forEach(d => {
    const s = d.data();
    const div = document.createElement("div");
    div.className = "list-item";
    div.innerHTML = `
      <strong>${s.title || "Rehearsal"}</strong><br>
      <span>${s.date || ""} ${s.time || ""}</span><br>
      <span class="muted small">${s.who || ""}</span>
    `;
    box.appendChild(div);
  });
}

/* MEDIA LIST (tracks + videos) */
async function loadMedia(){
  const box = $("mediaList");
  box.textContent = "Loading…";

  const tracksQ = query(collection(db, "tracks"), orderBy("createdAt", "desc"), limit(20));
  const videosQ = query(collection(db, "videos"), orderBy("createdAt", "desc"), limit(20));

  const [tracksSnap, videosSnap] = await Promise.all([getDocs(tracksQ), getDocs(videosQ)]);

  box.innerHTML = "";

  if (tracksSnap.empty && videosSnap.empty) {
    box.textContent = "No media yet.";
    return;
  }

  if (!tracksSnap.empty) {
    const h = document.createElement("h3");
    h.textContent = "Tracks";
    box.appendChild(h);
    tracksSnap.forEach(d => {
      const t = d.data();
      const div = document.createElement("div");
      div.className = "list-item";
      div.innerHTML = `
        <strong>${t.title || "Track"}</strong><br>
        <span class="muted small">${t.url}</span>
      `;
      const btn = document.createElement("button");
      btn.className = "media-btn";
      btn.textContent = "Open Track";
      btn.onclick = () => window.open(t.url, "_blank");
      div.appendChild(btn);
      box.appendChild(div);
    });
  }

  if (!videosSnap.empty) {
    const h = document.createElement("h3");
    h.textContent = "Videos";
    box.appendChild(h);
    videosSnap.forEach(d => {
      const v = d.data();
      const div = document.createElement("div");
      div.className = "list-item";
      div.innerHTML = `
        <strong>${v.title || "Video"}</strong><br>
        <span class="muted small">${v.url}</span>
      `;
      const btn = document.createElement("button");
      btn.className = "media-btn";
      btn.textContent = "Open Video";
      btn.onclick = () => window.open(v.url, "_blank");
      div.appendChild(btn);
      box.appendChild(div);
    });
  }
}

/* BOTTOM NAV */
function setActiveNav(index){
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.remove("active");
    if (parseInt(btn.dataset.index,10) === index) {
      btn.classList.add("active");
    }
  });
}

document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.onclick = () => {
    const target = btn.dataset.target;
    const index = parseInt(btn.dataset.index,10);
    setActiveNav(index);

    if (target === "scheduleScreen") loadSchedule();
    if (target === "mediaScreen") loadMedia();
    if (target === "homeScreen") loadHome();

    show(target);
  };
});

/* SWIPE NAV (iOS-style) */
let touchStartX = 0;
let touchEndX = 0;

function handleGesture(){
  const delta = touchEndX - touchStartX;
  if (Math.abs(delta) < 50) return;

  const navButtons = Array.from(document.querySelectorAll(".nav-btn"));
  const currentIndex = navButtons.findIndex(b => b.classList.contains("active"));
  if (currentIndex === -1) return;

  let nextIndex = currentIndex;
  if (delta < 0 && currentIndex < navButtons.length - 1) nextIndex++;
  if (delta > 0 && currentIndex > 0) nextIndex--;

  if (nextIndex !== currentIndex) {
    const btn = navButtons[nextIndex];
    btn.click();
  }
}

document.addEventListener("touchstart", e => {
  touchStartX = e.changedTouches[0].screenX;
});
document.addEventListener("touchend", e => {
  touchEndX = e.changedTouches[0].screenX;
  handleGesture();
});

/* PRACTICE GOAL SETTINGS */
$("savePracticeGoal").onclick = () => {
  const goal = parseInt($("practiceGoalInput").value, 10);
  if (goal > 0) {
    localStorage.setItem(PRACTICE_GOAL_KEY, String(goal));
    updatePracticeProgress();
    status("Practice goal updated.");
  }
};

/* NOTIFICATIONS / REMINDERS */
function isMobile(){
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}
function isStandalone(){
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
}

$("enableNotifications").onclick = async () => {
  if (!("Notification" in window)) {
    status("Notifications not supported on this device.");
    return;
  }

  const perm = await Notification.requestPermission();
  if (perm === "granted") {
    localStorage.setItem(NOTIF_ENABLED_KEY, "1");
    startReminderTimer();
    status("Notifications enabled.");
  } else {
    status("Notifications denied.");
  }
};

function startReminderTimer(){
  if (reminderTimer) return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  reminderTimer = setInterval(() => {
    const goal = parseInt(localStorage.getItem(PRACTICE_GOAL_KEY) || "60", 10);
    const minutes = parseInt(localStorage.getItem(PRACTICE_TODAY_KEY) || "0", 10);

    if (minutes < goal) {
      new Notification("Time to practice!", {
        body: "You haven't hit your practice goal yet today.",
        tag: "practice-reminder"
      });
    }
  }, 60 * 60 * 1000); // every hour
}

/* INSTALL PROMPT (FULLSCREEN, MOBILE ONLY, UNTIL INSTALLED) */
function maybeShowInstallModal(){
  if (!isMobile()) return;
  if (isStandalone()) return;
  if (!deferredPrompt) return;

  if (currentScreen === "loginScreen" || currentScreen === "setupScreen") {
    $("installModal").classList.add("active");
  } else {
    $("installModal").classList.remove("active");
  }
}

window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredPrompt = e;
  maybeShowInstallModal();
});

$("installModalBtn").onclick = async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  $("installModal").classList.remove("active");
  deferredPrompt = null;
};

$("installModalSkip").onclick = () => {
  $("installModal").classList.remove("active");
};

window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  $("installModal").classList.remove("active");
});

/* SIGN OUT */
$("logoutBtn").onclick = async () => {
  await signOut(auth);
  show("loginScreen");
  setActiveNav(0);
  status("Signed out.");
};

/* AUTH STATE */
onAuthStateChanged(auth, user => {
  if (user) {
    if (hasBiometric()) $("bioLoginBtn").classList.remove("hidden");
    startPracticeTimer();
    if (localStorage.getItem(NOTIF_ENABLED_KEY) === "1") startReminderTimer();
    show("loginScreen");
  } else {
    show("loginScreen");
  }
});

/* SPLASH → LOGIN */
setTimeout(() => {
  $("splashScreen").style.display = "none";
  show("loginScreen");
}, 1400);
