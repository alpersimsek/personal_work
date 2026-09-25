import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Wind,
  Sparkles,
  RefreshCw,
  Activity,
  CheckCircle2,
  Timer,
  Music,
  Waves,
  Bell,
} from 'lucide-react';

type BreathingPattern = 'box' | 'relax' | 'deep';
type SoundscapeType = 'solfeggio' | 'ocean' | 'bowls';

interface PatternConfig {
  name: string;
  subname: string;
  desc: string;
  phases: { name: string; duration: number; text: string }[];
}

interface SoundscapeConfig {
  id: SoundscapeType;
  name: string;
  icon: React.ElementType;
  desc: string;
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

const SOUNDSCAPES: SoundscapeConfig[] = [
  {
    id: 'solfeggio',
    name: '432Hz Meditasyon',
    icon: Music,
    desc: 'Organik 432Hz Solfeggio gevşeme frekansı & sıcak ortam pedleri',
  },
  {
    id: 'ocean',
    name: 'Okyanus Akışı',
    icon: Waves,
    desc: 'Nefes ritmine duyarlı yumuşak deniz dalgası & hafif rüzgar sesleri',
  },
  {
    id: 'bowls',
    name: 'Tibetan Çanları',
    icon: Bell,
    desc: 'Derin kase titreşimleri & şifa veren rezonans tonları',
  },
];

export const MindfulPause: React.FC = () => {
  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern>('box');
  const [selectedSoundscape, setSelectedSoundscape] = useState<SoundscapeType>('solfeggio');
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
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileScreen(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const activeAudioNodesRef = useRef<(OscillatorNode | AudioBufferSourceNode | GainNode)[]>([]);
  const animFrameRef = useRef<number | null>(null);

  const currentPattern = PATTERNS[selectedPattern];
  const currentPhase = currentPattern.phases[phaseIndex] || currentPattern.phases[0];

  // Helper to ensure AudioContext is active
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Play gentle Tibetan Bowl / Crystal Bell chime on phase change
  const playPhaseChime = (freq: number = 432) => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      const chimeOsc = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      const chimeHarmonic = ctx.createOscillator();
      const chimeHarmonicGain = ctx.createGain();

      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(freq, now);

      chimeHarmonic.type = 'sine';
      chimeHarmonic.frequency.setValueAtTime(freq * 2.76, now); // Metallic overtone

      // Soft envelope for chime
      chimeGain.gain.setValueAtTime(0.0001, now);
      chimeGain.gain.linearRampToValueAtTime(0.12, now + 0.04);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

      chimeHarmonicGain.gain.setValueAtTime(0.0001, now);
      chimeHarmonicGain.gain.linearRampToValueAtTime(0.03, now + 0.04);
      chimeHarmonicGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      chimeOsc.connect(chimeGain);
      chimeHarmonic.connect(chimeHarmonicGain);

      if (masterGainRef.current) {
        chimeGain.connect(masterGainRef.current);
        chimeHarmonicGain.connect(masterGainRef.current);
      } else {
        chimeGain.connect(ctx.destination);
        chimeHarmonicGain.connect(ctx.destination);
      }

      chimeOsc.start(now);
      chimeHarmonic.start(now);

      chimeOsc.stop(now + 2.3);
      chimeHarmonic.stop(now + 1.3);
    } catch {
      // Ignore fallback
    }
  };

  // Stop active soundscape generators
  const stopAmbientNodes = () => {
    activeAudioNodesRef.current.forEach((node) => {
      try {
        if ('stop' in node && typeof node.stop === 'function') {
          node.stop();
        }
        node.disconnect();
      } catch {
        // Ignore
      }
    });
    activeAudioNodesRef.current = [];
  };

