import React, { useEffect, useMemo, useRef, useState } from "react";

const GLOBAL_TOUCH_CSS = `
  html, body, #root {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000;
    overscroll-behavior: none;
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
    touch-action: none;
    position: fixed;
    inset: 0;
  }

  @media (max-width: 600px) {
    body {
      position: fixed;
      width: 100vw;
      height: 100dvh;
    }
  }

  * {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  button {
    min-height: 44px;
    touch-action: manipulation;
  }
`;

const GAME_W = 380;
const GAME_H = 640;
const SHIP_X = 90;
const GRAVITY = 0.38;
const LIFT = -7.1;
const WALL_WIDTH = 70;
const GAP = 185;
const WALL_SPAWN_FRAMES = 78;
const SHIP_SIZE = 38;
const SHIP_HITBOX = 20;
const PERFORMANCE_MODE = true;
const TAP_TO_PLAY_MODE = true;
const MOBILE_PERFORMANCE_MODE = true;
const MOBILE_HD_MODE = true;

const SOUND_FILES = {
  boost: "/sounds/boost.mp3",
  score: "/sounds/score.mp3",
  phase: "/sounds/phase.mp3",
  death: "/sounds/death.mp3",
  click: "/sounds/click.mp3",
  revive: "/sounds/revive.mp3",
  ambience: "/sounds/ambience.mp3",
  menu: "/sounds/menu.mp3"
};

const SOUND_VOLUME = {
  boost: 0.32,
  score: 0.28,
  phase: 0.38,
  death: 0.42,
  click: 0.22,
  revive: 0.45,
  ambience: 0.18,
  menu: 0.22,
};

const cosmeticCatalog = {
  ships: [
    { id: "DEFAULT", name: "DEFAULT", rarity: "FREE", cost: 0, requirement: 0, ownedByDefault: true },
    { id: "VOID", name: "VOID", rarity: "RARE", cost: 400, requirement: 40, ownedByDefault: false },
    { id: "SOLAR", name: "SOLAR", rarity: "RARE", cost: 650, requirement: 60, ownedByDefault: false },
    { id: "NEBULA", name: "NEBULA", rarity: "EPIC", cost: 1200, requirement: 85, ownedByDefault: false },
    { id: "GOLD", name: "GOLD", rarity: "LEGENDARY", cost: 2500, requirement: 115, ownedByDefault: false },
    { id: "GLITCH", name: "GLITCH", rarity: "TRANSCENDENT", cost: 5000, requirement: 150, ownedByDefault: false },
    { id: "ABYSSAL", name: "ABYSSAL", rarity: "MYTHIC", cost: 25000, requirement: 250, ownedByDefault: false },
  ],
  boosts: [
    { id: "FIRE", name: "FIRE", rarity: "FREE", cost: 0, requirement: 0, ownedByDefault: true },
    { id: "VOID", name: "VOID", rarity: "RARE", cost: 350, requirement: 40, ownedByDefault: false },
    { id: "SOLAR", name: "SOLAR", rarity: "RARE", cost: 550, requirement: 60, ownedByDefault: false },
    { id: "ICE", name: "ICE", rarity: "EPIC", cost: 1100, requirement: 85, ownedByDefault: false },
    { id: "PLASMA", name: "PLASMA", rarity: "LEGENDARY", cost: 2200, requirement: 115, ownedByDefault: false },
    { id: "RAINBOW", name: "RAINBOW", rarity: "TRANSCENDENT", cost: 4500, requirement: 150, ownedByDefault: false },
    { id: "ABYSSAL", name: "ABYSSAL", rarity: "MYTHIC", cost: 22000, requirement: 250, ownedByDefault: false },
  ],
  deathFx: [
    { id: "STATIC", name: "STATIC", rarity: "FREE", cost: 0, requirement: 0, ownedByDefault: true },
    { id: "EMBER", name: "EMBER", rarity: "EPIC", cost: 900, requirement: 60, ownedByDefault: false },
    { id: "VOID RIPPLE", name: "VOID RIPPLE", rarity: "TRANSCENDENT", cost: 4000, requirement: 150, ownedByDefault: false },
    { id: "ABYSSAL COLLAPSE", name: "ABYSSAL COLLAPSE", rarity: "MYTHIC", cost: 18000, requirement: 250, ownedByDefault: false },
  ],
  auras: [
    { id: "NONE", name: "NONE", rarity: "FREE", cost: 0, requirement: 0, ownedByDefault: true },
    { id: "HALO", name: "HALO", rarity: "LEGENDARY", cost: 2300, requirement: 115, ownedByDefault: false },
    { id: "SIGNAL", name: "SIGNAL", rarity: "TRANSCENDENT", cost: 3800, requirement: 150, ownedByDefault: false },
    { id: "ABYSS", name: "ABYSS", rarity: "MYTHIC", cost: 20000, requirement: 250, ownedByDefault: false }
  ],
};

function getShipGradient(style) {
  if (style === "VOID") return "radial-gradient(circle at 28% 24%, #ffffff 0%, #a78bfa 22%, #7c3aed 52%, #1e063f 100%)";
  if (style === "SOLAR") return "radial-gradient(circle at 28% 24%, #fff7ed 0%, #fed7aa 22%, #fb923c 48%, #ef4444 72%, #450a0a 100%)";
  if (style === "NEBULA") return "radial-gradient(circle at 25% 22%, #ffffff 0%, #f0abfc 18%, #ec4899 38%, #06b6d4 68%, #111827 100%)";
  if (style === "GOLD") return "radial-gradient(circle at 28% 22%, #ffffff 0%, #fef08a 20%, #facc15 48%, #b45309 76%, #451a03 100%)";
  if (style === "GLITCH") return "linear-gradient(135deg, #ffffff 0%, #22d3ee 18%, #111827 34%, #f472b6 52%, #22d3ee 68%, #030712 100%)";
  if (style === "ABYSSAL") return "radial-gradient(circle at 50% 50%, #000000 0%, #020617 38%, #050510 72%, #000000 100%)";
  return "radial-gradient(circle at 28% 24%, rgba(255,255,255,1) 0%, rgba(235,240,248,1) 28%, rgba(170,180,195,1) 62%, rgba(90,100,118,1) 100%)";
}

function getBoostGradient(style) {
  if (style === "VOID") return "linear-gradient(to left, rgba(124,58,237,1), rgba(192,132,252,0.95), rgba(255,255,255,0.55), transparent)";
  if (style === "SOLAR") return "linear-gradient(to left, rgba(239,68,68,1), rgba(251,146,60,1), rgba(254,240,138,0.95), transparent)";
  if (style === "ICE") return "linear-gradient(to left, rgba(14,165,233,1), rgba(186,230,253,1), rgba(255,255,255,0.75), transparent)";
  if (style === "PLASMA") return "linear-gradient(to left, rgba(236,72,153,1), rgba(34,211,238,1), rgba(255,255,255,0.7), transparent)";
  if (style === "RAINBOW") return "linear-gradient(to left, #ef4444, #f97316, #facc15, #22c55e, #38bdf8, #a78bfa, transparent)";
  if (style === "ABYSSAL") return "linear-gradient(to left, rgba(0,0,0,1), rgba(20,20,30,0.95), rgba(80,40,120,0.35), transparent)";
  return "linear-gradient(to left, rgba(255,92,24,1), rgba(255,184,76,0.95), rgba(255,255,255,0.55), transparent)";
}

function getBoostCoreGradient(style) {
  if (style === "VOID") return "linear-gradient(to left, rgba(255,255,255,1), rgba(216,180,254,0.95), transparent)";
  if (style === "SOLAR") return "linear-gradient(to left, rgba(255,255,255,1), rgba(254,240,138,1), transparent)";
  if (style === "ICE") return "linear-gradient(to left, rgba(255,255,255,1), rgba(186,230,253,1), transparent)";
  if (style === "PLASMA") return "linear-gradient(to left, rgba(255,255,255,1), rgba(125,211,252,1), transparent)";
  if (style === "RAINBOW") return "linear-gradient(to left, rgba(255,255,255,1), rgba(250,204,21,0.95), rgba(56,189,248,0.85), transparent)";
  if (style === "ABYSSAL") return "linear-gradient(to left, rgba(180,120,255,0.75), rgba(0,0,0,0.95), transparent)";
  return "linear-gradient(to left, rgba(255,255,255,1), rgba(255,200,80,0.95), transparent)";
}

const phases = [
  { name: "DRIFT", colors: ["#020617", "#1e1b4b", "#000000"], ship: "#67e8f9", accent: "#22d3ee", speed: 3.2, glow: 70, shake: 0 },
  { name: "WARP", colors: ["#06243a", "#0f4c81", "#000000"], ship: "#7dd3fc", accent: "#38bdf8", speed: 3.8, glow: 85, shake: 0 },
  { name: "VELOCITY", colors: ["#2e1065", "#701a75", "#000000"], ship: "#e879f9", accent: "#d946ef", speed: 4.5, glow: 100, shake: 0 },
  { name: "SOLAR", colors: ["#431407", "#92400e", "#000000"], ship: "#fb923c", accent: "#f97316", speed: 5.9, glow: 120, shake: 0.5 },
  { name: "INSTABILITY", colors: ["#450a0a", "#431407", "#000000"], ship: "#f87171", accent: "#ef4444", speed: 6.6, glow: 140, shake: 1 },
  { name: "FRACTURE", colors: ["#000000", "#450a0a", "#000000"], ship: "#ffffff", accent: "#fca5a5", speed: 7.1, glow: 160, shake: 1.5 },
  { name: "TRANSCENDENCE", colors: ["#dbeafe", "#f8fafc", "#c7d2fe"], ship: "#ffffff", accent: "#bfdbfe", speed: 7.8, glow: 210, shake: 0.25 },
];

const phaseStartScores = [0, 20, 40, 60, 85, 115, 150];

function getPhaseIndex(score) {
  if (score < 20) return 0;
  if (score < 40) return 1;
  if (score < 60) return 2;
  if (score < 85) return 3;
  if (score < 115) return 4;
  if (score < 150) return 5;
  return 6;
}

function safeRead(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

function safeWrite(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors.
  }
}

function getDefaultUnlocked() {
  return {
    ships: cosmeticCatalog.ships.filter((i) => i.ownedByDefault).map((i) => i.id),
    boosts: cosmeticCatalog.boosts.filter((i) => i.ownedByDefault).map((i) => i.id),
    deathFx: cosmeticCatalog.deathFx.filter((i) => i.ownedByDefault).map((i) => i.id),
    auras: cosmeticCatalog.auras.filter((i) => i.ownedByDefault).map((i) => i.id),
  };
}

function getRunCredits(score) {
  return Math.max(1, Math.floor(score / 8));
}

function cleanChoice(value, fallback) {
  return typeof value === "string" ? value : fallback;
}

