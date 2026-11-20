import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { guardBrowserErrors } from './fixtures/browserErrors';
import { APP_ROOT } from './fixtures/app';
import { goToProgressPage, progressSessionCount, runRangeQuizSession } from './fixtures/rangeTraining';
import { startStaticSite, type StaticSite } from './fixtures/staticSite';
import {
  REPO_ROOT,
  findAOnlyChunk,
  readAppVersion,
  readBuildInfo,
  readMainChunk,
  variantDir,
  type BuildInfo,
} from './fixtures/upgradeBuilds';

/**
 * L4 升级闭环（AC E4）：同 origin 的静态服务器先提供构建 A，训练产生 1 条记录；
 * SW 完成预缓存并受控后，服务器切到构建 B（A-only chunk 真 404）。此时：
 *
 * 1. 触发 update → B 进入 waiting（不 skipWaiting / 不 claim，A 页面仍由 A SW + A 缓存服务）；
 * 2. A 旧页面通过 SPA 导航访问从未访问过的路由，加载 A-only chunk（服务器已 404，
 *    只能命中 A 的旧预缓存）；
 * 3. 关闭全部受控 A 页面后，同 context 新开页 → B 激活（缓存名 / 清单 hash / 入口 hash 变化），
 *    进度记录（IndexedDB）保留。
 *
 * 禁止项：不改 SW 主脚本、不清缓存、不重建 context、不把「多开标签页」当升级完成。
 * 本用例不登记任何期望错误：console error / pageerror / 失败请求 / 4xx-5xx 一律失败。
 * 唯一例外是测试进程（非页面）主动 fetch A-only chunk 断言 404 —— 该请求不经过页面，
 * 也不产生页面级错误证据。
 */
const BUILD_SCRIPT = path.join(REPO_ROOT, 'e2e', 'scripts', 'build-e2e-variants.mjs');
/** 预先未访问、且仅存在于 A 的路由 chunk（帮助中心） */
const NEVER_VISITED_CHUNK_PREFIX = 'HelpHome-';
const HELP_TITLE = '帮助中心';
const HELP_QUICKSTART = '快速上手';

let site: StaticSite;
let buildA: BuildInfo;
let buildB: BuildInfo;

/** 自定义 origin 的引导跳过（fixtures/app 的 skipOnboarding 固定用 baseURL） */
async function skipOnboardingAt(page: Page): Promise<void> {
  await page.goto(`${site.origin}${APP_ROOT}`);
  await expect(page).toHaveURL(/\/dezhou\/onboarding$/);
  await page.getByRole('button', { name: '跳过引导' }).click();
  await expect(page).toHaveURL(/\/dezhou\/$/);
}

/** 当前激活 SW 写入 meta 的缓存名（activate 阶段写入，是「B 已激活」的权威信号） */
function readActiveCacheName(page: Page): Promise<string> {
  return page.evaluate(async () => {
    const meta = await caches.open('poker-training-meta');
    const response = await meta.match('/dezhou/.sw-meta-current');
    return response ? await response.text() : '';
  });
}

test.beforeAll(async () => {
  // 两次真实 Vite 构建（每次 ~2s）：产物写 gitignored 的 .playwright/e2e-upgrade-builds
  test.setTimeout(600_000);
  execFileSync(process.execPath, [BUILD_SCRIPT], { cwd: REPO_ROOT, stdio: 'inherit' });

  const appVersion = readAppVersion();
  buildA = readBuildInfo('A', appVersion);
  buildB = readBuildInfo('B', appVersion);

  // B 与 A 的可验证差异：入口 hash / 清单 hash / 缓存名 / chunk 字节标记
  expect(buildA.mainScript).not.toBe(buildB.mainScript);
  expect(buildA.manifestHash).not.toBe(buildB.manifestHash);
  expect(buildA.cacheName).not.toBe(buildB.cacheName);
  const mainChunkA = readMainChunk(buildA);
  const mainChunkB = readMainChunk(buildB);
  expect(mainChunkA).toContain(buildA.marker);
  expect(mainChunkB).toContain(buildB.marker);
  expect(mainChunkA).not.toBe(mainChunkB);

  site = await startStaticSite(variantDir('A'));
});

test.afterAll(async () => {
  await site?.close();
  execFileSync(process.execPath, [BUILD_SCRIPT, '--clean'], { cwd: REPO_ROOT, stdio: 'inherit' });
});

