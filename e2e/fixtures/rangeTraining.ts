import { expect, type Page } from '@playwright/test';
import { dismissGlobalDialog, navigateFromSidebar } from './app';

/**
 * 手牌范围训练闭环（L4 共用流程）：侧边栏 → 测验模式 → 配置 → 逐题作答 → 结果页。
 *
 * 全程走真实 UI（不写 localStorage / 不碰 store）：
 * - 训练配置 = QuizConfig 的两个 Select（无限时 + 题量）
 * - 答题 = 键盘 1/2/3（fold/call/raise）+ Space 推进，不假设随机题目的对错
 * - 末题答错会追加一道「救援题」（range-trainer store 的 rescueUsed 机制），
 *   因此实际题量 ≥ 配置题量；循环以题号读数为驱动，最终用结果页真实总题数收尾。
 */
/** QuizCard 键盘快捷键：1=fold / 2=call / 3=raise（与模块文档一致） */
const ANSWER_KEYS = ['1', '2', '3'] as const;
/** 反馈区推进按钮：答对为「下一题」，答错/失误为「再做一题」 */
const ADVANCE_BUTTON_NAME = /^(下一题|再做一题)$/;
/** 题号读数：`第 3 / 11 题` */
const COUNTER_PATTERN = /^第 (\d+) \/ (\d+) 题$/;

export interface RangeQuizResult {
  /** 实际作答次数（含救援题） */
  answered: number;
  /** 本次会话顶栏读数给出的总题数 */
  sessionTotal: number;
}

/** 通过 Select 真实交互选中配置项（config 卡片按位置/动作/限时/题量顺序渲染 4 个 combobox） */
export async function selectConfigOption(
  page: Page,
  index: number,
  optionName: string,
): Promise<void> {
  await page.getByRole('combobox').nth(index).click();
  await page.getByRole('option', { name: optionName, exact: true }).click();
}

/** 读取顶栏题号读数（`第 3 / 11 题`），返回 [当前题号, 本次会话总题数] */
function parseCounter(label: string): [number, number] {
  const match = COUNTER_PATTERN.exec(label.trim());
  if (!match?.[1] || !match[2]) throw new Error(`题号读数不符合预期：${label}`);
  return [Number(match[1]), Number(match[2])];
}

/**
 * 从「手牌范围训练」首页进入测验并完成一次真实训练，停在结果页。
 * 返回实际作答次数与会话总题数；调用方负责后续导航与记录断言。
 */
export async function runRangeQuizSession(
  page: Page,
  questions = 10,
): Promise<RangeQuizResult> {
  // 循环硬上限：配置题 + 救援题，留足余量防死循环（超限即失败）
  const maxIterations = questions * 3;

  await navigateFromSidebar(page, '手牌范围训练');
  await expect(page).toHaveURL(/\/dezhou\/range-trainer$/);
  await page.getByRole('button', { name: '测验模式' }).click();
  await expect(page).toHaveURL(/\/dezhou\/range-trainer\/quiz$/);

  // 配置：无限时（第 3 个 Select）+ 题量（第 4 个 Select）
  await selectConfigOption(page, 2, '无限时');
  await selectConfigOption(page, 3, `${questions} 题`);
  await page.getByRole('button', { name: '开始训练' }).click();

  const resultHeading = page.getByRole('heading', { level: 1, name: '训练完成！' });
  let answered = 0;
  let sessionTotal = 0;

  // 末题答错会追加救援题（total +1），因此不能用「配置题量」当终止条件；
  // 终止条件 = 结果页出现（题号读数只用于逐题校验与取真实总题数）。
  while (answered < maxIterations) {
    // 等待题号推进到「下一题」（或会话直接结束进入结果页），避免读到上一题的残留读数
    const expected = answered + 1;
    const questionCounter = page
      .getByText(new RegExp(`^第 ${expected} / (\\d+) 题$`))
      .first();
    try {
      await questionCounter.waitFor({ state: 'visible', timeout: 10_000 });
    } catch {
      await expect(resultHeading).toBeVisible();
      break;
    }

    const label = (await questionCounter.innerText()).trim();
    const [current, total] = parseCounter(label);
    expect(current, '题号必须逐题递增（不允许跳题 / 重复计数）').toBe(expected);
    sessionTotal = total;

    await page.keyboard.press(ANSWER_KEYS[answered % ANSWER_KEYS.length] ?? '1');

    // 答对 1.5s 后自动跳题；答错/失误停留等 Space。两条路径都在下一轮题号读数处收敛
    const advance = page.getByRole('button', { name: ADVANCE_BUTTON_NAME });
    await advance.waitFor({ state: 'visible', timeout: 3_000 }).catch(() => undefined);
    await dismissGlobalDialog(page);
    await page.keyboard.press('Space');
    answered += 1;
  }

  // 结果页：真实标题 + 真实题量（与本次会话顶栏总题数一致）
  await expect(resultHeading).toBeVisible();
  expect(answered, `本次闭环必须真实完成至少 ${questions} 题`).toBeGreaterThanOrEqual(questions);
  const totalCard = page.getByText('总题数').locator('..');
  await expect(totalCard.getByText(String(sessionTotal), { exact: true })).toBeVisible();

  return { answered, sessionTotal };
}

/** 结果页「返回首页」→ 侧边栏进入进度统计（记录此时已进入待落库状态） */
export async function goToProgressPage(page: Page): Promise<void> {
  await page.getByRole('button', { name: '返回首页' }).click();
  await expect(page).toHaveURL(/\/dezhou\/range-trainer$/);
  await navigateFromSidebar(page, '进度统计');
  await expect(page).toHaveURL(/\/dezhou\/progress$/);
}

/** 进度页「总训练次数」读数（records 走 IndexedDB，异步水合，刷新后仍需成立） */
export function progressSessionCount(page: Page) {
  return page
    .locator('.rp-metric')
    .filter({ hasText: '总训练次数' })
    .locator('.rp-metric-value');
}
