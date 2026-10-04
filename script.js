"use strict";


const CONFIG = Object.freeze({

  emailjs: {
    publicKey: "OE6ZjjxKYf1mSes4f",
    serviceId: "service_gvif7q9",
    templateId: "template_xszcfbg"
  },

  eventName: "MIDNIGHT 1000",

  eventDate: "17 October 2026",

  eventTime: "9 PM – 1 AM",

  venue:
    "Raj Vilas Resort Kawabandh, Gobindpur Dhanbad, Jharkhand",

  /*
   * CURRENT INITIAL PRICE
   *
   * This is intentionally 999 because the first 50 tickets
   * are advertised at ₹999.
   *
   * Automatic switching to ₹1710 after registration #50
   * requires a backend/database counter.
   */
  ticketPrice: 999,

  currency: "INR",

  /*
   * UPI DETAILS
   */
  upiId: "7082653911@ybl",

  payeeName: "AESTHETICS STUDIO",

  supportEmail:
    "support.aesthetics@gmail.com",

  whatsappContact:
    "917082653911",

  /*
   * EVENT COUNTDOWN
   *
   * India Standard Time:
   * 17 October 2026, 9:00 PM
   */
  countdownTarget:
    "2026-10-17T21:00:00+05:30"

});


/*
 * EMAILJS INITIALIZATION
 */

emailjs.init({
  publicKey: CONFIG.emailjs.publicKey
});


/*
 * DOM REFERENCES
 */

const DOM = {

  body: document.body,

  header:
    document.getElementById("site-header"),

  menuToggle:
    document.getElementById("menu-toggle"),

  primaryNavigation:
    document.getElementById("primary-navigation"),


  registrationForm:
    document.getElementById("registration-form"),

  fullName:
    document.getElementById("full-name"),

  whatsappNumber:
    document.getElementById("whatsapp-number"),

  submitPaymentButton:
    document.getElementById("submit-payment-button"),

  ticketPrice:
    document.getElementById("ticket-price"),


  nameError:
    document.getElementById("name-error"),

  whatsappError:
    document.getElementById("whatsapp-error"),

  formStatus:
    document.getElementById("form-status"),


  paymentSuccess:
    document.getElementById("payment-success"),

  retryUpiPaymentButton:
    document.getElementById("retry-upi-payment-button"),


  toast:
    document.getElementById("toast"),


  countdownDays:
    document.getElementById("countdown-days"),

  countdownHours:
    document.getElementById("countdown-hours"),

  countdownMinutes:
    document.getElementById("countdown-minutes"),

  countdownSeconds:
    document.getElementById("countdown-seconds")

};


/*
 * STATE
 */

const state = {

  isSubmitting: false,

  registrationPayload: null,

  toastTimer: null

};


/*
 * INITIALIZATION
 */

document.addEventListener(
  "DOMContentLoaded",
  initialize
);


function initialize() {

  DOM.ticketPrice.textContent =
    formatCurrency(CONFIG.ticketPrice);


  DOM.submitPaymentButton
    .querySelector("span")
    .textContent =
    `Pay ${formatCurrency(CONFIG.ticketPrice)} & Continue`;


  bindNavigation();

  bindRegistrationForm();

  bindFieldValidation();

  bindEscapeKey();

  bindRetryPayment();

  startCountdown();

}


/*
 * NAVIGATION
 */

function bindNavigation() {

  if (
    !DOM.menuToggle ||
    !DOM.primaryNavigation
  ) {
    return;
  }


  DOM.menuToggle.addEventListener(
    "click",
    toggleMobileNavigation
  );


  DOM.primaryNavigation
    .querySelectorAll("a")
    .forEach((link) => {

      link.addEventListener(
        "click",
        closeMobileNavigation
      );

    });


  document
    .querySelectorAll('a[href^="#"]')
    .forEach((link) => {

      link.addEventListener(
        "click",
        handleInternalNavigation
      );

    });

}


function toggleMobileNavigation() {

  const isOpen =
    DOM.menuToggle.getAttribute(
      "aria-expanded"
    ) === "true";


  DOM.menuToggle.setAttribute(
    "aria-expanded",
    String(!isOpen)
  );


  DOM.primaryNavigation.classList.toggle(
    "is-open",
    !isOpen
  );


  DOM.body.classList.toggle(
    "menu-open",
    !isOpen
  );


  DOM.menuToggle.setAttribute(
    "aria-label",
    isOpen
      ? "Open navigation menu"
      : "Close navigation menu"
  );

}


