/* =========================================================
   config.js — settings and colors. Change things here!
   ========================================================= */

const Config = {

  // true  = developer tools ON (button never locks, you can fast-forward time)
  // false = the real app (each streak can only be completed once per 24 hours)
  DEV_MODE: false,
  DEV_TOOLS_PASSWORD: "dev",

  STORAGE_KEY: "lmaoimtestingshutupikthisiseasilyhackable",      // the name your browser saves the data under
  MAX_NAME_LENGTH: 40,              // longest task name allowed

  ACTIVATION_DAYS: 3,               // days in a row before a streak appears
  DAY_MS: 24 * 60 * 60 * 1000,      // 24 hours, in milliseconds

  // Text palette colors are listed [left, right]; the first color is the left gradient edge.
  GRAY:  ["#C2C0DC", "#9491A7"],    // at risk (not done yet)
  GREEN: ["#a3fd1c", "#5cef00"],    // done today, but the streak hasn't started yet

  // Each tier begins at "from" days
  TIERS: [
    { tier: 1, from: 3,   colors: ["#f3ff47", "#ffb347"] },   // Orange -> Red
    { tier: 2, from: 30,   colors: ["#ffb347", "#ff3b30"] },
    { tier: 3, from: 100, colors: ["#ff47e6", "#d747ff"] },   // Violet -> Purple
    { tier: 4, from: 200, colors: ["#7dd3fc", "#1d4ed8"] },   // Bright blue
    { tier: 5, from: 365, colors: ["#1d4ed8", "#d81d74"] }  // Final tier; keeps this palette
  ],

  // Only used to shade the 3D side of a button during the rainbow event.
  // (The animated rainbow itself lives in styles.css.)
  RAINBOW_COLORS: ["#ff9900", "#9933ff"]
};