/* 原型浏览器验证 — 借用主仓 playwright-core（chromium-1254 无头壳），不新增依赖 */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const pw = require('F:/code/dezhou/node_modules/.pnpm/playwright-core@1.65.0/node_modules/playwright-core');
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const shotDir = join(root, 'verification');
mkdirSync(shotDir, { recursive: true });
const URL = 'file:///' + join(root, 'index.html').replace(/\\/g, '/');

const results = [];
const consoleErrors = [];
const pageErrors = [];
let page;

async function step(name, fn) {
  try {
    await fn();
    results.push({ name, status: 'passed' });
    console.log('PASS', name);
  } catch (e) {
    results.push({ name, status: 'failed', error: String(e.message || e).split('\n')[0] });
    console.log('FAIL', name, '-', String(e.message || e).split('\n')[0]);
  }
}
async function shot(name, full = false) {
  await page.waitForTimeout(850);
  await page.screenshot({ path: join(shotDir, name + '.png'), fullPage: full });
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

const browser = await pw.chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
page = await ctx.newPage();
page.setDefaultTimeout(12000);
page.setDefaultNavigationTimeout(15000);
/* 无头环境外网字体可能挂起：验证时阻断，原型本身有系统字体回退 */
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 300)));

await step('打开原型（桌面 1440×900）', async () => {
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.felt-arena');
});

await step('首次进入出现欢迎纸条', async () => {
  await page.waitForSelector('.dealer-slip', { timeout: 3000 });
  assert(await page.locator('.mentor-card').count() === 3, '应有 3 位导师');
  await shot('01-welcome-desktop');
});

await step('选导师 + 落座开局', async () => {
  await page.click('.mentor-card[data-mentor="strict-math"]');
  await page.click('[data-action="welcome-done"]');
  await page.waitForSelector('.dealer-slip', { state: 'detached' });
  const st = JSON.parse(await page.evaluate(() => localStorage.getItem('pokerlab-prototype-v1')));
  assert(st.onboarded === true && st.mentor === 'strict-math', '引导状态未持久化');
});

await step('首页：牌桌 / 打卡条 / 旅程图 / 训练场渲染', async () => {
  assert(await page.locator('.stage-node').count() === 4, '旅程应 4 阶段');
  assert(await page.locator('.module-card').count() === 6, '训练场应 6 模块');
  assert(await page.locator('.streak-rail').isVisible(), '打卡条可见');
  assert(await page.locator('.table-rail').isVisible(), '桌沿铜钉可见');
  await page.waitForTimeout(2100);
  await shot('02-home-desktop', true);
});

await step('进入当前课程 l2（位置就是权力）', async () => {
  await page.click('.next-lesson [data-action="open-lesson"]');
  await page.waitForSelector('.lesson-title');
  assert((await page.textContent('.lesson-title')).includes('位置'), '课程标题不符');
  assert(await page.locator('.content-block').count() >= 3, '内容块不足');
  assert(await page.locator('.lesson-rail').isVisible(), '学习导轨可见');
  await shot('03-lesson-desktop', true);
});

await step('课后检验：答对 3 题触发掌握达标', async () => {
  for (const q of [0, 1, 2]) await page.click(`.quiz-opt[data-q="${q}"][data-opt="1"]`);
  await page.waitForSelector('.quiz-result.pass');
  assert((await page.textContent('#quiz-score')).trim() === '3/3', '得分应 3/3');
  await shot('04-lesson-quiz-result');
});

await step('完成本课 → 钢印纸条 → l3 解锁', async () => {
  const eloBefore = JSON.parse(await page.evaluate(() => localStorage.getItem('pokerlab-prototype-v1'))).elo;
  await page.click('[data-action="lesson-complete"]');
  await page.waitForSelector('.dealer-slip .stamp');
  await shot('05-complete-slip');
  await page.click('.dealer-slip [data-action="open-lesson"][data-id="l3"]');
  await page.waitForSelector('.lesson-title:has-text("底池赔率")');
  const st = JSON.parse(await page.evaluate(() => localStorage.getItem('pokerlab-prototype-v1')));
  assert(st.lessons.l2 === 'done' && st.elo === eloBefore + 8, '课程完成状态/ELO 未更新');
});

await step('返回首页：旅程进度已更新', async () => {
  await page.click('.back-link');
  await page.waitForSelector('.journey');
  assert(await page.locator('.lesson-chip.done').count() >= 2, 'l1/l2 应为已完成');
  assert(await page.locator('.lesson-chip.current').count() === 1, '应只有一个当前课程');
});