function closeMobileNavigation() {

  if (
    !DOM.menuToggle ||
    !DOM.primaryNavigation
  ) {
    return;
  }


  DOM.menuToggle.setAttribute(
    "aria-expanded",
    "false"
  );


  DOM.primaryNavigation.classList.remove(
    "is-open"
  );


  DOM.body.classList.remove(
    "menu-open"
  );


  DOM.menuToggle.setAttribute(
    "aria-label",
    "Open navigation menu"
  );

}


function handleInternalNavigation(event) {

  const href =
    event.currentTarget.getAttribute("href");


  if (
    !href ||
    href === "#" ||
    !href.startsWith("#")
  ) {
    return;
  }


  const target =
    document.querySelector(href);


  if (!target) {
    return;
  }


  event.preventDefault();


  closeMobileNavigation();


  const headerHeight =
    DOM.header
      ? DOM.header.getBoundingClientRect().height
      : 0;


  const targetTop =
    target.getBoundingClientRect().top +
    window.scrollY -
    headerHeight -
    10;


  window.scrollTo({

    top: Math.max(0, targetTop),

    behavior:
      prefersReducedMotion()
        ? "auto"
        : "smooth"

  });


  if (history.pushState) {

    history.pushState(
      null,
      "",
      href
    );

  }

}


/*
 * ESCAPE KEY
 */

function bindEscapeKey() {

  document.addEventListener(
    "keydown",
    (event) => {

      if (event.key === "Escape") {

        closeMobileNavigation();

      }

    }
  );

}


/*
 * REGISTRATION FORM
 */

function bindRegistrationForm() {

  if (!DOM.registrationForm) {
    return;
  }


  DOM.registrationForm.addEventListener(
    "submit",
    handleRegistrationSubmit
  );

}


async function handleRegistrationSubmit(event) {

  event.preventDefault();


  if (state.isSubmitting) {
    return;
  }


  clearFormMessages();


  const validation =
    validateRegistration();


  if (!validation.valid) {

    showFormError(
      validation.message
    );


    if (validation.firstInvalid) {

      validation.firstInvalid.focus();

    }


    return;
  }


  const payload =
    createRegistrationPayload();


  state.isSubmitting = true;


  setSubmitState(true);


  try {

    /*
     * FIRST:
     * Send registration details to EmailJS.
     */

    await submitRegistration(
      payload
    );


    state.registrationPayload =
      payload;


    /*
     * THEN:
     * Show payment/verification message.
     */

    showSubmissionSuccess();


    showToast(
      "Registration received. Complete the ₹999 payment in your UPI app.",
      "success"
    );


    /*
     * Finally open the user's UPI app.
     */

    window.setTimeout(
      () => openUPIPayment(),
      250
    );


  } catch (error) {

    console.error(
      "Registration submission error:",
      error
    );


    const message =
      error && error.message
        ? error.message
        : "Unable to submit registration. Please try again.";


    showFormError(message);


    showToast(
      message,
      "error"
    );


  } finally {

    state.isSubmitting = false;

    setSubmitState(false);

  }

}


/*
 * VALIDATION
 */

function validateRegistration() {

  const name =
    DOM.fullName.value.trim();


  const whatsapp =
    DOM.whatsappNumber.value.trim();


  let valid = true;

  let firstInvalid = null;

  const messages = [];


  if (name.length < 2) {

    valid = false;

    firstInvalid =
      DOM.fullName;


    setFieldError(
      DOM.fullName,
      DOM.nameError,
      "Please enter your full name."
    );


    messages.push(
      "Please enter your full name."
    );

  } else if (name.length > 100) {

    valid = false;

    firstInvalid =
      DOM.fullName;


    setFieldError(
      DOM.fullName,
      DOM.nameError,
      "Name must be 100 characters or fewer."
    );


    messages.push(
      "Name must be 100 characters or fewer."
    );

  }


  const normalizedWhatsApp =
    normalizePhone(whatsapp);


  if (
    !isValidIndianWhatsAppNumber(
      normalizedWhatsApp
    )
  ) {

    valid = false;

    firstInvalid =
      firstInvalid ||
      DOM.whatsappNumber;


    setFieldError(
      DOM.whatsappNumber,
      DOM.whatsappError,
      "Enter a valid Indian WhatsApp number."
    );


    messages.push(
      "Enter a valid Indian WhatsApp number."
    );

  }


  return {

    valid,

    firstInvalid,

    message:
      messages.join(" ")

  };

}


/*
 * LIVE FIELD VALIDATION
 */

