"use strict";

const STORAGE_KEYS = {
  theme: "logic-agent-theme",
  welcomeDismissed: "logic-agent-welcome-dismissed"
};

const chatHistory = document.getElementById("chat-history");
const userInput = document.getElementById("user-input");
const chatForm = document.getElementById("chat-form");
const themeToggle = document.getElementById("theme-toggle");
const welcomeModal = document.getElementById("welcomeModal");
const purposeModal = document.getElementById("purposeModal");
const infoBtn = document.getElementById("infoBtn");
const closeBtn = document.getElementById("closeBtn");
const symbolBar = document.getElementById("symbol-bar");
const startBtn = document.getElementById("startBtn");
const learnMoreBtn = document.getElementById("learnMoreBtn");

let activeModal = null;
let previousFocus = null;

function readStorage(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures in private/locked-down contexts.
  }
}

function isDarkTheme() {
  return document.body.classList.contains("dark-mode");
}

function applyTheme(isDarkMode, persist = false) {
  document.body.classList.toggle("dark-mode", isDarkMode);
  themeToggle.setAttribute("aria-pressed", String(isDarkMode));
  themeToggle.title = isDarkMode ? "Switch to light mode" : "Switch to dark mode";
  themeToggle.setAttribute("aria-label", isDarkMode ? "Switch to light mode" : "Switch to dark mode");
  themeToggle.textContent = isDarkMode ? "☀️" : "🌙";

  if (persist) {
    writeStorage(STORAGE_KEYS.theme, isDarkMode ? "dark" : "light");
  }
}

function initTheme() {
  const storedTheme = readStorage(STORAGE_KEYS.theme);
  const prefersDark = typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
    : false;

  applyTheme(storedTheme ? storedTheme === "dark" : prefersDark);
}

function getFocusableElements(container) {
  const selector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "textarea:not([disabled])",
    "select:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
  ].join(",");

  return Array.from(container.querySelectorAll(selector)).filter((element) => {
    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden";
  });
}

function openModal(modal, focusSelector) {
  if (!modal) return;

  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  activeModal = modal;

  modal.style.display = modal === welcomeModal ? "flex" : "block";
  modal.setAttribute("aria-hidden", "false");

  const target = focusSelector ? modal.querySelector(focusSelector) : getFocusableElements(modal)[0];
  window.setTimeout(() => {
    if (target && typeof target.focus === "function") {
      target.focus();
    } else if (typeof modal.focus === "function") {
      modal.focus();
    }
  }, 0);
}

function closeModal(modal, { restoreFocus = true } = {}) {
  if (!modal) return;

  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");

  if (activeModal === modal) {
    activeModal = null;
  }

  if (restoreFocus && previousFocus && typeof previousFocus.focus === "function") {
    previousFocus.focus();
  }
}

function closeAllOpenModals() {
  const openModals = [purposeModal, welcomeModal].filter((modal) => modal && modal.style.display !== "none");

  openModals.forEach((modal) => {
    closeModal(modal, { restoreFocus: false });
  });

  if (previousFocus && typeof previousFocus.focus === "function") {
    previousFocus.focus();
  }
}

function openWelcomeModal() {
  if (readStorage(STORAGE_KEYS.welcomeDismissed) === "true") {
    closeModal(welcomeModal, { restoreFocus: false });
    return;
  }

  openModal(welcomeModal, "#startBtn");
}

function dismissWelcomeModal() {
  writeStorage(STORAGE_KEYS.welcomeDismissed, "true");
  closeModal(welcomeModal);
}

function insertAtCursor(field, value) {
  if (document.selection) {
    field.focus();
    document.selection.createRange().text = value;
    return;
  }

  if (field.selectionStart || field.selectionStart === 0) {
    const startPos = field.selectionStart;
    const endPos = field.selectionEnd;

    field.value = field.value.substring(0, startPos) + value + field.value.substring(endPos, field.value.length);
    field.selectionStart = startPos + value.length;
    field.selectionEnd = startPos + value.length;
    field.focus();
    return;
  }

  field.value += value;
  field.focus();
}

function createBubble(isUser) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("message-wrapper", isUser ? "user" : "bot");

  const avatar = document.createElement("div");
  avatar.classList.add("avatar", isUser ? "user-avatar" : "bot-avatar");
  avatar.textContent = isUser ? "U" : "🤠";

  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", isUser ? "user-message" : "bot-message");

  wrapper.appendChild(avatar);
  wrapper.appendChild(msgDiv);
  chatHistory.appendChild(wrapper);
  chatHistory.scrollTop = chatHistory.scrollHeight;
  return msgDiv;
}