await step('范围训练：5 题全对 → 五级反馈 → 结算', async () => {
  await page.click('.brass-banner [data-action="start-drill"][data-mode="quick"]');
  await page.waitForSelector('#drill-timer');
  await page.click('[data-action="drill-quit"]');
  await page.waitForSelector('.felt-arena');
  await page.click('.srs-item ~ * [data-action="start-drill"], .panel-live [data-action="start-drill"][data-mode="range"]');
  await page.waitForSelector('.scenario-card');
  const picks = [2, 0, 2, 1, 0];
  for (let i = 0; i < 5; i++) {
    await page.click(`[data-action="drill-answer"][data-opt="${picks[i]}"]`);
    await page.waitForSelector('.feedback.grade-best');
    if (i === 0) {
      assert((await page.textContent('#session-strip')).includes('×1'), '实时状态条应更新评级');
      await shot('06-drill-feedback');
    }
    await page.click('[data-action="drill-next"]');
  }
  await page.waitForSelector('.result-acc');
  await page.waitForFunction(() => { const el = document.querySelector('.result-acc'); return el && el.textContent.trim() === '100%'; });
  await shot('07-drill-summary');
  const st = JSON.parse(await page.evaluate(() => localStorage.getItem('pokerlab-prototype-v1')));
  assert(st.week[4] === 1 && st.sessions === 7, '打卡/训练次数未更新');
  await page.click('.dealer-slip [data-action="nav"][data-to="#/home"]');
  await page.waitForSelector('.felt-arena');
});

await step('错误答案路径：对比视图 + 相关课程', async () => {
  await page.click('.module-card[data-to="#/drill"]');
  await page.waitForSelector('.scenario-card');
  await page.click('[data-action="drill-answer"][data-opt="0"]');
  await page.waitForSelector('.feedback.grade-blunder');
  assert(await page.locator('.comparison').isVisible(), '应有 GTO 对比视图');
  assert(await page.locator('.related-chip').isVisible(), '应有相关课程芯片');
  await page.click('[data-action="drill-quit"]');
  await page.waitForSelector('.felt-arena');
});

await step('进度中心：ELO / 五维 / 打卡 / 成就 / 情绪签到', async () => {
  await page.click('.nav-item[data-to="#/progress"]');
  await page.waitForSelector('.rank-hero');
  assert(await page.locator('.dim-row').count() === 5, '五维能力');
  assert(await page.locator('.cal-cell').count() === 14, '14 日打卡');
  await page.click('[data-action="mood"][data-mood="good"]');
  await page.waitForSelector('.toast');
  assert(await page.locator('.mood-btn.active-good').count() === 1, '情绪签到态');
  await shot('08-progress-desktop', true);
});

await step('锁定课程说明纸条', async () => {
  await page.click('.nav-item[data-to="#/home"]');
  await page.waitForSelector('.journey');
  await page.click('.lesson-chip.locked >> nth=0');
  await page.waitForSelector('.dealer-slip');
  assert((await page.textContent('.slip-title')).includes('解锁'), '应为锁定说明');
  await shot('14-locked-slip');
  await page.click('[data-action="slip-close"]');
});

await step('浅色主题「白天牌室」切换', async () => {
  await page.click('#theme-btn');
  assert(await page.evaluate(() => document.documentElement.dataset.theme) === 'light', '主题未切换');
  const arenaBg = await page.evaluate(() => getComputedStyle(document.querySelector('.felt-arena')).backgroundImage);
  assert(arenaBg.includes('31, 82, 51') || arenaBg.includes('1f5233'), '绿呢牌桌应保持深色物理件');
  await shot('09-home-light', true);
  await page.click('#theme-btn');
});

await step('设置纸条：动效 / 演示解锁 / 重置', async () => {
  await page.click('.topbar [data-action="open-settings"]');
  await page.waitForSelector('.settings-row');
  await page.click('[data-action="toggle-demo"]');
  await page.waitForSelector('.toast');
  await page.click('[data-action="toggle-demo"]');
  await page.click('[data-action="reset-data"]');
  await page.waitForSelector('.dealer-slip', { timeout: 5000 });
  assert((await page.textContent('.slip-title')).includes('欢迎'), '重置后应回到引导');
});

