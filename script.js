"use strict";

/*
 * MIDNIGHT 1000
 * AESTHETICS STUDIO
 *
 * Frontend configuration.
 *
 * IMPORTANT:
 * - ticketPrice is intentionally locked to ₹999 for the initial version.
 * - backendEndpoint is intentionally left as YOUR_BACKEND_ENDPOINT.
 * - Payment verification is manual.
 * - Never put API keys, passwords, Gmail credentials, or other secrets here.
 *
 * When a backend is connected, it should accept the registration payload
 * documented below and handle email/payment verification securely server-side.
 */

const CONFIG = Object.freeze({
  backendEndpoint: "YOUR_BACKEND_ENDPOINT",

  emailjs: {
  publicKey: "OE6ZjjxKYf1mSes4f",
  serviceId: "service_gvif7q9",
  templateId: "template_xszcfbg"
},
  eventName: "MIDNIGHT 1000",
  eventDate: "17 October 2026",
  eventTime: "9 PM – 1 AM",
  venue: "Raj Vilas Resort Kawabandh, Gobindpur Dhanbad, Jharkhand",

  ticketPrice: 999,
  currency: "INR",

  upiId: "7082653911@ybl",
  payeeName: "AESTHETICS STUDIO",

  supportEmail: "support.aesthetics@gmail.com",
  whatsappContact: "917082653911",

  /*
   * This function is the intended future pricing seam.
   *
   * In production, a backend should determine the authoritative price.
   * The frontend must never be trusted to enforce ticket pricing.
   */
  getTicketPrice() {
    return this.ticketPrice;
  }
});
emailjs.init({
  publicKey: CONFIG.emailjs.publicKey
});

const DOM = {
  body: document.body,
  header: document.getElementById("site-header"),
  menuToggle: document.getElementById("menu-toggle"),
  primaryNavigation: document.getElementById("primary-navigation"),

  registrationForm: document.getElementById("registration-form"),
  fullName: document.getElementById("full-name"),
  whatsappNumber: document.getElementById("whatsapp-number"),
  submitPaymentButton: document.getElementById("submit-payment-button"),
  ticketPrice: document.getElementById("ticket-price"),

  nameError: document.getElementById("name-error"),
  whatsappError: document.getElementById("whatsapp-error"),
  formStatus: document.getElementById("form-status"),

  paymentSuccess: document.getElementById("payment-success"),
  upiPaymentButton: document.getElementById("upi-payment-button"),
  testingNotice: document.getElementById("testing-notice"),

  toast: document.getElementById("toast")
};

const state = {
  isSubmitting: false,
  registrationPayload: null,
  toastTimer: null
};

/* ---------------------------------------------------------
   Initialization
--------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", initialize);

function initialize() {
  DOM.ticketPrice.textContent = formatCurrency(CONFIG.getTicketPrice());
  DOM.submitPaymentButton.querySelector("span").textContent =
    `Pay ${formatCurrency(CONFIG.getTicketPrice())}`;

  DOM.upiPaymentButton.querySelector("span").textContent =
    `Pay ${formatCurrency(CONFIG.getTicketPrice())} via UPI`;

  bindNavigation();
  bindRegistrationForm();
  bindUPIPayment();
  bindFieldValidation();
  bindEscapeKey();

  if (CONFIG.backendEndpoint === "YOUR_BACKEND_ENDPOINT") {
    DOM.testingNotice.hidden = false;
  }
}

/* ---------------------------------------------------------
   Navigation
--------------------------------------------------------- */

function bindNavigation() {
  if (!DOM.menuToggle || !DOM.primaryNavigation) {
    return;
  }

  DOM.menuToggle.addEventListener("click", toggleMobileNavigation);

  const navLinks = DOM.primaryNavigation.querySelectorAll("a");

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      closeMobileNavigation();
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", handleInternalNavigation);
  });
}

function toggleMobileNavigation() {
  const isOpen = DOM.menuToggle.getAttribute("aria-expanded") === "true";

  DOM.menuToggle.setAttribute("aria-expanded", String(!isOpen));
  DOM.primaryNavigation.classList.toggle("is-open", !isOpen);
  DOM.body.classList.toggle("menu-open", !isOpen);

  DOM.menuToggle.setAttribute(
    "aria-label",
    isOpen ? "Open navigation menu" : "Close navigation menu"
  );
}

function closeMobileNavigation() {
  if (!DOM.menuToggle || !DOM.primaryNavigation) {
    return;
  }

  DOM.menuToggle.setAttribute("aria-expanded", "false");
  DOM.primaryNavigation.classList.remove("is-open");
  DOM.body.classList.remove("menu-open");
  DOM.menuToggle.setAttribute("aria-label", "Open navigation menu");
}

