const STORAGE_KEY = "personaLabsMode";
const DEFAULT_MODE = "study";
const modeButtons = Array.from(document.querySelectorAll("[data-mode]"));

loadMode();

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const mode = button.dataset.mode || DEFAULT_MODE;
    saveMode(mode);
    setActiveMode(mode);
  });
});

function loadMode() {
  chrome.storage.local.get({ [STORAGE_KEY]: DEFAULT_MODE }, (items) => {
    setActiveMode(items[STORAGE_KEY]);
  });
}

function saveMode(mode) {
  chrome.storage.local.set({ [STORAGE_KEY]: mode });
}

function setActiveMode(mode) {
  modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === mode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}