  // Organic Web Audio Ambient Engine
  const startAmbientSound = (soundType: SoundscapeType = selectedSoundscape) => {
    try {
      const ctx = getAudioContext();
      stopAmbientNodes();

      const now = ctx.currentTime;

      // Master Gain setup with smooth fade-in
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0001, now);
      masterGain.gain.linearRampToValueAtTime(isMuted ? 0 : 0.22, now + 2.5);
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      // Main Biquad Filter (Low-pass) to ensure warm, non-harsh soothing tone
      const biquad = ctx.createBiquadFilter();
      biquad.type = 'lowpass';
      biquad.frequency.setValueAtTime(soundType === 'ocean' ? 350 : 280, now);
      biquad.Q.setValueAtTime(1.2, now);
      biquad.connect(masterGain);
      filterNodeRef.current = biquad;

      if (soundType === 'solfeggio') {
        // 432Hz Solfeggio Harmonics (Sub Bass 54Hz, 108Hz, 216Hz, 432Hz, 648Hz)
        const freqs = [54, 108, 216, 432, 648];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();

          osc.type = idx === 0 ? 'sine' : 'sine';
          osc.frequency.setValueAtTime(freq, now);

          // Subtle detune for organic chorus width
          osc.detune.setValueAtTime((idx - 2) * 3, now);

          const vol = idx === 0 ? 0.25 : 0.12 / (idx + 0.5);
          g.gain.setValueAtTime(vol, now);

          osc.connect(g);
          g.connect(biquad);
          osc.start(now);

          activeAudioNodesRef.current.push(osc, g);
        });
      } else if (soundType === 'ocean') {
        // Ocean Waves Engine (Filtered Pink Noise + Sub Bass Grounding)
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        let b0 = 0,
          b1 = 0,
          b2 = 0,
          b3 = 0,
          b4 = 0,
          b5 = 0,
          b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.969 * b2 + white * 0.153852;
          b3 = 0.8665 * b3 + white * 0.3104856;
          b4 = 0.55 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.016898;
          output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          output[i] *= 0.11;
          b6 = white * 0.115926;
        }

        const noiseSrc = ctx.createBufferSource();
        noiseSrc.buffer = noiseBuffer;
        noiseSrc.loop = true;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.18, now);

        noiseSrc.connect(noiseGain);
        noiseGain.connect(biquad);
        noiseSrc.start(now);

        // Grounding sub drone (64Hz)
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.frequency.setValueAtTime(64, now);
        subGain.gain.setValueAtTime(0.12, now);
        subOsc.connect(subGain);
        subGain.connect(biquad);
        subOsc.start(now);

        activeAudioNodesRef.current.push(noiseSrc, noiseGain, subOsc, subGain);
      } else if (soundType === 'bowls') {
        // Singing Bowls & Resonant Chimes Drone
        const bowlFreqs = [144, 216, 432, 528, 720];
        bowlFreqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          // Subtle LFO modulation for bowl beating effect
          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.frequency.setValueAtTime(0.15 + idx * 0.05, now);
          lfoGain.gain.setValueAtTime(2.5, now);
          lfo.connect(lfoGain);
          lfoGain.connect(osc.frequency);
          lfo.start(now);

          const vol = 0.15 / (idx + 1);
          g.gain.setValueAtTime(vol, now);

          osc.connect(g);
          g.connect(biquad);
          osc.start(now);

          activeAudioNodesRef.current.push(osc, g, lfo, lfoGain);
        });
      }
    } catch {
      // Graceful audio fallback
    }
  };

  // Modulate filter cutoff & gain dynamically with breath phase (Inhale = gentle swell, Exhale = soft release)
  const modulateAmbientWithBreath = (isExpanding: boolean, duration: number) => {
    if (!audioCtxRef.current || !filterNodeRef.current || !masterGainRef.current || isMuted) return;
    try {
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;

      // Filter modulation: Inhale lifts filter cutoff to open up harmonic air; Exhale lowers filter cutoff
      const targetCutoff = isExpanding
        ? selectedSoundscape === 'ocean'
          ? 620
          : 450
        : selectedSoundscape === 'ocean'
        ? 220
        : 240;

      filterNodeRef.current.frequency.cancelScheduledValues(now);
      filterNodeRef.current.frequency.setValueAtTime(filterNodeRef.current.frequency.value, now);
      filterNodeRef.current.frequency.linearRampToValueAtTime(targetCutoff, now + duration);

      // Soft Gain modulation
      const targetGain = isExpanding ? 0.24 : 0.15;
      masterGainRef.current.gain.cancelScheduledValues(now);
      masterGainRef.current.gain.setValueAtTime(masterGainRef.current.gain.value, now);
      masterGainRef.current.gain.linearRampToValueAtTime(targetGain, now + duration);
    } catch {
      // Ignore
    }
  };

  const stopAmbientSound = () => {
    if (masterGainRef.current && audioCtxRef.current) {
      try {
        const ctx = audioCtxRef.current;
        const now = ctx.currentTime;
        masterGainRef.current.gain.cancelScheduledValues(now);
        masterGainRef.current.gain.setValueAtTime(masterGainRef.current.gain.value, now);
        masterGainRef.current.gain.linearRampToValueAtTime(0.00001, now + 1.2);

        setTimeout(() => {
          stopAmbientNodes();
        }, 1300);
      } catch {
        stopAmbientNodes();
      }
    } else {
      stopAmbientNodes();
    }
  };

  const startSession = () => {
    setIsPlaying(true);
    setIsCompleted(false);
    setSecondsRemaining(TOTAL_SESSION_SECONDS);
    setPhaseIndex(0);
    setPhaseProgress(0);
    setCompletedCycles(0);
    startAmbientSound(selectedSoundscape);
    playPhaseChime(432);
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
    const now = ctx.currentTime;
    if (isMuted) {
      masterGainRef.current.gain.cancelScheduledValues(now);
      masterGainRef.current.gain.setValueAtTime(0.001, now);
      masterGainRef.current.gain.linearRampToValueAtTime(0.2, now + 0.8);
      setIsMuted(false);
    } else {
      masterGainRef.current.gain.cancelScheduledValues(now);
      masterGainRef.current.gain.setValueAtTime(masterGainRef.current.gain.value, now);
      masterGainRef.current.gain.linearRampToValueAtTime(0.00001, now + 0.4);
      setIsMuted(true);
    }
  };

  const handleSoundscapeChange = (soundId: SoundscapeType) => {
    setSelectedSoundscape(soundId);
    if (isPlaying) {
      startAmbientSound(soundId);
      playPhaseChime(soundId === 'bowls' ? 528 : 432);
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
        playPhaseChime(528); // Completion bell
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

        // Acoustic phase cue chime (Tibetan bell)
        playPhaseChime(nextIsExpand ? 432 : 360);
      }

      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, selectedPattern, selectedSoundscape]);

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

  const scaleDelta = isMobileScreen ? 0.20 : 0.45;

  let currentScale = 1;
  let glowOpacity = 0.2;

  if (isPlaying) {
    if (isExpandingPhase) {
      currentScale = 1 + phaseProgress * scaleDelta;
      glowOpacity = 0.2 + phaseProgress * 0.45;
    } else if (isHoldingPhase) {
      currentScale = 1 + scaleDelta;
      glowOpacity = 0.65;
    } else if (isExhalingPhase) {
      currentScale = (1 + scaleDelta) - phaseProgress * scaleDelta;
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

  const gridColsClass =
    currentPattern.phases.length === 2
      ? 'grid-cols-2'
      : currentPattern.phases.length === 3
      ? 'grid-cols-3'
      : 'grid-cols-4';

  return (
    <div id="mindful-pause-section" className="w-full max-w-6xl mx-auto my-8 sm:my-14 md:my-16 px-4 sm:px-6">
      <div className="liquid-glass rounded-3xl p-4 sm:p-8 md:p-12 border border-white/15 bg-gradient-to-b from-white/[0.04] via-black/60 to-black/90 relative overflow-hidden shadow-2xl">
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
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-5 pb-6 sm:pb-8 border-b border-white/10 text-center md:text-left">
          <div className="max-w-xl flex flex-col items-center md:items-start mx-auto md:mx-0">
            <div className="inline-flex items-center gap-3 mb-4 sm:mb-6">
              <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 border border-white/15 text-white shrink-0">
                <Wind size={20} />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-current animate-pulse" />
              </div>
              <span className="text-white/50 text-xs sm:text-sm tracking-[0.2em] sm:tracking-[0.25em] uppercase font-semibold text-left">
                BİR DAKİKALIK DİNGİNLİK REHBERİ
              </span>
            </div>
            <h2 className="serif-font text-2xl sm:text-4xl md:text-5xl text-white tracking-tight leading-[1.15]">
              Sayfayı incelemeden önce zihnini dinlendir.
            </h2>
          </div>

          {/* 1-Minute Live Prominent Countdown Display & Pattern Switcher */}
          <div className="flex flex-col gap-2.5 w-full sm:w-[320px] self-start md:self-end">
            {/* Timer card */}
            <div className="liquid-glass rounded-2xl px-3.5 py-2 sm:px-5 sm:py-2.5 flex items-center justify-between gap-3 border border-white/20 bg-white/[0.05] shadow-xl w-full">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0">
                  <Timer size={15} className={isPlaying ? 'animate-pulse text-white' : 'text-white/70'} />
                </div>
                <div className="text-left font-mono">
                  <span className="text-[9px] sm:text-[10px] text-white/50 block leading-none uppercase tracking-widest font-sans font-medium mb-0.5 sm:mb-1">
                    1 DAKİKA SAYAÇ
                  </span>
                  <span className="text-sm sm:text-lg font-bold text-white tracking-widest">
                    {formatCountdown(secondsRemaining)}
                  </span>
                </div>
              </div>
              <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-white/40 border border-white/10 px-2 py-0.5 rounded-full">
                {isPlaying ? 'AKTİF' : 'BEKLEMEDE'}
              </span>
            </div>

            {/* Pattern Switcher Pills */}
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
                  className="btn btn-chip btn-sm min-w-0 px-2" data-active={selectedPattern === patternKey}
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

        {/* Soundscape Music Selector Toolbar */}
        <div className="relative z-10 mt-5 sm:mt-6 pt-2 pb-4 border-b border-white/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-white/75 font-medium">
              <Music size={14} className="text-white/80 shrink-0" />
              <span>SES ORTAMI SEÇİMİ (MEDİTASYON MÜZİĞİ):</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 w-full sm:w-auto">
              {SOUNDSCAPES.map((scape) => {
                const IconComponent = scape.icon;
                const isSelected = selectedSoundscape === scape.id;
                return (
                  <button
                    key={scape.id}
                    onClick={() => handleSoundscapeChange(scape.id)}
                    title={scape.desc}
                    className="btn btn-chip btn-sm min-w-0 px-2 sm:px-3.5" data-active={isSelected}
                  >
                    <IconComponent size={13} className="shrink-0" />
                    <span className="truncate">{scape.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content: Interactive Visualizer & Instructions */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center pt-6 sm:pt-8">
          
          {/* Left Column: Pattern Info, Guidance & Controls */}
          <div className="lg:col-span-6 flex flex-col space-y-5 sm:space-y-6 text-left">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-mono mb-3">
                <Activity size={13} className="text-white/80" />
                <span>{currentPattern.subname}</span>
              </div>

              {!isCompleted ? (
                <>
                  <h4 className="serif-font text-2xl sm:text-4xl md:text-5xl text-white font-normal mb-3">
                    {isPlaying ? currentPhase.name : currentPattern.name}
                  </h4>
                  <p className="text-white/80 text-sm sm:text-lg md:text-xl leading-relaxed font-light min-h-[48px] sm:min-h-[56px]">
                    {isPlaying ? currentPhase.text : currentPattern.desc}
                  </p>
                </>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-start gap-2 text-white">
                    <CheckCircle2 size={22} className="text-white shrink-0" />
                    <h4 className="serif-font text-2xl sm:text-3xl md:text-4xl text-white">
                      1 Dakikalık Duraklama Tamamlandı
                    </h4>
                  </div>
                  <p className="text-white/80 text-sm sm:text-lg md:text-xl leading-relaxed font-light">
                    Zihnini dinlendirdin. Şimdi sayfayı daha açık bir dikkat ve dinginlikle keşfetmeye hazırsın.
                  </p>
                </div>
              )}
            </div>

            {/* Phase steps progress tracker */}
            <div className={`grid ${gridColsClass} gap-1.5 sm:gap-2 pt-1`}>
              {currentPattern.phases.map((ph, idx) => {
                const isActive = isPlaying && phaseIndex === idx;
                const isPassed = isPlaying && phaseIndex > idx;
                return (
                  <div
                    key={ph.name}
                    className={`p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl border transition-all text-center ${
                      isActive
                        ? 'bg-white/10 border-white/40 shadow-lg'
                        : isPassed
                        ? 'bg-white/[0.02] border-white/20 opacity-70'
                        : 'bg-white/[0.01] border-white/5 opacity-40'
                    }`}
                  >
                    <div className="text-[9px] sm:text-xs uppercase font-mono tracking-wider text-white/70 mb-0.5 font-medium">
                      {ph.duration}s
                    </div>
                    <div className="text-[11px] sm:text-sm md:text-base text-white font-semibold truncate">
                      {ph.name}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 sm:gap-3 pt-2 w-full">
              {!isCompleted ? (
                <button
                  id="btn-mindful-pause-toggle"
                  onClick={togglePlay}
                  className="btn btn-primary btn-lg w-full sm:w-auto"
                >
                  {isPlaying ? (
                    <>
                      <Pause size={17} />
                      <span>Duraklat ({secondsRemaining}s kaldı)</span>
                    </>
                  ) : (
                    <>
                      <Play size={17} className="fill-black" />
                      <span>1 Dakikalık Döngüyü Başlat</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={startSession}
                  className="btn btn-primary btn-lg w-full sm:w-auto"
                >
                  <RefreshCw size={17} />
                  <span>Tekrar 1 Dakika Başlat</span>
                </button>
              )}

              {isPlaying && (
                <button
                  onClick={toggleMute}
                  className="btn btn-secondary btn-icon"
                  aria-label={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
                  title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
                >
                  {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
                </button>
              )}

              {isPlaying && (
                <button
                  onClick={resetSession}
                  className="btn btn-secondary btn-icon"
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

          {/* Right Column: Concentric Sacred Geometric Breathing Orb with Dual Rings */}
          <div className="lg:col-span-6 flex items-center justify-center py-6 sm:py-4 relative min-h-[250px] xs:min-h-[280px] sm:min-h-[360px] overflow-visible">
            
            {/* Outer Fluid Radiant Rings */}
            <div
              className="absolute w-44 h-44 xs:w-52 xs:h-52 sm:w-80 sm:h-80 rounded-full border border-white/10 transition-transform duration-300 ease-out"
              style={{
                transform: `scale(${currentScale * 1.15})`,
                opacity: glowOpacity * 0.4,
              }}
            />

            <div
              className="absolute w-36 h-36 xs:w-44 xs:h-44 sm:w-64 sm:h-64 rounded-full border border-white/20 transition-transform duration-300 ease-out"
              style={{
                transform: `scale(${currentScale * 1.08})`,
                opacity: glowOpacity * 0.7,
              }}
            />

            {/* Ambient Radial Soft Glow */}
            <div
              className="absolute w-32 h-32 xs:w-40 xs:h-40 sm:w-56 sm:h-56 rounded-full bg-white transition-all duration-300 ease-out filter blur-2xl pointer-events-none"
              style={{
                transform: `scale(${currentScale})`,
                opacity: glowOpacity * 0.25,
              }}
            />

            {/* Central High-Craft Breathing Sphere */}
            <div
              className="relative w-32 h-32 xs:w-38 xs:h-38 sm:w-52 sm:h-52 rounded-full liquid-glass flex flex-col items-center justify-center text-center p-2.5 sm:p-4 border border-white/30 shadow-[0_0_50px_rgba(255,255,255,0.15)] bg-neutral-950/80 backdrop-blur-xl transition-transform duration-200 ease-out z-10"
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
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-2.5 sm:p-3" viewBox="0 0 100 100">
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
                size={16}
                className={`text-white transition-opacity duration-300 mb-0.5 sm:mb-1 ${
                  isPlaying ? 'opacity-90' : 'opacity-40'
                }`}
              />

              <div className="serif-font text-base sm:text-2xl md:text-3xl text-white font-semibold tracking-tight px-1 leading-tight">
                {isPlaying ? currentPhase.name : isCompleted ? 'Tamamlandı' : 'Dinginlik'}
              </div>

              {/* Countdown / Phase Timer Display */}
              <div className="text-[10px] sm:text-[11px] text-white/70 tracking-wider uppercase font-mono mt-0.5 sm:mt-1 flex items-center gap-1 sm:gap-1.5">
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