function normalizeLogicResponse(apiResponse) {
  if (apiResponse && apiResponse.response && typeof apiResponse.response === "object") {
    return apiResponse.response;
  }

  if (apiResponse && apiResponse.choices && apiResponse.choices[0]) {
    let logicJSON = apiResponse.choices[0].message.content;

    const codeBlock = logicJSON.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlock) {
      logicJSON = codeBlock[1];
    } else {
      const jsonMatch = logicJSON.match(/\{[\s\S]*\}/);
      if (jsonMatch) logicJSON = jsonMatch[0];
    }

    return JSON.parse(logicJSON);
  }

  throw new Error(apiResponse?.error ? JSON.stringify(apiResponse.error) : "Invalid API response");
}

function getFriendlyErrorMessage(error) {
  const rawMessage = error instanceof Error ? error.message : String(error || "");
  const lowerMessage = rawMessage.toLowerCase();

  if (lowerMessage.includes("failed to fetch") || lowerMessage.includes("networkerror")) {
    return {
      title: "Network Error",
      message: "We could not reach the server. Check your connection and try again."
    };
  }

  if (lowerMessage.includes("unexpected token") || lowerMessage.includes("invalid json") || lowerMessage.includes("parse")) {
    return {
      title: "Response Error",
      message: "The server returned an invalid response. Please try again."
    };
  }

  if (rawMessage.startsWith("System Error:") || rawMessage.includes("OpenRouter API Error")) {
    return {
      title: "Backend Error",
      message: rawMessage
    };
  }

  return {
    title: "Error validating argument",
    message: rawMessage || "Please check your input format and try again."
  };
}

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  createBubble(true).textContent = text;
  userInput.value = "";

  const botBubble = createBubble(false);
  botBubble.innerHTML = `
    <div class="processing-container">
      <span class="status-text" id="status">Initializing Logic Engine...</span>
      <div class="lvl-bar-bg"><div class="lvl-bar-fill" id="fill"></div></div>
    </div>`;

  const fill = botBubble.querySelector("#fill");
  const status = botBubble.querySelector("#status");
  const runProgress = (p, t) => {
    fill.style.width = `${p}%`;
    status.textContent = t;
  };

  const apiPromise = fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userInput: text })
  }).then(async (response) => {
    let payload = null;

    try {
      payload = await response.json();
    } catch {
      throw new Error("The server returned an invalid JSON response.");
    }

    if (!response.ok) {
      const responseError = payload?.response?.error || payload?.error || `Request failed with status ${response.status}`;
      throw new Error(responseError);
    }

    return payload;
  });

  const animationTimeouts = [];
  const animationPromise = new Promise((resolve) => {
    const timings = [
      { time: 500, progress: 15, text: "Converting into Symbols..." },
      { time: 2000, progress: 35, text: "Choosing the Type..." },
      { time: 3500, progress: 60, text: "Validating the Argument..." },
      { time: 5000, progress: 85, text: "Constructing Truth Table..." },
      { time: 7200, progress: 95, text: "Finalizing Proof..." }
    ];

    timings.forEach(({ time, progress, text: progressText }) => {
      animationTimeouts.push(window.setTimeout(() => runProgress(progress, progressText), time));
    });

    animationTimeouts.push(window.setTimeout(resolve, 1000));
  });

  try {
    await Promise.race([apiPromise, animationPromise]);
    const apiResponse = await apiPromise;

    animationTimeouts.forEach(clearTimeout);

    const logic = normalizeLogicResponse(apiResponse);
    runProgress(100, "Validation Complete.");

    const copyIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
    const checkIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--valid-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

    let html = "";

    const isThreatResponse = logic.threat === true;

    if (isThreatResponse) {
      html = `
        <div class="threat-box" role="alert" aria-live="assertive">
          <div class="threat-title">Intruder found</div>
          <div class="threat-message">${logic.threat_message || "You need to go ASAP"}</div>
        </div>`;
    } else {
      html = `<button type="button" class="copy-proof-btn" title="Copy Proof" aria-label="Copy proof to clipboard">${copyIcon}</button>`;

      html += logic.valid
        ? `<div class="status-valid">VALID ARGUMENT</div><div class="success-message">Hurrah! Your logic is sound!</div>`
        : `<div class="status-invalid">${logic.type === null ? "NOT AN ARGUMENT" : "INVALID ARGUMENT"}</div>`;

      const logicTypeLabel = logic.type || "Unrecognized";
      html += `<div class="logic-header">Type: ${logicTypeLabel} ${logic.mood ? `| Mood: ${logic.mood}` : ""}</div>`;

      if (logic.details) {
        html += `<div class="info-box"><strong>Categorical Terms:</strong><br>
          M (Middle): ${logic.details.middle_term || "N/A"}<br>
          P (Major): ${logic.details.major_term || "N/A"}<br>
          S (Minor): ${logic.details.minor_term || "N/A"}</div>`;
      }

      if (logic.dictionary) {
        html += `<div class="info-box"><strong>Dictionary:</strong>`;
        for (const key in logic.dictionary) {
          html += `<div>${key}: ${logic.dictionary[key]}</div>`;
        }
        html += `</div>`;
      }

      if (logic.proof && Array.isArray(logic.proof)) {
        html += `<div class="proof-container">`;
        logic.proof.forEach((step) => {
          const statement = String(step.statement || "").replace(/->/g, "→");
          html += `<div class="proof-step"><span class="step-num">${step.step}.</span><span class="step-statement">${statement}</span><span class="step-rule">— ${step.rule}</span></div>`;
        });
        html += `</div>`;
      }

      if (!logic.valid) {
        html += `<div class="reason-box"><strong>LOGICAL ERROR:</strong><br>${logic.error || "No logical argument provided"}</div>`;
      }
    }

    botBubble.innerHTML = html;

    const copyBtn = botBubble.querySelector(".copy-proof-btn");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        let copyText = logic.valid ? "VALID ARGUMENT\n" : `${logic.type === null ? "NOT AN ARGUMENT" : "INVALID ARGUMENT"}\n`;
        copyText += `Type: ${logic.type || "Unrecognized"} ${logic.mood ? `| Mood: ${logic.mood}` : ""}\n\n`;

        if (logic.proof && Array.isArray(logic.proof)) {
          copyText += "Proof:\n";
          logic.proof.forEach((step) => {
            copyText += `${step.step}. ${String(step.statement || "").replace(/->/g, "→")} — ${step.rule}\n`;
          });
        }

        if (!logic.valid && logic.error) {
          copyText += `\nERROR: ${logic.error}\n`;
        }

        navigator.clipboard.writeText(copyText.trim()).then(() => {
          copyBtn.innerHTML = checkIcon;
          window.setTimeout(() => {
            copyBtn.innerHTML = copyIcon;
          }, 2000);
        });
      });
    }

    chatHistory.scrollTop = chatHistory.scrollHeight;
  } catch (error) {
    animationTimeouts.forEach(clearTimeout);

    const friendly = getFriendlyErrorMessage(error);
    botBubble.innerHTML = `
      <div class="status-invalid">⚠️ ${friendly.title}</div>
      <div class="error-message">${friendly.message}</div>`;
    console.error("Error:", error);
  }
}

