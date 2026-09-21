// Web Audio API chime synthesizer for real-time price alerts

export function playAlertChime(type: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'BULLISH') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Subtle, clean futuristic trading chime
    if (type === 'BULLISH') {
      // Ascending major chord notes: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.25);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      osc.start(now);
      osc.stop(now + 0.65);
    } else if (type === 'BEARISH') {
      // Descending warning chime: G5 (784Hz) -> Eb5 (622Hz) -> C5 (523Hz)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(783.99, now);
      osc.frequency.exponentialRampToValueAtTime(622.25, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.3);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

      osc.start(now);
      osc.stop(now + 0.75);
    } else {
      // Double ping
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(880, now + 0.15);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

      osc.start(now);
      osc.stop(now + 0.45);
    }
  } catch (err) {
    // Ignore audio context autoplay restriction
    console.debug('Audio alert playback suppressed', err);
  }
}