function bindFieldValidation() {

  DOM.fullName.addEventListener(
    "input",
    () => {

      clearFieldError(
        DOM.fullName,
        DOM.nameError
      );


      DOM.formStatus.textContent =
        "";

    }
  );


  DOM.whatsappNumber.addEventListener(
    "input",
    () => {

      clearFieldError(
        DOM.whatsappNumber,
        DOM.whatsappError
      );


      DOM.formStatus.textContent =
        "";


      DOM.whatsappNumber.value =
        DOM.whatsappNumber.value
          .replace(
            /[^\d+\s()-]/g,
            ""
          )
          .slice(0, 20);

    }
  );


  DOM.fullName.addEventListener(
    "blur",
    () => {

      if (
        DOM.fullName.value.trim()
      ) {

        validateSingleName();

      }

    }
  );


  DOM.whatsappNumber.addEventListener(
    "blur",
    () => {

      if (
        DOM.whatsappNumber.value.trim()
      ) {

        validateSingleWhatsApp();

      }

    }
  );

}


/*
 * SINGLE FIELD VALIDATION
 */

function validateSingleName() {

  if (
    DOM.fullName.value.trim().length < 2
  ) {

    setFieldError(
      DOM.fullName,
      DOM.nameError,
      "Please enter your full name."
    );


    return false;
  }


  clearFieldError(
    DOM.fullName,
    DOM.nameError
  );


  return true;

}


function validateSingleWhatsApp() {

  if (
    !isValidIndianWhatsAppNumber(
      normalizePhone(
        DOM.whatsappNumber.value
      )
    )
  ) {

    setFieldError(
      DOM.whatsappNumber,
      DOM.whatsappError,
      "Enter a valid Indian WhatsApp number."
    );


    return false;
  }


  clearFieldError(
    DOM.whatsappNumber,
    DOM.whatsappError
  );


  return true;

}


/*
 * FIELD HELPERS
 */

function setFieldError(
  input,
  errorElement,
  message
) {

  input.classList.add(
    "invalid"
  );

  errorElement.textContent =
    message;

}


function clearFieldError(
  input,
  errorElement
) {

  input.classList.remove(
    "invalid"
  );

  errorElement.textContent =
    "";

}


function clearFormMessages() {

  clearFieldError(
    DOM.fullName,
    DOM.nameError
  );


  clearFieldError(
    DOM.whatsappNumber,
    DOM.whatsappError
  );


  DOM.formStatus.textContent =
    "";

}


function showFormError(message) {

  DOM.formStatus.textContent =
    message;

}


/*
 * PHONE
 */

function normalizePhone(value) {

  return String(
    value || ""
  ).replace(
    /\D/g,
    ""
  );

}


function isValidIndianWhatsAppNumber(
  phone
) {

  return (
    /^[6-9]\d{9}$/.test(phone) ||
    /^91[6-9]\d{9}$/.test(phone)
  );

}


/*
 * PAYLOAD
 */

function createRegistrationPayload() {

  return {

    name:
      DOM.fullName.value.trim(),

    whatsapp:
      normalizeWhatsAppForBackend(
        DOM.whatsappNumber.value
      ),

    ticketPrice:
      CONFIG.ticketPrice,

    eventName:
      CONFIG.eventName,

    eventDate:
      CONFIG.eventDate,

    eventTime:
      CONFIG.eventTime,

    venue:
      CONFIG.venue,

    timestamp:
      new Date().toISOString(),

    paymentStatus:
      "PAYMENT INITIATED — VERIFY MANUALLY"

  };

}


function normalizeWhatsAppForBackend(
  value
) {

  const digits =
    normalizePhone(value);


  if (
    /^91[6-9]\d{9}$/.test(digits)
  ) {

    return `+${digits}`;

  }


  if (
    /^[6-9]\d{9}$/.test(digits)
  ) {

    return `+91${digits}`;

  }


  return value.trim();

}


/*
 * EMAILJS REGISTRATION
 *
 * This uses the existing EmailJS
 * service and template from your site.
 */

async function submitRegistration(
  payload
) {

  const templateParams = {

    name:
      payload.name,

    whatsapp:
      payload.whatsapp,

    ticketPrice:
      payload.ticketPrice,

    paymentStatus:
      payload.paymentStatus,

    eventName:
      payload.eventName,

    eventDate:
      payload.eventDate,

    eventTime:
      payload.eventTime,

    venue:
      payload.venue,

    timestamp:
      payload.timestamp

  };


  try {

    const response =
      await emailjs.send(

        CONFIG.emailjs.serviceId,

        CONFIG.emailjs.templateId,

        templateParams

      );


    if (
      !response ||
      response.status !== 200
    ) {

      throw new Error(
        "Registration could not be submitted. Please try again."
      );

    }


    return {

      success: true,

      data: response

    };


  } catch (error) {

    console.error(
      "EmailJS registration error:",
      error
    );


    throw new Error(
      "We could not submit your registration. Please try again."
    );

  }

}


