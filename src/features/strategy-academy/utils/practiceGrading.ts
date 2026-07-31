/**
 * P1E-13: 实战练习判分口径（纯函数）。
 *
 * 超时路径统一判错（对齐 range-trainer P1A-02 已修口径）：
 * 超时时系统代选最保守动作（Fold）仅用于展示，不进入正常判分链 —
 * 即使代选项恰好是正确答案，也不计对、不加连击、不播答对音效。
 */
import type { PracticeOption, PracticeQuestion } from '../types';

/** 超时系统代选：优先 Fold（最保守动作），无 Fold 时取第一个选项 */
export function pickTimeoutFallbackOption(question: PracticeQuestion): PracticeOption | null {
  return question.options.find((o) => o.action === 'Fold') ?? question.options[0] ?? null;
}

/**
 * 判分：超时恒判错；非超时按选项自身 isCorrect。
 *
 * 判分结果为唯一事实源，贯穿 correctCount / 连击 / 能力评估 /
 * 情绪记录 / 音效 / 难度自适应窗口。
 */
export function gradePracticeSelection(option: PracticeOption, isTimeout: boolean): boolean {
  if (isTimeout) return false;
  return option.isCorrect;
}