function handleInternalNavigation(event) {
  const href = event.currentTarget.getAttribute("href");

  if (!href || href === "#" || !href.startsWith("#")) {
    return;
  }

  const target = document.querySelector(href);

  if (!target) {
    return;
  }

  event.preventDefault();

  closeMobileNavigation();

  const headerHeight = DOM.header
    ? DOM.header.getBoundingClientRect().height
    : 0;

  const targetTop =
    target.getBoundingClientRect().top +
    window.scrollY -
    headerHeight -
    10;

  window.scrollTo({
    top: Math.max(0, targetTop),
    behavior: prefersReducedMotion() ? "auto" : "smooth"
  });

  if (history.pushState) {
    history.pushState(null, "", href);
  }
}

function bindEscapeKey() {
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMobileNavigation();
    }
  });
}

/* ---------------------------------------------------------
   Registration
--------------------------------------------------------- */

function bindRegistrationForm() {
  if (!DOM.registrationForm) {
    return;
  }

  DOM.registrationForm.addEventListener("submit", handleRegistrationSubmit);
}

async function handleRegistrationSubmit(event) {
  event.preventDefault();

  if (state.isSubmitting) {
    return;
  }

  clearFormMessages();

  const validation = validateRegistration();

  if (!validation.valid) {
    showFormError(validation.message);

    const firstInvalid = validation.firstInvalid;

    if (firstInvalid) {
      firstInvalid.focus();
    }

    return;
  }

  const payload = createRegistrationPayload();

  state.isSubmitting = true;
  setSubmitState(true);

  try {
    const result = await submitRegistration(payload);

    if (!result.success) {
      throw new Error(result.message || "Unable to submit registration.");
    }

    state.registrationPayload = payload;

    showSubmissionSuccess();

    showToast(
  "Your details are submitted.",
  "success"
);
  } catch (error) {
    console.error("Registration submission error:", error);

    showFormError(
      error && error.message
        ? error.message
        : "Something went wrong. Please try again."
    );

    showToast(
      error && error.message
        ? error.message
        : "Unable to submit registration.",
      "error"
    );
  } finally {
    state.isSubmitting = false;
    setSubmitState(false);
  }
}

function validateRegistration() {
  const name = DOM.fullName.value.trim();
  const whatsapp = DOM.whatsappNumber.value.trim();

  let valid = true;
  let firstInvalid = null;
  const messages = [];

  if (name.length < 2) {
    valid = false;
    firstInvalid = firstInvalid || DOM.fullName;
    setFieldError(
      DOM.fullName,
      DOM.nameError,
      "Please enter your full name."
    );
    messages.push("Please enter your full name.");
  } else if (name.length > 100) {
    valid = false;
    firstInvalid = firstInvalid || DOM.fullName;
    setFieldError(
      DOM.fullName,
      DOM.nameError,
      "Name must be 100 characters or fewer."
    );
    messages.push("Name must be 100 characters or fewer.");
  }

  const normalizedWhatsApp = normalizePhone(whatsapp);

  if (!isValidIndianWhatsAppNumber(normalizedWhatsApp)) {
    valid = false;
    firstInvalid = firstInvalid || DOM.whatsappNumber;

    setFieldError(
      DOM.whatsappNumber,
      DOM.whatsappError,
      "Enter a valid Indian WhatsApp number."
    );

    messages.push("Enter a valid Indian WhatsApp number.");
  }

  return {
    valid,
    firstInvalid,
    message: messages.join(" ")
  };
}

function bindFieldValidation() {
  DOM.fullName.addEventListener("input", () => {
    DOM.fullName.classList.remove("invalid");
    DOM.nameError.textContent = "";
    DOM.formStatus.textContent = "";
  });

  DOM.whatsappNumber.addEventListener("input", () => {
    DOM.whatsappNumber.classList.remove("invalid");
    DOM.whatsappError.textContent = "";
    DOM.formStatus.textContent = "";

    /*
     * Keep the input friendly while still allowing spaces, + and country code.
     * The backend should perform its own validation as the authoritative layer.
     */
    DOM.whatsappNumber.value = DOM.whatsappNumber.value
      .replace(/[^\d+\s()-]/g, "")
      .slice(0, 20);
  });

  DOM.fullName.addEventListener("blur", () => {
    if (DOM.fullName.value.trim().length > 0) {
      validateSingleName();
    }
  });

  DOM.whatsappNumber.addEventListener("blur", () => {
    if (DOM.whatsappNumber.value.trim().length > 0) {
      validateSingleWhatsApp();
    }
  });
}

