(() => {
  const contactConfig = Object.assign(
    {
      endpoint: "https://formsubmit.co/ajax/john.calkins@icloud.com",
      directEmail: "",
    },
    window.WAIV_CONTACT_CONFIG || {}
  );

  const modal = document.querySelector("[data-contact-modal]");
  const dialog = document.querySelector(".contact-modal-dialog");
  const panel = document.querySelector("[data-contact-panel]");
  const openButtons = Array.from(document.querySelectorAll("[data-contact-open]"));
  const closeButtons = Array.from(document.querySelectorAll("[data-contact-close]"));
  const form = document.querySelector("[data-contact-form]");
  const formView = document.querySelector("[data-contact-form-view]");
  const successView = document.querySelector("[data-contact-success-view]");
  const submitButton = document.querySelector("[data-contact-submit]");
  const submitLabel = document.querySelector("[data-contact-submit-label]");
  const submitError = document.querySelector("[data-contact-submit-error]");
  const emailInput = document.querySelector("#contact-email");
  const topicInput = document.querySelector("#contact-topic");
  const messageInput = document.querySelector("#contact-message");
  const honeypotInput = document.querySelector("#contact-company");

  if (
    !modal ||
    !dialog ||
    !panel ||
    !form ||
    !submitButton ||
    !submitLabel ||
    !emailInput ||
    !messageInput ||
    !honeypotInput
  ) {
    return;
  }

  const fieldState = {
    email: { touched: false },
    message: { touched: false },
  };

  let modalVisible = false;
  let isSubmitting = false;
  let previouslyFocusedElement = null;
  let closeTimer = null;

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const getErrorElement = (name) =>
    form.querySelector(`[data-error-for="${name}"]`);

  const validateField = (name) => {
    if (name === "email") {
      const value = emailInput.value.trim();
      if (!value) return "Email is required.";
      if (!emailPattern.test(value)) return "Enter a valid email.";
      return "";
    }

    if (name === "message") {
      const value = messageInput.value.trim();
      if (!value) return "Message is required.";
      return "";
    }

    return "";
  };

  const setFieldError = (name, message) => {
    const field = name === "email" ? emailInput : messageInput;
    const errorElement = getErrorElement(name);
    if (!field || !errorElement) return;

    if (message) {
      field.setAttribute("aria-invalid", "true");
      errorElement.textContent = message;
    } else {
      field.removeAttribute("aria-invalid");
      errorElement.textContent = "";
    }
  };

  const updateFieldErrors = ({ force = false } = {}) => {
    ["email", "message"].forEach((name) => {
      const shouldShow = force || fieldState[name].touched;
      setFieldError(name, shouldShow ? validateField(name) : "");
    });
  };

  const formIsValid = () => !validateField("email") && !validateField("message");

  const updateSubmitState = () => {
    submitButton.disabled = isSubmitting || !formIsValid();
  };

  const setSubmittingState = (submitting) => {
    isSubmitting = submitting;
    modal.classList.toggle("is-submitting", submitting);
    submitButton.disabled = submitting || !formIsValid();
    submitButton.setAttribute("aria-busy", String(submitting));
    submitLabel.textContent = submitting ? "Sending..." : "Send message";
  };

  const resetStatus = () => {
    submitError.hidden = true;
    submitError.textContent = "Something went wrong. Try again or send another message in a moment.";
  };

  const showSubmitError = () => {
    submitError.textContent = "Something went wrong. Try again or send another message in a moment.";
    submitError.hidden = false;
  };

  const resetFormState = () => {
    window.clearTimeout(closeTimer);
    form.reset();
    fieldState.email.touched = false;
    fieldState.message.touched = false;
    resetStatus();
    setFieldError("email", "");
    setFieldError("message", "");
    setSubmittingState(false);
    formView.hidden = false;
    successView.hidden = true;
    modal.classList.remove("is-success");
    dialog.setAttribute("aria-labelledby", "contact-modal-title");
    dialog.setAttribute("aria-describedby", "contact-modal-description");
    updateSubmitState();
  };

  const getFocusableElements = () => {
    const container = successView.hidden ? formView : successView;
    return Array.from(
      container.querySelectorAll(
        'a[href], button:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((element) => !element.hidden && element.offsetParent !== null);
  };

  const focusInitialElement = () => {
    const focusTarget = successView.hidden
      ? emailInput
      : successView.querySelector("[data-contact-close]");
    (focusTarget || panel).focus();
  };

  const handleKeydown = (event) => {
    if (!modalVisible) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
      return;
    }

    if (event.key !== "Tab") return;

    const focusableElements = getFocusableElements();
    if (!focusableElements.length) {
      event.preventDefault();
      panel.focus();
      return;
    }

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const openModal = (trigger) => {
    previouslyFocusedElement = trigger || document.activeElement;
    resetFormState();
    modal.hidden = false;
    document.body.classList.add("modal-open");
    openButtons.forEach((button) => button.setAttribute("aria-expanded", "true"));
    requestAnimationFrame(() => {
      modal.classList.add("is-visible");
      focusInitialElement();
    });
    document.addEventListener("keydown", handleKeydown);
    modalVisible = true;
  };

  const closeModal = () => {
    if (!modalVisible) return;

    modal.classList.remove("is-visible");
    document.body.classList.remove("modal-open");
    document.removeEventListener("keydown", handleKeydown);
    openButtons.forEach((button) => button.setAttribute("aria-expanded", "false"));
    modalVisible = false;

    closeTimer = window.setTimeout(() => {
      modal.hidden = true;
      if (
        previouslyFocusedElement &&
        typeof previouslyFocusedElement.focus === "function"
      ) {
        previouslyFocusedElement.focus();
      }
    }, 220);
  };

  const showSuccessState = () => {
    formView.hidden = true;
    successView.hidden = false;
    modal.classList.add("is-success");
    dialog.setAttribute("aria-labelledby", "contact-success-title");
    dialog.setAttribute("aria-describedby", "contact-success-description");
    requestAnimationFrame(() => {
      focusInitialElement();
    });
  };

  const sendContactMessage = async (payload) => {
    if (honeypotInput.value.trim()) {
      return { ok: true };
    }

    if (!contactConfig.endpoint) {
      throw new Error("No contact endpoint configured.");
    }

    const response = await fetch(contactConfig.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email: payload.email,
        topic: payload.topic || "Not specified",
        message: payload.message,
        _subject: payload.topic
          ? `WAIV contact: ${payload.topic}`
          : "WAIV contact message",
        _replyto: payload.email,
        _captcha: "false",
        _template: "table",
        _honey: honeypotInput.value.trim(),
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.success === "false") {
      throw new Error("Contact request failed.");
    }

    return data;
  };

  openButtons.forEach((button) => {
    button.addEventListener("click", () => openModal(button));
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", () => closeModal());
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal || event.target.hasAttribute("data-contact-close")) {
      closeModal();
    }
  });

  [emailInput, messageInput].forEach((field) => {
    field.addEventListener("blur", () => {
      fieldState[field.name].touched = true;
      updateFieldErrors();
      updateSubmitState();
    });

    field.addEventListener("input", () => {
      if (fieldState[field.name].touched) {
        updateFieldErrors();
      }
      resetStatus();
      updateSubmitState();
    });
  });

  const topicInputChange = () => resetStatus();
  if (topicInput) {
    topicInput.addEventListener("change", topicInputChange);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    fieldState.email.touched = true;
    fieldState.message.touched = true;
    updateFieldErrors({ force: true });
    updateSubmitState();

    if (!formIsValid() || isSubmitting) return;

    resetStatus();
    setSubmittingState(true);

    try {
      await sendContactMessage({
        email: emailInput.value.trim(),
        topic: topicInput ? topicInput.value.trim() : "",
        message: messageInput.value.trim(),
      });

      setSubmittingState(false);
      showSuccessState();
    } catch (error) {
      setSubmittingState(false);
      showSubmitError();
    }
  });

  updateSubmitState();
})();