/* ===== 移动端 390×844 ===== */
await page.setViewportSize({ width: 390, height: 844 });
await step('移动端：欢迎纸条 → 首页无横向溢出', async () => {
  await page.click('[data-action="welcome-done"]');
  await page.waitForSelector('.felt-arena');
  assert(await page.locator('.mobile-nav').isVisible(), '底栏应显示');
  assert(!(await page.locator('.sidebar').isVisible()), '侧栏应隐藏');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert(overflow <= 0, '首页横向溢出 ' + overflow + 'px');
  await page.waitForTimeout(2100);
  await shot('10-home-mobile', true);
});

await step('移动端：课程页 + 阅读进度条', async () => {
  await page.click('.mnav-item[data-to^="#/lesson"]');
  await page.waitForSelector('.lesson-title');
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(200);
  const w = await page.evaluate(() => document.getElementById('reading-bar').style.width);
  assert(parseFloat(w) > 0, '阅读进度条应随滚动填充');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert(overflow <= 0, '课程页横向溢出 ' + overflow + 'px');
  await shot('11-lesson-mobile', true);
});

await step('移动端：训练答题触摸目标 + 反馈', async () => {
  await page.click('.mnav-item[data-to="#/drill"]');
  await page.waitForSelector('.scenario-card');
  const h = await page.evaluate(() => document.querySelector('.act-btn').getBoundingClientRect().height);
  assert(h >= 44, '答题按钮高度应 ≥44px，实际 ' + h);
  await page.click('[data-action="drill-answer"][data-opt="2"]');
  await page.waitForSelector('.feedback');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert(overflow <= 0, '训练页横向溢出 ' + overflow + 'px');
  await shot('12-drill-mobile', true);
  await page.click('[data-action="drill-quit"]');
});

await step('移动端：速训倒计时运行', async () => {
  await page.click('.mnav-item[data-to="#/quick"]');
  await page.waitForSelector('#drill-timer');
  const t0 = Number(await page.textContent('#timer-num'));
  await page.waitForTimeout(2300);
  const t1 = Number(await page.textContent('#timer-num'));
  assert(t1 < t0, '倒计时未运行');
  await shot('13-quick-mobile');
  await page.click('[data-action="drill-quit"]');
});

await step('移动端：进度中心无溢出', async () => {
  await page.click('.mnav-item[data-to="#/progress"]');
  await page.waitForSelector('.rank-hero');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert(overflow <= 0, '进度页横向溢出 ' + overflow + 'px');
});

await step('重复交互稳定性：再来一组不产生重复计时器', async () => {
  await page.click('.mnav-item[data-to="#/quick"]');
  await page.waitForSelector('#drill-timer');
  for (let i = 0; i < 3; i++) {
    await page.click('[data-action="drill-answer"][data-opt="1"]');
    await page.waitForSelector('.feedback');
    await page.click('[data-action="drill-next"]');
  }
  await page.waitForSelector('.result-acc');
  await page.click('[data-action="drill-restart"]');
  await page.waitForSelector('#drill-timer');
  const t0 = Number(await page.textContent('#timer-num'));
  await page.waitForTimeout(2300);
  const t1 = Number(await page.textContent('#timer-num'));
  assert(t0 - t1 >= 2 && t0 - t1 <= 3, '重开后计时器速率异常（可能重复注册）: ' + (t0 - t1));
  await page.click('[data-action="drill-quit"]');
});

await browser.close();

const jsErrors = pageErrors;
const report = {
  ranAt: new Date().toISOString(),
  engine: 'playwright-core 1.65.0 / chromium-1254 headless shell',
  viewports: ['1440x900', '390x844'],
  steps: results,
  passed: results.filter((r) => r.status === 'passed').length,
  failed: results.filter((r) => r.status === 'failed').length,
  jsExceptions: jsErrors,
  consoleErrors: consoleErrors.slice(0, 20),
  screenshots: results.length ? require('node:fs').readdirSync(shotDir).filter((f) => f.endsWith('.png')) : [],
};
writeFileSync(join(shotDir, 'report.json'), JSON.stringify(report, null, 2));
console.log('\n==== SUMMARY ====');
console.log('passed:', report.passed, 'failed:', report.failed);
console.log('jsExceptions:', jsErrors.length, jsErrors.slice(0, 5));
console.log('consoleErrors:', consoleErrors.length, consoleErrors.slice(0, 5));
process.exit(report.failed || jsErrors.length ? 1 : 0);