function validateSingleName() {
  const name = DOM.fullName.value.trim();

  if (name.length < 2) {
    setFieldError(
      DOM.fullName,
      DOM.nameError,
      "Please enter your full name."
    );
    return false;
  }

  clearFieldError(DOM.fullName, DOM.nameError);
  return true;
}

function validateSingleWhatsApp() {
  const phone = normalizePhone(DOM.whatsappNumber.value);

  if (!isValidIndianWhatsAppNumber(phone)) {
    setFieldError(
      DOM.whatsappNumber,
      DOM.whatsappError,
      "Enter a valid Indian WhatsApp number."
    );
    return false;
  }

  clearFieldError(DOM.whatsappNumber, DOM.whatsappError);
  return true;
}

function setFieldError(input, errorElement, message) {
  input.classList.add("invalid");
  errorElement.textContent = message;
}

function clearFieldError(input, errorElement) {
  input.classList.remove("invalid");
  errorElement.textContent = "";
}

function clearFormMessages() {
  clearFieldError(DOM.fullName, DOM.nameError);
  clearFieldError(DOM.whatsappNumber, DOM.whatsappError);
  DOM.formStatus.textContent = "";
}

function showFormError(message) {
  DOM.formStatus.textContent = message;
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function isValidIndianWhatsAppNumber(phone) {
  /*
   * Accepts:
   * 9876543210
   * 919876543210
   *
   * Also handles common input forms such as:
   * +91 98765 43210
   * +91-98765-43210
   */
  if (/^[6-9]\d{9}$/.test(phone)) {
    return true;
  }

  if (/^91[6-9]\d{9}$/.test(phone)) {
    return true;
  }

  return false;
}

/* ---------------------------------------------------------
   Payload
--------------------------------------------------------- */

function createRegistrationPayload() {
  const ticketPrice = CONFIG.getTicketPrice();

  return {
    name: DOM.fullName.value.trim(),
    whatsapp: normalizeWhatsAppForBackend(DOM.whatsappNumber.value),
    ticketPrice,
    eventName: CONFIG.eventName,
    eventDate: CONFIG.eventDate,
    eventTime: CONFIG.eventTime,
    venue: CONFIG.venue,
    timestamp: new Date().toISOString(),
    paymentStatus: "PENDING VERIFICATION"
  };
}

function normalizeWhatsAppForBackend(value) {
  const digits = normalizePhone(value);

  if (/^91[6-9]\d{9}$/.test(digits)) {
    return `+${digits}`;
  }

  if (/^[6-9]\d{9}$/.test(digits)) {
    return `+91${digits}`;
  }

  return value.trim();
}

/* ---------------------------------------------------------
   Backend
--------------------------------------------------------- */
async function submitRegistration(payload) {
  try {
    const templateParams = {
      name: payload.name,
      whatsapp: payload.whatsapp,
      ticketPrice: payload.ticketPrice,
      paymentStatus: payload.paymentStatus,
      eventName: payload.eventName,
      eventDate: payload.eventDate,
      eventTime: payload.eventTime,
      venue: payload.venue,
      timestamp: payload.timestamp
    };

    const response = await emailjs.send(
      CONFIG.emailjs.serviceId,
      CONFIG.emailjs.templateId,
      templateParams
    );

    if (!response || response.status !== 200) {
      throw new Error(
        "Registration could not be submitted. Please try again."
      );
    }

    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error("EmailJS registration error:", error);

    throw new Error(
      "We could not submit your registration. Please try again."
    );
  }
}

location.href = upiIntent;
  } catch (error) {
    console.error("Unable to open UPI intent:", error);

    showToast(
      "Unable to open a UPI application on this device. Please use your UPI app manually with the displayed UPI ID.",
      "error"
    );
  }
}

/* ---------------------------------------------------------
   UI State
--------------------------------------------------------- */

function setSubmitState(isSubmitting) {
  DOM.submitPaymentButton.disabled = isSubmitting;

  const text = DOM.submitPaymentButton.querySelector("span");

  if (isSubmitting) {
    text.textContent = "Submitting…";
  } else {
    text.textContent = `Pay ${formatCurrency(CONFIG.getTicketPrice())}`;
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

function showToast(message, type = "success") {
  if (!DOM.toast) {
    return;
  }

  clearTimeout(state.toastTimer);

  DOM.toast.textContent = message;
  DOM.toast.className = `toast show ${type}`;

  state.toastTimer = window.setTimeout(() => {
    DOM.toast.classList.remove("show");
  }, 5000);
}

function prefersReducedMotion() {
  return (
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/* ---------------------------------------------------------
   Basic defensive handling
--------------------------------------------------------- */

window.addEventListener("error", (event) => {
  console.error("Website error:", event.error || event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});