export default function App() {
  const [soundEnabled, setSoundEnabled] = useState(() => safeRead("homebound_soundEnabled", "true") !== "false");
  const audioRef = useRef({});
  const audioUnlockedRef = useRef(false);

  const [booted, setBooted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [dead, setDead] = useState(false);
  const [screen, setScreen] = useState("MENU");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(safeRead("homebound_best", "0")));
  const [credits, setCredits] = useState(() => Number(safeRead("homebound_credits", "0")));
  const [dailyAdsUsed, setDailyAdsUsed] = useState(() => Number(safeRead("homebound_dailyAdsUsed", "0")));
  const [dailyAdsDate, setDailyAdsDate] = useState(() => safeRead("homebound_dailyAdsDate", ""));
  const [unlocked, setUnlocked] = useState(() => {
    try {
      const saved = safeRead("homebound_unlocked", "");
      return saved ? JSON.parse(saved) : getDefaultUnlocked();
    } catch {
      return getDefaultUnlocked();
    }
  });
  const [shipY, setShipY] = useState(GAME_H / 2);
  const [velocity, setVelocity] = useState(0);
  const [holdingBoost, setHoldingBoost] = useState(false);
  const [boostFlash, setBoostFlash] = useState(false);
  const [boostKick, setBoostKick] = useState(0);
  const [pulseScale, setPulseScale] = useState(1);
  const [walls, setWalls] = useState([]);
  const [phaseFlash, setPhaseFlash] = useState(false);
  const [phaseShock, setPhaseShock] = useState(false);
  const [deathFocus, setDeathFocus] = useState(false);
  const [deathZoom, setDeathZoom] = useState(null);
  const [reviveCount, setReviveCount] = useState(0);
  const [invulnerable, setInvulnerable] = useState(false);
  const [nearMissFlash, setNearMissFlash] = useState(false);
  const [nearMissSparks, setNearMissSparks] = useState([]);
  const frameRef = useRef(0);
  const [comets, setComets] = useState([]);
  const [shipStyle, setShipStyle] = useState(() => {
    return cleanChoice(safeRead("homebound_shipStyle", "DEFAULT"), "DEFAULT");
  });
  const [boostStyle, setBoostStyle] = useState(() => {
    return cleanChoice(safeRead("homebound_boostStyle", "FIRE"), "FIRE");
  });
  const [deathFx, setDeathFx] = useState(() => {
    return cleanChoice(safeRead("homebound_deathFx", "STATIC"), "STATIC");
  });
  const [auraStyle, setAuraStyle] = useState(() => {
    return cleanChoice(safeRead("homebound_auraStyle", "NONE"), "NONE");
  });
  const [previewShipStyle, setPreviewShipStyle] = useState(() => cleanChoice(safeRead("homebound_shipStyle", "DEFAULT"), "DEFAULT"));
  const [previewBoostStyle, setPreviewBoostStyle] = useState(() => cleanChoice(safeRead("homebound_boostStyle", "FIRE"), "FIRE"));
  const [previewDeathFx, setPreviewDeathFx] = useState(() => cleanChoice(safeRead("homebound_deathFx", "STATIC"), "STATIC"));
  const [previewAuraStyle, setPreviewAuraStyle] = useState(() => cleanChoice(safeRead("homebound_auraStyle", "NONE"), "NONE"));
  const [pendingPurchase, setPendingPurchase] = useState(null);
  const [continuedRun, setContinuedRun] = useState(false);
  const [stats, setStats] = useState(() => {
    try {
      const saved = safeRead("homebound_stats", "");
      return saved ? JSON.parse(saved) : { runs: 0, totalScore: 0, revives: 0, bestPhase: "DRIFT" };
    } catch {
      return { runs: 0, totalScore: 0, revives: 0, bestPhase: "DRIFT" };
    }
  });

  const spawnTimer = useRef(0);
  const lastGapY = useRef(GAME_H / 2);
  const scoredWallIds = useRef(new Set());
  const phaseIndex = getPhaseIndex(score);
  const currentPhase = phases[phaseIndex];
  const nextPhase = phases[Math.min(phaseIndex + 1, phases.length - 1)];
  const nextPhaseScore = phaseStartScores[Math.min(phaseIndex + 1, phaseStartScores.length - 1)];
  const distanceToNext = Math.max(0, nextPhaseScore - score);
  const phaseBleed = phaseIndex < phases.length - 1 && distanceToNext <= 8 ? (8 - distanceToNext) / 8 : 0;
  const phasePulse = phaseBleed > 0 ? 0.2 + phaseBleed * 0.28 + Math.abs(Math.sin(score * 1.7)) * 0.16 : 0;
  const isTranscendent = currentPhase.name === "TRANSCENDENCE";
  const transcendenceOverflow = Math.max(0, score - 150);
  const wallSpeed = isTranscendent ? currentPhase.speed + transcendenceOverflow * 0.035 : currentPhase.speed;
  const glowSize = TAP_TO_PLAY_MODE
    ? Math.min(90, isTranscendent ? currentPhase.glow + transcendenceOverflow * 0.06 : currentPhase.glow)
    : isTranscendent
    ? currentPhase.glow + transcendenceOverflow * 0.12
    : currentPhase.glow;
  const instabilityOffset = currentPhase.name === "INSTABILITY" ? Math.sin(score * 0.9) * 10 : 0;
  const fractureGhost = !PERFORMANCE_MODE && currentPhase.name === "FRACTURE";
  const transcendenceDrift = isTranscendent ? Math.sin(score * 0.04) * 18 : 0;
  const transcendenceBrightness = isTranscendent ? 1 : 1;

  const stars = useMemo(
    () =>
      Array.from({ length: MOBILE_PERFORMANCE_MODE ? (isTranscendent ? 8 : 12) : (isTranscendent ? 16 : 20) }, (_, i) => ({
        id: i,
        left: (i * 73) % 100,
        top: (i * 37) % 100,
        size: i % 3 === 0 ? 2 : 1,
        opacity: isTranscendent ? 0.04 + (i % 3) * 0.03 : 0.18 + (i % 5) * 0.08,
        depth: 0.25 + (i % 4) * 0.18,
      })),
    [isTranscendent]
  );

  const backgroundWisps = useMemo(
    () =>
      Array.from({ length: MOBILE_PERFORMANCE_MODE ? 1 : 4 }, (_, i) => ({
        id: i,
        left: (i * 31 + 8) % 100,
        top: (i * 23 + 14) % 100,
        width: 150 + i * 34,
        height: 48 + i * 16,
        drift: 0.012 + i * 0.006,
      })),
    []
  );

  const speedLines = useMemo(
    () =>
      Array.from({ length: MOBILE_PERFORMANCE_MODE ? 4 : 10 }, (_, i) => ({
        id: i,
        left: (i * 19 + 5) % 100,
        top: (i * 29 + 11) % 100,
        width: 70 + (i % 4) * 28,
        depth: 0.5 + (i % 5) * 0.18,
      })),
    []
  );

  function setupAudio() {
    if (audioUnlockedRef.current) return;
    audioUnlockedRef.current = true;

    Object.entries(SOUND_FILES).forEach(([key, src]) => {
      const audio = new Audio(src);
      audio.preload = "auto";
      audio.volume = SOUND_VOLUME[key] ?? 0.35;
      if (key === "ambience" || key === "menu") audio.loop = true;
      audioRef.current[key] = audio;
    });
  }

  function playSound(name) {
    if (!soundEnabled) return;
    setupAudio();
    const sound = audioRef.current[name];
    if (!sound) return;

    try {
      sound.currentTime = 0;
      sound.volume = SOUND_VOLUME[name] ?? 0.35;
      sound.play().catch(() => {});
    } catch {
      // Ignore browser audio blocking.
    }
  }

  function startMenuMusic(force = false) {
    if (!force && !soundEnabled) return;
    setupAudio();

    const menu = audioRef.current.menu;
    const ambience = audioRef.current.ambience;

    if (ambience) {
      try {
        ambience.pause();
        ambience.currentTime = 0;
      } catch {}
    }

    if (!menu) return;

    try {
      menu.volume = SOUND_VOLUME.menu;
      menu.play().catch(() => {});
    } catch {
      // Ignore browser audio blocking.
    }
  }

  function stopMenuMusic() {
    const menu = audioRef.current.menu;
    if (!menu) return;

    try {
      menu.pause();
      menu.currentTime = 0;
    } catch {}
  }

  function startAmbience(force = false) {
    if (!force && !soundEnabled) return;
    setupAudio();
    stopMenuMusic();

    const ambience = audioRef.current.ambience;
    if (!ambience) return;

    try {
      ambience.volume = SOUND_VOLUME.ambience;
      ambience.play().catch(() => {});
    } catch {
      // Ignore browser audio blocking.
    }
  }

  function stopAmbience() {
    const ambience = audioRef.current.ambience;
    if (!ambience) return;
    try {
      ambience.pause();
      ambience.currentTime = 0;
    } catch {
      // Ignore audio errors.
    }
  }

  function startBoostSound(force = false) {
    if (!force && !soundEnabled) return;
    setupAudio();
    const boost = audioRef.current.boost;
    if (!boost) return;

    try {
      boost.pause();
      boost.loop = true;
      boost.currentTime = 0;
      boost.volume = SOUND_VOLUME.boost;
      const result = boost.play();
      if (result?.catch) result.catch(() => {});
    } catch {
      // Ignore browser audio blocking.
    }
  }

  function stopBoostSound() {
    const boost = audioRef.current.boost;
    if (!boost) return;

    try {
      boost.pause();
      boost.currentTime = 0;
    } catch {
      // Ignore audio errors.
    }
  }

  function toggleSound() {
    setSoundEnabled((enabled) => {
      const next = !enabled;
      if (!next) {
        stopBoostSound();
        stopAmbience();
        stopMenuMusic();
      }
      return next;
    });
  }

  function getApproachMessage() {
    if (nextPhase.name === "SOLAR") return "SOLAR INTERFERENCE";
    if (nextPhase.name === "INSTABILITY") return "VECTOR UNSTABLE";
    if (nextPhase.name === "FRACTURE") return "RETURN PATH DISTORTING";
    if (nextPhase.name === "TRANSCENDENCE") return "SIGNAL LOST";
    return `APPROACHING ${nextPhase.name}`;
  }

  function getDeathTitle() {
    if (score > 150) return "DRIFT CONTINUES";
    if (score > 110) return "SIGNAL LOST";
    return "LOST IN SPACE";
  }

  function getDeathSubtitle() {
    if (score > 150) return "NO RESPONSE DETECTED";
    return "REALITY COLLAPSED HERE";
  }

  function startGame(startScore) {
    stopMenuMusic();
    setupAudio();
    startAmbience(true);
    playSound("click");
    const initialScore = typeof startScore === "number" ? startScore : 0;
    setStarted(true);
    setDead(false);
    setScreen("GAME");
    setDeathFocus(false);
    setDeathZoom(null);
    setScore(initialScore);
    setShipY(GAME_H / 2);
    setVelocity(-3.5);
    setWalls([]);
    setComets([]);
    setNearMissSparks([]);
    setReviveCount(0);
    setInvulnerable(false);
    setContinuedRun(false);
    spawnTimer.current = 0;
    lastGapY.current = GAME_H / 2;
    scoredWallIds.current = new Set();
    setStats((s) => ({ ...s, runs: s.runs + 1 }));
  }

  function endRun(finalScore) {
    const adjustedScore = continuedRun ? Math.floor(finalScore * 0.65) : finalScore;
    const earnedCredits = getRunCredits(adjustedScore);
    setCredits((c) => c + earnedCredits);
    const phaseName = phases[getPhaseIndex(adjustedScore)].name;
    setStats((s) => ({
      ...s,
      totalScore: s.totalScore + adjustedScore,
      bestPhase: phaseStartScores[getPhaseIndex(adjustedScore)] >= phaseStartScores[getPhaseIndex(best)] ? phaseName : s.bestPhase,
    }));
  }

  function pulse() {
    if (!started || dead || deathFocus) return;
    setVelocity((v) => Math.max(v + LIFT * 0.22, -6.6));
    setPulseScale(1.05);
    setBoostFlash(true);
    setBoostKick(0.45);
    setTimeout(() => setPulseScale(1), 60);
    setTimeout(() => setBoostKick(0), 100);
  }

  function beginBoost() {
    if (!started || dead) return;
    startBoostSound();
    pulse();
    setHoldingBoost(true);
    setBoostFlash(true);
  }

  function endBoost() {
    stopBoostSound();
    setHoldingBoost(false);
  }

  function revive() {
    playSound("revive");
    startAmbience(true);
    setContinuedRun(true);
    setDead(false);
    setReviveCount((c) => c + 1);
    setInvulnerable(true);
    setVelocity(-3.5);
    setShipY(GAME_H / 2);
    setWalls((w) => w.filter((wall) => wall.x < SHIP_X - 90 || wall.x > SHIP_X + 170));
    setStats((s) => ({ ...s, revives: s.revives + 1 }));
    setTimeout(() => setInvulnerable(false), 1200);
  }

  useEffect(() => {
    if (!loading) return;

    const loadingTimer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(loadingTimer);
  }, [loading]);

  useEffect(() => {
    safeWrite("homebound_soundEnabled", String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    if ((!started && !dead) || loading) startMenuMusic();
  }, [started, dead, soundEnabled, loading]);
  useEffect(() => safeWrite("homebound_best", String(best)), [best]);
  useEffect(() => safeWrite("homebound_credits", String(credits)), [credits]);
  useEffect(() => safeWrite("homebound_dailyAdsUsed", String(dailyAdsUsed)), [dailyAdsUsed]);
  useEffect(() => safeWrite("homebound_dailyAdsDate", dailyAdsDate), [dailyAdsDate]);
  useEffect(() => safeWrite("homebound_unlocked", JSON.stringify(unlocked)), [unlocked]);
  useEffect(() => safeWrite("homebound_shipStyle", shipStyle), [shipStyle]);
  useEffect(() => safeWrite("homebound_boostStyle", boostStyle), [boostStyle]);
  useEffect(() => safeWrite("homebound_deathFx", deathFx), [deathFx]);
  useEffect(() => safeWrite("homebound_auraStyle", auraStyle), [auraStyle]);
  useEffect(() => safeWrite("homebound_stats", JSON.stringify(stats)), [stats]);

  useEffect(() => {
    const today = new Date().toDateString();

    if (dailyAdsDate !== today) {
      setDailyAdsDate(today);
      setDailyAdsUsed(0);
    }
  }, []);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) {
        stopBoostSound();
        setHoldingBoost(false);
        setBoostFlash(false);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    function handleKey(e) {
      if (e.code === "Space") {
        e.preventDefault();
        if (!started || dead) return;
        if (!holdingBoost) beginBoost();
      }
    }

    function handleKeyUp(e) {
      if (e.code === "Space") endBoost();
    }

    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [started, dead, holdingBoost, deathFocus]);

  useEffect(() => {
    if (!started || dead || deathFocus) return;
    setBoostFlash(holdingBoost);
  }, [started, dead, deathFocus, holdingBoost]);

  useEffect(() => {
    if (!started || dead || deathFocus) return;

    const loop = setInterval(() => {
      frameRef.current += 1;
      setVelocity((v) => Math.max(v + GRAVITY + (holdingBoost ? -1.05 : 0), -6.6));

      setShipY((y) => {
        const next = y + velocity;
        if (next < 0 || next > GAME_H - SHIP_SIZE) {
          playSound("death");
          stopAmbience();
          stopBoostSound();
          setDead(true);
          setDeathFocus(false);
          setBest((b) => Math.max(b, score));
          endRun(score);
          return Math.max(0, Math.min(GAME_H - SHIP_SIZE, next));
        }
        return next;
      });

      spawnTimer.current += 1;
      if (spawnTimer.current > WALL_SPAWN_FRAMES) {
        spawnTimer.current = 0;
        const minGapY = 125;
        const maxGapY = 375;
        const direction = lastGapY.current < GAME_H / 2 ? 1 : -1;
        const forcedShift = 65 + Math.random() * 85;
        let gapY = lastGapY.current + direction * forcedShift + (Math.random() - 0.5) * 70;

        gapY = Math.max(minGapY, Math.min(maxGapY, gapY));

        if (Math.abs(gapY - lastGapY.current) < 55) {
          gapY = lastGapY.current < GAME_H / 2 ? maxGapY - Math.random() * 80 : minGapY + Math.random() * 80;
        }

        lastGapY.current = gapY;
        setWalls((w) => [...w, { id: Date.now() + Math.random(), x: GAME_W, gapY, scored: false }]);
      }

      setWalls((current) =>
        current
          .map((wall) => {
            const moved = {
              ...wall,
              x: wall.x - wallSpeed + (currentPhase.name === "INSTABILITY" ? Math.sin((wall.x + score) * 0.03) * 1.4 : 0),
            };

            const shipLeft = SHIP_X + (SHIP_SIZE - SHIP_HITBOX) / 2;
            const shipRight = shipLeft + SHIP_HITBOX;
            const shipTop = shipY + (SHIP_SIZE - SHIP_HITBOX) / 2;
            const shipBottom = shipTop + SHIP_HITBOX;
            const touchingX = shipRight > moved.x && shipLeft < moved.x + WALL_WIDTH;
            const touchingY = shipTop < moved.gapY - GAP / 2 || shipBottom > moved.gapY + GAP / 2;

            if (touchingX && touchingY && !deathFocus && !invulnerable) {
              const meaningfulDeath = score > 40 || score >= best || isTranscendent;
              if (meaningfulDeath) {
                playSound("death");
                stopAmbience();
                stopBoostSound();
                setDeathFocus(true);
                setDeathZoom({ x: moved.x + WALL_WIDTH / 2, y: shipY + SHIP_SIZE / 2 });
                setTimeout(() => {
                  setDead(true);
                  setDeathFocus(false);
                  setBest((b) => Math.max(b, score));
                  endRun(score);
                }, 850);
              } else {
                playSound("death");
                stopAmbience();
                stopBoostSound();
                setDead(true);
                setBest((b) => Math.max(b, score));
                endRun(score);
              }
            }

            const nearMiss =
              touchingX &&
              !touchingY &&
              (Math.abs(shipTop - (moved.gapY - GAP / 2)) < 18 || Math.abs(shipBottom - (moved.gapY + GAP / 2)) < 18);

            if (nearMiss && frameRef.current % 10 === 0) {
              setNearMissFlash(true);
              setNearMissSparks((s) => [
                ...s.slice(-2),
                { id: Date.now() + Math.random(), x: SHIP_X + SHIP_SIZE + 8, y: shipY + SHIP_SIZE / 2, color: currentPhase.accent },
              ]);
              setTimeout(() => setNearMissFlash(false), 60);
              setTimeout(() => setNearMissSparks((s) => s.slice(1)), 140);
            }

            if (!scoredWallIds.current.has(moved.id) && moved.x + WALL_WIDTH < SHIP_X - 10) {
              scoredWallIds.current.add(moved.id);
              moved.scored = true;
              playSound("score");
              setScore((s) => s + 1);
            }

            return moved;
          })
          .filter((wall) => wall.x > -WALL_WIDTH)
      );
    }, 22);

    return () => clearInterval(loop);
  }, [started, dead, deathFocus, velocity, shipY, score, wallSpeed, best, isTranscendent, currentPhase.name, holdingBoost, invulnerable]);

  useEffect(() => {
    if (started && !dead) playSound("phase");
    setPhaseFlash(true);
    setPhaseShock(true);
    const flashTimeout = setTimeout(() => setPhaseFlash(false), 450);
    const shockTimeout = setTimeout(() => setPhaseShock(false), 650);
    return () => {
      clearTimeout(flashTimeout);
      clearTimeout(shockTimeout);
    };
  }, [phaseIndex]);

  useEffect(() => {
    if (!started || dead || deathFocus) return;
    const cometInterval = setInterval(() => {
      if (!PERFORMANCE_MODE && Math.random() < 0.55) {
        setComets((c) => [
          ...c.slice(-3),
          {
            id: Date.now() + Math.random(),
            x: GAME_W + 80,
            y: 70 + Math.random() * (GAME_H - 160),
            speed: 5 + Math.random() * 4 + phaseIndex * 0.4,
            size: 1 + Math.random() * 2,
            color: currentPhase.accent,
          },
        ]);
      }
    }, 1800);
    return () => clearInterval(cometInterval);
  }, [started, dead, deathFocus, phaseIndex, currentPhase.accent]);

  useEffect(() => {
    if (!started || dead || deathFocus) return;
    const cometMotion = setInterval(() => {
      setComets((current) => current.map((c) => ({ ...c, x: c.x - c.speed })).filter((c) => c.x > -160));
    }, PERFORMANCE_MODE ? 22 : 16);
    return () => clearInterval(cometMotion);
  }, [started, dead, deathFocus]);

  function renderStructure(wall, top, height, bottom = false) {
    const isSolar = currentPhase.name === "SOLAR";
    const isInstability = currentPhase.name === "INSTABILITY";
    const isFracture = currentPhase.name === "FRACTURE";
    const isTrans = currentPhase.name === "TRANSCENDENCE";
    const ringOffset = Math.sin(wall.x * 0.015) * 12;
    const debrisOffset = Math.cos(wall.x * 0.02) * 8;
    const stationGlow = currentPhase.accent + "55";

    if (isSolar) {
      return (
        <>
          <div style={{ position: "absolute", left: wall.x - 42, top: bottom ? top - 30 : top + height - 30, width: WALL_WIDTH + 84, height: 60, borderRadius: 999, border: `2px solid ${stationGlow}`, transform: `rotate(${bottom ? -18 : 18}deg) translateY(${ringOffset}px)`, filter: "blur(0.3px)", opacity: 0.4 }} />
          <div style={{ position: "absolute", left: wall.x - 10, top, width: WALL_WIDTH + 20, height, background: "linear-gradient(180deg, rgba(255,240,180,0.98), rgba(255,170,60,0.95) 30%, rgba(255,90,20,0.92) 100%)", borderRadius: 42, boxShadow: "0 0 55px rgba(255,140,40,0.85)", border: "2px solid rgba(255,240,180,0.55)", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, opacity: 0.4, background: "repeating-linear-gradient(135deg, rgba(255,255,255,0.22) 0px, rgba(255,255,255,0.22) 6px, transparent 6px, transparent 18px)" }} />
          </div>
          <div style={{ position: "absolute", left: wall.x - 26, top: bottom ? top - 20 : top + height - 20, width: WALL_WIDTH + 52, height: 40, borderRadius: 999, background: "linear-gradient(to right, rgba(255,210,120,1), rgba(255,150,50,0.95), rgba(255,210,120,1))", boxShadow: "0 0 35px rgba(255,180,80,0.95)", border: "2px solid rgba(255,240,180,0.5)" }} />
        </>
      );
    }

    if (isInstability) {
      return (
        <>
          <div style={{ position: "absolute", left: wall.x - 34, top: bottom ? top - 22 : top + height - 22, width: WALL_WIDTH + 68, height: 44, borderRadius: 999, border: "2px solid rgba(255,120,120,0.35)", transform: `rotate(${bottom ? -22 : 22}deg)`, filter: "blur(2px)", opacity: 0.2 }} />
          <div style={{ position: "absolute", left: wall.x - 12, top, width: WALL_WIDTH + 24, height, background: "linear-gradient(180deg, rgba(255,120,120,0.98), rgba(90,0,0,0.98))", clipPath: bottom ? "polygon(0% 0%, 76% 0%, 100% 12%, 88% 100%, 22% 92%, 0% 72%)" : "polygon(18% 0%, 100% 0%, 100% 84%, 82% 100%, 0% 100%, 0% 12%)", boxShadow: "0 0 38px rgba(255,80,80,0.78)", transform: `skew(${Math.sin(wall.x * 0.03) * 6}deg)`, border: "2px solid rgba(255,180,180,0.2)" }} />
        </>
      );
    }

    if (isFracture) {
      return (
        <>
          <div style={{ position: "absolute", left: wall.x - 28, top: top + height * 0.2, width: WALL_WIDTH + 56, height: 22, borderRadius: 999, background: "rgba(255,255,255,0.35)", filter: "blur(10px)", opacity: 0.2 }} />
          <div style={{ position: "absolute", left: wall.x - 8, top, width: WALL_WIDTH + 16, height, background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(120,0,0,0.92))", clipPath: "polygon(12% 0%, 100% 8%, 82% 100%, 0% 92%)", boxShadow: "0 0 42px rgba(255,255,255,0.45)", transform: `skew(${Math.sin(wall.x * 0.02) * 4}deg)` }} />
        </>
      );
    }

    if (isTrans) {
      return (
        <>
          <div
            style={{
              position: "absolute",
              left: wall.x - 14,
              top,
              width: WALL_WIDTH + 28,
              height,
              background: "linear-gradient(180deg, rgba(219,234,254,0.22) 0%, rgba(248,250,252,0.18) 18%, rgba(199,210,254,0.2) 46%, rgba(219,234,254,0.16) 100%)",
              borderRadius: 42,
              border: "1px solid rgba(0,0,0,0.42)",
              boxShadow: "inset 0 0 28px rgba(0,0,0,0.28)",
              transform: `skew(${Math.sin(wall.x * 0.02) * 4}deg) scaleY(${1 + Math.sin(wall.x * 0.015) * 0.04})`,
              overflow: "hidden"
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "repeating-linear-gradient(180deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 10px, transparent 10px, transparent 30px)",
                opacity: 0.18
              }}
            />
          </div>

          <div
            style={{
              position: "absolute",
              left: wall.x - 34,
              top: top + height * 0.22,
              width: WALL_WIDTH + 68,
              height: 22,
              borderRadius: 999,
              background: "linear-gradient(to right, transparent, rgba(0,0,0,0.22), rgba(255,255,255,0.04), transparent)",
              boxShadow: "none",
              opacity: 0.16
            }}
          />
        </>
      );
    }

    return (
      <>
        <div style={{ position: "absolute", left: wall.x - 8, top, width: WALL_WIDTH + 16, height, background: currentPhase.name === "DRIFT" ? "linear-gradient(160deg, rgba(115,130,160,0.95), rgba(35,45,70,0.98))" : currentPhase.name === "WARP" ? "linear-gradient(160deg, rgba(80,180,255,0.95), rgba(15,45,90,0.98))" : "linear-gradient(160deg, rgba(185,90,190,0.95), rgba(65,25,80,0.98))", clipPath: bottom ? "polygon(12% 0%, 78% 0%, 100% 18%, 88% 100%, 22% 92%, 0% 70%)" : "polygon(0% 8%, 82% 0%, 100% 32%, 76% 100%, 18% 88%, 6% 44%)", boxShadow: MOBILE_HD_MODE ? `0 0 10px ${currentPhase.accent}44` : `0 0 24px ${currentPhase.accent}66` }} />
        <div style={{ position: "absolute", left: wall.x + 14, top: bottom ? top + 18 + debrisOffset : Math.max(10, top + height - 52 + debrisOffset), width: 22, height: 22, borderRadius: 999, background: "rgba(255,255,255,0.28)", boxShadow: MOBILE_HD_MODE ? "none" : `0 0 16px ${currentPhase.accent}`, opacity: 0.75 }} />
        <div style={{ position: "absolute", left: wall.x - 20, top: bottom ? top + 54 - debrisOffset : Math.max(24, top + height - 96 - debrisOffset), width: 26, height: 8, borderRadius: 999, background: `linear-gradient(to right, transparent, ${currentPhase.accent}, transparent)`, boxShadow: `0 0 12px ${currentPhase.accent}`, opacity: 0.16 }} />
      </>
    );
  }

  function Ship({ crashed = false }) {
    const scale = crashed ? 2 : 1;
    const bodyStyle = getShipGradient(shipStyle);
    const isFancy = ["VOID", "SOLAR", "NEBULA", "GOLD", "GLITCH", "ABYSSAL"].includes(shipStyle);

    return (
      <div style={{ position: "relative", width: SHIP_SIZE * scale, height: SHIP_SIZE * scale }}>
        {!crashed && isFancy && (
          <div style={{ position: "absolute", left: SHIP_SIZE * -0.04 * scale, top: SHIP_SIZE * 0.11 * scale, width: SHIP_SIZE * 0.98 * scale, height: SHIP_SIZE * 0.7 * scale, borderRadius: 999, background: shipStyle === "GOLD" ? "radial-gradient(circle, rgba(250,204,21,0.38), transparent 68%)" : shipStyle === "SOLAR" ? "radial-gradient(circle, rgba(249,115,22,0.36), transparent 68%)" : shipStyle === "NEBULA" ? "radial-gradient(circle, rgba(34,211,238,0.32), rgba(236,72,153,0.18), transparent 70%)" : "radial-gradient(circle, rgba(167,139,250,0.32), transparent 68%)", filter: TAP_TO_PLAY_MODE ? "blur(3px)" : "blur(8px)", opacity: 0.9, pointerEvents: "none" }} />
        )}

        <div style={{ position: "absolute", left: SHIP_SIZE * 0.06 * scale, top: SHIP_SIZE * 0.18 * scale, width: SHIP_SIZE * 0.82 * scale, height: SHIP_SIZE * 0.52 * scale, borderRadius: "52% 48% 50% 50% / 62% 58% 48% 52%", background: bodyStyle, border: crashed ? "2px solid rgba(255,255,255,0.35)" : invulnerable ? "2px solid rgba(34,211,238,1)" : "2px solid rgba(255,255,255,0.58)", boxShadow: crashed ? "none" : shipStyle === "GOLD" ? "0 0 18px rgba(250,204,21,0.7)" : shipStyle === "NEBULA" ? "0 0 18px rgba(34,211,238,0.58)" : `0 0 ${18 + transcendenceOverflow * 0.05}px ${currentPhase.accent}`, opacity: !crashed && invulnerable ? 0.72 + Math.abs(Math.sin(score * 2)) * 0.28 : 1, overflow: "hidden" }}>
          {!crashed && ["NEBULA", "GOLD", "GLITCH"].includes(shipStyle) && (
            <div style={{ position: "absolute", left: 0, top: -8 * scale, width: 18 * scale, height: 46 * scale, background: "linear-gradient(to right, transparent, rgba(255,255,255,0.72), transparent)", animation: "skinShimmer 1.8s ease-in-out infinite", pointerEvents: "none" }} />
          )}
          {!crashed && shipStyle === "NEBULA" && (
            <div style={{ position: "absolute", right: 8 * scale, top: 5 * scale, width: 5 * scale, height: 5 * scale, borderRadius: 999, background: "rgba(34,211,238,0.95)", boxShadow: "0 0 10px rgba(34,211,238,0.95)", opacity: 0.9 }} />
          )}
        </div>
        {shipStyle === "ABYSSAL" && !crashed && (
          <>
            <div style={{ position: "absolute", left: SHIP_SIZE * -0.18 * scale, top: SHIP_SIZE * 0.06 * scale, width: SHIP_SIZE * 1.18 * scale, height: SHIP_SIZE * 0.9 * scale, borderRadius: 999, border: "1px solid rgba(120,80,180,0.12)", filter: "blur(1px)", opacity: 0.45, animation: "haloOrbit 6s linear infinite" }} />
            <div style={{ position: "absolute", left: SHIP_SIZE * 0.22 * scale, top: SHIP_SIZE * 0.28 * scale, width: SHIP_SIZE * 0.12 * scale, height: SHIP_SIZE * 0.12 * scale, borderRadius: 999, background: "rgba(168,85,247,0.9)", boxShadow: "0 0 10px rgba(168,85,247,0.9)", opacity: 0.75 }} />
          </>
        )}

        {shipStyle === "GLITCH" && !crashed && (
          <div style={{ position: "absolute", left: SHIP_SIZE * 0.08 * scale, top: SHIP_SIZE * 0.2 * scale, width: SHIP_SIZE * 0.78 * scale, height: SHIP_SIZE * 0.08 * scale, background: "rgba(34,211,238,0.75)", opacity: 0.16, transform: `translateY(${Math.sin(score * 1.7) * 6}px)` }} />
        )}
        {shipStyle === "GOLD" && (
          <div style={{ position: "absolute", left: SHIP_SIZE * 0.2 * scale, top: SHIP_SIZE * 0.23 * scale, width: SHIP_SIZE * 0.28 * scale, height: SHIP_SIZE * 0.08 * scale, borderRadius: 999, background: "rgba(255,255,255,0.65)", transform: "rotate(-12deg)", opacity: 0.8 }} />
        )}
        <div style={{ position: "absolute", left: SHIP_SIZE * 0.28 * scale, top: SHIP_SIZE * 0.29 * scale, width: SHIP_SIZE * 0.5 * scale, height: SHIP_SIZE * 0.24 * scale, borderRadius: 999, background: "linear-gradient(180deg, rgba(60,190,255,0.95), rgba(5,22,55,0.98) 55%, rgba(0,8,25,0.98))", boxShadow: "0 0 10px rgba(80,190,255,0.85), inset 0 2px 4px rgba(255,255,255,0.65)", border: "1px solid rgba(210,240,255,0.85)" }} />
        <div style={{ position: "absolute", left: SHIP_SIZE * -0.08 * scale, top: SHIP_SIZE * 0.32 * scale, width: SHIP_SIZE * 0.24 * scale, height: SHIP_SIZE * 0.2 * scale, borderRadius: 999, background: "linear-gradient(90deg, rgba(45,45,55,1), rgba(170,170,180,1), rgba(45,45,55,1))", border: "2px solid rgba(255,255,255,0.28)", boxShadow: "inset 0 0 8px rgba(0,0,0,0.75)" }} />
      </div>
    );
  }

  return (
    <div style={{
      width: "100vw",
      height: "100dvh",
      minHeight: "100vh",
      background: "#000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 0,
      overflow: "hidden",
      fontFamily: "system-ui, sans-serif",
      touchAction: "none",
      overscrollBehavior: "none",
      userSelect: "none",
      WebkitUserSelect: "none",
      WebkitTouchCallout: "none",
    }}>
      <div style={{
        width: `min(100vw, ${GAME_W}px)`,
        height: `min(100dvh, ${GAME_H}px)`,
        maxWidth: GAME_W,
        maxHeight: GAME_H,
        aspectRatio: `${GAME_W} / ${GAME_H}`,
        background: "#000",
        border: TAP_TO_PLAY_MODE ? "none" : "1px solid #1e293b",
        borderRadius: TAP_TO_PLAY_MODE ? 0 : 32,
        overflow: "hidden",
        boxShadow: TAP_TO_PLAY_MODE ? "none" : "0 25px 80px rgba(0,0,0,0.65)",
      }}>
        <div
          onContextMenu={(e) => e.preventDefault()}
          onMouseDown={() => {
            if (!started || dead || screen !== "GAME") return;
            beginBoost();
          }}
          onMouseUp={endBoost}
          onMouseLeave={endBoost}
          onTouchStart={(e) => {
            e.preventDefault();
            if (!started || dead || screen !== "GAME") return;
            beginBoost();
          }}
          onTouchMove={(e) => e.preventDefault()}
          onTouchEnd={endBoost}
          onTouchCancel={endBoost}
          style={{
            position: "relative",
            overflow: "hidden",
            cursor: "pointer",
            userSelect: "none",
            WebkitUserSelect: "none",
            WebkitTouchCallout: "none",
            touchAction: "none",
            width: "100%",
            height: "100%",
            maxWidth: GAME_W,
            maxHeight: GAME_H,
            aspectRatio: `${GAME_W} / ${GAME_H}`,
            margin: "auto",
            transition: deathFocus ? "transform 850ms cubic-bezier(0.16, 1, 0.3, 1)" : "none",
            transformOrigin: deathFocus && deathZoom ? `${deathZoom.x}px ${deathZoom.y}px` : "center center",
            transform: deathFocus && deathZoom ? `scale(1.45) translate(${-(deathZoom.x - GAME_W / 2) * 0.22}px, ${-(deathZoom.y - GAME_H / 2) * 0.18}px)` : `translate(${Math.sin(score * 0.15) * currentPhase.shake + instabilityOffset - boostKick * 2.2}px, ${Math.cos(score * 0.12) * currentPhase.shake}px)`,
          }}
        >
          <style>{`
            ${GLOBAL_TOUCH_CSS}

            @keyframes skinPulse {
              0% { transform: scale(1); opacity: 0.65; }
              50% { transform: scale(1.08); opacity: 1; }
              100% { transform: scale(1); opacity: 0.65; }
            }

            @keyframes trailShimmer {
              0% { opacity: 0.55; transform: translateX(0px) scaleX(0.92); }
              50% { opacity: 1; transform: translateX(-4px) scaleX(1.08); }
              100% { opacity: 0.55; transform: translateX(0px) scaleX(0.92); }
            }

            @keyframes skinShimmer {
              0% { transform: translateX(-120%) rotate(-18deg); opacity: 0; }
              35% { opacity: 0.75; }
              100% { transform: translateX(180%) rotate(-18deg); opacity: 0; }
            }

            @keyframes haloOrbit {
              0% { transform: rotate(0deg) scale(1); }
              50% { transform: rotate(180deg) scale(1.08); }
              100% { transform: rotate(360deg) scale(1); }
            }

            @keyframes trailPulse {
              0% { opacity: 0.35; transform: translateX(0px) scaleX(0.9); }
              50% { opacity: 0.9; transform: translateX(-8px) scaleX(1.12); }
              100% { opacity: 0.35; transform: translateX(0px) scaleX(0.9); }
            }

            @keyframes crashFloat {
              0% { transform: rotate(194deg) translateY(0px); }
              25% { transform: rotate(201deg) translateY(-4px); }
              50% { transform: rotate(196deg) translateY(3px); }
              75% { transform: rotate(204deg) translateY(-2px); }
              100% { transform: rotate(194deg) translateY(0px); }
            }
          `}</style>

          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, ${currentPhase.colors[0]}, ${currentPhase.colors[1]}, ${currentPhase.colors[2]})` }} />
          {isTranscendent && (
            <>
              <div
                style={{
                  position: "absolute",
                  inset: -120,
                  borderRadius: 9999,
                  border: "22px solid rgba(255,255,255,0.18)",
                  transform: "scale(1.4)",
                  opacity: 0.85,
                  pointerEvents: "none"
                }}
              />

              <div
                style={{
                  position: "absolute",
                  inset: -40,
                  borderRadius: 9999,
                  border: "10px solid rgba(255,255,255,0.16)",
                  transform: "scale(1.3)",
                  opacity: 0.75,
                  pointerEvents: "none"
                }}
              />

              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: 520,
                  height: 520,
                  transform: "translate(-50%, -50%) scale(1.2)",
                  borderRadius: 9999,
                  background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(191,219,254,0.14) 24%, rgba(255,255,255,0.04) 48%, transparent 72%)",
                  filter: "blur(12px)",
                  opacity: 0.9,
                  pointerEvents: "none"
                }}
              />
            </>
          )}
          {phaseShock && <div style={{ position: "absolute", left: GAME_W / 2 - 120, top: GAME_H / 2 - 120, width: 240, height: 240, borderRadius: 999, border: `2px solid ${currentPhase.accent}`, opacity: PERFORMANCE_MODE ? 0.08 : 0.18, transform: "scale(1.8)", filter: PERFORMANCE_MODE ? "none" : "blur(2px)", pointerEvents: "none" }} />}

          <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity: 0.4, pointerEvents: "none", transform: isTranscendent ? `translateX(${transcendenceDrift}px)` : "none", transition: isTranscendent ? "transform 0.3s linear" : "none" }}>
            {stars.map((star) => (
              <div key={star.id} style={{ position: "absolute", borderRadius: 999, background: "white", left: `${(star.left - score * star.depth * 0.08 + 120) % 120}%`, top: `${star.top}%`, width: star.size, height: star.size, opacity: star.opacity }} />
            ))}
          </div>

          {!isTranscendent && (
            <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", opacity: MOBILE_PERFORMANCE_MODE ? 0.16 : currentPhase.name === "DRIFT" ? 0.5 : 0.35 }}>
              {backgroundWisps.map((wisp) => (
                <div
                  key={wisp.id}
                  style={{
                    position: "absolute",
                    left: `${(wisp.left - score * wisp.drift + 120) % 120 - 10}%`,
                    top: `${wisp.top}%`,
                    width: wisp.width,
                    height: wisp.height,
                    borderRadius: 999,
                    background: `linear-gradient(to right, transparent, ${currentPhase.accent}22, rgba(255,255,255,0.08), transparent)`,
                    filter: MOBILE_PERFORMANCE_MODE ? "blur(8px)" : TAP_TO_PLAY_MODE ? "blur(14px)" : "blur(24px)",
                    transform: `rotate(${-18 + wisp.id * 11}deg)`,
                  }}
                />
              ))}
            </div>
          )}

          {(currentPhase.name === "WARP" || currentPhase.name === "VELOCITY" || currentPhase.name === "SOLAR" || currentPhase.name === "INSTABILITY" || currentPhase.name === "FRACTURE") && (
            <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", opacity: MOBILE_PERFORMANCE_MODE ? (holdingBoost ? 0.16 : 0.08) : holdingBoost ? 0.34 : 0.18 }}>
              {speedLines.map((line) => (
                <div
                  key={line.id}
                  style={{
                    position: "absolute",
                    left: `${(line.left - score * line.depth * 0.45 + 140) % 140 - 20}%`,
                    top: `${line.top}%`,
                    width: line.width,
                    height: 1,
                    borderRadius: 999,
                    background: `linear-gradient(to right, transparent, ${currentPhase.accent}99, transparent)`,
                    transform: "rotate(-9deg)",
                  }}
                />
              ))}
            </div>
          )}

          {isTranscendent && (
            <div style={{ position: "absolute", left: "50%", top: "48%", width: 280, height: 280, transform: "translate(-50%, -50%)", borderRadius: 9999, background: "radial-gradient(circle, rgba(255,255,255,0.52) 0%, rgba(255,255,255,0.24) 22%, transparent 68%)", filter: "blur(18px)", opacity: 0.7, pointerEvents: "none" }} />
          )}

          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 48%, transparent 42%, rgba(0,0,0,0.22) 100%)", opacity: isTranscendent ? 0.05 : 0.5, pointerEvents: "none" }} />

          {comets.map((comet) => (
            <div key={comet.id} style={{ position: "absolute", left: comet.x, top: comet.y, width: 90, height: comet.size + 2, borderRadius: 999, background: `linear-gradient(to left, ${comet.color}, rgba(255,255,255,0.35), transparent)`, filter: "blur(1px)", opacity: 0.16, transform: "rotate(-12deg)", pointerEvents: "none" }} />
          ))}

          <div style={{ position: "absolute", inset: 0, opacity: MOBILE_HD_MODE ? 0.18 : 0.3, pointerEvents: "none" }}>
            <div style={{ position: "absolute", top: 80, left: 48, width: 160, height: 160, borderRadius: 999, filter: MOBILE_HD_MODE ? "none" : MOBILE_PERFORMANCE_MODE ? "blur(6px)" : TAP_TO_PLAY_MODE ? "blur(12px)" : PERFORMANCE_MODE ? "blur(22px)" : "blur(45px)", background: currentPhase.accent }} />
            <div style={{ position: "absolute", bottom: 10, right: 0, width: 220, height: 220, borderRadius: 999, filter: MOBILE_HD_MODE ? "none" : MOBILE_PERFORMANCE_MODE ? "blur(6px)" : TAP_TO_PLAY_MODE ? "blur(12px)" : PERFORMANCE_MODE ? "blur(22px)" : "blur(45px)", background: currentPhase.ship }} />
          </div>

          {fractureGhost && walls.map((wall) => <React.Fragment key={`ghost-${wall.id}`}>{renderStructure({ ...wall, x: wall.x + 10 }, 0, wall.gapY - GAP / 2)}{renderStructure({ ...wall, x: wall.x + 10 }, wall.gapY + GAP / 2, GAME_H, true)}</React.Fragment>)}
          {walls.map((wall) => <React.Fragment key={wall.id}>{renderStructure(wall, 0, wall.gapY - GAP / 2)}{renderStructure(wall, wall.gapY + GAP / 2, GAME_H, true)}</React.Fragment>)}

          <div style={{ position: "absolute", left: SHIP_X - glowSize / 2 + SHIP_SIZE / 2, top: shipY - glowSize / 2 + SHIP_SIZE / 2, width: glowSize, height: glowSize, borderRadius: 999, background: "radial-gradient(circle, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.12) 40%, transparent 75%)", filter: MOBILE_HD_MODE ? "none" : MOBILE_PERFORMANCE_MODE ? "blur(2px)" : TAP_TO_PLAY_MODE ? "blur(3px)" : PERFORMANCE_MODE ? "blur(5px)" : "blur(10px)", pointerEvents: "none" }} />

          {boostFlash && (
            <>
              <div style={{ position: "absolute", left: holdingBoost ? SHIP_X - 89 : SHIP_X - 21, top: shipY + SHIP_SIZE / 2 - (holdingBoost ? 10 : 7), width: holdingBoost ? 101 : 12, height: holdingBoost ? 20 : 6, borderRadius: 999, background: getBoostGradient(boostStyle), filter: MOBILE_HD_MODE ? "none" : MOBILE_PERFORMANCE_MODE ? (holdingBoost ? "blur(1px)" : "none") : TAP_TO_PLAY_MODE ? (holdingBoost ? "blur(3px)" : "blur(1px)") : PERFORMANCE_MODE ? (holdingBoost ? "blur(5px)" : "blur(3px)") : (holdingBoost ? "blur(11px)" : "blur(6px)"), opacity: holdingBoost ? 1 : 0.58, transform: `rotate(${velocity * 1.1}deg)`, animation: ["ICE", "PLASMA", "RAINBOW", "VOID"].includes(boostStyle) ? "trailShimmer 0.65s ease-in-out infinite" : "none", pointerEvents: "none" }} />
              <div style={{ position: "absolute", left: holdingBoost ? SHIP_X - 64 : SHIP_X - 14, top: shipY + SHIP_SIZE / 2 - 4, width: holdingBoost ? 54 : 6, height: holdingBoost ? 12 : 3, borderRadius: 999, background: getBoostCoreGradient(boostStyle), filter: TAP_TO_PLAY_MODE ? "none" : PERFORMANCE_MODE ? "blur(1px)" : "blur(2px)", transform: `rotate(${velocity * 1.1}deg)`, pointerEvents: "none" }} />

              {holdingBoost && boostStyle === "ICE" && [0, 1, 2].map((i) => (
                <div key={`ice-${i}`} style={{ position: "absolute", left: SHIP_X - 72 - i * 18, top: shipY + SHIP_SIZE / 2 - 10 + i * 7, width: 10, height: 10, background: "rgba(186,230,253,0.9)", clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)", opacity: 0.55, transform: `rotate(${45 + i * 18}deg)`, filter: "blur(0.2px)", pointerEvents: "none" }} />
              ))}

              {holdingBoost && boostStyle === "PLASMA" && (
                <div style={{ position: "absolute", left: SHIP_X - 102, top: shipY + SHIP_SIZE / 2 - 16, width: 112, height: 32, borderRadius: 999, border: "1px solid rgba(34,211,238,0.5)", background: "radial-gradient(circle, rgba(236,72,153,0.18), transparent 70%)", animation: "trailPulse 0.55s ease-in-out infinite", pointerEvents: "none" }} />
              )}

              {holdingBoost && boostStyle === "ABYSSAL" && (
                <>
                  <div style={{ position: "absolute", left: SHIP_X - 118, top: shipY + SHIP_SIZE / 2 - 20, width: 126, height: 42, borderRadius: 999, background: "linear-gradient(to left, rgba(0,0,0,1), rgba(30,30,40,0.96), rgba(88,28,135,0.45), transparent)", filter: "blur(5px)", opacity: 0.95, animation: "trailPulse 1.1s ease-in-out infinite", pointerEvents: "none" }} />

                  <div style={{ position: "absolute", left: SHIP_X - 84, top: shipY + SHIP_SIZE / 2 - 10, width: 84, height: 18, borderRadius: 999, background: "linear-gradient(to left, rgba(168,85,247,0.85), rgba(0,0,0,1), transparent)", opacity: 0.92, filter: "blur(1px)", pointerEvents: "none" }} />
                </>
              )}

              {holdingBoost && boostStyle === "RAINBOW" && (
                <>
                  <div style={{ position: "absolute", left: SHIP_X - 104, top: shipY + SHIP_SIZE / 2 - 16, width: 118, height: 34, borderRadius: 999, background: "linear-gradient(to left, rgba(239,68,68,0.95), rgba(249,115,22,0.95), rgba(250,204,21,0.95), rgba(34,197,94,0.95), rgba(56,189,248,0.95), rgba(167,139,250,0.95), transparent)", filter: "blur(2px)", opacity: 0.95, animation: "trailPulse 0.7s ease-in-out infinite", pointerEvents: "none" }} />

                  <div style={{ position: "absolute", left: SHIP_X - 82, top: shipY + SHIP_SIZE / 2 - 7, width: 82, height: 14, borderRadius: 999, background: "linear-gradient(to left, rgba(255,255,255,0.98), rgba(250,204,21,0.95), rgba(56,189,248,0.95), rgba(167,139,250,0.9), transparent)", opacity: 0.92, filter: "blur(0.5px)", pointerEvents: "none" }} />
                </>
              )}
            </>
          )}

          <div style={{ position: "absolute", left: SHIP_X, top: shipY, width: SHIP_SIZE, height: SHIP_SIZE, transform: `scale(${(1 + Math.min(score / 160, 0.25)) * pulseScale}) rotate(${velocity * 1.6}deg)`, transition: "none" }}>
            <Ship />
          </div>

          {nearMissSparks.map((spark) => <div key={spark.id} style={{ position: "absolute", left: spark.x, top: spark.y, width: 8, height: 8, borderRadius: 999, background: spark.color, boxShadow: `0 0 18px ${spark.color}`, opacity: 0.75, pointerEvents: "none" }} />)}

          <div style={{ position: "absolute", top: 20, left: 20, color: "white" }}>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 3, color: currentPhase.accent }}>{currentPhase.name}</div>
            <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 1 }}>{score}</div>
          </div>

          <button
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              toggleSound();
            }}
            style={{ position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)", border: "1px solid rgba(255,255,255,0.14)", background: "rgba(0,0,0,0.18)", color: "rgba(255,255,255,0.65)", borderRadius: 999, padding: "6px 10px", fontSize: 10, fontWeight: 800, letterSpacing: 1.2, cursor: "pointer" }}
          >
            {soundEnabled ? "SOUND ON" : "SOUND OFF"}
          </button>

          <div style={{ position: "absolute", top: 20, right: 20, textAlign: "right", color: "rgba(255,255,255,0.72)" }}>
            {phaseBleed > 0 && phaseIndex < phases.length - 1 && <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: nextPhase.accent, marginBottom: 8 }}>{getApproachMessage()}</div>}
            <div style={{ fontSize: 12 }}>BEST</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{best}</div>
          </div>

          {!booted && (
            <TapToBeginScreen
              onBegin={() => {
                setSoundEnabled(true);
                safeWrite("homebound_soundEnabled", "true");
                setupAudio();
                setTimeout(() => startMenuMusic(true), 0);
                setBooted(true);
                setLoading(true);
              }}
            />
          )}

          {booted && loading && <LoadingScreen />}

          {booted && !loading && !started && screen === "MENU" && (
            <MenuScreen credits={credits} dailyAdsUsed={dailyAdsUsed} onAdCoins={() => {
                if (dailyAdsUsed >= 3) return;
                setCredits((c) => c + 10);
                setDailyAdsUsed((d) => d + 1);
              }} onLaunch={(startScore) => startGame(startScore)} onSkins={() => setScreen("SKINS")} onStats={() => setScreen("STATS")} />
          )}

          {booted && !loading && !started && screen === "SKINS" && (
            <SkinsScreen
              credits={credits}
              best={best}
              unlocked={unlocked}
              setCredits={setCredits}
              setUnlocked={setUnlocked}
              shipStyle={shipStyle}
              boostStyle={boostStyle}
              deathFx={deathFx}
              auraStyle={auraStyle}
              previewShipStyle={previewShipStyle}
              previewBoostStyle={previewBoostStyle}
              previewDeathFx={previewDeathFx}
              previewAuraStyle={previewAuraStyle}
              setPreviewShipStyle={setPreviewShipStyle}
              setPreviewBoostStyle={setPreviewBoostStyle}
              setPreviewDeathFx={setPreviewDeathFx}
              setPreviewAuraStyle={setPreviewAuraStyle}
              pendingPurchase={pendingPurchase}
              setPendingPurchase={setPendingPurchase}
              setShipStyle={setShipStyle}
              setBoostStyle={setBoostStyle}
              setDeathFx={setDeathFx}
              setAuraStyle={setAuraStyle}
              onBack={() => setScreen("MENU")}
            />
          )}

          {booted && !loading && !started && screen === "STATS" && <StatsScreen best={best} stats={stats} onBack={() => setScreen("MENU")} />}

          {dead && (
            <DeathScreen
              score={score}
              best={best}
              reviveCount={reviveCount}
              getDeathTitle={getDeathTitle}
              getDeathSubtitle={getDeathSubtitle}
              revive={revive}
              retry={() => startGame()}
              toMenu={() => {
                stopBoostSound();
                stopAmbience();
                setStarted(false);
                setDead(false);
                setScreen("MENU");
                setDeathFocus(false);
                setDeathZoom(null);
                setScore(0);
                setShipY(GAME_H / 2);
                setVelocity(0);
                setWalls([]);
                setComets([]);
                setNearMissSparks([]);
                spawnTimer.current = 0;
                lastGapY.current = GAME_H / 2;
                scoredWallIds.current = new Set();
              }}
              shipStyle={shipStyle}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Button({ children, onClick, color = "rgba(34,211,238,0.5)" }) {
  return (
    <button
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      style={{ padding: "12px 18px", borderRadius: 999, border: `1px solid ${color}`, background: "rgba(255,255,255,0.04)", color: "white", fontSize: 12, fontWeight: 800, letterSpacing: 2, cursor: "pointer" }}
    >
      {children}
    </button>
  );
}

function TapToBeginScreen({ onBegin }) {
  return (
    <div
      onClick={onBegin}
      onTouchStart={onBegin}
      style={{ ...overlayStyle(false, "rgba(0,0,0,0.96)"), cursor: "pointer" }}
    >
      <div style={{ position: "relative", width: 150, height: 82, marginBottom: 34 }}>
        <div style={{ position: "absolute", left: 8, top: 34, width: 84, height: 18, borderRadius: 999, background: "linear-gradient(to left, rgba(34,211,238,0.95), rgba(255,255,255,0.45), transparent)", filter: "blur(8px)", opacity: 0.95 }} />

        <div style={{ position: "absolute", left: 58, top: 18, width: 72, height: 36, borderRadius: "52% 48% 50% 50% / 62% 58% 48% 52%", background: "radial-gradient(circle at 28% 24%, rgba(255,255,255,1) 0%, rgba(235,240,248,1) 28%, rgba(170,180,195,1) 62%, rgba(90,100,118,1) 100%)", border: "2px solid rgba(255,255,255,0.58)", boxShadow: "0 0 28px rgba(103,232,249,0.45)" }} />

        <div style={{ position: "absolute", left: 78, top: 27, width: 42, height: 14, borderRadius: 999, background: "linear-gradient(180deg, rgba(60,190,255,0.95), rgba(5,22,55,0.98) 55%, rgba(0,8,25,0.98))", border: "1px solid rgba(210,240,255,0.85)" }} />

        <div style={{ position: "absolute", left: 50, top: 30, width: 18, height: 14, borderRadius: 999, background: "linear-gradient(90deg, rgba(45,45,55,1), rgba(170,170,180,1), rgba(45,45,55,1))", border: "2px solid rgba(255,255,255,0.28)" }} />
      </div>

      <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: 3, marginBottom: 14 }}>HOMEBOUND: SPACE RUNNER</div>

      <div style={{ color: "rgba(255,255,255,0.52)", fontSize: 12, letterSpacing: 5, animation: "tapPulse 1.4s ease-in-out infinite" }}>
        TAP TO BEGIN
      </div>

      <style>{`
        @keyframes tapPulse {
          0% { opacity: 0.25; }
          50% { opacity: 1; }
          100% { opacity: 0.25; }
        }
      `}</style>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={overlayStyle(false, "rgba(0,0,0,0.9)")}>
      <div style={{ position: "relative", width: 120, height: 70, marginBottom: 28 }}>
        <div style={{ position: "absolute", left: 0, top: 28, width: 64, height: 14, borderRadius: 999, background: "linear-gradient(to left, rgba(34,211,238,0.95), rgba(255,255,255,0.45), transparent)", filter: "blur(5px)", opacity: 0.95 }} />

        <div style={{ position: "absolute", left: 46, top: 18, width: 58, height: 28, borderRadius: "52% 48% 50% 50% / 62% 58% 48% 52%", background: "radial-gradient(circle at 28% 24%, rgba(255,255,255,1) 0%, rgba(235,240,248,1) 28%, rgba(170,180,195,1) 62%, rgba(90,100,118,1) 100%)", border: "2px solid rgba(255,255,255,0.58)", boxShadow: "0 0 24px rgba(103,232,249,0.45)" }} />

        <div style={{ position: "absolute", left: 62, top: 24, width: 34, height: 12, borderRadius: 999, background: "linear-gradient(180deg, rgba(60,190,255,0.95), rgba(5,22,55,0.98) 55%, rgba(0,8,25,0.98))", border: "1px solid rgba(210,240,255,0.85)" }} />

        <div style={{ position: "absolute", left: 40, top: 26, width: 16, height: 12, borderRadius: 999, background: "linear-gradient(90deg, rgba(45,45,55,1), rgba(170,170,180,1), rgba(45,45,55,1))", border: "2px solid rgba(255,255,255,0.28)" }} />
      </div>

      <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: 3, marginBottom: 12 }}>HOMEBOUND: SPACE RUNNER</div>

      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, letterSpacing: 3, marginBottom: 26 }}>
        CALIBRATING RETURN VECTOR
      </div>

      <div style={{ width: 170, height: 4, borderRadius: 999, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
        <div style={{ width: "100%", height: "100%", borderRadius: 999, background: "linear-gradient(to right, transparent, rgba(103,232,249,0.9), transparent)", animation: "loadingSweep 1.1s ease-in-out infinite" }} />
      </div>

      <style>{`
        @keyframes loadingSweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

function MenuScreen({ credits, dailyAdsUsed, onAdCoins, onLaunch, onSkins, onStats }) {
  return (
    <div style={overlayStyle(false)}>
      <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", color: "rgba(255,226,120,0.52)", fontSize: 10, fontWeight: 800, letterSpacing: 1.5 }}>
        ✦ {credits}
      </div>

      <div style={{ marginTop: 72, marginBottom: -30 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0, letterSpacing: 1.5 }}>HOMEBOUND: SPACE RUNNER</h1>
        
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, letterSpacing: 3, marginBottom: 16 }}>
          FAINT SIGNAL DETECTED
        </p>
        
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          width: "100%",
          maxWidth: 280,
          marginTop: 92,
        }}
      >
        <Button onClick={() => onLaunch()}>LAUNCH</Button>
        <Button onClick={onSkins} color="rgba(192,132,252,0.5)">
          HANGAR
        </Button>
        <Button onClick={onAdCoins} color="rgba(250,204,21,0.45)">
          {dailyAdsUsed >= 3 ? "DAILY ADS EXHAUSTED" : `WATCH AD +10 CREDITS (${3 - dailyAdsUsed}/3)`}
        </Button>
        <Button onClick={onStats} color="rgba(255,255,255,0.25)">
          LIFETIME STATS
        </Button>
      </div>
    </div>
  );
}

