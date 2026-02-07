// admin.js
import {
  auth,
  db,
  onAuthStateChanged,
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit
} from "./firebase.js";

const $ = id => document.getElementById(id);
const status = (msg, type="info") => {
  const box = $("status");
  box.textContent = msg;
  box.style.color = type === "error" ? "#b00020" : "#0a7a2f";
};

/* ---------------------------
   ADMIN CHECK
---------------------------- */

async function isAdmin(uid) {
  const u = await getDoc(doc(db, "users", uid));
  return u.exists() && u.data().role === "admin";
}

async function init() {
  status("Checking authentication…");

  await new Promise(resolve => {
    const unsub = onAuthStateChanged(auth, u => {
      unsub();
      resolve(u);
    });
  });

  const user = auth.currentUser;
  if (!user) {
    status("Not signed in.", "error");
    return;
  }

  status(`Signed in as ${user.email}. Checking admin…`);

  if (!(await isAdmin(user.uid))) {
    status("You are not an admin.", "error");
    return;
  }

  status("Admin verified.");
  setupForms();
  setupSidebar();
  loadUsers();
}

/* ---------------------------
   CRUD FUNCTIONS
---------------------------- */

async function createAnnouncement() {
  await addDoc(collection(db, "announcements"), {
    title: $("announcementTitle").value,
    message: $("announcementMessage").value,
    createdAt: serverTimestamp()
  });
  status("Announcement created.");
}

async function createSchedule() {
  await addDoc(collection(db, "schedule"), {
    title: $("scheduleTitle").value,
    date: $("scheduleDate").value,
    time: $("scheduleTime").value,
    who: $("scheduleWho").value,
    extra: $("scheduleExtra").value,
    sortTimestamp: Date.now(),
    createdAt: serverTimestamp()
  });
  status("Schedule item created.");
}

async function createTrack() {
  await addDoc(collection(db, "tracks"), {
    title: $("trackTitle").value,
    url: $("trackUrl").value,
    createdAt: serverTimestamp()
  });
  status("Track created.");
}

async function createVideo() {
  await addDoc(collection(db, "videos"), {
    title: $("videoTitle").value,
    url: $("videoUrl").value,
    createdAt: serverTimestamp()
  });
  status("Video created.");
}

async function saveSetting() {
  const id = $("settingsId").value || "default";
  await updateDoc(doc(db, "settings", id), {
    value: $("settingsValue").value
  });
  status("Setting saved.");
}

async function loadUsers() {
  const box = $("usersList");
  box.innerHTML = "Loading…";

  const q = query(collection(db, "users"), orderBy("__name__"), limit(100));
  const snap = await getDocs(q);

  box.innerHTML = "";

  snap.forEach(d => {
    const u = d.data();
    const row = document.createElement("div");
    row.className = "list-item";
    row.innerHTML = `
      <div>
        <strong>${d.id}</strong><br>
        ${u.email || ""} — <span class="pill">${u.role}</span>
      </div>
      <div>
        <button class="btn outline" data-uid="${d.id}" data-role="admin">Admin</button>
        <button class="btn outline" data-uid="${d.id}" data-role="member">Member</button>
        <button class="btn outline" data-uid="${d.id}" data-role="delete">Delete</button>
      </div>
    `;
    box.appendChild(row);
  });

  box.querySelectorAll("button").forEach(btn => {
    btn.onclick = async () => {
      const uid = btn.dataset.uid;
      const role = btn.dataset.role;

      if (role === "delete") {
        await deleteDoc(doc(db, "users", uid));
        status("User deleted.");
      } else {
        await updateDoc(doc(db, "users", uid), { role });
        status(`Updated ${uid} to ${role}.`);
      }

      loadUsers();
    };
  });
}

/* ---------------------------
   FORM HANDLERS
---------------------------- */

function setupForms() {
  $("announcementForm").onsubmit = e => {
    e.preventDefault();
    createAnnouncement();
  };

  $("scheduleForm").onsubmit = e => {
    e.preventDefault();
    createSchedule();
  };

  $("trackForm").onsubmit = e => {
    e.preventDefault();
    createTrack();
  };

  $("videoForm").onsubmit = e => {
    e.preventDefault();
    createVideo();
  };

  $("settingsForm").onsubmit = e => {
    e.preventDefault();
    saveSetting();
  };

  $("refreshUsers").onclick = loadUsers;
}

/* ---------------------------
   SIDEBAR NAVIGATION
---------------------------- */

function setupSidebar() {
  const navItems = document.querySelectorAll(".nav-item");
  const sections = {
    announcements: $("section-announcements"),
    schedule: $("section-schedule"),
    tracks: $("section-tracks"),
    videos: $("section-videos"),
    settings: $("section-settings"),
    users: $("section-users")
  };

  navItems.forEach(item => {
    item.onclick = () => {
      navItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");

      const target = item.dataset.section;
      Object.keys(sections).forEach(key => {
        sections[key].style.display = key === target ? "block" : "none";
      });
    };
  });
}

/* ---------------------------
   START
---------------------------- */

init();
