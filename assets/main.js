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
})();
