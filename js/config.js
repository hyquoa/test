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
  GRAY:  ["#CBD5E1", "#64748B"],    // at risk (not done yet)
  GREEN: ["#a3fd1c", "#5cef00"],    // done today, but the streak hasn't started yet

  // Each tier begins at "from" days
  TIERS: [
    { tier: 1, from: 3,   colors: ["#faff00", "#ff7a00"] },
    { tier: 2, from: 30,  colors: ["#00f5d4", "#168bff"] },
    { tier: 3, from: 100, colors: ["#b7ff00", "#00c853"] },
    { tier: 4, from: 200, colors: ["#ff3cac", "#784bff"] },
    { tier: 5, from: 365, colors: ["#ffb000", "#ff3d5a"] }
  ]
};