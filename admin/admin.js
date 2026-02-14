// admin.js
import {
  auth,
  db,
  onAuthStateChanged,
  signOut,
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
} from "/Grease-PracticeBase/firebase.js";

const $ = id => document.getElementById(id);
const status = (msg, type="info") => {
  const bar = $("status");
  bar.textContent = msg;
  bar.style.background = type === "error" ? "#b00020" : "#111";
};

/* STATE FOR EDITING */
let editingAnnouncementId = null;
let editingScheduleId = null;
let editingTrackId = null;
let editingVideoId = null;

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
  setupSignOut();
  await Promise.all([
    loadAnnouncements(),
    loadSchedule(),
    loadTracks(),
    loadVideos(),
    loadUsers()
  ]);
}

/* ---------------------------
   ANNOUNCEMENTS
---------------------------- */

async function loadAnnouncements() {
  const box = $("announcementsList");
  box.innerHTML = "Loading…";

  const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(100));
  const snap = await getDocs(q);

  box.innerHTML = "";
  snap.forEach(d => {
    const a = d.data();
    const row = document.createElement("div");
    row.className = "list-item";
    row.innerHTML = `
      <div class="list-item-main">
        <strong>${a.title || "(no title)"}</strong><br>
        <div>${a.message || ""}</div>
      </div>
      <div class="list-item-actions">
        <button class="btn small outline" data-id="${d.id}" data-action="edit-ann">Edit</button>
        <button class="btn small outline" data-id="${d.id}" data-action="delete-ann">Delete</button>
      </div>
    `;
    box.appendChild(row);
  });

  box.querySelectorAll("button").forEach(btn => {
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    btn.onclick = async () => {
      if (action === "edit-ann") {
        const ref = doc(db, "announcements", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const a = snap.data();
          $("announcementTitle").value = a.title || "";
          $("announcementMessage").value = a.message || "";
          editingAnnouncementId = id;
          status("Editing announcement…");
        }
      } else if (action === "delete-ann") {
        await deleteDoc(doc(db, "announcements", id));
        status("Announcement deleted.");
        editingAnnouncementId = null;
        $("announcementForm").reset();
        loadAnnouncements();
      }
    };
  });
}

async function saveAnnouncement() {
  const data = {
    title: $("announcementTitle").value,
    message: $("announcementMessage").value,
    createdAt: serverTimestamp()
  };

  if (editingAnnouncementId) {
    await updateDoc(doc(db, "announcements", editingAnnouncementId), data);
    status("Announcement updated.");
  } else {
    await addDoc(collection(db, "announcements"), data);
    status("Announcement created.");
  }

  editingAnnouncementId = null;
  $("announcementForm").reset();
  loadAnnouncements();
}

/* ---------------------------
   SCHEDULE
---------------------------- */

async function loadSchedule() {
  const box = $("scheduleList");
  box.innerHTML = "Loading…";

  const q = query(collection(db, "schedule"), orderBy("sortTimestamp", "desc"), limit(100));
  const snap = await getDocs(q);

  box.innerHTML = "";
  snap.forEach(d => {
    const s = d.data();
    const row = document.createElement("div");
    row.className = "list-item";
    row.innerHTML = `
      <div class="list-item-main">
        <strong>${s.title || "(no title)"}</strong><br>
        <div>${s.date || ""} ${s.time || ""}</div>
        <div>${s.who || ""}</div>
        <div>${s.extra || ""}</div>
      </div>
      <div class="list-item-actions">
        <button class="btn small outline" data-id="${d.id}" data-action="edit-sch">Edit</button>
        <button class="btn small outline" data-id="${d.id}" data-action="delete-sch">Delete</button>
      </div>
    `;
    box.appendChild(row);
  });

  box.querySelectorAll("button").forEach(btn => {
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    btn.onclick = async () => {
      if (action === "edit-sch") {
        const ref = doc(db, "schedule", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const s = snap.data();
          $("scheduleTitle").value = s.title || "";
          $("scheduleDate").value = s.date || "";
          $("scheduleTime").value = s.time || "";
          $("scheduleWho").value = s.who || "";
          $("scheduleExtra").value = s.extra || "";
          editingScheduleId = id;
          status("Editing schedule item…");
        }
      } else if (action === "delete-sch") {
        await deleteDoc(doc(db, "schedule", id));
        status("Schedule item deleted.");
        editingScheduleId = null;
        $("scheduleForm").reset();
        loadSchedule();
      }
    };
  });
}

async function saveSchedule() {
  const data = {
    title: $("scheduleTitle").value,
    date: $("scheduleDate").value,
    time: $("scheduleTime").value,
    who: $("scheduleWho").value,
    extra: $("scheduleExtra").value,
    sortTimestamp: Date.now(),
    createdAt: serverTimestamp()
  };

  if (editingScheduleId) {
    await updateDoc(doc(db, "schedule", editingScheduleId), data);
    status("Schedule item updated.");
  } else {
    await addDoc(collection(db, "schedule"), data);
    status("Schedule item created.");
  }

  editingScheduleId = null;
  $("scheduleForm").reset();
  loadSchedule();
}

/* ---------------------------
   TRACKS
---------------------------- */