function SkinsScreen({ credits, best, unlocked, setCredits, setUnlocked, shipStyle, boostStyle, deathFx, auraStyle, previewShipStyle, previewBoostStyle, previewDeathFx, previewAuraStyle, setPreviewShipStyle, setPreviewBoostStyle, setPreviewDeathFx, setPreviewAuraStyle, pendingPurchase, setPendingPurchase, setShipStyle, setBoostStyle, setDeathFx, setAuraStyle, onBack }) {
  const previewShip = getShipGradient(previewShipStyle);
  const previewBoost = getBoostGradient(previewBoostStyle);

  return (
    <div style={overlayStyle(true)}>
      <h2 style={{ fontSize: 32, fontWeight: 900, margin: 0 }}>HANGAR</h2>
      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, letterSpacing: 3, marginBottom: 8 }}>COSMETICS ONLY</p>
      <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", color: "rgba(255,226,120,0.52)", fontSize: 10, fontWeight: 800, letterSpacing: 1.5 }}>
        ✦ {credits}
      </div>

      <div style={{ position: "relative", width: 240, height: 170, marginBottom: 24, transform: "scale(1.05)" }}>
        <div style={{ position: "absolute", left: 6, top: 70, width: 132, height: 28, borderRadius: 999, background: previewBoost, filter: "blur(7px)", opacity: 1, animation: "trailShimmer 0.7s ease-in-out infinite" }} />

        <div style={{ position: "absolute", left: 20, top: 74, width: 92, height: 12, borderRadius: 999, background: getBoostCoreGradient(previewBoostStyle), opacity: 0.95 }} />

        {previewBoostStyle === "ICE" && [0,1,2,3].map((i) => (
          <div key={`preview-ice-${i}`} style={{ position: "absolute", left: 22 + i * 18, top: 58 + i * 8, width: 14, height: 14, background: "rgba(186,230,253,0.95)", clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)", transform: `rotate(${45 + i * 15}deg)`, boxShadow: "0 0 12px rgba(186,230,253,0.8)" }} />
        ))}

        {previewBoostStyle === "PLASMA" && (
          <div style={{ position: "absolute", left: 0, top: 52, width: 150, height: 48, borderRadius: 999, border: "2px solid rgba(34,211,238,0.45)", background: "radial-gradient(circle, rgba(236,72,153,0.22), transparent 72%)", animation: "trailPulse 0.55s ease-in-out infinite" }} />
        )}

        {previewBoostStyle === "ABYSSAL" && (
          <>
            <div style={{ position: "absolute", left: -6, top: 52, width: 160, height: 50, borderRadius: 999, background: "linear-gradient(to left, rgba(0,0,0,1), rgba(20,20,28,0.96), rgba(88,28,135,0.48), transparent)", filter: "blur(5px)", opacity: 1, animation: "trailPulse 1.1s ease-in-out infinite" }} />

            <div style={{ position: "absolute", left: 24, top: 68, width: 92, height: 16, borderRadius: 999, background: "linear-gradient(to left, rgba(168,85,247,0.9), rgba(0,0,0,1), transparent)", opacity: 0.95 }} />
          </>
        )}

        {previewBoostStyle === "RAINBOW" && (
          <>
            <div style={{ position: "absolute", left: 0, top: 54, width: 148, height: 42, borderRadius: 999, background: "linear-gradient(to left, rgba(239,68,68,0.98), rgba(249,115,22,0.98), rgba(250,204,21,0.98), rgba(34,197,94,0.98), rgba(56,189,248,0.98), rgba(167,139,250,0.98), transparent)", filter: "blur(3px)", opacity: 1, animation: "trailPulse 0.75s ease-in-out infinite" }} />

            <div style={{ position: "absolute", left: 18, top: 67, width: 104, height: 14, borderRadius: 999, background: "linear-gradient(to left, rgba(255,255,255,1), rgba(250,204,21,0.98), rgba(56,189,248,0.95), rgba(167,139,250,0.92), transparent)", opacity: 0.95 }} />
          </>
        )}

        {previewDeathFx === "EMBER" && (
          <>
            <div style={{ position: "absolute", left: 108, top: 10, width: 10, height: 10, borderRadius: 999, background: "rgba(255,180,80,0.95)", boxShadow: "0 0 18px rgba(255,140,40,0.95)", animation: "crashFloat 1.8s ease-in-out infinite" }} />
            <div style={{ position: "absolute", left: 132, top: 18, width: 6, height: 6, borderRadius: 999, background: "rgba(255,90,40,0.95)", boxShadow: "0 0 14px rgba(255,90,40,0.95)", animation: "crashFloat 2.3s ease-in-out infinite" }} />
          </>
        )}

        {previewDeathFx === "VOID RIPPLE" && (
          <>
            <div style={{ position: "absolute", left: 76, top: 12, width: 74, height: 46, borderRadius: 999, border: "2px solid rgba(168,85,247,0.35)", boxShadow: "0 0 24px rgba(168,85,247,0.22)", opacity: 0.8 }} />
            <div style={{ position: "absolute", left: 68, top: 4, width: 90, height: 62, borderRadius: 999, border: "1px solid rgba(255,255,255,0.16)", opacity: 0.18 }} />
          </>
        )}

        {previewAuraStyle !== "NONE" && (
          <>
            {previewAuraStyle === "HALO" && (
              <div style={{ position: "absolute", left: 100, top: 34, width: 108, height: 64, borderRadius: 999, border: "2px solid rgba(255,255,255,0.5)", boxShadow: "0 0 28px rgba(255,255,255,0.45)", animation: "haloOrbit 3.5s linear infinite" }} />
            )}

            {previewAuraStyle === "SIGNAL" && (
              <>
                <div style={{ position: "absolute", left: 96, top: 30, width: 118, height: 72, borderRadius: 999, border: "2px solid rgba(56,189,248,0.65)", boxShadow: "0 0 30px rgba(56,189,248,0.55)", animation: "haloOrbit 3.5s linear infinite" }} />
                <div style={{ position: "absolute", left: 128, top: 58, width: 54, height: 8, borderRadius: 999, background: "linear-gradient(to right, transparent, rgba(56,189,248,0.9), transparent)", opacity: 0.9, animation: "trailPulse 1s ease-in-out infinite" }} />
              </>
            )}

            {previewAuraStyle === "ABYSS" && (
              <>
                <div style={{ position: "absolute", left: 84, top: 22, width: 142, height: 92, borderRadius: 999, background: "radial-gradient(circle, rgba(0,0,0,0.96) 0%, rgba(88,28,135,0.12) 55%, transparent 78%)", filter: "blur(10px)", opacity: 0.95, animation: "skinPulse 2.8s ease-in-out infinite" }} />
                <div style={{ position: "absolute", left: 102, top: 38, width: 106, height: 60, borderRadius: 999, border: "1px solid rgba(168,85,247,0.18)", boxShadow: "0 0 40px rgba(88,28,135,0.22)", animation: "haloOrbit 7s linear infinite reverse" }} />
              </>
            )}
          </>
        )}

        <div style={{ position: "absolute", left: 108, top: 44, width: 110, height: 72 }}>
          <div style={{ position: "absolute", left: 8, top: 12, width: 84, height: 40, borderRadius: "52% 48% 50% 50% / 62% 58% 48% 52%", background: previewShip, border: "2px solid rgba(255,255,255,0.58)", boxShadow: previewShipStyle === "GOLD" ? "0 0 28px rgba(250,204,21,0.9)" : previewShipStyle === "NEBULA" ? "0 0 28px rgba(34,211,238,0.8)" : "0 0 22px rgba(255,255,255,0.35)", overflow: "hidden" }}>
            {["NEBULA", "GOLD", "GLITCH"].includes(previewShipStyle) && (
              <div style={{ position: "absolute", left: -12, top: -12, width: 24, height: 72, background: "linear-gradient(to right, transparent, rgba(255,255,255,0.9), transparent)", transform: "rotate(-16deg)", animation: "skinShimmer 1.5s ease-in-out infinite" }} />
            )}

            {previewShipStyle === "NEBULA" && (
              <>
                <div style={{ position: "absolute", right: 16, top: 10, width: 6, height: 6, borderRadius: 999, background: "rgba(34,211,238,1)", boxShadow: "0 0 12px rgba(34,211,238,1)" }} />
                <div style={{ position: "absolute", right: 28, top: 18, width: 4, height: 4, borderRadius: 999, background: "rgba(236,72,153,0.95)", boxShadow: "0 0 10px rgba(236,72,153,0.95)" }} />
              </>
            )}
          </div>
          <div style={{ position: "absolute", left: 30, top: 24, width: 46, height: 16, borderRadius: 999, background: "linear-gradient(180deg, rgba(60,190,255,0.95), rgba(5,22,55,0.98) 55%, rgba(0,8,25,0.98))", border: "1px solid rgba(210,240,255,0.85)" }} />
          <div style={{ position: "absolute", left: -8, top: 26, width: 20, height: 14, borderRadius: 999, background: "linear-gradient(90deg, rgba(45,45,55,1), rgba(170,170,180,1), rgba(45,45,55,1))", border: "2px solid rgba(255,255,255,0.28)" }} />
        </div>
      </div>

      <div style={{ width: "100%", maxHeight: 385, overflowY: "auto", paddingRight: 4 }}>
        <Picker title="SHIP SKINS" category="ships" options={cosmeticCatalog.ships} value={shipStyle} previewValue={previewShipStyle} setPreviewValue={setPreviewShipStyle} credits={credits} best={best} unlocked={unlocked} setCredits={setCredits} setUnlocked={setUnlocked} setPendingPurchase={setPendingPurchase} onChange={setShipStyle} />
        <Picker title="BOOST TRAILS" category="boosts" options={cosmeticCatalog.boosts} value={boostStyle} previewValue={previewBoostStyle} setPreviewValue={setPreviewBoostStyle} credits={credits} best={best} unlocked={unlocked} setCredits={setCredits} setUnlocked={setUnlocked} setPendingPurchase={setPendingPurchase} onChange={setBoostStyle} />
        <Picker title="DEATH EFFECTS" category="deathFx" options={cosmeticCatalog.deathFx} value={deathFx} previewValue={previewDeathFx} setPreviewValue={setPreviewDeathFx} credits={credits} best={best} unlocked={unlocked} setCredits={setCredits} setUnlocked={setUnlocked} setPendingPurchase={setPendingPurchase} onChange={setDeathFx} />
        <Picker title="AURAS" category="auras" options={cosmeticCatalog.auras} value={auraStyle} previewValue={previewAuraStyle} setPreviewValue={setPreviewAuraStyle} credits={credits} best={best} unlocked={unlocked} setCredits={setCredits} setUnlocked={setUnlocked} setPendingPurchase={setPendingPurchase} onChange={setAuraStyle} />
      </div>

      {pendingPurchase && (
        <PurchaseConfirmModal
          purchase={pendingPurchase}
          credits={credits}
          setCredits={setCredits}
          setUnlocked={setUnlocked}
          onCancel={() => setPendingPurchase(null)}
          onConfirm={() => {
            const { item, category, onChange } = pendingPurchase;
            setCredits((c) => c - item.cost);
            setUnlocked((u) => ({
              ...u,
              [category]: [...new Set([...(u?.[category] || []), String(item.id)])],
            }));
            onChange(String(item.id));
            setPendingPurchase(null);
          }}
        />
      )}

      <Button onClick={onBack}>RETURN</Button>
    </div>
  );
}

