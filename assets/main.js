(() => {
  "use strict";

  // Small layout corrections kept here so every localized page gets the same fix
  // without duplicating overrides across the HTML files.
  const layoutFixes = document.createElement("style");
  layoutFixes.dataset.layoutFixes = "2026-09-10-c";
  layoutFixes.textContent = `
    :root { --section-space: clamp(5.5rem, 8.5vw, 8.25rem); }
    .section-number { margin-bottom: clamp(2.5rem, 4.5vw, 4rem); }
    .section-heading { margin-bottom: clamp(3rem, 5.5vw, 4.75rem); }
    .hero { padding-block: clamp(4rem, 7vw, 6.5rem) 5.5rem; }
    .case-studies { padding-bottom: clamp(6.5rem, 9vw, 8.5rem); }
    .takeaway { display: flex; align-items: center; gap: .65rem; width: fit-content; }
    .takeaway > span { display: inline-flex; flex: 0 0 auto; }

    @media (max-width: 760px) {
      :root { --section-space: 4.1rem; }
      .hero { min-height: auto; padding-block: 3rem 4.25rem; }
      .section-number { margin-bottom: 2rem; }
      .section-heading { margin-bottom: 2.75rem; }
      .case-studies { padding-bottom: 5.25rem; }
      .method { padding-top: 4rem; }

      .case-secondary { row-gap: 1rem; }
      .case-secondary-copy > p:not(.takeaway) { margin-bottom: 0; }
      .mini-stats { margin-top: 0 !important; }

      .case-secondary > .takeaway {
        display: flex;
        align-items: center;
        gap: .55rem;
        width: fit-content;
        margin: .9rem 0 0;
        padding-top: 1rem;
      }

      .case-secondary > .takeaway > span {
        display: inline-flex;
        flex: 0 0 auto;
        margin: 0;
      }
    }

    @media (max-width: 480px) {
      .hero { padding-top: 2.5rem; }
      .case-studies { padding-bottom: 5.5rem; }
      .method { padding-top: 3.75rem; }
    }
  `;
  document.head.appendChild(layoutFixes);

  // On mobile, place the real takeaway after the stats instead of recreating it
  // with generated text. This preserves the original SVG arrow and avoids emoji rendering.
  const caseSecondary = document.querySelector(".case-secondary");
  const caseSecondaryCopy = caseSecondary?.querySelector(".case-secondary-copy");
  const caseSecondaryStats = caseSecondary?.querySelector(".mini-stats");
  const caseSecondaryTakeaway = caseSecondaryCopy?.querySelector(".takeaway");
  const mobileCaseQuery = window.matchMedia("(max-width: 760px)");

  const placeCaseTakeaway = () => {
    if (!caseSecondary || !caseSecondaryCopy || !caseSecondaryStats || !caseSecondaryTakeaway) return;
    if (mobileCaseQuery.matches) {
      caseSecondaryStats.insertAdjacentElement("afterend", caseSecondaryTakeaway);
    } else {
      caseSecondaryCopy.appendChild(caseSecondaryTakeaway);
    }
  };

  placeCaseTakeaway();
  if (mobileCaseQuery.addEventListener) {
    mobileCaseQuery.addEventListener("change", placeCaseTakeaway);
  } else {
    mobileCaseQuery.addListener(placeCaseTakeaway);
  }

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
      { threshold: 0.1, rootMargin: "0px 0px -4% 0px" }
    );
    revealElements.forEach((element) => revealObserver.observe(element));
  }

  const countElements = [...document.querySelectorAll(".count-up")];
  const locale = document.documentElement.lang === "it" ? "it-IT" : "en-US";

  const formatValue = (element, value) => {
    const decimals = Number(element.dataset.decimals || 0);
    const grouping = element.dataset.grouping === "true";
    const number = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: grouping,
    }).format(value);
    return `${element.dataset.prefix || ""}${number}${element.dataset.suffix || ""}`;
  };

  const animateCount = (element) => {
    if (element.dataset.counted === "true") return;
    const target = Number(element.dataset.to);
    if (!Number.isFinite(target)) return;

    element.dataset.counted = "true";
    if (reducedMotion) {
      element.textContent = formatValue(element, target);
      return;
    }

    const duration = 1250;
    const start = performance.now();
    const step = (time) => {
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      element.textContent = formatValue(element, target * eased);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const isInCounterViewport = (element) => {
    const rect = element.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    return rect.top < vh * 0.9 && rect.bottom > vh * 0.08;
  };

  const startVisibleCounters = () => {
    countElements.forEach((element) => {
      if (element.dataset.counted !== "true" && isInCounterViewport(element)) animateCount(element);
    });
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
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    countElements.forEach((element) => counterObserver.observe(element));

    // Safari/iOS can restore a page from the back-forward cache without firing
    // the observer as expected. A lightweight visibility scan makes the count-up reliable.
    window.addEventListener("pageshow", () => requestAnimationFrame(startVisibleCounters));
    window.addEventListener("orientationchange", () => setTimeout(startVisibleCounters, 120));
    requestAnimationFrame(startVisibleCounters);
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

  const observatory = document.querySelector("[data-observatory]");
  if (observatory && !reducedMotion && window.matchMedia("(pointer: fine)").matches) {
    const cards = observatory.querySelectorAll("[data-parallax]");
    let pointerX = 0;
    let pointerY = 0;
    let frame = 0;

    const renderParallax = () => {
      cards.forEach((card) => {
        const depth = Number(card.dataset.parallax || 0.5);
        const x = pointerX * 15 * depth;
        const y = pointerY * 12 * depth;
        const rotateX = pointerY * -2.2 * depth;
        const rotateY = pointerX * 2.8 * depth;
        card.style.transform = `translate3d(${x}px, ${y}px, 0) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });
      frame = 0;
    };

    observatory.addEventListener("pointermove", (event) => {
      const bounds = observatory.getBoundingClientRect();
      pointerX = (event.clientX - bounds.left) / bounds.width - 0.5;
      pointerY = (event.clientY - bounds.top) / bounds.height - 0.5;
      if (!frame) frame = requestAnimationFrame(renderParallax);
    });

    observatory.addEventListener("pointerleave", () => {
      pointerX = 0;
      pointerY = 0;
      if (!frame) frame = requestAnimationFrame(renderParallax);
    });
  }
})();
