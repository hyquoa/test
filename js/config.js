const Config = {

  // true  = dev tools on
  // false = not on dehahah
  DEV_MODE: false, // prolly dont enable this lmao
  DEV_TOOLS_PASSWORD: "dev",

  STORAGE_KEY: "zaqwsdxcfredfghjiuytrfdcfghjkiuhgfdcxvbnjkiuhygrfdxcvbhju",      // the name your browser saves the data under
  MAX_NAME_LENGTH: 40,              // longest task name allowed

  ACTIVATION_DAYS: 3,               // days in a row before a streak appears
  DAY_MS: 24 * 60 * 60 * 1000,      // 24 hours, in milliseconds

  // Tier colors are listed [bottom, top] for the streak number gradient.
  GRAY:  ["#CBD5E1", "#64748B"],    // at risk (not done yet)
  GREEN: ["#a3fd1c", "#5cef00"],    // done today, but the streak hasn't started yet

  // Each tier begins at "from" days
  TIERS: [
    { tier: 1, from: 3,   colors: ["#f0a03f", "#f5eb6f"] },
    { tier: 2, from: 50,  colors: ["#f8c750", "#ea5431"] },
    { tier: 3, from: 100, colors: ["#cc16a9", "#b421e3"] },
    { tier: 4, from: 200, colors: ["#52daf2", "#2558e7"] },
    { tier: 5, from: 365, colors: ["#fff1a8", "#ffd700"] }
  ]
};