async function loadTracks() {
  const box = $("tracksList");
  box.innerHTML = "Loading…";

  const q = query(collection(db, "tracks"), orderBy("createdAt", "desc"), limit(100));
  const snap = await getDocs(q);

  box.innerHTML = "";
  snap.forEach(d => {
    const t = d.data();
    const row = document.createElement("div");
    row.className = "list-item";
    row.innerHTML = `
      <div class="list-item-main">
        <strong>${t.title || "(no title)"}</strong><br>
        <div>${t.url || ""}</div>
      </div>
      <div class="list-item-actions">
        <button class="btn small outline" data-id="${d.id}" data-action="edit-track">Edit</button>
        <button class="btn small outline" data-id="${d.id}" data-action="delete-track">Delete</button>
      </div>
    `;
    box.appendChild(row);
  });

  box.querySelectorAll("button").forEach(btn => {
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    btn.onclick = async () => {
      if (action === "edit-track") {
        const ref = doc(db, "tracks", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const t = snap.data();
          $("trackTitle").value = t.title || "";
          $("trackUrl").value = t.url || "";
          editingTrackId = id;
          status("Editing track…");
        }
      } else if (action === "delete-track") {
        await deleteDoc(doc(db, "tracks", id));
        status("Track deleted.");
        editingTrackId = null;
        $("trackForm").reset();
        loadTracks();
      }
    };
  });
}

async function saveTrack() {
  const data = {
    title: $("trackTitle").value,
    url: $("trackUrl").value,
    createdAt: serverTimestamp()
  };

  if (editingTrackId) {
    await updateDoc(doc(db, "tracks", editingTrackId), data);
    status("Track updated.");
  } else {
    await addDoc(collection(db, "tracks"), data);
    status("Track created.");
  }

  editingTrackId = null;
  $("trackForm").reset();
  loadTracks();
}

/* ---------------------------
   VIDEOS
---------------------------- */

async function loadVideos() {
  const box = $("videosList");
  box.innerHTML = "Loading…";

  const q = query(collection(db, "videos"), orderBy("createdAt", "desc"), limit(100));
  const snap = await getDocs(q);

  box.innerHTML = "";
  snap.forEach(d => {
    const v = d.data();
    const row = document.createElement("div");
    row.className = "list-item";
    row.innerHTML = `
      <div class="list-item-main">
        <strong>${v.title || "(no title)"}</strong><br>
        <div>${v.url || ""}</div>
      </div>
      <div class="list-item-actions">
        <button class="btn small outline" data-id="${d.id}" data-action="edit-video">Edit</button>
        <button class="btn small outline" data-id="${d.id}" data-action="delete-video">Delete</button>
      </div>
    `;
    box.appendChild(row);
  });

  box.querySelectorAll("button").forEach(btn => {
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    btn.onclick = async () => {
      if (action === "edit-video") {
        const ref = doc(db, "videos", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const v = snap.data();
          $("videoTitle").value = v.title || "";
          $("videoUrl").value = v.url || "";
          editingVideoId = id;
          status("Editing video…");
        }
      } else if (action === "delete-video") {
        await deleteDoc(doc(db, "videos", id));
        status("Video deleted.");
        editingVideoId = null;
        $("videoForm").reset();
        loadVideos();
      }
    };
  });
}

async function saveVideo() {
  const data = {
    title: $("videoTitle").value,
    url: $("videoUrl").value,
    createdAt: serverTimestamp()
  };

  if (editingVideoId) {
    await updateDoc(doc(db, "videos", editingVideoId), data);
    status("Video updated.");
  } else {
    await addDoc(collection(db, "videos"), data);
    status("Video created.");
  }

  editingVideoId = null;
  $("videoForm").reset();
  loadVideos();
}

/* ---------------------------
   SETTINGS
---------------------------- */

async function saveSetting() {
  const id = $("settingsId").value || "default";
  await updateDoc(doc(db, "settings", id), {
    value: $("settingsValue").value
  }).catch(async err => {
    // if doc doesn't exist, create it
    if (err.code === "not-found") {
      await updateDoc(doc(db, "settings", id), { value: $("settingsValue").value });
    }
  });
  status("Setting saved.");
}

/* ---------------------------
   USERS
---------------------------- */

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
      <div class="list-item-main">
        <strong>${d.id}</strong><br>
        ${u.email || ""} — <span class="pill">${u.role}</span>
      </div>
      <div class="list-item-actions">
        <button class="btn small outline" data-uid="${d.id}" data-role="admin">Admin</button>
        <button class="btn small outline" data-uid="${d.id}" data-role="member">Member</button>
        <button class="btn small outline" data-uid="${d.id}" data-role="delete">Delete</button>
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
    saveAnnouncement().catch(err => status(err.message, "error"));
  };

  $("scheduleForm").onsubmit = e => {
    e.preventDefault();
    saveSchedule().catch(err => status(err.message, "error"));
  };

  $("trackForm").onsubmit = e => {
    e.preventDefault();
    saveTrack().catch(err => status(err.message, "error"));
  };

  $("videoForm").onsubmit = e => {
    e.preventDefault();
    saveVideo().catch(err => status(err.message, "error"));
  };

  $("settingsForm").onsubmit = e => {
    e.preventDefault();
    saveSetting().catch(err => status(err.message, "error"));
  };

  $("refreshUsers").onclick = () => {
    loadUsers().catch(err => status(err.message, "error"));
  };
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
   SIGN OUT
---------------------------- */

function setupSignOut() {
  const btn = $("signOutBtn");
  btn.onclick = async () => {
    await signOut(auth);
    status("Signed out.", "info");
    setTimeout(() => {
      window.location.href = "/PracticeBase";
    }, 500);
  };
}

/* ---------------------------
   START
---------------------------- */

init().catch(err => status(err.message, "error"));

