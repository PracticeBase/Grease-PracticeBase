/* notif.js — Toasts + Device Notifications */

/* ------------------------------
   TOASTS (Toastify CDN)
------------------------------ */

export function toast(message, type = "default") {
  let bg = "linear-gradient(to right, #111, #333)";

  if (type === "success") bg = "linear-gradient(to right, #4caf50, #2e7d32)";
  if (type === "error") bg = "linear-gradient(to right, #d32f2f, #b71c1c)";
  if (type === "info") bg = "linear-gradient(to right, #1976d2, #0d47a1)";

  Toastify({
    text: message,
    duration: 3500,
    gravity: "bottom",
    position: "center",
    close: true,
    style: {
      background: bg,
      borderRadius: "999px",
      padding: "12px 20px",
      fontSize: "0.9rem"
    }
  }).showToast();
}

/* ------------------------------
   DEVICE NOTIFICATIONS
------------------------------ */

export async function notifyDevice(title, body) {
  if (!("Notification" in window)) {
    toast("Device notifications not supported", "error");
    return;
  }

  if (Notification.permission !== "granted") {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      toast("Notifications disabled", "error");
      return;
    }
  }

  try {
    new Notification(title, { body });
  } catch {
    toast("Unable to send device notification", "error");
  }
}
