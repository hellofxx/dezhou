// 轻量音效管理器（使用 Web Audio API，无需外部文件）
class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private initialized: boolean = false;

  /** 必须在用户交互后调用（浏览器安全策略） */
  init() {
    if (this.initialized) return;
    try {
      this.audioContext = new AudioContext();
      this.initialized = true;
    } catch {
      // Web Audio API 不可用时静默失败
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled() {
    return this.enabled;
  }

  /** 答题正确：上升音阶 C5 → E5 */
  playCorrect() {
    this.playTone(523, 100); // C5
    setTimeout(() => this.playTone(659, 120), 100); // E5
  }

  /** 答题错误：下降音阶 E4 → C4 */
  playWrong() {
    this.playTone(329, 150); // E4
    setTimeout(() => this.playTone(261, 180), 150); // C4
  }

  /** 倒计时滴答声（最后 5 秒） */
  playTick() {
    this.playTone(800, 30);
  }

  /** 超时提示音 */
  playTimeout() {
    this.playTone(200, 300);
    setTimeout(() => this.playTone(150, 300), 200);
  }

  /** 发牌声（白噪声短脉冲） */
  playDeal() {
    if (!this.enabled || !this.audioContext) return;
    const ctx = this.audioContext;
    const bufferSize = ctx.sampleRate * 0.05;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = 0.08;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  }

  /** 筹码声（高频短脉冲） */
  playChip() {
    this.playTone(2000, 20);
    setTimeout(() => this.playTone(2400, 15), 30);
  }

  private playTone(frequency: number, duration: number) {
    if (!this.enabled || !this.audioContext) return;
    try {
      const ctx = this.audioContext;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = frequency;
      osc.type = 'sine';
      gain.gain.value = 0.1; // 音量 10%
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
      osc.start();
      osc.stop(ctx.currentTime + duration / 1000);
    } catch {
      // 静默失败
    }
  }
}

export const soundManager = new SoundManager();