/*
 * UPI PAYMENT
 *
 * Creates:
 *
 * upi://pay?
 * pa=7082653911@ybl
 * pn=AESTHETICS STUDIO
 * am=999.00
 * cu=INR
 *
 * This pre-fills the amount.
 */

function buildUPIIntent() {

  const params =
    new URLSearchParams({

      pa:
        CONFIG.upiId,

      pn:
        CONFIG.payeeName,

      am:
        CONFIG.ticketPrice.toFixed(2),

      cu:
        "INR",

      tn:
        `${CONFIG.eventName} Ticket`

    });


  return (
    `upi://pay?${params.toString()}`
  );

}


/*
 * OPEN PAYMENT APP
 */

function openUPIPayment() {

  const upiIntent =
    buildUPIIntent();


  try {

    window.location.href =
      upiIntent;


  } catch (error) {

    console.error(
      "Unable to open UPI intent:",
      error
    );


    showToast(

      "Unable to open a UPI application on this device. Please open your UPI app and pay ₹999 to 7082653911@ybl.",

      "error"

    );

  }

}


/*
 * RETRY PAYMENT BUTTON
 */

function bindRetryPayment() {

  if (
    DOM.retryUpiPaymentButton
  ) {

    DOM.retryUpiPaymentButton.addEventListener(
      "click",
      openUPIPayment
    );

  }

}


/*
 * SHOW PAYMENT MESSAGE
 */

function showSubmissionSuccess() {

  DOM.registrationForm.hidden =
    true;


  DOM.paymentSuccess.hidden =
    false;


  DOM.paymentSuccess.scrollIntoView({

    behavior:
      prefersReducedMotion()
        ? "auto"
        : "smooth",

    block:
      "center"

  });

}


/*
 * BUTTON STATE
 */

function setSubmitState(
  isSubmitting
) {

  DOM.submitPaymentButton.disabled =
    isSubmitting;


  const text =
    DOM.submitPaymentButton.querySelector(
      "span"
    );


  text.textContent =
    isSubmitting
      ? "Submitting…"
      : `Pay ₹${CONFIG.ticketPrice.toLocaleString("en-IN")} & Continue`;

}


/*
 * COUNTDOWN
 */

function startCountdown() {

  updateCountdown();


  window.setInterval(
    updateCountdown,
    1000
  );

}


function updateCountdown() {

  const diff =
    new Date(
      CONFIG.countdownTarget
    ).getTime() -
    Date.now();


  const remaining =
    Math.max(
      0,
      diff
    );


  const days =
    Math.floor(
      remaining / 86400000
    );


  const hours =
    Math.floor(
      (
        remaining % 86400000
      ) / 3600000
    );


  const minutes =
    Math.floor(
      (
        remaining % 3600000
      ) / 60000
    );


  const seconds =
    Math.floor(
      (
        remaining % 60000
      ) / 1000
    );


  DOM.countdownDays.textContent =
    String(days).padStart(
      2,
      "0"
    );


  DOM.countdownHours.textContent =
    String(hours).padStart(
      2,
      "0"
    );


  DOM.countdownMinutes.textContent =
    String(minutes).padStart(
      2,
      "0"
    );


  DOM.countdownSeconds.textContent =
    String(seconds).padStart(
      2,
      "0"
    );

}


/*
 * CURRENCY
 */

function formatCurrency(value) {

  return new Intl.NumberFormat(
    "en-IN",
    {

      style:
        "currency",

      currency:
        "INR",

      maximumFractionDigits:
        0

    }
  ).format(value);

}


/*
 * TOAST
 */

function showToast(
  message,
  type = "success"
) {

  if (!DOM.toast) {
    return;
  }


  clearTimeout(
    state.toastTimer
  );


  DOM.toast.textContent =
    message;


  DOM.toast.className =
    `toast show ${type}`;


  state.toastTimer =
    window.setTimeout(
      () => {

        DOM.toast.classList.remove(
          "show"
        );

      },
      5000
    );

}


/*
 * ACCESSIBILITY
 */

function prefersReducedMotion() {

  return (
    window.matchMedia &&
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
  );

}


/*
 * DEFENSIVE ERROR LOGGING
 */

window.addEventListener(
  "error",
  (event) => {

    console.error(
      "Website error:",
      event.error ||
      event.message
    );

  }
);


window.addEventListener(
  "unhandledrejection",
  (event) => {

    console.error(
      "Unhandled promise rejection:",
      event.reason
    );

  }
);
