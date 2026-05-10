const STORAGE_KEY = "personaLabsMode";
const DEBUG_STORAGE_KEY = "personaLabsDebugMode";
const PERSONA_PREFS_STORAGE_KEY = "personaLabsPersonaPreferences";
const DEFAULT_MODE = "studyGeneral";
const modeButtons = Array.from(document.querySelectorAll("[data-mode]"));
const debugModeInput = document.querySelector("#debug-mode");
const surveySaveButton = document.querySelector("#survey-save");

const DEFAULT_PERSONA_PREFERENCES = {
  version: 1,
  onboardingComplete: false,
  goals: [],
  preferredLearningDomains: [],
  stressDriftTriggers: [],
  desiredExplorationLevel: "balanced",
  volatilityTolerance: "medium",
  preferredCognitiveMode: "research"
};

loadMode();
loadDebugMode();
loadPersonaPreferences();

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

if (debugModeInput) {
  debugModeInput.addEventListener("change", () => {
    chrome.storage.local.set({ [DEBUG_STORAGE_KEY]: debugModeInput.checked });
  });
}

if (surveySaveButton) {
  surveySaveButton.addEventListener("click", () => {
    chrome.storage.local.set({ [PERSONA_PREFS_STORAGE_KEY]: readPersonaPreferencesForm() });
  });
}

function saveMode(mode) {
  chrome.storage.local.set({ [STORAGE_KEY]: mode });
}

function setActiveMode(mode) {
  const normalizedMode = mode === "study" ? DEFAULT_MODE : mode;
  modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === normalizedMode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function loadDebugMode() {
  if (!debugModeInput) {
    return;
  }

  chrome.storage.local.get({ [DEBUG_STORAGE_KEY]: false }, (items) => {
    debugModeInput.checked = Boolean(items[DEBUG_STORAGE_KEY]);
  });
}

function loadPersonaPreferences() {
  chrome.storage.local.get({ [PERSONA_PREFS_STORAGE_KEY]: DEFAULT_PERSONA_PREFERENCES }, (items) => {
    writePersonaPreferencesForm(items[PERSONA_PREFS_STORAGE_KEY] || DEFAULT_PERSONA_PREFERENCES);
  });
}

function readPersonaPreferencesForm() {
  return {
    version: 1,
    onboardingComplete: true,
    goals: splitListValue("#survey-goals"),
    preferredLearningDomains: splitListValue("#survey-domains"),
    stressDriftTriggers: splitListValue("#survey-triggers"),
    desiredExplorationLevel: valueFor("#survey-exploration", "balanced"),
    volatilityTolerance: valueFor("#survey-volatility", "medium"),
    preferredCognitiveMode: valueFor("#survey-cognitive-mode", "research")
  };
}

function writePersonaPreferencesForm(preferences) {
  setValue("#survey-goals", (preferences.goals || []).join(", "));
  setValue("#survey-domains", (preferences.preferredLearningDomains || []).join(", "));
  setValue("#survey-triggers", (preferences.stressDriftTriggers || []).join(", "));
  setValue("#survey-exploration", preferences.desiredExplorationLevel || "balanced");
  setValue("#survey-volatility", preferences.volatilityTolerance || "medium");
  setValue("#survey-cognitive-mode", preferences.preferredCognitiveMode || "research");
}

function splitListValue(selector) {
  return valueFor(selector, "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function valueFor(selector, fallback) {
  const element = document.querySelector(selector);
  return element && element.value ? element.value : fallback;
}

function setValue(selector, value) {
  const element = document.querySelector(selector);
  if (element) {
    element.value = value;
  }
}
