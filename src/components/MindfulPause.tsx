import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Play, Pause, Wind, Sparkles, RefreshCw, Activity, CheckCircle2, Timer } from 'lucide-react';

type BreathingPattern = 'box' | 'relax' | 'deep';

interface PatternConfig {
  name: string;
  subname: string;
  desc: string;
  phases: { name: string; duration: number; text: string }[];
}

const TOTAL_SESSION_SECONDS = 60; // 1-minute fixed countdown session

const PATTERNS: Record<BreathingPattern, PatternConfig> = {
  box: {
    name: 'Kutu Nefesi (4-4-4-4)',
    subname: 'Zihinsel Berraklık & Odak',
    desc: 'Zihni sakinleştirir, otonom sinir sistemini dengeler ve dikkati toplar.',
    phases: [
      { name: 'Nefes Al', duration: 4, text: 'Burnundan derin ve yavaşça nefes al...' },
      { name: 'Tut', duration: 4, text: 'Zihnini sakin tutarak nefesini bekle...' },
      { name: 'Nefes Ver', duration: 4, text: 'Tüm gerginliği ve stresi serbest bırak...' },
      { name: 'Dingin Kal', duration: 4, text: 'Boşluk anının huzurunu hisset...' },
    ],
  },
  relax: {
    name: '4-7-8 Rahatlama',
    subname: 'Derin Gevşeme & Huzur',
    desc: 'Kaygı ve stresi yatıştırarak kalp ritmini yavaşlatır, derin gevşeme sağlar.',
    phases: [
      { name: 'Nefes Al', duration: 4, text: 'Dingin bir enerjiyle ciğerlerini doldur...' },
      { name: 'Hafifçe Tut', duration: 7, text: 'Bedeninin gevşemesine izin vererek tut...' },
      { name: 'Yavaşça Ver', duration: 8, text: 'Uzun ve akıcı bir şekilde tüm nefesi sal...' },
    ],
  },
  deep: {
    name: 'Beden Farkındalığı (5-5)',
    subname: 'Doğal Ritmik Denge',
    desc: 'Kalp-beyin uyumunu artırır, telaşsız ve dengeli bir iç alan yaratır.',
    phases: [
      { name: 'Yumuşak Nefes Al', duration: 5, text: 'Bedeninin genişlediğini hisset...' },
      { name: 'Sakin Nefes Ver', duration: 5, text: 'Tüm ağırlıkları ve düşünceleri serbest bırak...' },
    ],
  },
};

