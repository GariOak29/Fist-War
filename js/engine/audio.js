// ============================================
// AudioManager - Procedural Web Audio Synthesis
// Punches, Kicks, Special FX, Beam, and Crowd Cheer
// ============================================
class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
    }

    _init() {
        if (this.ctx) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
                this.masterGain = this.ctx.createGain();
                this.masterGain.connect(this.ctx.destination);
                this.masterGain.gain.value = 0.5;
            }
        } catch (e) {
            // Delayed until gesture
        }
    }

    setVolume(vol) {
        this._init();
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, vol));
        }
    }

    play(soundName) {
        this._init();
        if (!this.ctx) return;

        if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }

        try {
            switch (soundName) {
                case 'punch_light': this._playPunchLight(); break;
                case 'punch_heavy': this._playPunchHeavy(); break;
                case 'kick_light': this._playKickLight(); break;
                case 'kick_heavy': this._playKickHeavy(); break;
                case 'block': this._playBlock(); break;
                case 'whiff': this._playWhiff(); break;
                case 'special_hit': this._playSpecialHit(); break;
                case 'ko': this._playKO(); break;
                case 'round_start': this._playRoundStart(); break;
                case 'dash': this._playDash(); break;
                case 'jump': this._playJump(); break;
                case 'land': this._playLand(); break;
                case 'counter_hit': this._playCounterHit(); break;
                case 'cheer': this._playCheer(); break;
                case 'beam_charge': this._playBeamCharge(); break;
                case 'beam_fire': this._playBeamFire(); break;
                case 'beam_hit': this._playBeamHit(); break;
            }
        } catch (err) {
            // Guard against audio context errors
        }
    }

    _createOsc(type, freq, t) {
        const osc = this.ctx.createOscillator();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        return osc;
    }

    _createNoise(duration) {
        const bufferSize = Math.max(100, Math.floor(this.ctx.sampleRate * duration));
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        return noise;
    }

    _createDistortionCurve(amount) {
        const k = typeof amount === 'number' ? amount : 50;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < n_samples; ++i) {
            const x = i * 2 / n_samples - 1;
            curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
        }
        return curve;
    }

    _playCheer() {
        const t = this.ctx.currentTime;
        const noise = this._createNoise(1.2);
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(600, t);
        filter.frequency.linearRampToValueAtTime(1200, t + 0.3);
        filter.frequency.linearRampToValueAtTime(800, t + 1.2);
        filter.Q.value = 1.0;

        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 1.2);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(t);
    }

    _playPunchLight() {
        const t = this.ctx.currentTime;
        const osc = this._createOsc('triangle', 400, t);
        const gain = this.ctx.createGain();
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);
        gain.gain.setValueAtTime(1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.1);
    }

    _playPunchHeavy() {
        const t = this.ctx.currentTime;
        const osc = this._createOsc('sine', 200, t);
        const noise = this._createNoise(0.25);
        const gain = this.ctx.createGain();
        const noiseGain = this.ctx.createGain();
        osc.frequency.exponentialRampToValueAtTime(15, t + 0.25);
        
        gain.gain.setValueAtTime(1.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
        
        noiseGain.gain.setValueAtTime(0.8, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
        
        const dist = this.ctx.createWaveShaper();
        dist.curve = this._createDistortionCurve(20);
        
        osc.connect(dist);
        noise.connect(noiseGain);
        dist.connect(gain);
        gain.connect(this.masterGain);
        noiseGain.connect(this.masterGain);
        
        osc.start(t);
        noise.start(t);
        osc.stop(t + 0.25);
    }

    _playKickLight() {
        const t = this.ctx.currentTime;
        const osc = this._createOsc('square', 300, t);
        const gain = this.ctx.createGain();
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
        gain.gain.setValueAtTime(0.9, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.15);
    }

    _playKickHeavy() {
        const t = this.ctx.currentTime;
        const osc = this._createOsc('sawtooth', 120, t);
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, t);
        filter.frequency.exponentialRampToValueAtTime(40, t + 0.35);
        
        osc.frequency.exponentialRampToValueAtTime(10, t + 0.35);
        
        gain.gain.setValueAtTime(1.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
        
        const dist = this.ctx.createWaveShaper();
        dist.curve = this._createDistortionCurve(30);

        osc.connect(filter);
        filter.connect(dist);
        dist.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(t);
        osc.stop(t + 0.35);
    }

    _playBlock() {
        const t = this.ctx.currentTime;
        const noise = this._createNoise(0.12);
        const osc = this._createOsc('triangle', 900, t);
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1200, t);
        
        gain.gain.setValueAtTime(0.8, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        
        noise.connect(filter);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        noise.start(t);
        osc.start(t);
        osc.stop(t + 0.12);
    }

    _playWhiff() {
        const t = this.ctx.currentTime;
        const noise = this._createNoise(0.18);
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(500, t);
        filter.frequency.linearRampToValueAtTime(1200, t + 0.08);
        filter.frequency.linearRampToValueAtTime(400, t + 0.18);
        
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.linearRampToValueAtTime(0.6, t + 0.08);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.18);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        noise.start(t);
    }

    _playSpecialHit() {
        const t = this.ctx.currentTime;
        const osc = this._createOsc('square', 500, t);
        const noise = this._createNoise(0.45);
        const gain = this.ctx.createGain();
        
        osc.frequency.setValueAtTime(500, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.45);
        
        gain.gain.setValueAtTime(1.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);
        
        const dist = this.ctx.createWaveShaper();
        dist.curve = this._createDistortionCurve(60);

        osc.connect(dist);
        dist.connect(gain);
        noise.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(t);
        noise.start(t);
        osc.stop(t + 0.45);
    }

    _playKO() {
        const t = this.ctx.currentTime;
        const osc = this._createOsc('sawtooth', 100, t);
        const osc2 = this._createOsc('sine', 500, t);
        const noise = this._createNoise(2.5);
        const gain = this.ctx.createGain();
        const gain2 = this.ctx.createGain();
        
        osc.frequency.exponentialRampToValueAtTime(5, t + 2.5);
        gain.gain.setValueAtTime(1.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 2.5);
        
        osc2.frequency.exponentialRampToValueAtTime(100, t + 2.5);
        gain2.gain.setValueAtTime(0.8, t);
        gain2.gain.exponentialRampToValueAtTime(0.01, t + 2.5);
        
        const dist = this.ctx.createWaveShaper();
        dist.curve = this._createDistortionCurve(50);
        
        osc.connect(dist);
        dist.connect(gain);
        noise.connect(gain);
        osc2.connect(gain2);
        
        gain.connect(this.masterGain);
        gain2.connect(this.masterGain);
        
        osc.start(t);
        osc2.start(t);
        noise.start(t);
        osc.stop(t + 2.5);
        osc2.stop(t + 2.5);
    }

    _playRoundStart() {
        const t = this.ctx.currentTime;
        const osc = this._createOsc('square', 350, t);
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(350, t);
        osc.frequency.setValueAtTime(450, t + 0.2);
        osc.frequency.setValueAtTime(600, t + 0.4);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.6, t + 0.1);
        gain.gain.setValueAtTime(0.6, t + 0.4);
        gain.gain.linearRampToValueAtTime(0, t + 0.6);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.6);
    }

    _playDash() {
        const t = this.ctx.currentTime;
        const noise = this._createNoise(0.25);
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(900, t);
        filter.frequency.linearRampToValueAtTime(150, t + 0.25);
        
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        noise.start(t);
    }

    _playJump() {
        const t = this.ctx.currentTime;
        const osc = this._createOsc('sine', 250, t);
        const gain = this.ctx.createGain();
        osc.frequency.linearRampToValueAtTime(500, t + 0.25);
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.25);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.25);
    }

    _playLand() {
        const t = this.ctx.currentTime;
        const osc = this._createOsc('triangle', 120, t);
        const noise = this._createNoise(0.12);
        const gain = this.ctx.createGain();
        osc.frequency.exponentialRampToValueAtTime(15, t + 0.12);
        gain.gain.setValueAtTime(0.6, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        osc.connect(gain);
        noise.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        noise.start(t);
        osc.stop(t + 0.12);
    }

    _playCounterHit() {
        const t = this.ctx.currentTime;
        const osc = this._createOsc('sawtooth', 250, t);
        const gain = this.ctx.createGain();
        const dist = this.ctx.createWaveShaper();
        
        dist.curve = this._createDistortionCurve(100);
        dist.oversample = '4x';
        
        osc.frequency.exponentialRampToValueAtTime(20, t + 0.6);
        gain.gain.setValueAtTime(1.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
        
        osc.connect(dist);
        dist.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(t);
        osc.stop(t + 0.6);
    }

    _playBeamCharge() {
        const t = this.ctx.currentTime;
        const osc = this._createOsc('sawtooth', 100, t);
        const osc2 = this._createOsc('square', 105, t);
        const gain = this.ctx.createGain();
        
        // Rising frequency sweep
        osc.frequency.exponentialRampToValueAtTime(800, t + 0.8);
        osc2.frequency.exponentialRampToValueAtTime(820, t + 0.8);
        
        gain.gain.setValueAtTime(0.01, t);
        gain.gain.exponentialRampToValueAtTime(0.8, t + 0.8);
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, t);
        filter.frequency.exponentialRampToValueAtTime(3000, t + 0.8);
        
        // Pseudo-reverb using delay
        const delay = this.ctx.createDelay();
        delay.delayTime.value = 0.05;
        const feedback = this.ctx.createGain();
        feedback.gain.value = 0.3;
        
        osc.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        
        gain.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(this.masterGain);
        
        gain.connect(this.masterGain);
        
        osc.start(t);
        osc2.start(t);
        osc.stop(t + 0.8);
        osc2.stop(t + 0.8);
    }

    _playBeamFire() {
        const t = this.ctx.currentTime;
        const osc = this._createOsc('sawtooth', 60, t);
        const osc2 = this._createOsc('square', 120, t); // harmonic
        const noise = this._createNoise(1.5);
        const gain = this.ctx.createGain();
        
        // Sustained powerful bass with harmonics
        osc.frequency.setValueAtTime(60, t);
        osc.frequency.exponentialRampToValueAtTime(20, t + 1.5);
        osc2.frequency.setValueAtTime(120, t);
        osc2.frequency.exponentialRampToValueAtTime(40, t + 1.5);
        
        gain.gain.setValueAtTime(1.5, t);
        gain.gain.linearRampToValueAtTime(1.0, t + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 1.5);
        
        const dist = this.ctx.createWaveShaper();
        dist.curve = this._createDistortionCurve(40);
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(4000, t);
        filter.frequency.exponentialRampToValueAtTime(200, t + 1.5);
        
        osc.connect(dist);
        osc2.connect(dist);
        noise.connect(filter);
        dist.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(t);
        osc2.start(t);
        noise.start(t);
        osc.stop(t + 1.5);
        osc2.stop(t + 1.5);
    }

    _playBeamHit() {
        const t = this.ctx.currentTime;
        const osc = this._createOsc('square', 150, t);
        const noise = this._createNoise(0.6);
        const gain = this.ctx.createGain();
        
        // Explosive impact
        osc.frequency.exponentialRampToValueAtTime(10, t + 0.6);
        
        gain.gain.setValueAtTime(1.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
        
        const dist = this.ctx.createWaveShaper();
        dist.curve = this._createDistortionCurve(100); // heavy distortion
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(100, t);
        
        osc.connect(dist);
        noise.connect(dist);
        dist.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(t);
        noise.start(t);
        osc.stop(t + 0.6);
    }
}

window.AudioManager = AudioManager;
