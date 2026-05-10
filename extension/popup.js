const STORAGE_KEY = "personaLabsChillMode";
const DEFAULT_MODE = "chill";
const VALID_MODES = new Set(["chill", "bareMetal"]);

const modeButtons = Array.from(document.querySelectorAll("[data-mode]"));

chrome.storage.local.get({ [STORAGE_KEY]: DEFAULT_MODE }, (items) => {
  setActiveMode(normalizeMode(items[STORAGE_KEY]));
});

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const mode = normalizeMode(button.dataset.mode);
    chrome.storage.local.set({ [STORAGE_KEY]: mode }, () => {
      setActiveMode(mode);
    });
  });
});

function normalizeMode(mode) {
  return VALID_MODES.has(mode) ? mode : DEFAULT_MODE;
}

function setActiveMode(mode) {
  modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === mode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}