test('切换部署构建后：旧页面仍从旧缓存取旧 chunk，关闭旧页后新 SW 激活且记录保留', async ({
  context,
}) => {
  test.setTimeout(300_000);
  const page = await context.newPage();
  const guard = guardBrowserErrors(page);

  // 1. 打开 A → 真实训练 → 进度页 1 条
  await skipOnboardingAt(page);
  await runRangeQuizSession(page, 10);
  await goToProgressPage(page);
  await expect(progressSessionCount(page)).toHaveText('1', { timeout: 20_000 });

  // 2. 等 A 的全量预缓存完成并受控（正常重载取控制权，不修改 SW 生命周期）
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    if (!registration.active) throw new Error('service worker 未激活，预缓存未完成');
  });
  await page.reload();
  await expect(page).toHaveURL(/\/dezhou\/progress$/);
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);
  await expect(progressSessionCount(page)).toHaveText('1', { timeout: 20_000 });

  // A 侧基线：缓存名 / 激活 meta 都是 A
  const cachesBefore = await page.evaluate(() => caches.keys());
  expect(cachesBefore).toContain(buildA.cacheName);
  expect(await readActiveCacheName(page)).toBe(buildA.cacheName);

  // 3. 服务器切到 B：同 origin、同端口，A-only 资产从此 404
  const aOnlyChunk = findAOnlyChunk(buildA, buildB, NEVER_VISITED_CHUNK_PREFIX);
  site.switchRoot(variantDir('B'));
  expect(site.currentRoot()).toBe(path.resolve(variantDir('B')));

  // A 旧页面此时尚未请求过该 chunk（断言「此前未访问」成立）
  expect(
    await page.evaluate(
      (url) => performance.getEntriesByType('resource').some((entry) => entry.name.endsWith(url)),
      aOnlyChunk.url,
    ),
  ).toBe(false);

  // 服务器侧真 404（测试进程直连，不经过页面 / SW）
  const goneResponse = await fetch(`${site.origin}${aOnlyChunk.url}`);
  expect(goneResponse.status).toBe(404);

  // 4. 触发 SW 更新：B 安装完成进入 waiting，但绝不立即接管（不 skipWaiting / claim）
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) throw new Error('缺少 SW registration');
    await registration.update();
  });
  await expect
    .poll(
      () =>
        page.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration())?.waiting)),
      { timeout: 60_000 },
    )
    .toBe(true);
  // B 的预缓存已写完（等待态即可用），缓存名与 A 不同
  await expect.poll(() => page.evaluate(() => caches.keys()), { timeout: 60_000 }).toContain(
    buildB.cacheName,
  );
  expect(await readActiveCacheName(page)).toBe(buildA.cacheName);

  // 5. A 旧页面 SPA 导航到从未访问的帮助中心：chunk 只能来自 A 的旧预缓存
  await page.locator('aside').getByRole('link', { name: HELP_TITLE }).click();
  await expect(page).toHaveURL(/\/dezhou\/help$/);
  await expect(page.getByRole('heading', { level: 1, name: HELP_TITLE })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: HELP_QUICKSTART })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        (url) =>
          performance.getEntriesByType('resource').some((entry) => entry.name.endsWith(url)),
        aOnlyChunk.url,
      ),
    )
    .toBe(true);
  // B 仍在等待：旧页面没有被新版本接管
  expect(
    await page.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration())?.waiting)),
  ).toBe(true);
  expect(await readActiveCacheName(page)).toBe(buildA.cacheName);

  guard.assertClean();

  // 6. 关闭全部受控 A 页面 → 同 context 新开页
  await page.close();
  const upgraded = await context.newPage();
  const upgradedGuard = guardBrowserErrors(upgraded);

  await upgraded.goto(`${site.origin}${APP_ROOT}progress`);
  await expect.poll(() => readActiveCacheName(upgraded), { timeout: 60_000 }).toBe(
    buildB.cacheName,
  );

  const registrationState = await upgraded.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return {
      active: registration?.active?.state ?? null,
      waiting: Boolean(registration?.waiting),
      controlled: navigator.serviceWorker.controller !== null,
    };
  });
  expect(registrationState.active).toBe('activated');
  expect(registrationState.waiting).toBe(false);

  // 新页面必须由 B 服务：正常重载取得 B 的控制权，入口 hash 与 B 一致
  await upgraded.reload();
  await expect
    .poll(() => upgraded.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);
  const mainScript = await upgraded.evaluate(
    () => document.querySelector('script[type="module"]')?.getAttribute('src') ?? '',
  );
  expect(mainScript).toBe(buildB.mainScript);
  expect(mainScript).not.toBe(buildA.mainScript);
  expect(await upgraded.evaluate(() => caches.keys())).toContain(buildB.cacheName);

  // 7. 进度记录（IndexedDB）跨升级保留
  await expect(upgraded).toHaveURL(/\/dezhou\/progress$/);
  await expect(progressSessionCount(upgraded)).toHaveText('1', { timeout: 20_000 });
  await upgraded.reload();
  await expect(progressSessionCount(upgraded)).toHaveText('1', { timeout: 20_000 });

  upgradedGuard.assertClean();
});
