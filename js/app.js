/* =========================================================
   app.js — the "boss" file. It loads your data, listens for
   clicks from ui.js, and tells the other files what to do.
   ========================================================= */

const App = (function () {

  let data;   // everything we save: { version, timeOffset, streaks: [ ... ] }

  /* ---------- Data helpers ---------- */

  function makeId() {
    return "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function makeStreak(name) {
    return { id: makeId(), name: name, state: Engine.newState() };
  }

  function defaultData() {
    return {
      version: 1,
      timeOffset: 0,    // dev-mode time travel, in milliseconds
      streaks: [ makeStreak("Read for 20 minutes") ]
    };
  }

  function loadData() {
    const saved = Store.load();
    if (saved && Array.isArray(saved.streaks)) {
      saved.timeOffset = Number(saved.timeOffset) || 0;
      return saved;
    }
    return defaultData();
  }

  function findStreak(id) {
    return data.streaks.find(function (s) { return s.id === id; });
  }

  // The app's clock. In dev mode it can be fast-forwarded.
  function clock() {
    return Date.now() + (Config.DEV_MODE ? data.timeOffset : 0);
  }

  /* ---------- Drawing ---------- */

  function render() {
    const now = clock();
    const rainbowOn = PlatformEvents.isRainbowOn();

    const items = data.streaks.map(function (streak) {
      return { streak: streak, view: Engine.getView(streak.state, now, rainbowOn) };
    });
    UI.render(items, now);

    if (Config.DEV_MODE) {
      UI.setDevInfo(
        "Pretend it's: " + new Date(now).toLocaleString() + "\n" +
        "Time skipped:  +" + Math.round(data.timeOffset / 3600000) + " hours\n" +
        "Rainbow event: " + (rainbowOn ? "ON" : "off")
      );
    }
  }

  function saveAndRender() {
    Store.save(data);
    render();
  }

  /* ---------- Things you can do ---------- */

  function completeStreak(id) {
    const streak = findStreak(id);
    if (!streak) return;
    streak.state = Engine.applyCompletion(streak.state, clock(), Config.DEV_MODE);
    saveAndRender();
  }

  // Called by the pop-up form. id is null for a new streak.
  function saveStreak(form) {
    if (form.id) {
      const streak = findStreak(form.id);
      if (streak) {
        streak.name = form.name;
      }
    } else {
      data.streaks.push(makeStreak(form.name));
    }
    saveAndRender();
  }

  function deleteStreak(id) {
    const streak = findStreak(id);
    if (!streak) return;
    if (!confirm('Delete "' + streak.name + '"? Its streak will be lost.')) return;
    data.streaks = data.streaks.filter(function (s) { return s.id !== id; });
    saveAndRender();
  }

  /* ---------- Developer tools ---------- */

  function devSetStreak(id, count) {
    const streak = findStreak(id);
    if (!streak || !Number.isSafeInteger(count) || count < 0) return;
    streak.state = Engine.forceActive(count, clock());
    saveAndRender();
  }

  function devAction(name, hours) {
    if (name === "skip") {
      data.timeOffset += hours * 3600000;
      saveAndRender();
    } else if (name === "rainbow-on") {
      PlatformEvents.fire("RAINBOW_START");
    } else if (name === "rainbow-off") {
      PlatformEvents.fire("RAINBOW_END");
    } else if (name === "reset") {
      if (confirm("Delete ALL streaks and reset the clock?")) {
        data = defaultData();
        saveAndRender();
      }
    }
  }

  /* ---------- Start ---------- */

  function start() {
    data = loadData();

    UI.init({
      onComplete: completeStreak,
      onEdit: function (id) { UI.openDialog(findStreak(id)); },
      onSave: saveStreak,
      onDelete: deleteStreak,
      onDevSet: devSetStreak,
      onDev: devAction
    });

    PlatformEvents.setListener(render);

    setInterval(render, 1000);   // keeps the countdowns and expiry live
    render();
  }

  return { start };
})();

App.start();