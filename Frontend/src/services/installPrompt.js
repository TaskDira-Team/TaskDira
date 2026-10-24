// Keeps the browser's "install this app" offer so the landing page can show it
// when someone taps the download button. Chrome and Edge fire the event once,
// often before the landing page mounts, so we listen from app start.
let deferred = null;
const listeners = new Set();

export function listenForInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event;
    listeners.forEach((fn) => fn(true));
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    listeners.forEach((fn) => fn(false));
  });
}

export function canPromptInstall() {
  return !!deferred;
}

export function onInstallAvailability(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function promptInstall() {
  if (!deferred) return false;
  const event = deferred;
  deferred = null;
  event.prompt();
  const choice = await event.userChoice.catch(() => null);
  listeners.forEach((fn) => fn(false));
  return choice?.outcome === "accepted";
}

export function isInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

export function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}
