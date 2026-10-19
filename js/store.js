
/* =========================================================
   store.js — saving and loading. This is the ONLY file that
   talks to the browser's memory (localStorage).
   Later, if you ever want a different way to save, only this file changes.
   ========================================================= */

const Store = (function () {

  function load() {
    try {
      const text = localStorage.getItem(Config.STORAGE_KEY);
      return text ? JSON.parse(text) : null;
    } catch (error) {
      console.warn("Could not load saved data:", error);
      return null;
    }
  }

  function save(data) {
    try {
      localStorage.setItem(Config.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn("Could not save data:", error);
    }
  }

  return { load, save };
})();