export const MindfulPause: React.FC = () => {
  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern>('box');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // 1 Minute Countdown timer (seconds remaining)
  const [secondsRemaining, setSecondsRemaining] = useState(TOTAL_SESSION_SECONDS);

  // Phase animation state
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0); // 0 to 1 inside current phase
  const [phaseTimeLeft, setPhaseTimeLeft] = useState(4);
  const [completedCycles, setCompletedCycles] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const oscNodesRef = useRef<{ osc: OscillatorNode; gain: GainNode }[]>([]);
  const animFrameRef = useRef<number | null>(null);

  const currentPattern = PATTERNS[selectedPattern];
  const currentPhase = currentPattern.phases[phaseIndex] || currentPattern.phases[0];

  // Ambient sound generator (432Hz ambient chord)
  const startAmbientSound = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 2.5);
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      const frequencies = [108, 216, 324, 432, 540];
      const nodes: { osc: OscillatorNode; gain: GainNode }[] = [];

      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.detune.setValueAtTime((idx - 2) * 2.5, ctx.currentTime);

        const baseVol = 0.08 / (idx + 1);
        g.gain.setValueAtTime(baseVol, ctx.currentTime);

        osc.connect(g);
        g.connect(masterGain);
        osc.start();
        nodes.push({ osc, gain: g });
      });

      oscNodesRef.current = nodes;
    } catch {
      // Graceful fallback
    }
  };

  const modulateAmbientWithBreath = (isExpanding: boolean, duration: number) => {
    if (!audioCtxRef.current || !masterGainRef.current || isMuted) return;
    try {
      const ctx = audioCtxRef.current;
      const targetGain = isExpanding ? 0.16 : 0.08;
      masterGainRef.current.gain.cancelScheduledValues(ctx.currentTime);
      masterGainRef.current.gain.setValueAtTime(masterGainRef.current.gain.value, ctx.currentTime);
      masterGainRef.current.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + duration);
    } catch {
      // Ignore
    }
  };

  const stopAmbientSound = () => {
    if (masterGainRef.current && audioCtxRef.current) {
      try {
        const ctx = audioCtxRef.current;
        masterGainRef.current.gain.cancelScheduledValues(ctx.currentTime);
        masterGainRef.current.gain.setValueAtTime(masterGainRef.current.gain.value, ctx.currentTime);
        masterGainRef.current.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 1.2);

        setTimeout(() => {
          oscNodesRef.current.forEach(({ osc, gain }) => {
            try {
              osc.stop();
              osc.disconnect();
              gain.disconnect();
            } catch {
              // Ignore
            }
          });
          oscNodesRef.current = [];
        }, 1300);
      } catch {
        // Ignore
      }
    }
  };

  const startSession = () => {
    setIsPlaying(true);
    setIsCompleted(false);
    setSecondsRemaining(TOTAL_SESSION_SECONDS);
    setPhaseIndex(0);
    setPhaseProgress(0);
    setCompletedCycles(0);
    startAmbientSound();
  };

  const pauseSession = () => {
    setIsPlaying(false);
    stopAmbientSound();
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
  };

  const resetSession = () => {
    setIsPlaying(false);
    setIsCompleted(false);
    setSecondsRemaining(TOTAL_SESSION_SECONDS);
    setPhaseIndex(0);
    setPhaseProgress(0);
    setCompletedCycles(0);
    stopAmbientSound();
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
  };

  const togglePlay = () => {
    if (!isPlaying) {
      startSession();
    } else {
      pauseSession();
    }
  };

  const toggleMute = () => {
    if (!masterGainRef.current || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (isMuted) {
      masterGainRef.current.gain.cancelScheduledValues(ctx.currentTime);
      masterGainRef.current.gain.setValueAtTime(0.001, ctx.currentTime);
      masterGainRef.current.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + 0.8);
      setIsMuted(false);
    } else {
      masterGainRef.current.gain.cancelScheduledValues(ctx.currentTime);
      masterGainRef.current.gain.setValueAtTime(masterGainRef.current.gain.value, ctx.currentTime);
      masterGainRef.current.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.4);
      setIsMuted(true);
    }
  };

  // High precision animation loop: 60s total countdown + pattern phase loop
  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    let activePhaseIdx = phaseIndex;
    let phaseDuration = currentPattern.phases[activePhaseIdx].duration;
    let phaseStart = performance.now();
    const sessionStart = performance.now() - (TOTAL_SESSION_SECONDS - secondsRemaining) * 1000;

    const isExpand = currentPattern.phases[activePhaseIdx].name.includes('Al');
    modulateAmbientWithBreath(isExpand, phaseDuration);

    const step = (now: number) => {
      // 1. Session Countdown calculation (60s total)
      const sessionElapsedSec = (now - sessionStart) / 1000;
      const remSec = Math.max(0, Math.ceil(TOTAL_SESSION_SECONDS - sessionElapsedSec));
      setSecondsRemaining(remSec);

      if (sessionElapsedSec >= TOTAL_SESSION_SECONDS) {
        // Session Finished!
        setIsPlaying(false);
        setIsCompleted(true);
        setSecondsRemaining(0);
        setPhaseProgress(0);
        stopAmbientSound();
        return;
      }

      // 2. Breath Phase calculation
      const phaseElapsed = (now - phaseStart) / 1000;
      const progress = Math.min(phaseElapsed / phaseDuration, 1);
      setPhaseProgress(progress);
      setPhaseTimeLeft(Math.max(0, Math.ceil(phaseDuration - phaseElapsed)));

      if (phaseElapsed >= phaseDuration) {
        const nextIdx = (activePhaseIdx + 1) % currentPattern.phases.length;
        if (nextIdx === 0) {
          setCompletedCycles((c) => c + 1);
        }
        activePhaseIdx = nextIdx;
        setPhaseIndex(nextIdx);
        phaseDuration = currentPattern.phases[nextIdx].duration;
        phaseStart = now;

        const nextIsExpand = currentPattern.phases[nextIdx].name.includes('Al');
        modulateAmbientWithBreath(nextIsExpand, phaseDuration);
      }

      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, selectedPattern]);

  // Clean audio on unmount
  useEffect(() => {
    return () => {
      stopAmbientSound();
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Compute visual scale & glow intensity based on current phase
  const isExpandingPhase = currentPhase.name.includes('Al');
  const isHoldingPhase = currentPhase.name.includes('Tut');
  const isExhalingPhase = currentPhase.name.includes('Ver') || currentPhase.name.includes('Dingin');

  let currentScale = 1;
  let glowOpacity = 0.2;

  if (isPlaying) {
    if (isExpandingPhase) {
      currentScale = 1 + phaseProgress * 0.45;
      glowOpacity = 0.2 + phaseProgress * 0.45;
    } else if (isHoldingPhase) {
      currentScale = 1.45;
      glowOpacity = 0.65;
    } else if (isExhalingPhase) {
      currentScale = 1.45 - phaseProgress * 0.45;
      glowOpacity = 0.65 - phaseProgress * 0.45;
    }
  }

  // Format MM:SS for countdown display
  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const totalProgressFraction = (TOTAL_SESSION_SECONDS - secondsRemaining) / TOTAL_SESSION_SECONDS;

  return (
    <div id="mindful-pause-section" className="w-full max-w-6xl mx-auto my-8 sm:my-14 md:my-16 px-4 sm:px-6">
      <div className="liquid-glass rounded-3xl p-5 sm:p-8 md:p-12 border border-white/15 bg-gradient-to-b from-white/[0.04] via-black/60 to-black/90 relative overflow-hidden shadow-2xl">
        {/* Soft Ambient Radiance in Background */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/[0.03] filter blur-3xl pointer-events-none transition-opacity duration-1000"
          style={{ opacity: isPlaying ? 0.8 : 0.3 }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-white/[0.04] filter blur-3xl pointer-events-none transition-opacity duration-1000"
          style={{ opacity: isPlaying ? 0.9 : 0.4 }}
        />

        {/* Top Header Row with High-Visibility Countdown Badge */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-5 pb-6 sm:pb-8 border-b border-white/10 text-left">
          <div className="max-w-xl">
            <div className="flex items-center gap-2.5 text-white/50 text-xs sm:text-sm tracking-[0.25em] uppercase font-medium mb-3">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <Wind size={15} className="text-white/80" />
              <span>BİR DAKİKALIK DİNGİNLİK REHBERİ</span>
            </div>
            <h3 className="serif-font text-2xl sm:text-4xl md:text-5xl text-white tracking-tight leading-tight">
              Sayfayı incelemeden önce zihnini dinlendir.
            </h3>
          </div>

          {/* 1-Minute Live Prominent Countdown Display & Pattern Switcher stacked with matching width */}
          <div className="flex flex-col gap-2.5 w-full sm:w-[320px] self-start md:self-end">
            {/* Timer card spanning matching width */}
            <div className="liquid-glass rounded-2xl px-4 py-2.5 sm:px-5 sm:py-2.5 flex items-center justify-between gap-3 border border-white/20 bg-white/[0.05] shadow-xl w-full">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0">
                  <Timer size={16} className={isPlaying ? 'animate-pulse text-white' : 'text-white/70'} />
                </div>
                <div className="text-left font-mono">
                  <span className="text-[10px] text-white/50 block leading-none uppercase tracking-widest font-sans font-medium mb-1">
                    1 DAKİKA SAYAÇ
                  </span>
                  <span className="text-base sm:text-lg font-bold text-white tracking-widest">
                    {formatCountdown(secondsRemaining)}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 border border-white/10 px-2 py-0.5 rounded-full">
                {isPlaying ? 'AKTİF' : 'BEKLEMEDE'}
              </span>
            </div>

            {/* Pattern Switcher Pills spanning matching full width */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl liquid-glass border border-white/10 bg-black/40 w-full">
              {(Object.keys(PATTERNS) as BreathingPattern[]).map((patternKey) => (
                <button
                  key={patternKey}
                  onClick={() => {
                    setSelectedPattern(patternKey);
                    if (isPlaying) {
                      setPhaseIndex(0);
                      setPhaseProgress(0);
                    }
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-medium transition-all text-center cursor-pointer ${
                    selectedPattern === patternKey
                      ? 'bg-white text-black font-semibold shadow-md'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {PATTERNS[patternKey].name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Global 60-Second Linear Progress Bar */}
        <div className="relative z-10 w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-5 sm:mt-6">
          <div
            className="h-full bg-gradient-to-r from-white/40 via-white/80 to-white transition-all duration-200"
            style={{ width: `${totalProgressFraction * 100}%` }}
          />
        </div>

        {/* Main Content: Interactive Visualizer & Instructions */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center pt-6 sm:pt-10">
          
          {/* Left Column: Pattern Info, Guidance & Controls */}
          <div className="lg:col-span-6 flex flex-col space-y-5 sm:space-y-6 text-left">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-mono mb-3">
                <Activity size={13} className="text-white/80" />
                <span>{currentPattern.subname}</span>
              </div>

              {!isCompleted ? (
                <>
                  <h4 className="serif-font text-2xl sm:text-3xl text-white mb-2">
                    {isPlaying ? currentPhase.name : currentPattern.name}
                  </h4>
                  <p className="text-white/60 text-sm sm:text-base leading-relaxed font-light min-h-[44px]">
                    {isPlaying ? currentPhase.text : currentPattern.desc}
                  </p>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-start gap-2 text-white">
                    <CheckCircle2 size={20} className="text-white" />
                    <h4 className="serif-font text-2xl sm:text-3xl text-white">
                      1 Dakikalık Duraklama Tamamlandı
                    </h4>
                  </div>
                  <p className="text-white/70 text-sm sm:text-base leading-relaxed font-light">
                    Zihnini dinlendirdin. Şimdi sayfayı daha açık bir dikkat ve dinginlikle keşfetmeye hazırsın.
                  </p>
                </div>
              )}
            </div>

            {/* Phase steps progress tracker */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pt-1">
              {currentPattern.phases.map((ph, idx) => {
                const isActive = isPlaying && phaseIndex === idx;
                const isPassed = isPlaying && phaseIndex > idx;
                return (
                  <div
                    key={ph.name}
                    className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border transition-all text-center ${
                      isActive
                        ? 'bg-white/10 border-white/40 shadow-lg'
                        : isPassed
                        ? 'bg-white/[0.02] border-white/20 opacity-70'
                        : 'bg-white/[0.01] border-white/5 opacity-40'
                    }`}
                  >
                    <div className="text-[9px] sm:text-[10px] uppercase font-mono tracking-wider text-white/60 mb-0.5">
                      {ph.duration}s
                    </div>
                    <div className="text-[11px] sm:text-xs text-white font-medium truncate">
                      {ph.name}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 w-full">
              {!isCompleted ? (
                <button
                  id="btn-mindful-pause-toggle"
                  onClick={togglePlay}
                  className="liquid-glass bg-white text-black hover:bg-white/90 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2.5 sm:gap-3 cursor-pointer shadow-2xl"
                >
                  {isPlaying ? (
                    <>
                      <Pause size={16} />
                      <span>Duraklat ({secondsRemaining}s kaldı)</span>
                    </>
                  ) : (
                    <>
                      <Play size={16} className="fill-black" />
                      <span>1 Dakikalık Döngüyü Başlat</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={startSession}
                  className="liquid-glass bg-white text-black hover:bg-white/90 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2.5 sm:gap-3 cursor-pointer shadow-2xl"
                >
                  <RefreshCw size={16} />
                  <span>Tekrar 1 Dakika Başlat</span>
                </button>
              )}

              {isPlaying && (
                <button
                  onClick={toggleMute}
                  className="p-2.5 sm:p-3 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors border border-white/15 cursor-pointer"
                  aria-label={isMuted ? 'Sesi Aç (432Hz Ambient)' : 'Sesi Kapat'}
                  title={isMuted ? 'Sesi Aç (432Hz Ambient)' : 'Sesi Kapat'}
                >
                  {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
                </button>
              )}

              {isPlaying && (
                <button
                  onClick={resetSession}
                  className="p-2.5 sm:p-3 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors border border-white/10 cursor-pointer"
                  aria-label="Sıfırla"
                  title="Sıfırla"
                >
                  <RefreshCw size={15} />
                </button>
              )}

              {completedCycles > 0 && isPlaying && (
                <span className="text-xs text-white/50 font-mono self-center">
                  Tamamlanan: {completedCycles}
                </span>
              )}
            </div>
          </div>

          {/* Right Column: Redesigned Concentric Sacred Geometric Breathing Orb with Dual Rings */}
          <div className="lg:col-span-6 flex items-center justify-center py-4 relative min-h-[300px] sm:min-h-[360px]">
            
            {/* Outer Fluid Radiant Rings */}
            <div
              className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full border border-white/10 transition-transform duration-300 ease-out"
              style={{
                transform: `scale(${currentScale * 1.15})`,
                opacity: glowOpacity * 0.4,
              }}
            />

            <div
              className="absolute w-52 h-52 sm:w-64 sm:h-64 rounded-full border border-white/20 transition-transform duration-300 ease-out"
              style={{
                transform: `scale(${currentScale * 1.08})`,
                opacity: glowOpacity * 0.7,
              }}
            />

            {/* Ambient Radial Soft Glow */}
            <div
              className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-white transition-all duration-300 ease-out filter blur-2xl pointer-events-none"
              style={{
                transform: `scale(${currentScale})`,
                opacity: glowOpacity * 0.25,
              }}
            />

            {/* Central High-Craft Breathing Sphere */}
            <div
              className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full liquid-glass flex flex-col items-center justify-center text-center p-4 border border-white/30 shadow-[0_0_50px_rgba(255,255,255,0.15)] bg-neutral-950/80 backdrop-blur-xl transition-transform duration-200 ease-out z-10"
              style={{
                transform: `scale(${currentScale})`,
              }}
            >
              {/* Outer 60s Global Countdown Ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-1" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="48"
                  fill="transparent"
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth="1.5"
                />
                {isPlaying && (
                  <circle
                    cx="50"
                    cy="50"
                    r="48"
                    fill="transparent"
                    stroke="rgba(255, 255, 255, 0.35)"
                    strokeWidth="1.5"
                    strokeDasharray="301.6"
                    strokeDashoffset={301.6 * (1 - totalProgressFraction)}
                    strokeLinecap="round"
                    className="transition-all duration-100"
                  />
                )}
              </svg>

              {/* Inner Circular SVG Phase Progress Ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-3" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="43"
                  fill="transparent"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="2.5"
                />
                {isPlaying && (
                  <circle
                    cx="50"
                    cy="50"
                    r="43"
                    fill="transparent"
                    stroke="rgba(255, 255, 255, 0.9)"
                    strokeWidth="3"
                    strokeDasharray="270"
                    strokeDashoffset={270 * (1 - phaseProgress)}
                    strokeLinecap="round"
                    className="transition-all duration-75"
                  />
                )}
              </svg>

              <Sparkles
                size={18}
                className={`text-white transition-opacity duration-300 mb-1 ${
                  isPlaying ? 'opacity-90' : 'opacity-40'
                }`}
              />

              <div className="serif-font text-lg sm:text-xl text-white font-medium tracking-tight">
                {isPlaying ? currentPhase.name : isCompleted ? 'Tamamlandı' : 'Dinginlik'}
              </div>

              {/* Countdown / Phase Timer Display */}
              <div className="text-[11px] text-white/70 tracking-wider uppercase font-mono mt-1 flex items-center gap-1.5">
                {isPlaying ? (
                  <>
                    <span className="text-white font-semibold">{phaseTimeLeft}s</span>
                    <span className="text-white/30">•</span>
                    <span className="text-white/60">{formatCountdown(secondsRemaining)}</span>
                  </>
                ) : isCompleted ? (
                  <span className="text-white/80">60sn Bitti</span>
                ) : (
                  <span>01:00</span>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
