/* =========================================================
   engine.js — the streak RULES. No screen code in here.
   ========================================================= */

const Engine = (function () {

  // Makes a safe copy, so we never change the original by accident
  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /* ---------- Dates (local time), like "2026-10-18" ---------- */

  function dayKey(ms) {
    const d = new Date(ms);
    return d.getFullYear() + "-" +
           String(d.getMonth() + 1).padStart(2, "0") + "-" +
           String(d.getDate()).padStart(2, "0");
  }

  function nextDayKey(key) {
    const p = key.split("-").map(Number);
    return dayKey(new Date(p[0], p[1] - 1, p[2] + 1).getTime());
  }

  /* ---------- The data for one brand-new streak ---------- */

  function newState() {
    return {
      phase: "BUILDING",   // BUILDING = hidden, ACTIVE = visible
      buildDays: 0,        // days in a row so far (while building)
      lastDay: null,       // last day you finished the task (while building)
      count: 0,            // the streak number (while active)
      best: 0,             // longest streak ever
      cycleStart: null,    // when the current 24-hour window began (while active)
      cycleDone: false     // did you finish the task in this window?
    };
  }

  /* ---------- Checks the clock. Runs every time we look at a streak. ---------- */

  function resolveExpiry(s, now) {
    if (s.phase === "BUILDING") {
      const today = dayKey(now);
      // Skipped a day? The 3-day progress starts over.
      if (s.lastDay !== null && s.lastDay !== today && nextDayKey(s.lastDay) !== today) {
        s.buildDays = 0;
        s.lastDay = null;
      }
      return;
    }

    // ACTIVE: when a 24-hour window ends, start the next one or lose the streak
    while (s.phase === "ACTIVE" && now >= s.cycleStart + Config.DAY_MS) {
      if (s.cycleDone) {
        s.cycleStart += Config.DAY_MS;
        s.cycleDone = false;
      } else {
        const best = s.best;
        Object.assign(s, newState());   // missed it: back to zero and hidden
        s.best = best;
      }
    }
  }

  /* ---------- The button click. Returns the NEW state. ----------
     devMode = true lets you click as many times as you want (for testing). */

  function applyCompletion(streak, now, devMode) {
    const s = clone(streak);
    resolveExpiry(s, now);

    // --- The streak is already active ---
    if (s.phase === "ACTIVE") {
      if (!s.cycleDone) {
        s.cycleDone = true;
        s.count++;
      } else if (devMode) {
        s.count++;                   // dev mode: extra clicks keep adding
      } else {
        return s;                    // already done in this window
      }
      s.best = Math.max(s.best, s.count);
      return s;
    }

    // --- Still building up to the first 3 days ---
    const today = dayKey(now);
    if (s.lastDay !== today) {
      if (s.lastDay !== null && nextDayKey(s.lastDay) === today) s.buildDays++;
      else s.buildDays = 1;
      s.lastDay = today;
    } else if (devMode) {
      s.buildDays++;                 // dev mode: extra clicks keep adding
    } else {
      return s;                      // already done today
    }

    if (s.buildDays >= Config.ACTIVATION_DAYS) {   // ACTIVATE the streak!
      s.phase = "ACTIVE";
      s.count = s.buildDays;
      s.best = Math.max(s.best, s.count);
      s.cycleStart = now;
      s.cycleDone = true;            // this window is already complete
    }
    return s;
  }

  /* ---------- Tiers and colors ---------- */

  function tierFor(count) {
    let found = 0;
    Config.TIERS.forEach(function (t) {
      if (count >= t.from) found = t.tier;
    });
    return found;
  }

  function tierColors(count) {
    const tier = tierFor(count);
    if (tier === 0) return Config.GRAY;

    const info = Config.TIERS.find(function (t) { return t.tier === tier; });
    return info.colors;
  }

  /* ---------- Turns the raw data into exactly what the screen needs ---------- */

  function getView(streak, now) {
    const s = clone(streak);
    resolveExpiry(s, now);

    // Streak not started yet: hidden, just show progress
    if (s.phase === "BUILDING") {
      const doneToday = s.lastDay === dayKey(now);
      return {
        visible: false,
        done: doneToday,
        theme: doneToday ? "green" : "gray",
        colors: doneToday ? Config.GREEN : Config.GRAY,
        tierColors: doneToday ? Config.GREEN : Config.GRAY,
        buildDays: s.buildDays,
        count: 0,
        tier: 0,
        nextTier: null,
        tierCountdownMs: null,
        expiresAt: null
      };
    }

    // Streak is active
    let theme = "tier";
    if (!s.cycleDone) theme = "gray";          // warning state: at risk

    let colors = tierColors(s.count);
    if (theme === "gray") colors = Config.GRAY;

    const expiresAt = s.cycleStart + Config.DAY_MS;
    const nextTierInfo = Config.TIERS.find(function (t) { return t.from > s.count; });

    return {
      visible: true,
      done: s.cycleDone,
      theme: theme,
      colors: colors,
      tierColors: tierColors(s.count),
      buildDays: 0,
      count: s.count,
      tier: tierFor(s.count),
      nextTier: nextTierInfo ? nextTierInfo.tier : null,
      tierCountdownMs: nextTierInfo
        ? (s.cycleDone ? Math.max(0, expiresAt - now) : 0) +
          Math.max(0, nextTierInfo.from - s.count - 1) * Config.DAY_MS
        : null,
      expiresAt: expiresAt
    };
  }

  /* ---------- Testing helper: jump straight to an active streak ---------- */

  function forceActive(count, now) {
    const s = newState();
    s.phase = "ACTIVE";
    s.count = count;
    s.best = count;
    s.cycleStart = now;
    s.cycleDone = false;
    return s;
  }

  // Only these are shared with the other files
  return { newState, applyCompletion, getView, forceActive };
})();