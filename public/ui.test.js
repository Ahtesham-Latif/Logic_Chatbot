/**
 * @jest-environment jsdom
 */

const fs = require("fs");
const path = require("path");

const htmlPath = path.resolve(__dirname, "../public/index.html");
const htmlContent = fs.readFileSync(htmlPath, "utf8");
const appJsPath = path.resolve(__dirname, "app.js");

function bootstrapApp() {
  document.documentElement.innerHTML = htmlContent;
  jest.clearAllMocks();

  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      statusText: "OK",
      json: () =>
        Promise.resolve({
          response: {
            valid: true,
            type: "Propositional Logic",
            mood: null,
            details: null,
            proof: [
              { step: 1, statement: "P → Q", rule: "Premise" },
              { step: 2, statement: "P", rule: "Premise" },
              { step: 3, statement: "Q", rule: "Modus Ponens" }
            ],
            error: null
          }
        })
    })
  );

  Element.prototype.scrollTo = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();

  const scriptContent = fs.readFileSync(appJsPath, "utf8");
  window.eval(`(function() { ${scriptContent} })();`);
  window.dispatchEvent(new window.Event("load"));
}

describe("Logic Validation Agent - Strict UI & Component Tests", () => {
  let originalClipboard;

  beforeAll(() => {
    originalClipboard = navigator.clipboard;
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockImplementation(() => Promise.resolve())
      }
    });
  });

  afterAll(() => {
    Object.assign(navigator, { clipboard: originalClipboard });
  });

  beforeEach(() => {
    localStorage.clear();
    bootstrapApp();
  });

  describe("Initial Rendering & Theme Control", () => {
    test("renders all major DOM node containers correctly", () => {
      expect(document.getElementById("chat-container")).not.toBeNull();
      expect(document.getElementById("chat-form")).not.toBeNull();
      expect(document.getElementById("symbol-bar")).not.toBeNull();
      expect(document.getElementById("welcomeModal")).not.toBeNull();
    });

    test("toggles the dark mode theme across the body element", () => {
      const themeToggle = document.getElementById("theme-toggle");

      expect(document.body.classList.contains("dark-mode")).toBe(false);
      themeToggle.click();
      expect(document.body.classList.contains("dark-mode")).toBe(true);
      expect(localStorage.getItem("logic-agent-theme")).toBe("dark");
      themeToggle.click();
      expect(document.body.classList.contains("dark-mode")).toBe(false);
      expect(localStorage.getItem("logic-agent-theme")).toBe("light");
    });

    test("marks accessibility attributes on the theme toggle and dialogs", () => {
      const themeToggle = document.getElementById("theme-toggle");
      const welcomeModal = document.getElementById("welcomeModal");
      const purposeModal = document.getElementById("purposeModal");

      expect(themeToggle.getAttribute("aria-label")).toContain("dark mode");
      expect(welcomeModal.getAttribute("role")).toBe("dialog");
      expect(welcomeModal.getAttribute("aria-modal")).toBe("true");
      expect(purposeModal.getAttribute("role")).toBe("dialog");
    });
  });

  describe("Modal Navigation & Interactions", () => {
    test('shows welcome modal automatically, and closes on "Get Started"', () => {
      const welcomeModal = document.getElementById("welcomeModal");
      const startBtn = document.getElementById("startBtn");

      expect(welcomeModal.style.display).toBe("flex");

      startBtn.click();
      expect(welcomeModal.style.display).toBe("none");
      expect(localStorage.getItem("logic-agent-welcome-dismissed")).toBe("true");
    });

    test('opens and closes the "How It Works" info modal properly', () => {
      const purposeModal = document.getElementById("purposeModal");
      const infoBtn = document.getElementById("infoBtn");
      const closeBtn = document.getElementById("closeBtn");

      expect(purposeModal.style.display).not.toBe("block");

      infoBtn.click();
      expect(purposeModal.style.display).toBe("block");

      closeBtn.click();
      expect(purposeModal.style.display).toBe("none");
    });

    test("keeps the welcome modal dismissed on reload after the user closes it", () => {
      localStorage.setItem("logic-agent-welcome-dismissed", "true");
      bootstrapApp();

      const welcomeModal = document.getElementById("welcomeModal");
      expect(welcomeModal.style.display).toBe("none");
    });

    test("closes actively open modals when the Escape key is dispatched", () => {
      const purposeModal = document.getElementById("purposeModal");
      const welcomeModal = document.getElementById("welcomeModal");

      purposeModal.style.display = "block";
      welcomeModal.style.display = "flex";

      document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape" }));

      expect(purposeModal.style.display).toBe("none");
      expect(welcomeModal.style.display).toBe("none");
    });
  });

  describe("Form Actions & Logic Validation Chat", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test("inserts custom symbolic logic operators from the symbol bar into the input", () => {
      const userInput = document.getElementById("user-input");
      const impliesBtn = document.querySelector('button[data-symbol="→"]');
      const thereforeBtn = document.querySelector('button[data-symbol="∴"]');

      impliesBtn.click();
      expect(userInput.value).toBe("→");

      thereforeBtn.click();
      expect(userInput.value).toBe("→∴");
    });

    test("successfully generates valid chat UI components upon correct API logic checks", async () => {
      const userInput = document.getElementById("user-input");
      const chatForm = document.getElementById("chat-form");
      const chatHistory = document.getElementById("chat-history");

      userInput.value = "P → Q, P ∴ Q";
      chatForm.dispatchEvent(new window.Event("submit", { cancelable: true, bubbles: true }));

      const userMessages = chatHistory.querySelectorAll(".user-message");
      expect(userMessages.length).toBe(1);
      expect(userMessages[0].textContent).toBe("P → Q, P ∴ Q");
      expect(userInput.value).toBe("");

      await jest.runAllTimersAsync();

      const botMessages = chatHistory.querySelectorAll(".bot-message");
      const latestBotMessage = botMessages[botMessages.length - 1];

      expect(latestBotMessage.innerHTML).toContain("VALID ARGUMENT");
      expect(latestBotMessage.innerHTML).toContain("Propositional Logic");

      const ruleSpans = latestBotMessage.querySelectorAll(".step-rule");
      expect(ruleSpans.length).toBeGreaterThan(0);
      expect(ruleSpans[2].textContent).toContain("Modus Ponens");

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test("renders a threat warning when the backend flags an intrusion", async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          json: () =>
            Promise.resolve({
              response: {
                valid: false,
                type: null,
                mood: null,
                details: null,
                proof: [],
                error: null,
                threat: true,
                threat_message: "Intruder found : You need to go ASAP"
              }
            })
        })
      );

      const userInput = document.getElementById("user-input");
      const chatForm = document.getElementById("chat-form");
      const chatHistory = document.getElementById("chat-history");

      userInput.value = "P → Q, P ∴ Q";
      chatForm.dispatchEvent(new window.Event("submit", { cancelable: true, bubbles: true }));

      await jest.runAllTimersAsync();

      const botMessages = chatHistory.querySelectorAll(".bot-message");
      const latestBotMessage = botMessages[botMessages.length - 1];

      expect(latestBotMessage.innerHTML).toContain("Intruder found");
      expect(latestBotMessage.innerHTML).toContain("You need to go ASAP");
      expect(latestBotMessage.innerHTML).not.toContain("INVALID ARGUMENT");
    });

    test("renders a normal non-argument result without a threat warning", async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          json: () =>
            Promise.resolve({
              response: {
                valid: false,
                type: null,
                mood: null,
                details: null,
                proof: [],
                error: "No logical argument provided"
              }
            })
        })
      );

      const userInput = document.getElementById("user-input");
      const chatForm = document.getElementById("chat-form");
      const chatHistory = document.getElementById("chat-history");

      userInput.value = "VALIDATE A LOGICAL ARGUMENT.";
      chatForm.dispatchEvent(new window.Event("submit", { cancelable: true, bubbles: true }));

      await jest.runAllTimersAsync();

      const botMessages = chatHistory.querySelectorAll(".bot-message");
      const latestBotMessage = botMessages[botMessages.length - 1];

      expect(latestBotMessage.innerHTML).toContain("NOT AN ARGUMENT");
      expect(latestBotMessage.innerHTML).toContain("No logical argument provided");
      expect(latestBotMessage.innerHTML).not.toContain("Intruder found");
    });
  });
});