function PurchaseConfirmModal({ purchase, credits, setCredits, setUnlocked, onCancel, onConfirm }) {
  const { item } = purchase;

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 28, zIndex: 20 }}>
      <div style={{ width: "100%", maxWidth: 290, borderRadius: 24, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(5,10,25,0.96)", padding: 22, boxShadow: "0 18px 60px rgba(0,0,0,0.65)", textAlign: "center", overflow: "hidden" }}>
        <div style={{ position: "relative", width: "100%", height: 90, marginBottom: 16, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 26, top: 34, width: 92, height: 18, borderRadius: 999, background: item.id === "VOID" ? "linear-gradient(to left, rgba(124,58,237,1), rgba(192,132,252,0.95), rgba(255,255,255,0.55), transparent)" : item.id === "SOLAR" ? "linear-gradient(to left, rgba(239,68,68,1), rgba(251,146,60,1), rgba(254,240,138,0.95), transparent)" : item.id === "ICE" ? "linear-gradient(to left, rgba(14,165,233,1), rgba(186,230,253,1), rgba(255,255,255,0.75), transparent)" : item.id === "PLASMA" ? "linear-gradient(to left, rgba(236,72,153,1), rgba(34,211,238,1), rgba(255,255,255,0.7), transparent)" : item.id === "RAINBOW" ? "linear-gradient(to left, #ef4444, #f97316, #facc15, #22c55e, #38bdf8, #a78bfa, transparent)" : "linear-gradient(to left, rgba(255,92,24,1), rgba(255,184,76,0.95), rgba(255,255,255,0.55), transparent)", filter: "blur(4px)", opacity: 0.95 }} />

          <div style={{ position: "absolute", left: 104, top: 24, width: 74, height: 38, borderRadius: "52% 48% 50% 50% / 62% 58% 48% 52%", background: item.id === "VOID" ? "radial-gradient(circle at 28% 24%, #ffffff 0%, #a78bfa 22%, #7c3aed 52%, #1e063f 100%)" : item.id === "SOLAR" ? "radial-gradient(circle at 28% 24%, #fff7ed 0%, #fed7aa 22%, #fb923c 48%, #ef4444 72%, #450a0a 100%)" : item.id === "NEBULA" ? "radial-gradient(circle at 25% 22%, #ffffff 0%, #f0abfc 18%, #ec4899 38%, #06b6d4 68%, #111827 100%)" : item.id === "GOLD" ? "radial-gradient(circle at 28% 22%, #ffffff 0%, #fef08a 20%, #facc15 48%, #b45309 76%, #451a03 100%)" : item.id === "GLITCH" ? "linear-gradient(135deg, #ffffff 0%, #22d3ee 18%, #111827 34%, #f472b6 52%, #22d3ee 68%, #030712 100%)" : "radial-gradient(circle at 28% 24%, rgba(255,255,255,1) 0%, rgba(235,240,248,1) 28%, rgba(170,180,195,1) 62%, rgba(90,100,118,1) 100%)", border: "2px solid rgba(255,255,255,0.58)", boxShadow: "0 0 20px rgba(255,255,255,0.22)" }} />

          <div style={{ position: "absolute", left: 122, top: 35, width: 34, height: 12, borderRadius: 999, background: "linear-gradient(180deg, rgba(60,190,255,0.95), rgba(5,22,55,0.98) 55%, rgba(0,8,25,0.98))", border: "1px solid rgba(210,240,255,0.85)" }} />

          <div style={{ position: "absolute", left: 94, top: 37, width: 16, height: 12, borderRadius: 999, background: "linear-gradient(90deg, rgba(45,45,55,1), rgba(170,170,180,1), rgba(45,45,55,1))", border: "2px solid rgba(255,255,255,0.28)" }} />
        </div>

        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: 3, marginBottom: 8 }}>CONFIRM PURCHASE</div>
        <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>{item.name}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", letterSpacing: 2, marginBottom: 16 }}>{item.rarity}</div>
        <div style={{ color: "#fde68a", fontWeight: 900, marginBottom: 6 }}>COST: {item.cost} CREDITS</div>
        <div style={{ color: "rgba(255,255,255,0.48)", fontSize: 12, marginBottom: 20 }}>BALANCE AFTER: {credits - item.cost}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Button onClick={onConfirm} color="rgba(250,204,21,0.55)">BUY & EQUIP</Button>
          <Button onClick={onCancel} color="rgba(255,255,255,0.22)">CANCEL</Button>
        </div>
      </div>
    </div>
  );
}

