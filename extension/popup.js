const STORAGE_KEY = "personaLabsChillMode";
const DEVELOPER_MODE_STORAGE_KEY = "personaLabsDeveloperMode";
const DEFAULT_MODE = "chill";
const VALID_MODES = new Set(["chill", "bareMetal"]);

const modeButtons = Array.from(document.querySelectorAll("[data-mode]"));
const developerModeInput = document.querySelector("#developer-mode");

chrome.storage.local.get(
  {
    [STORAGE_KEY]: DEFAULT_MODE,
    [DEVELOPER_MODE_STORAGE_KEY]: false
  },
  (items) => {
    setActiveMode(normalizeMode(items[STORAGE_KEY]));
    if (developerModeInput) {
      developerModeInput.checked = Boolean(items[DEVELOPER_MODE_STORAGE_KEY]);
    }
  }
);

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const mode = normalizeMode(button.dataset.mode);
    chrome.storage.local.set({ [STORAGE_KEY]: mode }, () => {
      setActiveMode(mode);
    });
  });
});

if (developerModeInput) {
  developerModeInput.addEventListener("change", () => {
    chrome.storage.local.set({
      [DEVELOPER_MODE_STORAGE_KEY]: developerModeInput.checked
    });
  });
}

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
