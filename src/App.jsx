import React, { useEffect, useMemo, useRef, useState } from "react";

const GAME_W = 380;
const GAME_H = 640;
const SHIP_X = 90;
const SHIP_SIZE = 38;
const SHIP_HITBOX = 21;
const GRAVITY = 0.38;
const LIFT = -7.1;
const WALL_WIDTH = 70;
const GAP = 185;
const WALL_SPAWN_FRAMES = 78;

function getCanvasDpr() {
  const raw = window.devicePixelRatio || 1;
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  // Mobile browsers struggle when canvas renders at full 2x/3x retina resolution.
  // 1.35 keeps it looking sharp while reducing per-frame pixel work a lot.
  if (isMobile) return Math.min(raw, 1.35);

  // Desktop can afford a cleaner high-DPI render.
  return Math.min(raw, 2);
}

const SOUND_FILES = {
  boost: "/sounds/boost.mp3",
  score: "/sounds/score.mp3",
  phase: "/sounds/phase.mp3",
  death: "/sounds/death.mp3",
  click: "/sounds/click.mp3",
  revive: "/sounds/revive.mp3",
  ambience: "/sounds/ambience.mp3",
  menu: "/sounds/menu.mp3",
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

const phases = [
  {
    name: "DRIFT",
    colors: ["#020617", "#1e1b4b", "#000000"],
    accent: "#22d3ee",
    ship: "#67e8f9",
    speed: 3.2,
  },
  {
    name: "WARP",
    colors: ["#06243a", "#0f4c81", "#000000"],
    accent: "#38bdf8",
    ship: "#7dd3fc",
    speed: 3.8,
  },
  {
    name: "VELOCITY",
    colors: ["#2e1065", "#701a75", "#000000"],
    accent: "#d946ef",
    ship: "#e879f9",
    speed: 4.5,
  },
  {
    name: "SOLAR",
    colors: ["#431407", "#92400e", "#000000"],
    accent: "#f97316",
    ship: "#fb923c",
    speed: 5.9,
  },
  {
    name: "INSTABILITY",
    colors: ["#450a0a", "#431407", "#000000"],
    accent: "#ef4444",
    ship: "#f87171",
    speed: 6.6,
  },
  {
    name: "FRACTURE",
    colors: ["#000000", "#450a0a", "#000000"],
    accent: "#fca5a5",
    ship: "#ffffff",
    speed: 7.1,
  },
  {
    name: "TRANSCENDENCE",
    colors: ["#dbeafe", "#f8fafc", "#c7d2fe"],
    accent: "#bfdbfe",
    ship: "#ffffff",
    speed: 7.8,
  },
];

const phaseStartScores = [0, 20, 40, 60, 85, 115, 150];

const cosmeticCatalog = {
  ships: [
    {
      id: "DEFAULT",
      name: "DEFAULT",
      rarity: "FREE",
      cost: 0,
      requirement: 0,
      ownedByDefault: true,
    },
    {
      id: "VOID",
      name: "VOID",
      rarity: "RARE",
      cost: 400,
      requirement: 40,
      ownedByDefault: false,
    },
    {
      id: "SOLAR",
      name: "SOLAR",
      rarity: "RARE",
      cost: 650,
      requirement: 60,
      ownedByDefault: false,
    },
    {
      id: "NEBULA",
      name: "NEBULA",
      rarity: "EPIC",
      cost: 1200,
      requirement: 85,
      ownedByDefault: false,
    },
    {
      id: "GOLD",
      name: "GOLD",
      rarity: "LEGENDARY",
      cost: 2500,
      requirement: 115,
      ownedByDefault: false,
    },
    {
      id: "GLITCH",
      name: "GLITCH",
      rarity: "TRANSCENDENT",
      cost: 5000,
      requirement: 150,
      ownedByDefault: false,
    },
    {
      id: "ABYSSAL",
      name: "ABYSSAL",
      rarity: "MYTHIC",
      cost: 25000,
      requirement: 250,
      ownedByDefault: false,
    },
  ],
  boosts: [
    {
      id: "FIRE",
      name: "FIRE",
      rarity: "FREE",
      cost: 0,
      requirement: 0,
      ownedByDefault: true,
    },
    {
      id: "VOID",
      name: "VOID",
      rarity: "RARE",
      cost: 350,
      requirement: 40,
      ownedByDefault: false,
    },
    {
      id: "SOLAR",
      name: "SOLAR",
      rarity: "RARE",
      cost: 550,
      requirement: 60,
      ownedByDefault: false,
    },
    {
      id: "ICE",
      name: "ICE",
      rarity: "EPIC",
      cost: 1100,
      requirement: 85,
      ownedByDefault: false,
    },
    {
      id: "PLASMA",
      name: "PLASMA",
      rarity: "LEGENDARY",
      cost: 2200,
      requirement: 115,
      ownedByDefault: false,
    },
    {
      id: "RAINBOW",
      name: "RAINBOW",
      rarity: "TRANSCENDENT",
      cost: 4500,
      requirement: 150,
      ownedByDefault: false,
    },
    {
      id: "ABYSSAL",
      name: "ABYSSAL",
      rarity: "MYTHIC",
      cost: 22000,
      requirement: 250,
      ownedByDefault: false,
    },
  ],
  deathFx: [
    {
      id: "STATIC",
      name: "STATIC",
      rarity: "FREE",
      cost: 0,
      requirement: 0,
      ownedByDefault: true,
    },
    {
      id: "EMBER",
      name: "EMBER",
      rarity: "EPIC",
      cost: 900,
      requirement: 60,
      ownedByDefault: false,
    },
    {
      id: "VOID RIPPLE",
      name: "VOID RIPPLE",
      rarity: "TRANSCENDENT",
      cost: 4000,
      requirement: 150,
      ownedByDefault: false,
    },
    {
      id: "ABYSSAL COLLAPSE",
      name: "ABYSSAL COLLAPSE",
      rarity: "MYTHIC",
      cost: 18000,
      requirement: 250,
      ownedByDefault: false,
    },
  ],
  auras: [
    {
      id: "NONE",
      name: "NONE",
      rarity: "FREE",
      cost: 0,
      requirement: 0,
      ownedByDefault: true,
    },
    {
      id: "HALO",
      name: "HALO",
      rarity: "LEGENDARY",
      cost: 2300,
      requirement: 115,
      ownedByDefault: false,
    },
    {
      id: "SIGNAL",
      name: "SIGNAL",
      rarity: "TRANSCENDENT",
      cost: 3800,
      requirement: 150,
      ownedByDefault: false,
    },
    {
      id: "ABYSS",
      name: "ABYSS",
      rarity: "MYTHIC",
      cost: 20000,
      requirement: 250,
      ownedByDefault: false,
    },
  ],
};

function getPhaseIndex(score) {
  if (score < 20) return 0;
  if (score < 40) return 1;
  if (score < 60) return 2;
  if (score < 85) return 3;
  if (score < 115) return 4;
  if (score < 150) return 5;
  return 6;
}

function getApproachMessage(score) {
  const next = phaseStartScores.find((start) => start > score);
  if (!next) return "SINGULARITY STABLE";
  const remaining = next - score;
  if (remaining <= 5) return "PHASE SHIFT IMMINENT";
  if (remaining <= 10) return "APPROACHING NEXT PHASE";
  return "";
}

function safeRead(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v;
  } catch {
    return fallback;
  }
}