function Picker({ title, category, options, value, previewValue, setPreviewValue, credits, best, unlocked, setCredits, setUnlocked, setPendingPurchase, onChange }) {
  function handleItem(item) {
    setPreviewValue(String(item.id));
    const owned = unlocked?.[category]?.includes(item.id) || item.ownedByDefault;
    const requirementMet = best >= item.requirement;

    if (owned) {
      onChange(String(item.id));
      return;
    }

    if (!requirementMet || credits < item.cost) return;

    setPendingPurchase({ item, category, onChange });
  }

  return (
    <div style={{ width: "100%", maxWidth: 320, margin: "0 auto 18px" }}>
      <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, letterSpacing: 3, marginBottom: 10 }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {options.map((item) => {
          const owned = unlocked?.[category]?.includes(item.id) || item.ownedByDefault;
          const requirementMet = best >= item.requirement;
          const affordable = credits >= item.cost;
          const selected = value === item.id;
          const previewing = previewValue === item.id;
          const status = owned ? "OWNED" : !requirementMet ? `REACH ${item.requirement}` : affordable ? `${item.cost} CREDITS` : `${item.cost} CREDITS`;
          const statusColor = owned ? "rgba(125,211,252,0.8)" : !requirementMet ? "rgba(248,113,113,0.9)" : affordable ? "rgba(250,204,21,0.9)" : "rgba(255,255,255,0.45)";

          return (
          <button
            key={item.id}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              handleItem(item);
            }}
            style={{
              padding: "10px 6px",
              borderRadius: 16,
              border: selected ? "1px solid rgba(255,255,255,0.75)" : previewing ? "1px solid rgba(250,204,21,0.55)" : "1px solid rgba(255,255,255,0.12)",
              background: selected ? "rgba(255,255,255,0.15)" : previewing ? "rgba(250,204,21,0.08)" : owned ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.04)",
              color: "white",
              fontSize: 9,
              fontWeight: 900,
              letterSpacing: 1,
              cursor: "pointer",
              opacity: requirementMet ? 1 : 0.65,
            }}
          >
            <div>{item.name}</div>
            <div style={{ marginTop: 4, fontSize: 7, color: statusColor, letterSpacing: 0.5 }}>
              {status}
            </div>
          </button>
          );
        })}
      </div>
    </div>
  );
}

