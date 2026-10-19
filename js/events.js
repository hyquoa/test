/* =========================================================
   events.js — global platform events (like the Rainbow event).

   Anything can announce an event:
     PlatformEvents.fire("RAINBOW_START")
   or with an end time (here: rainbow for the next 10 minutes):
     PlatformEvents.fire("RAINBOW_START", Date.now() + 10 * 60 * 1000)
   When the time is up, the normal colors come back by themselves.
   ========================================================= */

const PlatformEvents = (function () {

  let rainbowOn = false;
  let timer = null;
  let onChange = function () {};   // app.js gives us a function to call when something changes

  window.addEventListener("platform-event", function (e) {
    const detail = e.detail || {};
    clearTimeout(timer);

    if (detail.type === "RAINBOW_START") {
      rainbowOn = true;
      if (detail.endsAt) {
        // Go back to normal colors when the event window closes
        timer = setTimeout(function () {
          rainbowOn = false;
          onChange();
        }, Math.max(0, detail.endsAt - Date.now()));
      }
    } else if (detail.type === "RAINBOW_END") {
      rainbowOn = false;
    }

    onChange();
  });

  function fire(type, endsAt) {
    window.dispatchEvent(new CustomEvent("platform-event", {
      detail: { type: type, endsAt: endsAt }
    }));
  }

  return {
    isRainbowOn: function () { return rainbowOn; },
    setListener: function (fn) { onChange = fn; },
    fire: fire
  };
})();