function safeWrite(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function cleanChoice(value, fallback) {
  return typeof value === "string" ? value : fallback;
}

function getDefaultUnlocked() {
  return {
    ships: cosmeticCatalog.ships
      .filter((i) => i.ownedByDefault)
      .map((i) => i.id),
    boosts: cosmeticCatalog.boosts
      .filter((i) => i.ownedByDefault)
      .map((i) => i.id),
    deathFx: cosmeticCatalog.deathFx
      .filter((i) => i.ownedByDefault)
      .map((i) => i.id),
    auras: cosmeticCatalog.auras
      .filter((i) => i.ownedByDefault)
      .map((i) => i.id),
  };
}

function getRunCredits(score) {
  return Math.max(1, Math.floor(score / 8));
}

function getShipColors(style) {
  if (style === "VOID") return ["#ffffff", "#a78bfa", "#1e063f"];
  if (style === "SOLAR") return ["#fff7ed", "#fb923c", "#450a0a"];
  if (style === "NEBULA") return ["#ffffff", "#ec4899", "#06b6d4"];
  if (style === "GOLD") return ["#ffffff", "#facc15", "#451a03"];
  if (style === "GLITCH") return ["#22d3ee", "#f472b6", "#030712"];
  if (style === "ABYSSAL") return ["#0a0a12", "#000000", "#581c87"];
  return ["#ffffff", "#cbd5e1", "#475569"];
}

function getBoostColors(style) {
  if (style === "VOID") return ["#7c3aed", "#d8b4fe", "transparent"];
  if (style === "SOLAR") return ["#ef4444", "#f97316", "transparent"];
  if (style === "ICE") return ["#0ea5e9", "#bae6fd", "transparent"];
  if (style === "PLASMA") return ["#ec4899", "#22d3ee", "transparent"];
  if (style === "RAINBOW")
    return ["#ef4444", "#facc15", "#22c55e", "#38bdf8", "#a78bfa"];
  if (style === "ABYSSAL") return ["#000000", "#581c87", "transparent"];
  return ["#ff5c18", "#ffb84c", "transparent"];
}

function getBoostGradient(style) {
  const c = getBoostColors(style);
  if (style === "RAINBOW") {
    return "linear-gradient(to left, " + c.join(", ") + ", transparent)";
  }
  return "linear-gradient(to left, " + c[0] + ", " + c[1] + ", transparent)";
}

function getShipGradient(style) {
  const c = getShipColors(style);
  return (
    "radial-gradient(circle at 28% 24%, " +
    c[0] +
    " 0%, " +
    c[1] +
    " 42%, " +
    c[2] +
    " 100%)"
  );
}

function getBoostCoreGradient(style) {
  const c = getBoostColors(style);
  const middle = c[1] || "#fff";
  return (
    "linear-gradient(to left, rgba(255,255,255,0.95), " +
    middle +
    ", transparent)"
  );
}

export default function App() {
  const [soundEnabled, setSoundEnabled] = useState(
    () => safeRead("homebound_soundEnabled", "true") !== "false"
  );
  const audioRef = useRef({});
  const audioUnlockedRef = useRef(false);

  const [booted, setBooted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState("MENU");
  const [started, setStarted] = useState(false);
  const [dead, setDead] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() =>
    Number(safeRead("homebound_best", "0"))
  );
  const [credits, setCredits] = useState(() =>
    Number(safeRead("homebound_credits", "0"))
  );
  const [dailyAdsUsed, setDailyAdsUsed] = useState(() =>
    Number(safeRead("homebound_dailyAdsUsed", "0"))
  );
  const [dailyAdsDate, setDailyAdsDate] = useState(() =>
    safeRead("homebound_dailyAdsDate", "")
  );
  const [gameKey, setGameKey] = useState(0);
  const [reviveCount, setReviveCount] = useState(0);
  const [continuedRun, setContinuedRun] = useState(false);
  const [initialScore, setInitialScore] = useState(0);
  const [pendingPurchase, setPendingPurchase] = useState(null);

  const [unlocked, setUnlocked] = useState(() => {
    try {
      const saved = safeRead("homebound_unlocked", "");
      return saved ? JSON.parse(saved) : getDefaultUnlocked();
    } catch {
      return getDefaultUnlocked();
    }
  });

  const [shipStyle, setShipStyle] = useState(() =>
    cleanChoice(safeRead("homebound_shipStyle", "DEFAULT"), "DEFAULT")
  );
  const [boostStyle, setBoostStyle] = useState(() =>
    cleanChoice(safeRead("homebound_boostStyle", "FIRE"), "FIRE")
  );
  const [deathFx, setDeathFx] = useState(() =>
    cleanChoice(safeRead("homebound_deathFx", "STATIC"), "STATIC")
  );
  const [auraStyle, setAuraStyle] = useState(() =>
    cleanChoice(safeRead("homebound_auraStyle", "NONE"), "NONE")
  );
  const [previewShipStyle, setPreviewShipStyle] = useState(shipStyle);
  const [previewBoostStyle, setPreviewBoostStyle] = useState(boostStyle);
  const [previewDeathFx, setPreviewDeathFx] = useState(deathFx);
  const [previewAuraStyle, setPreviewAuraStyle] = useState(auraStyle);

  const [stats, setStats] = useState(() => {
    try {
      const saved = safeRead("homebound_stats", "");
      return saved
        ? JSON.parse(saved)
        : { runs: 0, totalScore: 0, revives: 0, bestPhase: "DRIFT" };
    } catch {
      return { runs: 0, totalScore: 0, revives: 0, bestPhase: "DRIFT" };
    }
  });

  function setupAudio() {
    if (audioUnlockedRef.current) return;
    audioUnlockedRef.current = true;
    Object.entries(SOUND_FILES).forEach(([key, src]) => {
      const a = new Audio(src);
      a.preload = "auto";
      a.volume = SOUND_VOLUME[key] ?? 0.35;
      if (key === "ambience" || key === "menu") a.loop = true;
      audioRef.current[key] = a;
    });
  }

  function playSound(name) {
    if (!soundEnabled) return;
    setupAudio();
    const s = audioRef.current[name];
    if (!s) return;
    try {
      s.currentTime = 0;
      s.volume = SOUND_VOLUME[name] ?? 0.35;
      s.play().catch(() => {});
    } catch {}
  }

  function startLoop(name, force = false) {
    if (!force && !soundEnabled) return;
    setupAudio();
    const s = audioRef.current[name];
    if (!s) return;
    try {
      s.volume = SOUND_VOLUME[name] ?? 0.25;
      s.play().catch(() => {});
    } catch {}
  }

  function stopSound(name, reset = true) {
    const s = audioRef.current[name];
    if (!s) return;
    try {
      s.pause();
      if (reset) s.currentTime = 0;
    } catch {}
  }

  function startMenuMusic(force = false) {
    stopSound("ambience");
    startLoop("menu", force);
  }

  function startAmbience(force = false) {
    stopSound("menu");
    startLoop("ambience", force);
  }

  function startBoostSound() {
    if (!soundEnabled) return;
    setupAudio();
    const b = audioRef.current.boost;
    if (!b) return;
    try {
      b.pause();
      b.loop = true;
      b.currentTime = 0;
      b.volume = SOUND_VOLUME.boost;
      b.play().catch(() => {});
    } catch {}
  }

  function stopBoostSound() {
    stopSound("boost");
  }

  function toggleSound() {
    setSoundEnabled((v) => {
      const next = !v;
      if (!next) {
        stopSound("menu");
        stopSound("ambience");
        stopBoostSound();
      } else if (!started) {
        startMenuMusic(true);
      }
      return next;
    });
  }

  function startGame(scoreStart = 0) {
    setupAudio();
    startAmbience(true);
    playSound("click");
    setStarted(true);
    setDead(false);
    setScreen("GAME");
    setInitialScore(scoreStart);
    setScore(scoreStart);
    setReviveCount(0);
    setContinuedRun(false);
    setGameKey((k) => k + 1);
    setStats((s) => ({ ...s, runs: s.runs + 1 }));
  }

  function finishRun(finalScore) {
    stopSound("ambience");
    stopBoostSound();
    const adjusted = continuedRun ? Math.floor(finalScore * 0.65) : finalScore;
    setBest((b) => Math.max(b, finalScore));
    setCredits((c) => c + getRunCredits(adjusted));
    const phaseName = phases[getPhaseIndex(adjusted)].name;
    setStats((s) => ({
      ...s,
      totalScore: s.totalScore + adjusted,
      bestPhase:
        phaseStartScores[getPhaseIndex(adjusted)] >=
        phaseStartScores[getPhaseIndex(best)]
          ? phaseName
          : s.bestPhase,
    }));
  }

  function handleDeath(finalScore) {
    playSound("death");
    setScore(finalScore);
    setDead(true);
    finishRun(finalScore);
  }

  function revive() {
    playSound("revive");
    startAmbience(true);
    setContinuedRun(true);
    setDead(false);
    setReviveCount((c) => c + 1);
    setInitialScore(score);
    setGameKey((k) => k + 1);
    setStats((s) => ({ ...s, revives: s.revives + 1 }));
  }

  function toMenu() {
    stopSound("ambience");
    stopBoostSound();
    setStarted(false);
    setDead(false);
    setScreen("MENU");
    setScore(0);
    setInitialScore(0);
    startMenuMusic(true);
  }

  useEffect(() => {
    const css = document.createElement("style");
    css.innerHTML = `
      html, body, #root { margin:0; padding:0; width:100%; height:100%; overflow:hidden; background:#000; overscroll-behavior:none; touch-action:none; -webkit-user-select:none; user-select:none; position:fixed; inset:0; }
      * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
      button { min-height:44px; touch-action:manipulation; }
    `;
    document.head.appendChild(css);
    return () => document.head.removeChild(css);
  }, []);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(t);
  }, [loading]);

  useEffect(
    () => safeWrite("homebound_soundEnabled", String(soundEnabled)),
    [soundEnabled]
  );
  useEffect(() => safeWrite("homebound_best", String(best)), [best]);
  useEffect(() => safeWrite("homebound_credits", String(credits)), [credits]);
  useEffect(
    () => safeWrite("homebound_dailyAdsUsed", String(dailyAdsUsed)),
    [dailyAdsUsed]
  );
  useEffect(
    () => safeWrite("homebound_dailyAdsDate", dailyAdsDate),
    [dailyAdsDate]
  );
  useEffect(
    () => safeWrite("homebound_unlocked", JSON.stringify(unlocked)),
    [unlocked]
  );
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
    if ((!started && !dead) || loading) startMenuMusic();
  }, [started, dead, loading, soundEnabled]);

  return (
    <div style={appShellStyle}>
      <div style={gameFrameStyle}>
        <CanvasGame
          key={gameKey}
          active={started && !dead && screen === "GAME" && !loading && booted}
          initialScore={initialScore}
          shipStyle={shipStyle}
          boostStyle={boostStyle}
          auraStyle={auraStyle}
          best={best}
          soundEnabled={soundEnabled}
          toggleSound={toggleSound}
          onScore={setScore}
          onPhase={() => playSound("phase")}
          onScoreSound={() => playSound("score")}
          onDeath={handleDeath}
          onBoostStart={startBoostSound}
          onBoostEnd={stopBoostSound}
        />

        {!booted && (
          <TapToBeginScreen
            onBegin={() => {
              setSoundEnabled(true);
              safeWrite("homebound_soundEnabled", "true");
              setupAudio();
              startMenuMusic(true);
              setBooted(true);
              setLoading(true);
            }}
          />
        )}

        {booted && loading && <LoadingScreen />}

        {booted && !loading && !started && screen === "MENU" && (
          <MenuScreen
            credits={credits}
            dailyAdsUsed={dailyAdsUsed}
            onAdCoins={() => {
              if (dailyAdsUsed >= 3) return;
              setCredits((c) => c + 10);
              setDailyAdsUsed((d) => d + 1);
            }}
            onLaunch={() => startGame(0)}
            onSkins={() => setScreen("SKINS")}
            onStats={() => setScreen("STATS")}
          />
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

        {booted && !loading && !started && screen === "STATS" && (
          <StatsScreen
            best={best}
            stats={stats}
            onBack={() => setScreen("MENU")}
          />
        )}

        {dead && (
          <DeathScreen
            score={score}
            best={best}
            reviveCount={reviveCount}
            revive={revive}
            retry={() => startGame(0)}
            toMenu={toMenu}
            shipStyle={shipStyle}
          />
        )}
      </div>
    </div>
  );
}

function CanvasGame({
  active,
  initialScore,
  shipStyle,
  boostStyle,
  auraStyle,
  best,
  soundEnabled,
  toggleSound,
  onScore,
  onPhase,
  onScoreSound,
  onDeath,
  onBoostStart,
  onBoostEnd,
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const stateRef = useRef(null);
  const holdingRef = useRef(false);
  const lastTimeRef = useRef(0);
  const scoreDisplayRef = useRef(initialScore);
  const phaseDisplayRef = useRef(getPhaseIndex(initialScore));
  const [, forceHud] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = getCanvasDpr();
    canvas.width = GAME_W * dpr;
    canvas.height = GAME_H * dpr;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    stateRef.current = {
      shipY: GAME_H / 2,
      velocity: -3.5,
      score: initialScore,
      walls: [],
      stars: Array.from({ length: 18 }, (_, i) => ({
        x: (i * 73) % GAME_W,
        y: (i * 37) % GAME_H,
        r: i % 3 === 0 ? 1.4 : 0.9,
        d: 0.25 + (i % 4) * 0.2,
      })),
      spawn: 0,
      lastGapY: GAME_H / 2,
      frame: 0,
      lastPhase: getPhaseIndex(initialScore),
      invulnerableFrames: initialScore > 0 ? 70 : 0,
      alive: true,
    };

    scoreDisplayRef.current = initialScore;
    phaseDisplayRef.current = getPhaseIndex(initialScore);
    onScore(initialScore);
    lastTimeRef.current = performance.now();

    function loop(now) {
      if (!stateRef.current?.alive) return;
      const dt = Math.min(1.4, (now - lastTimeRef.current) / 16.67 || 1);
      lastTimeRef.current = now;
      updateGame(stateRef.current, dt);
      drawGame(ctx, stateRef.current);
      rafRef.current = requestAnimationFrame(loop);
    }

    function updateGame(s, dt) {
      s.frame += 1;
      const phaseIndex = getPhaseIndex(s.score);
      const phase = phases[phaseIndex];
      const isTrans = phase.name === "TRANSCENDENCE";
      const speed = isTrans
        ? phase.speed + Math.max(0, s.score - 150) * 0.035
        : phase.speed;

      if (phaseIndex !== s.lastPhase) {
        s.lastPhase = phaseIndex;
        phaseDisplayRef.current = phaseIndex;
        onPhase();
        forceHud((n) => n + 1);
      }

      s.velocity += (GRAVITY + (holdingRef.current ? -1.05 : 0)) * dt;
      s.velocity = Math.max(s.velocity, -6.6);
      s.shipY += s.velocity * dt;

      if (s.shipY < 0 || s.shipY > GAME_H - SHIP_SIZE) {
        kill(s);
        return;
      }

      s.spawn += dt;
      if (s.spawn > WALL_SPAWN_FRAMES) {
        s.spawn = 0;
        const direction = s.lastGapY < GAME_H / 2 ? 1 : -1;
        let gapY =
          s.lastGapY +
          direction * (65 + Math.random() * 85) +
          (Math.random() - 0.5) * 70;
        gapY = Math.max(125, Math.min(375, gapY));
        if (Math.abs(gapY - s.lastGapY) < 55)
          gapY =
            s.lastGapY < GAME_H / 2
              ? 375 - Math.random() * 80
              : 125 + Math.random() * 80;
        s.lastGapY = gapY;
        s.walls.push({
          id: Date.now() + Math.random(),
          x: GAME_W,
          gapY,
          scored: false,
          phaseIndex: getPhaseIndex(s.score),
        });
      }

      const shipLeft = SHIP_X + (SHIP_SIZE - SHIP_HITBOX) / 2;
      const shipRight = shipLeft + SHIP_HITBOX;
      const shipTop = s.shipY + (SHIP_SIZE - SHIP_HITBOX) / 2;
      const shipBottom = shipTop + SHIP_HITBOX;

      for (const wall of s.walls) {
        wall.x -=
          (speed +
            (phase.name === "INSTABILITY"
              ? Math.sin((wall.x + s.score) * 0.03) * 1.4
              : 0)) *
          dt;
        const touchingX = shipRight > wall.x && shipLeft < wall.x + WALL_WIDTH;
        const touchingY =
          shipTop < wall.gapY - GAP / 2 || shipBottom > wall.gapY + GAP / 2;
        if (touchingX && touchingY && s.invulnerableFrames <= 0) {
          kill(s);
          return;
        }
        if (!wall.scored && wall.x + WALL_WIDTH < SHIP_X - 10) {
          wall.scored = true;
          s.score += 1;
          scoreDisplayRef.current = s.score;
          onScore(s.score);
          onScoreSound();
          forceHud((n) => n + 1);
        }
      }

      s.walls = s.walls.filter((w) => w.x > -WALL_WIDTH - 20);
      if (s.invulnerableFrames > 0) s.invulnerableFrames -= 1 * dt;
    }

    function kill(s) {
      if (!s.alive) return;
      s.alive = false;
      cancelAnimationFrame(rafRef.current);
      onBoostEnd();
      onDeath(s.score);
    }

    function drawGame(ctx, s) {
      const phaseIndex = getPhaseIndex(s.score);
      const phase = phases[phaseIndex];
      const isTrans = phase.name === "TRANSCENDENCE";
      ctx.clearRect(0, 0, GAME_W, GAME_H);

      const bg = ctx.createLinearGradient(0, 0, 0, GAME_H);
      bg.addColorStop(0, phase.colors[0]);
      bg.addColorStop(0.55, phase.colors[1]);
      bg.addColorStop(1, phase.colors[2]);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, GAME_W, GAME_H);

      drawStars(ctx, s, phase, isTrans);
      drawAtmosphere(ctx, s, phase, isTrans);
      for (const wall of s.walls) drawWall(ctx, wall, phase);
      drawBoost(ctx, s.shipY, s.velocity);
      drawShip(ctx, s.shipY, s.velocity, phase, s.invulnerableFrames > 0);
      drawHud(ctx, s.score, best, phase, soundEnabled);
    }

    function drawStars(ctx, s, phase, isTrans) {
      ctx.save();
      ctx.globalAlpha = isTrans ? 0.16 : 0.7;
      for (const star of s.stars) {
        const x = (star.x - s.score * star.d * 3 + GAME_W * 2) % GAME_W;
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    function drawAtmosphere(ctx, s, phase, isTrans) {
      ctx.save();
      if (isTrans) {
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = "rgba(255,255,255,0.16)";
        ctx.lineWidth = 18;
        ctx.beginPath();
        ctx.arc(GAME_W / 2, GAME_H / 2, 220, 0, Math.PI * 2);
        ctx.stroke();
        const g = ctx.createRadialGradient(
          GAME_W / 2,
          GAME_H / 2,
          10,
          GAME_W / 2,
          GAME_H / 2,
          250
        );
        g.addColorStop(0, "rgba(255,255,255,0.42)");
        g.addColorStop(0.35, "rgba(255,255,255,0.16)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, GAME_W, GAME_H);
      } else {
        const g = ctx.createRadialGradient(120, 150, 10, 120, 150, 180);
        g.addColorStop(0, phase.accent + "33");
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, GAME_W, GAME_H);
      }
      const vignette = ctx.createRadialGradient(
        GAME_W / 2,
        GAME_H / 2,
        150,
        GAME_W / 2,
        GAME_H / 2,
        360
      );
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(
        1,
        isTrans ? "rgba(0,0,0,0.05)" : "rgba(0,0,0,0.42)"
      );
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, GAME_W, GAME_H);
      ctx.restore();
    }

    function roundedRect(ctx, x, y, w, h, r) {
      const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.lineTo(x + w - rr, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
      ctx.lineTo(x + w, y + h - rr);
      ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
      ctx.lineTo(x + rr, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
      ctx.lineTo(x, y + rr);
      ctx.quadraticCurveTo(x, y, x + rr, y);
      ctx.closePath();
    }

    function drawWall(ctx, wall, phase) {
      const topH = wall.gapY - GAP / 2;
      const bottomY = wall.gapY + GAP / 2;
      const bottomH = GAME_H - bottomY;
      const wallPhase =
        phases[wall.phaseIndex ?? getPhaseIndex(scoreDisplayRef.current)] ||
        phase;
      const type = wallPhase.name;
      const isTrans = type === "TRANSCENDENCE";

      ctx.save();

      const drawSegment = (x, y, w, h) => {
        const grad = ctx.createLinearGradient(x, 0, x + w, 0);

        if (isTrans) {
          grad.addColorStop(0, "rgba(219,234,254,0.08)");
          grad.addColorStop(0.5, "rgba(248,250,252,0.16)");
          grad.addColorStop(1, "rgba(219,234,254,0.08)");
          ctx.strokeStyle = "rgba(0,0,0,0.42)";
        } else if (type === "SOLAR") {
          grad.addColorStop(0, "rgba(120,35,10,0.95)");
          grad.addColorStop(0.45, "rgba(249,115,22,0.95)");
          grad.addColorStop(1, "rgba(255,220,120,0.55)");
          ctx.strokeStyle = "rgba(255,190,80,0.45)";
        } else if (type === "INSTABILITY") {
          grad.addColorStop(0, "rgba(40,0,0,0.98)");
          grad.addColorStop(0.5, "rgba(239,68,68,0.92)");
          grad.addColorStop(1, "rgba(10,0,0,0.98)");
          ctx.strokeStyle = "rgba(255,120,120,0.45)";
        } else if (type === "FRACTURE") {
          grad.addColorStop(0, "rgba(5,5,8,0.98)");
          grad.addColorStop(0.5, "rgba(255,255,255,0.72)");
          grad.addColorStop(1, "rgba(30,0,0,0.98)");
          ctx.strokeStyle = "rgba(255,255,255,0.45)";
        } else if (type === "VELOCITY") {
          grad.addColorStop(0, "rgba(40,0,70,0.98)");
          grad.addColorStop(0.5, "rgba(217,70,239,0.92)");
          grad.addColorStop(1, "rgba(10,0,25,0.98)");
          ctx.strokeStyle = "rgba(232,121,249,0.4)";
        } else if (type === "WARP") {
          grad.addColorStop(0, "rgba(5,35,60,0.96)");
          grad.addColorStop(0.5, "rgba(56,189,248,0.9)");
          grad.addColorStop(1, "rgba(5,12,25,0.96)");
          ctx.strokeStyle = "rgba(125,211,252,0.35)";
        } else {
          grad.addColorStop(0, wallPhase.accent + "44");
          grad.addColorStop(0.5, wallPhase.accent + "dd");
          grad.addColorStop(1, "rgba(5,10,25,0.95)");
          ctx.strokeStyle = "rgba(255,255,255,0.2)";
        }

        ctx.fillStyle = grad;

        if (type === "FRACTURE") {
          ctx.beginPath();
          ctx.moveTo(x + 12, y);
          ctx.lineTo(x + w - 4, y + 12);
          ctx.lineTo(x + w - 18, y + h * 0.42);
          ctx.lineTo(x + w, y + h * 0.75);
          ctx.lineTo(x + w - 10, y + h);
          ctx.lineTo(x + 8, y + h - 8);
          ctx.lineTo(x + 22, y + h * 0.56);
          ctx.lineTo(x, y + h * 0.24);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (type === "INSTABILITY") {
          ctx.beginPath();
          ctx.moveTo(x + 8, y);
          ctx.lineTo(x + w - 8, y);
          ctx.lineTo(x + w, y + h * 0.22);
          ctx.lineTo(x + w - 10, y + h * 0.48);
          ctx.lineTo(x + w, y + h * 0.76);
          ctx.lineTo(x + w - 8, y + h);
          ctx.lineTo(x + 8, y + h);
          ctx.lineTo(x, y + h * 0.72);
          ctx.lineTo(x + 10, y + h * 0.45);
          ctx.lineTo(x, y + h * 0.18);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (type === "VELOCITY" || type === "WARP") {
          roundedRect(ctx, x - 8, y, w + 16, h, 18);
          ctx.fill();
          ctx.stroke();
          ctx.globalAlpha = 0.65;
          ctx.strokeStyle = "rgba(255,255,255,0.28)";
          ctx.lineWidth = 1;
          for (
            let yy = y + 24;
            yy < y + h;
            yy += type === "VELOCITY" ? 38 : 46
          ) {
            ctx.beginPath();
            ctx.moveTo(x + 8, yy);
            ctx.lineTo(x + w - 8, yy - 14);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        } else if (type === "SOLAR") {
          roundedRect(ctx, x - 10, y, w + 20, h, 30);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "rgba(255,210,100,0.22)";
          for (let yy = y + 18; yy < y + h; yy += 52) {
            roundedRect(ctx, x + 8, yy, w - 16, 8, 999);
            ctx.fill();
          }
        } else {
          roundedRect(ctx, x - 8, y, w + 16, h, isTrans ? 42 : 28);
          ctx.fill();
          ctx.lineWidth = isTrans ? 1 : 2;
          ctx.stroke();
        }
      };

      drawSegment(wall.x, -20, WALL_WIDTH, topH + 20);
      drawSegment(wall.x, bottomY, WALL_WIDTH, bottomH + 20);
      ctx.restore();
    }

    function drawBoost(ctx, y, velocity) {
      if (!holdingRef.current) return;
      const colors = getBoostColors(boostStyle);
      ctx.save();
      ctx.translate(SHIP_X + 4, y + SHIP_SIZE / 2);
      ctx.rotate((velocity * 1.1 * Math.PI) / 180);
      const grad = ctx.createLinearGradient(0, 0, -120, 0);
      if (boostStyle === "RAINBOW") {
        colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c));
        grad.addColorStop(1, "rgba(0,0,0,0)");
      } else {
        grad.addColorStop(0, colors[1] || "white");
        grad.addColorStop(0.55, colors[0]);
        grad.addColorStop(1, "rgba(0,0,0,0)");
      }
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = grad;
      roundedRect(ctx, -110, -12, 112, 24, 999);
      ctx.fill();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = getBoostCoreGradient(boostStyle);
      roundedRect(ctx, -72, -5, 68, 10, 999);
      ctx.fill();
      ctx.restore();
    }

    function drawShip(ctx, y, velocity, phase, invulnerable) {
      const [c1, c2, c3] = getShipColors(shipStyle);
      const x = SHIP_X;
      const angle = (velocity * 1.55 * Math.PI) / 180;
      ctx.save();
      ctx.translate(x + SHIP_SIZE / 2, y + SHIP_SIZE / 2);
      ctx.rotate(angle);
      if (auraStyle !== "NONE") {
        ctx.globalAlpha = auraStyle === "ABYSS" ? 0.5 : 0.45;
        ctx.strokeStyle =
          auraStyle === "ABYSS"
            ? "rgba(88,28,135,0.65)"
            : auraStyle === "SIGNAL"
            ? "rgba(56,189,248,0.8)"
            : "rgba(255,255,255,0.75)";
        ctx.lineWidth = auraStyle === "ABYSS" ? 3 : 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 33, 22, performance.now() * 0.001, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = invulnerable
        ? 0.65 + Math.abs(Math.sin(performance.now() * 0.02)) * 0.35
        : 1;
      const bodyGrad = ctx.createRadialGradient(-7, -7, 4, 0, 0, 35);
      bodyGrad.addColorStop(0, c1);
      bodyGrad.addColorStop(0.45, c2);
      bodyGrad.addColorStop(1, c3);
      ctx.fillStyle = bodyGrad;
      ctx.strokeStyle =
        shipStyle === "ABYSSAL"
          ? "rgba(168,85,247,0.38)"
          : "rgba(255,255,255,0.65)";
      ctx.lineWidth = 2;
      roundedRect(ctx, -14, -10, 30, 20, 14);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(15,23,42,0.95)";
      roundedRect(ctx, -2, -5, 14, 8, 999);
      ctx.fill();
      ctx.fillStyle = "rgba(96,165,250,0.92)";
      roundedRect(ctx, 1, -4, 10, 5, 999);
      ctx.fill();
      ctx.fillStyle = "#737373";
      roundedRect(ctx, -20, -4, 8, 8, 999);
      ctx.fill();
      ctx.restore();
    }

    function drawHud(ctx, score, best, phase, soundOn) {
      ctx.save();
      ctx.fillStyle = "white";
      ctx.font = "800 14px system-ui";
      ctx.fillStyle = phase.accent;
      ctx.fillText(phase.name, 20, 34);
      ctx.fillStyle = "white";
      ctx.font = "900 48px system-ui";
      ctx.fillText(String(score), 20, 82);

      ctx.textAlign = "right";
      ctx.font = "400 12px system-ui";
      ctx.fillStyle = "rgba(255,255,255,0.72)";
      ctx.fillText("BEST", GAME_W - 20, 33);
      ctx.font = "800 24px system-ui";
      ctx.fillText(String(best), GAME_W - 20, 60);

      const approach = getApproachMessage(score);
      if (approach) {
        ctx.font = "800 10px system-ui";
        ctx.fillStyle =
          phase.name === "TRANSCENDENCE"
            ? "rgba(15,23,42,0.65)"
            : "rgba(255,255,255,0.62)";
        ctx.fillText(approach, GAME_W - 20, 86);
      }

      ctx.textAlign = "center";
      ctx.font = "800 10px system-ui";
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.fillText(soundOn ? "SOUND ON" : "SOUND OFF", GAME_W / 2, 32);
      ctx.restore();
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [initialScore]);

  useEffect(() => {
    if (!active && stateRef.current) stateRef.current.alive = false;
  }, [active]);

  function beginBoost(e) {
    e?.preventDefault?.();
    if (!active) return;
    holdingRef.current = true;
    const s = stateRef.current;
    if (s) s.velocity = Math.max(s.velocity + LIFT * 0.22, -6.6);
    onBoostStart();
  }

  function endBoost(e) {
    e?.preventDefault?.();
    holdingRef.current = false;
    onBoostEnd();
  }

  function handleSoundClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x =
      ((e.clientX || e.touches?.[0]?.clientX || 0) - rect.left) *
      (GAME_W / rect.width);
    const y =
      ((e.clientY || e.touches?.[0]?.clientY || 0) - rect.top) *
      (GAME_H / rect.height);
    if (y < 54 && x > GAME_W / 2 - 65 && x < GAME_W / 2 + 65) {
      toggleSound();
      return true;
    }
    return false;
  }

  return (
    <canvas
      ref={canvasRef}
      onContextMenu={(e) => e.preventDefault()}
      onMouseDown={(e) => {
        if (!handleSoundClick(e)) beginBoost(e);
      }}
      onMouseUp={endBoost}
      onMouseLeave={endBoost}
      onTouchStart={(e) => {
        if (!handleSoundClick(e)) beginBoost(e);
      }}
      onTouchEnd={endBoost}
      onTouchCancel={endBoost}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
        touchAction: "none",
        background: "#000",
      }}
    />
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
      style={{
        padding: "12px 18px",
        borderRadius: 999,
        border: `1px solid ${color}`,
        background: "rgba(255,255,255,0.04)",
        color: "white",
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: 2,
        cursor: "pointer",
      }}
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
      <LogoShip large />
      <div
        style={{
          fontSize: 34,
          fontWeight: 900,
          letterSpacing: 2.5,
          marginBottom: 14,
        }}
      >
        HOMEBOUND: SPACE RUNNER
      </div>
      <div
        style={{
          color: "rgba(255,255,255,0.52)",
          fontSize: 12,
          letterSpacing: 5,
          animation: "tapPulse 1.4s ease-in-out infinite",
        }}
      >
        TAP TO BEGIN
      </div>
      <style>{`@keyframes tapPulse{0%{opacity:.25}50%{opacity:1}100%{opacity:.25}}`}</style>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={overlayStyle(false, "rgba(0,0,0,0.9)")}>
      <LogoShip />
      <div
        style={{
          fontSize: 30,
          fontWeight: 900,
          letterSpacing: 2.5,
          marginBottom: 12,
        }}
      >
        HOMEBOUND: SPACE RUNNER
      </div>
      <div
        style={{
          color: "rgba(255,255,255,0.5)",
          fontSize: 11,
          letterSpacing: 3,
          marginBottom: 26,
        }}
      >
        CALIBRATING RETURN VECTOR
      </div>
      <div
        style={{
          width: 170,
          height: 4,
          borderRadius: 999,
          background: "rgba(255,255,255,0.12)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 999,
            background:
              "linear-gradient(to right, transparent, rgba(103,232,249,0.9), transparent)",
            animation: "loadingSweep 1.1s ease-in-out infinite",
          }}
        />
      </div>
      <style>{`@keyframes loadingSweep{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
    </div>
  );
}

function LogoShip({ large = false }) {
  const scale = large ? 1.25 : 1;
  return (
    <div
      style={{
        position: "relative",
        width: 130 * scale,
        height: 78 * scale,
        marginBottom: 28,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 4 * scale,
          top: 34 * scale,
          width: 74 * scale,
          height: 16 * scale,
          borderRadius: 999,
          background:
            "linear-gradient(to left, rgba(34,211,238,0.95), rgba(255,255,255,0.45), transparent)",
          filter: "blur(7px)",
          opacity: 0.95,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 52 * scale,
          top: 20 * scale,
          width: 66 * scale,
          height: 34 * scale,
          borderRadius: "52% 48% 50% 50% / 62% 58% 48% 52%",
          background: getShipGradient("DEFAULT"),
          border: "2px solid rgba(255,255,255,0.58)",
          boxShadow: "0 0 28px rgba(103,232,249,0.45)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 72 * scale,
          top: 31 * scale,
          width: 38 * scale,
          height: 13 * scale,
          borderRadius: 999,
          background:
            "linear-gradient(180deg, rgba(60,190,255,0.95), rgba(5,22,55,0.98) 55%, rgba(0,8,25,0.98))",
          border: "1px solid rgba(210,240,255,0.85)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 43 * scale,
          top: 33 * scale,
          width: 18 * scale,
          height: 13 * scale,
          borderRadius: 999,
          background:
            "linear-gradient(90deg, rgba(45,45,55,1), rgba(170,170,180,1), rgba(45,45,55,1))",
          border: "2px solid rgba(255,255,255,0.28)",
        }}
      />
    </div>
  );
}

function MenuScreen({
  credits,
  dailyAdsUsed,
  onAdCoins,
  onLaunch,
  onSkins,
  onStats,
}) {
  return (
    <div style={overlayStyle(false)}>
      <div style={creditStyle}>✦ {credits}</div>
      <div style={{ marginTop: 72, marginBottom: -30 }}>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 900,
            margin: 0,
            letterSpacing: 1.5,
          }}
        >
          HOMEBOUND: SPACE RUNNER
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: 12,
            letterSpacing: 3,
            marginBottom: 16,
          }}
        >
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
        <Button onClick={onLaunch}>LAUNCH</Button>
        <Button onClick={onSkins} color="rgba(192,132,252,0.5)">
          HANGAR
        </Button>
        <Button onClick={onAdCoins} color="rgba(250,204,21,0.45)">
          {dailyAdsUsed >= 3
            ? "DAILY ADS EXHAUSTED"
            : `WATCH AD +10 CREDITS (${3 - dailyAdsUsed}/3)`}
        </Button>
        <Button onClick={onStats} color="rgba(255,255,255,0.25)">
          LIFETIME STATS
        </Button>
      </div>
    </div>
  );
}

function SkinsScreen({
  credits,
  best,
  unlocked,
  setCredits,
  setUnlocked,
  shipStyle,
  boostStyle,
  deathFx,
  auraStyle,
  previewShipStyle,
  previewBoostStyle,
  previewDeathFx,
  previewAuraStyle,
  setPreviewShipStyle,
  setPreviewBoostStyle,
  setPreviewDeathFx,
  setPreviewAuraStyle,
  pendingPurchase,
  setPendingPurchase,
  setShipStyle,
  setBoostStyle,
  setDeathFx,
  setAuraStyle,
  onBack,
}) {
  return (
    <div style={overlayStyle(true)}>
      <h2 style={{ fontSize: 32, fontWeight: 900, margin: 0 }}>HANGAR</h2>
      <p
        style={{
          color: "rgba(255,255,255,0.45)",
          fontSize: 12,
          letterSpacing: 3,
          marginBottom: 8,
        }}
      >
        COSMETICS ONLY
      </p>
      <div style={creditStyle}>✦ {credits}</div>
      <HangarPreview
        shipStyle={previewShipStyle}
        boostStyle={previewBoostStyle}
        deathFx={previewDeathFx}
        auraStyle={previewAuraStyle}
      />
      <div
        style={{
          width: "100%",
          maxHeight: 385,
          overflowY: "auto",
          paddingRight: 4,
        }}
      >
        <Picker
          title="SHIP SKINS"
          category="ships"
          options={cosmeticCatalog.ships}
          value={shipStyle}
          previewValue={previewShipStyle}
          setPreviewValue={setPreviewShipStyle}
          credits={credits}
          best={best}
          unlocked={unlocked}
          setPendingPurchase={setPendingPurchase}
          onChange={setShipStyle}
        />
        <Picker
          title="BOOST TRAILS"
          category="boosts"
          options={cosmeticCatalog.boosts}
          value={boostStyle}
          previewValue={previewBoostStyle}
          setPreviewValue={setPreviewBoostStyle}
          credits={credits}
          best={best}
          unlocked={unlocked}
          setPendingPurchase={setPendingPurchase}
          onChange={setBoostStyle}
        />
        <Picker
          title="DEATH EFFECTS"
          category="deathFx"
          options={cosmeticCatalog.deathFx}
          value={deathFx}
          previewValue={previewDeathFx}
          setPreviewValue={setPreviewDeathFx}
          credits={credits}
          best={best}
          unlocked={unlocked}
          setPendingPurchase={setPendingPurchase}
          onChange={setDeathFx}
        />
        <Picker
          title="AURAS"
          category="auras"
          options={cosmeticCatalog.auras}
          value={auraStyle}
          previewValue={previewAuraStyle}
          setPreviewValue={setPreviewAuraStyle}
          credits={credits}
          best={best}
          unlocked={unlocked}
          setPendingPurchase={setPendingPurchase}
          onChange={setAuraStyle}
        />
      </div>
      {pendingPurchase && (
        <PurchaseConfirmModal
          purchase={pendingPurchase}
          credits={credits}
          onCancel={() => setPendingPurchase(null)}
          onConfirm={() => {
            const { item, category, onChange } = pendingPurchase;
            setCredits((c) => c - item.cost);
            setUnlocked((u) => ({
              ...u,
              [category]: [
                ...new Set([...(u?.[category] || []), String(item.id)]),
              ],
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

function HangarPreview({ shipStyle, boostStyle, deathFx, auraStyle }) {
  return (
    <div
      style={{
        position: "relative",
        width: 240,
        height: 170,
        marginBottom: 24,
        transform: "scale(1.05)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 54,
          width: 150,
          height: 42,
          borderRadius: 999,
          background: getBoostGradient(boostStyle),
          filter: "blur(5px)",
          opacity: 1,
          animation: "trailPulse .85s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 20,
          top: 68,
          width: 104,
          height: 14,
          borderRadius: 999,
          background: getBoostCoreGradient(boostStyle),
          opacity: 0.95,
        }}
      />
      {boostStyle === "RAINBOW" && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 54,
            width: 150,
            height: 42,
            borderRadius: 999,
            background: getBoostGradient("RAINBOW"),
            filter: "blur(3px)",
            animation: "trailPulse .75s ease-in-out infinite",
          }}
        />
      )}
      {boostStyle === "ABYSSAL" && (
        <div
          style={{
            position: "absolute",
            left: -8,
            top: 50,
            width: 160,
            height: 54,
            borderRadius: 999,
            background:
              "radial-gradient(circle, rgba(0,0,0,1), rgba(88,28,135,.35), transparent 72%)",
            filter: "blur(6px)",
            animation: "trailPulse 1.1s ease-in-out infinite",
          }}
        />
      )}
      {auraStyle !== "NONE" && (
        <div
          style={{
            position: "absolute",
            left: auraStyle === "ABYSS" ? 84 : 98,
            top: auraStyle === "ABYSS" ? 20 : 30,
            width: auraStyle === "ABYSS" ? 142 : 118,
            height: auraStyle === "ABYSS" ? 94 : 72,
            borderRadius: 999,
            border:
              auraStyle === "ABYSS"
                ? "2px solid rgba(88,28,135,.3)"
                : auraStyle === "SIGNAL"
                ? "2px solid rgba(56,189,248,.65)"
                : "2px solid rgba(255,255,255,.55)",
            boxShadow:
              auraStyle === "ABYSS"
                ? "0 0 42px rgba(88,28,135,.28)"
                : auraStyle === "SIGNAL"
                ? "0 0 30px rgba(56,189,248,.55)"
                : "0 0 28px rgba(255,255,255,.45)",
            animation: "haloOrbit 4s linear infinite",
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          left: 108,
          top: 44,
          width: 110,
          height: 72,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 8,
            top: 12,
            width: 84,
            height: 40,
            borderRadius: "52% 48% 50% 50% / 62% 58% 48% 52%",
            background: getShipGradient(shipStyle),
            border: "2px solid rgba(255,255,255,0.58)",
            boxShadow:
              shipStyle === "GOLD"
                ? "0 0 28px rgba(250,204,21,0.9)"
                : shipStyle === "ABYSSAL"
                ? "0 0 30px rgba(88,28,135,.45)"
                : "0 0 22px rgba(255,255,255,0.35)",
            overflow: "hidden",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 30,
            top: 24,
            width: 46,
            height: 16,
            borderRadius: 999,
            background:
              "linear-gradient(180deg, rgba(60,190,255,0.95), rgba(5,22,55,0.98) 55%, rgba(0,8,25,0.98))",
            border: "1px solid rgba(210,240,255,0.85)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: -8,
            top: 26,
            width: 20,
            height: 14,
            borderRadius: 999,
            background:
              "linear-gradient(90deg, rgba(45,45,55,1), rgba(170,170,180,1), rgba(45,45,55,1))",
            border: "2px solid rgba(255,255,255,0.28)",
          }}
        />
      </div>
      {deathFx !== "STATIC" && (
        <div
          style={{
            position: "absolute",
            left: 128,
            top: 14,
            width: 44,
            height: 44,
            borderRadius: 999,
            border:
              deathFx.includes("VOID") || deathFx.includes("ABYSS")
                ? "2px solid rgba(168,85,247,.35)"
                : "2px solid rgba(255,180,80,.5)",
            boxShadow:
              deathFx.includes("VOID") || deathFx.includes("ABYSS")
                ? "0 0 24px rgba(168,85,247,.25)"
                : "0 0 18px rgba(255,140,40,.55)",
            opacity: 0.8,
          }}
        />
      )}
      <style>{`@keyframes trailPulse{0%{opacity:.35;transform:scaleX(.92)}50%{opacity:1;transform:scaleX(1.08)}100%{opacity:.35;transform:scaleX(.92)}}@keyframes haloOrbit{0%{transform:rotate(0deg) scale(1)}50%{transform:rotate(180deg) scale(1.08)}100%{transform:rotate(360deg) scale(1)}}`}</style>
    </div>
  );
}

function Picker({
  title,
  category,
  options,
  value,
  previewValue,
  setPreviewValue,
  credits,
  best,
  unlocked,
  setPendingPurchase,
  onChange,
}) {
  function handleItem(item) {
    setPreviewValue(String(item.id));
    const owned =
      unlocked?.[category]?.includes(item.id) || item.ownedByDefault;
    const requirementMet = best >= item.requirement;
    if (owned) return onChange(String(item.id));
    if (!requirementMet || credits < item.cost) return;
    setPendingPurchase({ item, category, onChange });
  }

  return (
    <div style={{ width: "100%", maxWidth: 320, margin: "0 auto 18px" }}>
      <div
        style={{
          color: "rgba(255,255,255,0.45)",
          fontSize: 11,
          letterSpacing: 3,
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
        }}
      >
        {options.map((item) => {
          const owned =
            unlocked?.[category]?.includes(item.id) || item.ownedByDefault;
          const requirementMet = best >= item.requirement;
          const selected = value === item.id;
          const previewing = previewValue === item.id;
          const status = owned
            ? "OWNED"
            : !requirementMet
            ? `REACH ${item.requirement}`
            : `${item.cost} CREDITS`;
          const statusColor = owned
            ? "rgba(125,211,252,0.8)"
            : !requirementMet
            ? "rgba(248,113,113,0.9)"
            : "rgba(250,204,21,0.9)";
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
                border: selected
                  ? "1px solid rgba(255,255,255,0.75)"
                  : previewing
                  ? "1px solid rgba(250,204,21,0.55)"
                  : "1px solid rgba(255,255,255,0.12)",
                background: selected
                  ? "rgba(255,255,255,0.15)"
                  : previewing
                  ? "rgba(250,204,21,0.08)"
                  : "rgba(255,255,255,0.04)",
                color: "white",
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: 1,
                cursor: "pointer",
                opacity: requirementMet ? 1 : 0.65,
              }}
            >
              <div>{item.name}</div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 7,
                  color: statusColor,
                  letterSpacing: 0.5,
                }}
              >
                {status}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PurchaseConfirmModal({ purchase, credits, onCancel, onConfirm }) {
  const { item } = purchase;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 28,
        zIndex: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 290,
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(5,10,25,0.96)",
          padding: 22,
          boxShadow: "0 18px 60px rgba(0,0,0,0.65)",
          textAlign: "center",
        }}
      >
        <HangarPreview
          shipStyle={item.id}
          boostStyle={item.id}
          deathFx={item.id}
          auraStyle={item.id === "ABYSS" ? "ABYSS" : "NONE"}
        />
        <div
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: 3,
            marginBottom: 8,
          }}
        >
          CONFIRM PURCHASE
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>
          {item.name}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.55)",
            letterSpacing: 2,
            marginBottom: 16,
          }}
        >
          {item.rarity}
        </div>
        <div style={{ color: "#fde68a", fontWeight: 900, marginBottom: 6 }}>
          COST: {item.cost} CREDITS
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.48)",
            fontSize: 12,
            marginBottom: 20,
          }}
        >
          BALANCE AFTER: {credits - item.cost}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Button onClick={onConfirm} color="rgba(250,204,21,0.55)">
            BUY & EQUIP
          </Button>
          <Button onClick={onCancel} color="rgba(255,255,255,0.22)">
            CANCEL
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatsScreen({ best, stats, onBack }) {
  return (
    <div style={overlayStyle(true)}>
      <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 24 }}>
        LIFETIME STATS
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12,
          width: "100%",
          maxWidth: 280,
          marginBottom: 28,
        }}
      >
        <Stat label="RUNS" value={stats.runs} />
        <Stat label="BEST" value={best} />
        <Stat label="TOTAL" value={stats.totalScore} />
        <Stat label="REVIVES" value={stats.revives} />
      </div>
      <div
        style={{
          color: "rgba(216,180,254,0.75)",
          fontSize: 12,
          letterSpacing: 3,
          marginBottom: 28,
        }}
      >
        FARTHEST SIGNAL: {stats.bestPhase}
      </div>
      <Button onClick={onBack}>RETURN</Button>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.05)",
        borderRadius: 18,
        padding: 16,
      }}
    >
      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
        {label}
      </div>
      <div style={{ color: "white", fontSize: 28, fontWeight: 900 }}>
        {value}
      </div>
    </div>
  );
}

function DeathScreen({
  score,
  best,
  reviveCount,
  revive,
  retry,
  toMenu,
  shipStyle,
}) {
  return (
    <div style={overlayStyle(true, "rgba(0,0,0,0.62)")}>
      <div
        style={{
          width: 82,
          height: 62,
          marginBottom: 16,
          transform: "rotate(198deg)",
          opacity: 0.35,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 6,
            top: 12,
            width: 68,
            height: 34,
            borderRadius: "52% 48% 50% 50% / 62% 58% 48% 52%",
            background: getShipGradient(shipStyle),
            border: "2px solid rgba(255,255,255,0.35)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 28,
            top: 20,
            width: 40,
            height: 16,
            borderRadius: 999,
            background:
              "linear-gradient(180deg, rgba(60,190,255,0.95), rgba(5,22,55,0.98) 55%, rgba(0,8,25,0.98))",
            border: "1px solid rgba(210,240,255,0.85)",
          }}
        />
      </div>
      <div style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>
        {score > 110 ? "SIGNAL LOST" : "LOST IN SPACE"}
      </div>
      <div style={{ color: "rgba(255,255,255,0.7)", marginBottom: 18 }}>
        Score: {score}
      </div>
      <Button onClick={retry}>TRY AGAIN</Button>
      <div style={{ height: 10 }} />
      {reviveCount === 0 && (
        <Button onClick={revive} color="rgba(192,132,252,0.55)">
          REVIVE (WATCH AD)
        </Button>
      )}
      <div style={{ height: 10 }} />
      <Button onClick={toMenu} color="rgba(255,255,255,0.25)">
        MAIN MENU
      </Button>
    </div>
  );
}

function overlayStyle(blur = true, bg = "rgba(0,0,0,0.7)") {
  return {
    position: "absolute",
    inset: 0,
    background: bg,
    backdropFilter: blur ? "blur(4px)" : "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    color: "white",
    padding: 32,
    boxSizing: "border-box",
    zIndex: 5,
  };
}

const appShellStyle = {
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
};

const gameFrameStyle = {
  position: "relative",
  width: `min(100vw, ${GAME_W}px)`,
  height: `min(100dvh, ${GAME_H}px)`,
  maxWidth: GAME_W,
  maxHeight: GAME_H,
  aspectRatio: `${GAME_W} / ${GAME_H}`,
  background: "#000",
  overflow: "hidden",
};

const creditStyle = {
  position: "absolute",
  top: 16,
  left: "50%",
  transform: "translateX(-50%)",
  color: "rgba(255,226,120,0.52)",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 1.5,
};
