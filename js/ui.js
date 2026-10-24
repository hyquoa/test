/* =========================================================
   ui.js — draws the cards and the add/edit pop-up.
   It never changes your data. It just tells app.js what you clicked.
   ========================================================= */

const UI = (function () {

  const listEl    = document.getElementById("streakList");
  const emptyEl   = document.getElementById("emptyMessage");
  const dialog    = document.getElementById("streakDialog");
  const form      = document.getElementById("streakForm");
  const nameInput = document.getElementById("nameInput");
  const confirmDialog = document.getElementById("confirmDialog");
  const confirmTitle = document.getElementById("confirmTitle");
  const confirmMessage = document.getElementById("confirmMessage");
  const confirmCancel = document.getElementById("confirmCancel");
  const confirmAccept = document.getElementById("confirmAccept");
  const devPanel  = document.getElementById("devPanel");
  const devToggle = document.getElementById("devToggle");
  const devPasswordDialog = document.getElementById("devPasswordDialog");
  const devPasswordForm = document.getElementById("devPasswordForm");
  const devPasswordInput = document.getElementById("devPasswordInput");
  const devPasswordError = document.getElementById("devPasswordError");
  const devInfo   = document.getElementById("devInfo");
  const celebration = document.getElementById("completionCelebration");
  const celebrationAnnouncement = celebration.querySelector(".celebration-announcement");
  const celebrationBefore = celebration.querySelector(".celebration-number-before");
  const celebrationAfter = celebration.querySelector(".celebration-number-after");
  const celebrationBeforeDepth = celebrationBefore.querySelector(".celebration-number-depth");
  const celebrationAfterDepth = celebrationAfter.querySelector(".celebration-number-depth");
  const celebrationBeforeFace = celebrationBefore.querySelector(".celebration-number-face");
  const celebrationAfterFace = celebrationAfter.querySelector(".celebration-number-face");
  const celebrationCaption = celebration.querySelector(".celebration-caption");
  const celebrationTier = celebration.querySelector(".celebration-tier");

  const cards = new Map();           // streak id -> that streak's card on the page
  let handlers = {};                 // functions that app.js gives us
  let editingId = null;              // null = we're making a NEW streak
  let celebrationTimer = null;
  let confirmationResolve = null;
  let confirmationAccepted = false;

  /* ---------- Small helpers ---------- */

  // Only touches the page if the text actually changed
  function setText(el, text) {
    if (el.textContent !== text) el.textContent = text;
  }

  function setIconText(el, icon, text) {
    const iconPath = icon ? "assets/gvesster/" + icon + ".png" : "";
    if (el.dataset.iconPath === iconPath && el.textContent === text) return;

    el.replaceChildren();
    if (iconPath) {
      const image = document.createElement("img");
      image.className = "inline-icon";
      image.src = iconPath;
      image.alt = "";
      image.setAttribute("aria-hidden", "true");
      el.appendChild(image);
    }
    if (text) el.appendChild(document.createTextNode(text));
    el.dataset.iconPath = iconPath;
  }

  // Makes a darker copy of a "#rrggbb" color (for the 3D side of buttons)
  function darken(hex, factor) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.round(((n >> 16) & 255) * factor);
    const g = Math.round(((n >> 8) & 255) * factor);
    const b = Math.round((n & 255) * factor);
    return "rgb(" + r + "," + g + "," + b + ")";
  }

  function formatTime(ms) {
    ms = Math.max(0, ms);
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return (d ? d + "d " : "") + h + "h " + m + "m " + s + "s";
  }

  function confirm(options) {
    setText(confirmTitle, options.title);
    setText(confirmMessage, options.message);
    setText(confirmAccept, options.confirmLabel);

    return new Promise(function (resolve) {
      confirmationResolve = resolve;
      confirmDialog.showModal();
      confirmCancel.focus();
    });
  }

  /* ---------- Building a card (done once per streak) ---------- */

  function createCard(id) {
    const card = document.createElement("article");
    card.className = "card card-enter";
    card.dataset.id = id;
    card.addEventListener("animationend", function (event) {
      if (event.animationName === "card-arrive") card.classList.remove("card-enter");
    });

    card.innerHTML = `
      <div class="card-head">
        <h2 class="card-title"></h2>
        <button class="icon-btn" data-action="edit" title="Edit" aria-label="Edit streak"><img class="icon-image" src="assets/gvesster/pencil.png" alt="" aria-hidden="true"></button>
        <button class="icon-btn" data-action="delete" title="Delete" aria-label="Delete streak"><img class="icon-image" src="assets/gvesster/trash.png" alt="" aria-hidden="true"></button>
      </div>

      <div class="streak-area">
        <div class="streak-number" role="img" aria-label="0 day streak"><span class="streak-number-depth" aria-hidden="true">0</span><span class="streak-number-face">0</span></div>
        <p class="streak-label"><span class="flame"><img src="assets/gvesster/fire.png" alt="" aria-hidden="true"></span> day streak</p>
        <p class="tier-label"></p>
        <p class="tier-countdown"></p>
      </div>

      <div class="building">
        <div class="dots" role="img"></div>
        <div class="building-text"></div>
      </div>

      <button class="btn-3d done-btn" data-action="complete"></button>
      <div class="timer"></div>
    `;

    if (Config.DEV_MODE) {
      card.insertAdjacentHTML("beforeend", `
        <div class="dev-row">
          <label for="dev-count-${id}"><img class="inline-icon" src="assets/gvesster/settings.png" alt="" aria-hidden="true"> Set streak days</label>
          <div class="dev-set-controls">
            <input id="dev-count-${id}" class="dev-count-input" type="number" min="0" max="9007199254740991" step="1" required aria-label="Streak day count">
            <button type="button" data-action="dev-set">Set</button>
          </div>
        </div>
      `);
      const devCountInput = card.querySelector(".dev-count-input");
      devCountInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          card.querySelector('[data-action="dev-set"]').click();
        }
      });
    }

    const dots = card.querySelector(".dots");
    for (let i = 0; i < Config.ACTIVATION_DAYS; i++) {
      const dot = document.createElement("span");
      dot.className = "build-dot";
      dot.setAttribute("aria-hidden", "true");
      dots.appendChild(dot);
    }

    return card;
  }

  /* ---------- Updating a card (runs every second) ---------- */

  function updateCard(card, streak, view, now) {
    // textContent (not innerHTML) so weird characters in a name can't break the page
    setText(card.querySelector(".card-title"), streak.name);

    // Colors for this card (the CSS reads these three variables)
    card.dataset.theme = view.theme;
    card.style.setProperty("--c1", view.colors[0]);
    card.style.setProperty("--c2", view.colors[1]);
    card.style.setProperty("--depth1", darken(view.colors[0], 0.48));
    card.style.setProperty("--depth2", darken(view.colors[1], 0.48));
    card.style.setProperty("--fire1", view.tierColors[0]);
    card.style.setProperty("--fire2", view.tierColors[1]);
    card.style.setProperty("--tier-highlight", view.tierColors[0]);
    card.style.setProperty("--tier-bg", view.tierColors[1]);
    card.style.setProperty("--sh", darken(view.colors[1], 0.55));

    // Big number (only after the streak starts) OR the "building" progress
    card.querySelector(".streak-area").hidden = !view.visible;
    card.querySelector(".building").hidden = view.visible;

    if (view.visible) {
      const numberEl = card.querySelector(".streak-number");
      const numberDepth = numberEl.querySelector(".streak-number-depth");
      const numberFace = numberEl.querySelector(".streak-number-face");
      const text = String(view.count);
      if (numberFace.textContent !== text) {
        numberDepth.textContent = text;
        numberFace.textContent = text;
        if (card.dataset.ready) {          // little pop (but not on the first draw)
          numberEl.classList.remove("pop");
          void numberEl.offsetWidth;       // restarts the animation
          numberEl.classList.add("pop");
        }
      }
      numberEl.setAttribute("aria-label", text + " day streak");
      setText(card.querySelector(".tier-label"), "Tier " + view.tier);
      setIconText(card.querySelector(".tier-countdown"), view.nextTier === null ? "trophy" : null,
        view.nextTier === null
          ? "Highest tier reached"
          : view.tierCountdownMs === 0 && !view.done
            ? "Complete today to reach Tier " + view.nextTier + "!"
            : "Tier " + view.nextTier + " in " + formatTime(view.tierCountdownMs));
      card.dataset.tier = String(view.tier);
    } else {
      const n = Math.min(view.buildDays, Config.ACTIVATION_DAYS);
      const dots = card.querySelector(".dots");
      Array.from(dots.children).forEach(function (dot, index) {
        dot.classList.toggle("is-complete", index < n);
      });
      dots.setAttribute("aria-label", n + " of " + Config.ACTIVATION_DAYS + " days completed");
      setText(card.querySelector(".building-text"),
        "Do this " + Config.ACTIVATION_DAYS + " days in a row to start your streak");
      setText(card.querySelector(".tier-label"), "");
      setText(card.querySelector(".tier-countdown"), "");
      card.dataset.tier = "0";
    }
    card.dataset.count = String(view.visible ? view.count : view.buildDays);
    card.dataset.ready = "1";

    // The button
    const button = card.querySelector(".done-btn");
    button.disabled = view.done && !Config.DEV_MODE;
    setIconText(button, view.done ? "checkmark" : null, view.done ? "Done for today" : "I did it today!");

    // The countdown
    const timer = card.querySelector(".timer");
    if (view.visible) {
      const left = formatTime(view.expiresAt - now);
      setIconText(timer, view.done ? "checkmark" : "warning", view.done
        ? "Safe for now. New window opens in " + left
        : "Streak at risk! " + left + " left");
    } else {
      setIconText(timer, view.done ? "checkmark" : null,
        view.done ? "Done for today. Come back tomorrow!" : "");
    }
  }

  function prepareCelebrationConfetti() {
    const confetti = celebration.querySelector(".celebration-confetti");
    const colors = Config.GREEN.concat(Config.TIERS.reduce(function (all, tier) {
      return all.concat(tier.colors);
    }, []));

    for (let i = 0; i < 36; i++) {
      const piece = document.createElement("i");
      const angle = i * 2.4;
      const distance = 105 + (i % 6) * 27;
      piece.style.setProperty("--x", Math.cos(angle) * distance + "px");
      piece.style.setProperty("--y", Math.sin(angle) * distance + "px");
      piece.style.setProperty("--spin", (i % 2 ? 1 : -1) * (260 + i * 19) + "deg");
      piece.style.setProperty("--piece-color", colors[i % colors.length]);
      piece.style.setProperty("--delay", (i % 8) * 0.025 + "s");
      confetti.appendChild(piece);
    }
  }

  function celebrateCompletion(card, previousCount, previousTier) {
    const count = Number(card.dataset.count);
    if (!Number.isSafeInteger(count) || count <= previousCount) return;

    const tier = Number(card.dataset.tier);
    const tierUnlocked = tier > previousTier;
    const startColor = card.style.getPropertyValue("--tier-highlight");
    const endColor = card.style.getPropertyValue("--tier-bg");

    setText(celebrationBeforeFace, String(previousCount));
    setText(celebrationAfterFace, String(count));
    setText(celebrationBeforeDepth, String(previousCount));
    setText(celebrationAfterDepth, String(count));
    setText(celebrationCaption, tierUnlocked ? "A new chapter starts today." : "Another day. Another promise kept.");
    setText(celebrationTier, tierUnlocked ? "TIER " + tier + " UNLOCKED" : "");
    celebrationTier.hidden = !tierUnlocked;
    celebration.style.setProperty("--celebration-start", startColor);
    celebration.style.setProperty("--celebration-end", endColor);
    celebration.style.setProperty("--celebration-depth-start", darken(startColor, 0.48));
    celebration.style.setProperty("--celebration-depth-end", darken(endColor, 0.48));
    celebration.style.setProperty("--celebration-before-depth", darken("#a6aab6", 0.48));
    celebration.style.setProperty("--counter-size", Math.max(54, 124 - Math.max(0, String(count).length - 3) * 8) + "px");
    setText(celebrationAnnouncement, tierUnlocked
      ? "Day " + count + ". Tier " + tier + " unlocked!"
      : "Day " + count + ". Another day completed.");

    celebration.hidden = false;
    celebration.classList.remove("is-playing", "is-tier-up");
    void celebration.offsetWidth;
    celebration.classList.add("is-playing");
    if (tierUnlocked) celebration.classList.add("is-tier-up");

    clearTimeout(celebrationTimer);
    celebrationTimer = setTimeout(function () {
      celebration.classList.remove("is-playing", "is-tier-up");
      celebration.hidden = true;
    }, 2700);
  }

  /* ---------- Drawing all the cards ---------- */

  // items = [ { streak, view }, ... ]
  function render(items, now) {
    const ids = new Set(items.map(function (item) { return item.streak.id; }));

    // Remove cards for streaks that were deleted
    cards.forEach(function (card, id) {
      if (!ids.has(id)) {
        card.remove();
        cards.delete(id);
      }
    });

    // Create or update the rest, and keep them in order
    items.forEach(function (item, index) {
      let card = cards.get(item.streak.id);
      if (!card) {
        card = createCard(item.streak.id);
        cards.set(item.streak.id, card);
      }
      card.style.setProperty("--card-order", Math.min(index, 5));
      updateCard(card, item.streak, item.view, now);

      if (listEl.children[index] !== card) {
        listEl.insertBefore(card, listEl.children[index] || null);
      }
    });

    emptyEl.hidden = items.length > 0;
  }

  /* ---------- Clicks on the cards ---------- */

  function handleListClick(e) {
    const button = e.target.closest("[data-action]");
    if (!button) return;
    const card = button.closest(".card");
    if (!card) return;
    const id = card.dataset.id;

    switch (button.dataset.action) {
      case "complete": {
        const previousCount = Number(card.dataset.count || "0");
        const previousTier = Number(card.dataset.tier || "0");
        handlers.onComplete(id);
        celebrateCompletion(card, previousCount, previousTier);
        break;
      }
      case "edit":     handlers.onEdit(id); break;
      case "delete":   handlers.onDelete(id); break;
      case "dev-set": {
        const input = card.querySelector(".dev-count-input");
        if (input.reportValidity() && Number.isSafeInteger(input.valueAsNumber) && input.valueAsNumber >= 0) {
          handlers.onDevSet(id, input.valueAsNumber);
        } else if (input.validity.valid) {
          input.setCustomValidity("Enter a whole number within the supported range.");
          input.reportValidity();
          input.setCustomValidity("");
        }
        break;
      }
    }
  }

  /* ---------- The add / edit pop-up ---------- */

  // Pass a streak to edit it, or null to make a new one
  function openDialog(streak) {
    editingId = streak ? streak.id : null;
    document.getElementById("dialogTitle").textContent = streak ? "Edit streak" : "New streak";
    nameInput.value = streak ? streak.name : "";
    dialog.showModal();
    nameInput.focus();
  }

  /* ---------- Start-up ---------- */

  function init(h) {
    handlers = h;
    nameInput.maxLength = Config.MAX_NAME_LENGTH;
    prepareCelebrationConfetti();

    listEl.addEventListener("click", handleListClick);

    document.getElementById("addBtn").addEventListener("click", function () {
      openDialog(null);
    });

    document.getElementById("cancelBtn").addEventListener("click", function () {
      dialog.close();
    });

    confirmCancel.addEventListener("click", function () {
      confirmDialog.close();
    });

    confirmAccept.addEventListener("click", function () {
      confirmationAccepted = true;
      confirmDialog.close();
    });

    confirmDialog.addEventListener("cancel", function (event) {
      event.preventDefault();
      confirmDialog.close();
    });

    confirmDialog.addEventListener("close", function () {
      if (confirmationResolve) confirmationResolve(confirmationAccepted);
      confirmationResolve = null;
      confirmationAccepted = false;
    });

    confirmDialog.addEventListener("click", function (event) {
      if (event.target === confirmDialog) confirmDialog.close();
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const name = nameInput.value.trim();
      if (!name) { nameInput.focus(); return; }
      handlers.onSave({ id: editingId, name: name });
      dialog.close();
    });

    if (Config.DEV_MODE) {
      devPanel.hidden = true;
      devToggle.hidden = false;
      document.body.classList.add("dev-hidden");
      devToggle.addEventListener("click", function () {
        if (devPanel.hidden) {
          devPasswordInput.value = "";
          setText(devPasswordError, "");
          devPasswordDialog.showModal();
          devPasswordInput.focus();
        } else {
          devPanel.hidden = true;
          document.body.classList.add("dev-hidden");
          devToggle.setAttribute("aria-expanded", "false");
        }
      });
      devPasswordForm.addEventListener("submit", function (event) {
        event.preventDefault();
        if (devPasswordInput.value !== Config.DEV_TOOLS_PASSWORD) {
          setText(devPasswordError, "That password is not correct. Try again.");
          devPasswordInput.select();
          return;
        }
        devPanel.hidden = false;
        document.body.classList.remove("dev-hidden");
        devToggle.setAttribute("aria-expanded", "true");
        setText(devPasswordError, "");
        devPasswordDialog.close();
        devToggle.focus();
      });
      document.getElementById("devPasswordCancel").addEventListener("click", function () {
        devPasswordDialog.close();
      });
      devPasswordDialog.addEventListener("close", function () {
        devPasswordInput.value = "";
        setText(devPasswordError, "");
      });
      devPanel.addEventListener("click", function (e) {
        const button = e.target.closest("[data-dev]");
        if (button) handlers.onDev(button.dataset.dev, Number(button.dataset.hours));
      });
    }
  }

  function setDevInfo(text) {
    setText(devInfo, text);
  }

  return { init, render, openDialog, setDevInfo, confirm };
})();