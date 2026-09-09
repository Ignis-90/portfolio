(() => {
  "use strict";

  const rootAssets = document.querySelectorAll("[data-root-asset]");
  if (window.location.protocol === "file:") {
    const isItalian = document.documentElement.lang === "it";
    rootAssets.forEach((asset) => {
      asset.src = `${isItalian ? "../" : "./"}${asset.dataset.rootAsset}`;
    });
    document.querySelectorAll('a[href="/"]').forEach((link) => {
      link.href = isItalian ? "../index.html" : "./index.html";
    });
    document.querySelectorAll('a[href="/it/"]').forEach((link) => {
      link.href = isItalian ? "./index.html" : "./it/index.html";
    });
  }

  const header = document.querySelector("[data-header]");
  const menuButton = document.querySelector("[data-menu-toggle]");
  const mobileMenu = document.querySelector("[data-mobile-menu]");

  const setMenu = (open) => {
    if (!menuButton || !mobileMenu) return;
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute(
      "aria-label",
      open
        ? menuButton.dataset.labelClose || "Close menu"
        : menuButton.dataset.labelOpen || "Open menu"
    );
    mobileMenu.hidden = !open;
  };

  menuButton?.addEventListener("click", () => {
    setMenu(Boolean(mobileMenu && mobileMenu.hidden));
  });

  mobileMenu?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenu(false);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1040) setMenu(false);
  });

  const updateHeader = () => {
    header?.classList.toggle("scrolled", window.scrollY > 12);
  };
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealElements = document.querySelectorAll(".reveal, .stagger-group");

  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -5% 0px" }
    );
    revealElements.forEach((element) => revealObserver.observe(element));
  }

  const countElements = document.querySelectorAll(".count-up");
  const locale = document.documentElement.lang === "it" ? "it-IT" : "en-US";

  const formatValue = (element, value) => {
    const decimals = Number(element.dataset.decimals || 0);
    const grouping = element.dataset.grouping === "true";
    const number = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: grouping
    }).format(value);
    return `${element.dataset.prefix || ""}${number}${element.dataset.suffix || ""}`;
  };

  const animateCount = (element) => {
    if (element.dataset.counted === "true") return;
    element.dataset.counted = "true";
    const target = Number(element.dataset.to);

    if (reducedMotion || !Number.isFinite(target)) {
      if (Number.isFinite(target)) element.textContent = formatValue(element, target);
      return;
    }

    const duration = 1200;
    const start = performance.now();
    const step = (time) => {
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      element.textContent = formatValue(element, target * eased);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if (reducedMotion || !("IntersectionObserver" in window)) {
    countElements.forEach(animateCount);
  } else {
    const counterObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCount(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.45 }
    );
    countElements.forEach((element) => counterObserver.observe(element));
  }

  const consentBanner = document.querySelector("[data-consent-banner]");
  const consentAccept = document.querySelector("[data-consent-accept]");
  const consentReject = document.querySelector("[data-consent-reject]");
  const consentOpenButtons = document.querySelectorAll("[data-consent-open]");
  const contactForm = document.querySelector("[data-contact-form]");
  let pageViewSent = false;

  const getConsentChoice = () => {
    try {
      return localStorage.getItem("oaiq-consent");
    } catch {
      return null;
    }
  };

  const setConsentChoice = (choice) => {
    try {
      localStorage.setItem("oaiq-consent", choice);
    } catch {
      // The Pixel consent state still applies for the current page.
    }
  };

  const createEventId = () =>
    window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const firePageView = () => {
    if (pageViewSent) return;
    pageViewSent = true;
    window.oaiq?.(
      "measure",
      "page_viewed",
      {
        type: "contents",
        contents: [{ id: location.pathname || "/", name: document.title, content_type: "page" }],
      },
      { event_id: createEventId() }
    );
  };

  const fireContactClick = (link) => {
    if (getConsentChoice() !== "granted") return;
    window.oaiq?.(
      "measure",
      "custom",
      {
        type: "custom",
        contents: [{ id: "linkedin_contact", name: link.textContent.trim(), content_type: "contact_cta" }],
      },
      { custom_event_name: "contact_clicked", event_id: createEventId() }
    );
  };

  const fireLeadCreated = () => {
    if (getConsentChoice() !== "granted") return;
    window.oaiq?.(
      "measure",
      "lead_created",
      { type: "customer_action" },
      { event_id: createEventId() }
    );
  };

  document.querySelectorAll('a[href*="linkedin.com/in/piergiorgiopanzini"]').forEach((link) => {
    link.addEventListener("click", () => fireContactClick(link));
  });

  consentOpenButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!consentBanner) return;
      consentBanner.hidden = false;
      consentReject?.focus();
    });
  });

  const consentChoice = getConsentChoice();
  if (consentChoice === "granted") {
    window.oaiq?.("consent", true);
    firePageView();
  } else if (consentChoice !== "denied" && consentBanner) {
    consentBanner.hidden = false;
  }

  consentAccept?.addEventListener("click", () => {
    setConsentChoice("granted");
    window.oaiq?.("consent", true);
    firePageView();
    if (consentBanner) consentBanner.hidden = true;
  });

  consentReject?.addEventListener("click", () => {
    setConsentChoice("denied");
    window.oaiq?.("consent", false);
    if (consentBanner) consentBanner.hidden = true;
  });

  contactForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const status = contactForm.querySelector("[data-contact-status]");
    if (!submitButton || !status) return;

    const originalMarkup = submitButton.innerHTML;
    status.textContent = "";
    status.className = "form-status";
    submitButton.disabled = true;
    submitButton.textContent = submitButton.dataset.submitPending || "Sending…";

    try {
      const response = await fetch(contactForm.action, {
        method: "POST",
        body: new FormData(contactForm),
        headers: { Accept: "application/json" },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false || result.success === "false") {
        throw new Error("Submission rejected");
      }
      contactForm.reset();
      status.textContent = status.dataset.success;
      status.classList.add("is-success");
      fireLeadCreated();
    } catch {
      status.textContent = status.dataset.error;
      status.classList.add("is-error");
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = originalMarkup;
    }
  });

})();
