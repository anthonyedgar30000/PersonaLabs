const STORAGE_KEY = "personaLabsChillMode";
const DEVELOPER_MODE_STORAGE_KEY = "personaLabsDeveloperMode";
const ADAPTIVE_GUIDANCE_STORAGE_KEY = "personaLabsAdaptiveGuidance";
const USER_GOAL_STORAGE_KEY = "personaLabsUserGoal";
const DEFAULT_MODE = "chill";
const DEFAULT_USER_GOAL = "relaxDecompress";
const VALID_MODES = new Set(["chill", "bareMetal"]);
const VALID_USER_GOALS = new Set([
  "relaxDecompress",
  "reduceDoomscrolling",
  "focusLearn",
  "lowerScreenTime",
  "curiosityGuidedLearning"
]);

const modeButtons = Array.from(document.querySelectorAll("[data-mode]"));
const developerModeInput = document.querySelector("#developer-mode");
const adaptiveGuidanceInput = document.querySelector("#adaptive-guidance");
const adaptiveGuidanceStatus = document.querySelector("#adaptive-guidance-status");
const userGoalSelect = document.querySelector("#user-goal");

chrome.storage.local.get(
  {
    [STORAGE_KEY]: DEFAULT_MODE,
    [DEVELOPER_MODE_STORAGE_KEY]: false,
    [ADAPTIVE_GUIDANCE_STORAGE_KEY]: false,
    [USER_GOAL_STORAGE_KEY]: DEFAULT_USER_GOAL
  },
  (items) => {
    setActiveMode(normalizeMode(items[STORAGE_KEY]));
    setAdaptiveGuidance(Boolean(items[ADAPTIVE_GUIDANCE_STORAGE_KEY]));
    setUserGoal(normalizeUserGoal(items[USER_GOAL_STORAGE_KEY]));
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

if (adaptiveGuidanceInput) {
  adaptiveGuidanceInput.addEventListener("change", () => {
    const enabled = adaptiveGuidanceInput.checked;
    chrome.storage.local.set({ [ADAPTIVE_GUIDANCE_STORAGE_KEY]: enabled }, () => {
      setAdaptiveGuidance(enabled);
    });
  });
}

if (userGoalSelect) {
  userGoalSelect.addEventListener("change", () => {
    const userGoal = normalizeUserGoal(userGoalSelect.value);
    chrome.storage.local.set({ [USER_GOAL_STORAGE_KEY]: userGoal }, () => {
      setUserGoal(userGoal);
    });
  });
}

function normalizeMode(mode) {
  return VALID_MODES.has(mode) ? mode : DEFAULT_MODE;
}

function normalizeUserGoal(userGoal) {
  return VALID_USER_GOALS.has(userGoal) ? userGoal : DEFAULT_USER_GOAL;
}

function setActiveMode(mode) {
  modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === mode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function setAdaptiveGuidance(enabled) {
  if (adaptiveGuidanceInput) {
    adaptiveGuidanceInput.checked = enabled;
  }

  if (adaptiveGuidanceStatus) {
    adaptiveGuidanceStatus.textContent = enabled ? "On" : "Off";
  }
}

function setUserGoal(userGoal) {
  if (userGoalSelect) {
    userGoalSelect.value = normalizeUserGoal(userGoal);
  }
}