function StatsScreen({ best, stats, onBack }) {
  return (
    <div style={overlayStyle(true)}>
      <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 24 }}>LIFETIME STATS</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, width: "100%", maxWidth: 280, marginBottom: 28 }}>
        <Stat label="RUNS" value={stats.runs} />
        <Stat label="BEST" value={best} />
        <Stat label="TOTAL" value={stats.totalScore} />
        <Stat label="REVIVES" value={stats.revives} />
      </div>
      <div style={{ color: "rgba(216,180,254,0.75)", fontSize: 12, letterSpacing: 3, marginBottom: 28 }}>FARTHEST SIGNAL: {stats.bestPhase}</div>
      <Button onClick={onBack}>RETURN</Button>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", borderRadius: 18, padding: 16 }}>
      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{label}</div>
      <div style={{ color: "white", fontSize: 28, fontWeight: 900 }}>{value}</div>
    </div>
  );
}

function DeathScreen({ score, best, reviveCount, getDeathTitle, getDeathSubtitle, revive, retry, toMenu, shipStyle }) {
  const reviveLabel = "REVIVE (WATCH AD)";

  return (
    <div style={overlayStyle(true, "rgba(0,0,0,0.6)")}>
      <div style={{ width: 82, height: 62, marginBottom: 16, transform: "rotate(198deg)", opacity: 0.16, animation: "crashFloat 2.8s ease-in-out infinite", position: "relative" }}>
        <div style={{ position: "absolute", left: 6, top: 12, width: 68, height: 34, borderRadius: "52% 48% 50% 50% / 62% 58% 48% 52%", background: getShipGradient(shipStyle), border: "2px solid rgba(255,255,255,0.35)" }} />
        <div style={{ position: "absolute", left: 28, top: 20, width: 40, height: 16, borderRadius: 999, background: "linear-gradient(180deg, rgba(60,190,255,0.95), rgba(5,22,55,0.98) 55%, rgba(0,8,25,0.98))", border: "1px solid rgba(210,240,255,0.85)" }} />
        <div style={{ position: "absolute", left: -4, top: 21, width: 20, height: 16, borderRadius: 999, background: "linear-gradient(90deg, rgba(45,45,55,1), rgba(170,170,180,1), rgba(45,45,55,1))", border: "2px solid rgba(255,255,255,0.28)" }} />
      </div>
      <div style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>{getDeathTitle()}</div>
      <div style={{ color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>Score: {score}</div>
      {score >= best && score > 20 && <div style={{ color: "rgba(216,180,254,0.8)", fontSize: 10, letterSpacing: 3, marginBottom: 16 }}>{getDeathSubtitle()}</div>}
      <Button onClick={retry}>TRY AGAIN</Button>
      <div style={{ height: 10 }} />
      {reviveCount === 0 && (
        <Button onClick={revive} color="rgba(192,132,252,0.55)">
          {reviveLabel}
        </Button>
      )}
      <div style={{ height: 10 }} />
      <Button onClick={toMenu} color="rgba(255,255,255,0.25)">MAIN MENU</Button>
    </div>
  );
}

function overlayStyle(blur = true, bg = "rgba(0,0,0,0.7)") {
  return {
    position: "absolute",
    inset: 0,
    background: bg,
    backdropFilter: blur && !TAP_TO_PLAY_MODE ? "blur(8px)" : "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    color: "white",
    padding: 32,
    boxSizing: "border-box",
  };
}