function trapFocus(event) {
  if (!activeModal || event.key !== "Tab") return;

  const focusable = getFocusableElements(activeModal);
  if (!focusable.length) {
    event.preventDefault();
    activeModal.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function bindEvents() {
  window.addEventListener("load", openWelcomeModal);

  startBtn.addEventListener("click", () => {
    writeStorage(STORAGE_KEYS.welcomeDismissed, "true");
    closeModal(welcomeModal);
  });

  learnMoreBtn.addEventListener("click", () => {
    writeStorage(STORAGE_KEYS.welcomeDismissed, "true");
    closeModal(welcomeModal, { restoreFocus: false });
    openModal(purposeModal, "#closeBtn");
  });

  infoBtn.addEventListener("click", () => {
    openModal(purposeModal, "#closeBtn");
  });

  closeBtn.addEventListener("click", () => {
    closeModal(purposeModal);
  });

  window.addEventListener("click", (event) => {
    if (event.target === purposeModal) {
      closeModal(purposeModal);
    }
    if (event.target === welcomeModal) {
      closeModal(welcomeModal);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activeModal) {
      closeAllOpenModals();
      return;
    }

    trapFocus(event);
  });

  themeToggle.addEventListener("click", () => {
    applyTheme(!isDarkTheme(), true);
  });

  symbolBar.addEventListener("click", (event) => {
    const btn = event.target.closest("button");
    if (!btn) return;

    const symbol = btn.getAttribute("data-symbol") || btn.textContent.trim();
    insertAtCursor(userInput, symbol);
  });

  chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage();
  });
}

initTheme();
bindEvents();
