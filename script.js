(function () {
  "use strict";

  /* ------------------------------------------
     Google Drive video links
     Paste share link OR file ID for each video.
     Share setting: Anyone with the link → Viewer
     Example: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
     ------------------------------------------ */
  const VIDEO_SOURCES = {
    cnv1: "https://drive.google.com/file/d/1MeVI_i1Z0CCOCeUdjRjdfIkRk9qgbQxW/view?usp=sharing",
    cnv2: "https://drive.google.com/file/d/1iYv-1Rn6-uF_p1q0sru1SWBB9lbDO_bl/view?usp=sharing",
    cnv3: "https://drive.google.com/file/d/1PLA9deKR1aYJjpdXVAwy-OxIlBqonByD/view?usp=sharing",
    cnv4: "https://drive.google.com/file/d/1GeWSenLzqQiANFBBu2eOf-OIXLi0VXdA/view?usp=sharing",
    pv1: "https://drive.google.com/file/d/1SZu1BaVpJDvWDKQAmZ71wSzG-Qf87nzV/view?usp=sharing",
    pv2: "https://drive.google.com/file/d/1x2UQpd1InOMW3dlqVPdzgP_tLYK1CSv_/view?usp=sharing",
    pv3: "https://drive.google.com/file/d/1jwA3v2gmjv4rUaWxuwIvOed9tVxbkUzN/view?usp=sharing",
    pv4: "https://drive.google.com/file/d/1i2m1aUpyopriQExIHjYK6_DbjyERjZOC/view?usp=sharing",
    pv5: "https://drive.google.com/file/d/1cTXbiooaB2MdrAIN4xOsGEKOX6peuBs9/view?usp=sharing",
    pv6: "https://drive.google.com/file/d/1YMkTrdnpJBnOfOsAPoucMLpkTEwV9WG4/view?usp=sharing",
    pv7: "https://drive.google.com/file/d/17leSCnn1W7u4jTRKvBaFru2akexmYm_7/view?usp=sharing",
  };

  function videoKey(src) {
    return (src || "").replace(/\.mp4.*$/i, "").replace(/^.*\//, "");
  }

  function extractDriveId(value) {
    if (!value) return "";
    const trimmed = value.trim();
    const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (dMatch) return dMatch[1];
    const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch) return idMatch[1];
    if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) return trimmed;
    return "";
  }

  function getMappedSource(key) {
    const normalized = videoKey(key);
    return VIDEO_SOURCES[normalized] || "";
  }

  function driveThumbnailUrl(fileId) {
    return "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w800";
  }

  function resolveVideoPlayUrl(keyOrUrl) {
    const mapped = getMappedSource(keyOrUrl);
    if (!mapped) return keyOrUrl;

    const fileId = extractDriveId(mapped);
    if (fileId) {
      return "https://drive.google.com/file/d/" + fileId + "/preview";
    }
    return mapped;
  }

  function applyVideoSources() {
    document.querySelectorAll("[data-video]").forEach(function (el) {
      el.setAttribute("data-video-key", videoKey(el.getAttribute("data-video")));
    });

    document.querySelectorAll("video.reel__media, video.creator__img").forEach(function (vid) {
      const key = videoKey((vid.getAttribute("src") || "").split("#")[0]);
      const mapped = getMappedSource(key);
      const fileId = extractDriveId(mapped);

      if (fileId) {
        vid.removeAttribute("src");
        vid.poster = driveThumbnailUrl(fileId);
        vid.preload = "none";
        vid.classList.add("is-drive-thumb");
      }
    });
  }

  applyVideoSources();

  const toggle = document.querySelector(".nav__toggle");
  const mobileNav = document.getElementById("mobile-nav");

  function setNavOpen(isOpen) {
    if (!toggle || !mobileNav) return;

    mobileNav.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    mobileNav.setAttribute("aria-hidden", String(!isOpen));
    document.body.classList.toggle("nav-open", isOpen);
  }

  function closeNav() {
    setNavOpen(false);
  }

  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      setNavOpen(!mobileNav.classList.contains("is-open"));
    });

    mobileNav.querySelectorAll("[data-nav-close], .mobile-nav__link, .mobile-nav__cta").forEach(function (el) {
      el.addEventListener("click", closeNav);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && mobileNav.classList.contains("is-open")) {
        closeNav();
      }
    });
  }

  /* ------------------------------------------
     Video thumbnail poster frames
     Seek each thumbnail video to a frame so it
     shows a real preview instead of a black box.
     ------------------------------------------ */
  const thumbVideos = document.querySelectorAll(
    ".reel__media, video.creator__img"
  );

  thumbVideos.forEach(function (vid) {
    if (vid.classList.contains("is-drive-thumb") || !vid.getAttribute("src")) {
      return;
    }
    const seekToFrame = function () {
      try {
        if (vid.currentTime < 0.1 && vid.duration) {
          vid.currentTime = Math.min(0.4, vid.duration / 2);
        }
      } catch (e) {}
    };
    if (vid.readyState >= 1) {
      seekToFrame();
    } else {
      vid.addEventListener("loadedmetadata", seekToFrame, { once: true });
    }
  });

  /* ------------------------------------------
     Scroll reveal animations
     ------------------------------------------ */
  const animated = document.querySelectorAll("[data-animate]");

  if (animated.length) {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      animated.forEach(function (el) {
        el.classList.add("is-visible");
      });
    } else {
      const observer = new IntersectionObserver(
        function (entries, obs) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;

            const el = entry.target;
            const delay = el.hasAttribute("data-float")
              ? 0
              : indexWithinGroup(el) * 90;

            setTimeout(function () {
              el.classList.add("is-visible");
            }, delay);

            obs.unobserve(el);
          });
        },
        { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
      );

      animated.forEach(function (el) {
        observer.observe(el);
      });
    }
  }

  // Stagger siblings that share a parent for a smoother cascade.
  function indexWithinGroup(el) {
    const parent = el.parentElement;
    if (!parent) return 0;
    const siblings = Array.prototype.filter.call(
      parent.children,
      function (child) {
        return child.hasAttribute("data-animate");
      }
    );
    return Math.max(0, siblings.indexOf(el));
  }

  /* ------------------------------------------
     Gallery parallax
     ------------------------------------------ */
  const parallaxItems = Array.prototype.slice.call(
    document.querySelectorAll("[data-parallax]")
  );
  const reduceMotionParallax = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (parallaxItems.length && !reduceMotionParallax) {
    let ticking = false;

    const update = function () {
      const viewportH = window.innerHeight;

      parallaxItems.forEach(function (item) {
        const rect = item.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > viewportH) return;

        // Progress: -1 (entering bottom) -> 1 (leaving top)
        const progress = (rect.top + rect.height / 2 - viewportH / 2) /
          (viewportH / 2 + rect.height / 2);
        const depth = parseFloat(item.getAttribute("data-parallax")) || 0;
        const img = item.querySelector(".gallery__img");
        if (img) {
          img.style.setProperty("--py", (progress * depth).toFixed(2) + "px");
        }
      });

      ticking = false;
    };

    const requestUpdate = function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });
    update();
  }

  /* ------------------------------------------
     Creator lightbox / video modal
     ------------------------------------------ */
  const lightbox = document.getElementById("creator-lightbox");
  const creatorCards = document.querySelectorAll(".creator");
  const galleryItems = document.querySelectorAll(".gallery__item[data-full]");
  const reelCards = document.querySelectorAll(".reel[data-video]");

  if (lightbox && (creatorCards.length || galleryItems.length || reelCards.length)) {
    const media = document.getElementById("lightbox-media");
    const caption = document.getElementById("lightbox-caption");
    let lastFocused = null;

    const makePlaceholder = function () {
      const div = document.createElement("div");
      div.className = "lightbox__placeholder";
      div.textContent = "Reel coming soon";
      return div;
    };

    const buildMedia = function (src) {
      // Choose the right element based on the source type.
      if (!src) return makePlaceholder();

      if (/\.(mp4|webm|ogg)$/i.test(src)) {
        const video = document.createElement("video");
        video.src = src;
        video.controls = true;
        video.autoplay = true;
        video.playsInline = true;
        return video;
      }
      if (/drive\.google\.com/i.test(src)) {
        const iframe = document.createElement("iframe");
        iframe.src = src;
        iframe.allow = "autoplay; fullscreen";
        iframe.allowFullscreen = true;
        return iframe;
      }
      if (/youtube\.com|youtu\.be|vimeo\.com/i.test(src)) {
        const iframe = document.createElement("iframe");
        iframe.src = src;
        iframe.allow = "autoplay; fullscreen";
        iframe.allowFullscreen = true;
        return iframe;
      }
      if (/\.(jpg|jpeg|png|webp|avif|gif)$/i.test(src)) {
        const img = document.createElement("img");
        img.src = src;
        img.alt = "";
        // Swap to placeholder if the image is missing.
        img.addEventListener("error", function () {
          media.replaceChildren(makePlaceholder());
        });
        return img;
      }
      return makePlaceholder();
    };

    const openLightbox = function (trigger) {
      lastFocused = trigger;
      const src = resolveVideoPlayUrl(
        trigger.getAttribute("data-video-key") ||
          trigger.getAttribute("data-video") ||
          trigger.getAttribute("data-full")
      );
      media.replaceChildren(buildMedia(src));
      caption.textContent = trigger.getAttribute("data-creator") || "";
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      const closeBtn = lightbox.querySelector(".lightbox__close");
      if (closeBtn) closeBtn.focus();
    };

    const closeLightbox = function () {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      // Clear media so videos stop playing.
      media.replaceChildren();
      if (lastFocused) lastFocused.focus();
    };

    creatorCards.forEach(function (card) {
      card.addEventListener("click", function () {
        openLightbox(card);
      });
    });

    galleryItems.forEach(function (item) {
      item.addEventListener("click", function () {
        openLightbox(item);
      });
    });

    reelCards.forEach(function (card) {
      card.addEventListener("click", function () {
        openLightbox(card);
      });
    });

    lightbox.querySelectorAll("[data-close]").forEach(function (el) {
      el.addEventListener("click", closeLightbox);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && lightbox.classList.contains("is-open")) {
        closeLightbox();
      }
    });
  }

  /* ------------------------------------------
     Results counter animation
     ------------------------------------------ */
  const counters = document.querySelectorAll(".metric__value[data-count]");

  if (counters.length) {
    const reduceMotionCount = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const runCounter = function (el) {
      const target = parseFloat(el.getAttribute("data-count")) || 0;
      const suffix = el.getAttribute("data-suffix") || "";
      const decimals = parseInt(el.getAttribute("data-decimal") || "0", 10);
      const duration = 1600;

      if (reduceMotionCount) {
        el.textContent =
          (decimals ? target.toFixed(decimals) : String(Math.round(target))) +
          suffix;
        return;
      }

      const start = performance.now();
      const step = function (now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = target * eased;
        const value = decimals
          ? current.toFixed(decimals)
          : String(Math.round(current));
        el.textContent = value + suffix;
        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          el.textContent =
            (decimals ? target.toFixed(decimals) : String(Math.round(target))) +
            suffix;
        }
      };
      window.requestAnimationFrame(step);
    };

    if (!("IntersectionObserver" in window)) {
      counters.forEach(runCounter);
    } else {
      const countObserver = new IntersectionObserver(
        function (entries, obs) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            runCounter(entry.target);
            obs.unobserve(entry.target);
          });
        },
        { threshold: 0.5 }
      );
      counters.forEach(function (el) {
        countObserver.observe(el);
      });
    }
  }

  /* ------------------------------------------
     Magnetic buttons (Final CTA)
     ------------------------------------------ */
  const magnets = document.querySelectorAll(".magnetic");
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const reduceMotionMagnet = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (magnets.length && finePointer && !reduceMotionMagnet) {
    const strength = 0.4;

    magnets.forEach(function (magnet) {
      const inner = magnet.querySelector(".magnetic__inner") || magnet;

      magnet.addEventListener("mousemove", function (e) {
        const rect = magnet.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        magnet.style.transform =
          "translate(" + x * strength + "px," + y * strength + "px)";
        inner.style.transform =
          "translate(" + x * strength * 0.4 + "px," + y * strength * 0.4 + "px)";
      });

      magnet.addEventListener("mouseleave", function () {
        magnet.style.transform = "";
        inner.style.transform = "";
      });
    });
  }

  /* ------------------------------------------
     Scroll progress bar
     ------------------------------------------ */
  const progress = document.querySelector(".scroll-progress span");
  if (progress) {
    let progressTicking = false;
    const updateProgress = function () {
      const h = document.documentElement;
      const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
      progress.style.width = Math.min(scrolled * 100, 100) + "%";
      progressTicking = false;
    };
    window.addEventListener(
      "scroll",
      function () {
        if (!progressTicking) {
          progressTicking = true;
          window.requestAnimationFrame(updateProgress);
        }
      },
      { passive: true }
    );
    updateProgress();
  }

  /* ------------------------------------------
     Custom cursor (fine pointers only)
     ------------------------------------------ */
  const ring = document.querySelector(".cursor");
  const dot = document.querySelector(".cursor-dot");
  const finePointerCursor = window.matchMedia("(pointer: fine)").matches;
  const reduceMotionCursor = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (ring && dot && finePointerCursor) {
    document.body.classList.add("cursor-ready");

    let mouseX = 0,
      mouseY = 0,
      ringX = 0,
      ringY = 0;

    document.addEventListener("mousemove", function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform =
        "translate(" + mouseX + "px," + mouseY + "px) translate(-50%, -50%)";
      document.body.classList.add("cursor-on");
    });

    document.addEventListener("mouseleave", function () {
      document.body.classList.remove("cursor-on");
    });

    const renderRing = function () {
      // Smooth follow with easing for a premium trailing feel.
      ringX += (mouseX - ringX) * (reduceMotionCursor ? 1 : 0.18);
      ringY += (mouseY - ringY) * (reduceMotionCursor ? 1 : 0.18);
      ring.style.transform =
        "translate(" + ringX + "px," + ringY + "px) translate(-50%, -50%)";
      window.requestAnimationFrame(renderRing);
    };
    renderRing();

    const interactive = document.querySelectorAll(
      "a, button, .creator, .reel, .gallery__item, .package, input, textarea"
    );
    interactive.forEach(function (el) {
      el.addEventListener("mouseenter", function () {
        ring.classList.add("is-active");
      });
      el.addEventListener("mouseleave", function () {
        ring.classList.remove("is-active");
      });
    });
  }

  /* ------------------------------------------
     Hero image 3D tilt
     ------------------------------------------ */
  const tilt = document.querySelector("[data-tilt]");
  if (tilt && finePointerCursor && !reduceMotionCursor) {
    const maxTilt = 7;
    tilt.addEventListener("mousemove", function (e) {
      const rect = tilt.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      tilt.style.transform =
        "perspective(900px) rotateY(" + px * maxTilt + "deg) rotateX(" +
        -py * maxTilt + "deg)";
    });
    tilt.addEventListener("mouseleave", function () {
      tilt.style.transform = "";
    });
  }
})();
