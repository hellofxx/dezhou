import { expect, test } from '@playwright/test';
import { guardBrowserErrors } from './fixtures/browserErrors';
import { skipOnboarding } from './fixtures/app';
import { goToProgressPage, progressSessionCount, runRangeQuizSession } from './fixtures/rangeTraining';

/**
 * L4 持久化失败闭环：精确注入「记录库写入失败」→ 提示条出现、记录保留在内存 →
 * 页面内恢复原方法后点「重试」→ 真实落库、刷新后仍在。
 *
 * 注入边界（只影响记录库，不破坏 SW / 缓存 / 其他 IndexedDB）：
 * - 仅覆盖 `IDBObjectStore.prototype.put`，且仅当 `transaction.db.name ===
 *   'poker-training-records'` 且 `store.name === 'records'`；
 * - 每个文档只失败一次，抛 `QuotaExceededError`（真实配额错误类型）；
 * - 其他 DB（hand-history-db / poker-training 等）与 get/delete/clear 全部走原型原方法。
 *
 * 噪声策略：本用例不登记任何「预期错误」——若注入产生了意外 console error / pageerror /
 * 失败请求 / 4xx-5xx，一律失败（`guard.assertClean()`）。注入异常被应用层 try/catch 捕获，
 * 属于「提示条 + 内存保留」的产品行为，不是浏览器级错误。
 */
const RECORDS_DB = 'poker-training-records';
const RECORDS_STORE = 'records';
const NOTICE_TITLE = '训练记录仅本次可见';
const NOTICE_PENDING = '待写入 1 条';

test('记录库写入失败时提示条出现且记录留在内存，恢复后重试真实落库并在刷新后保留', async ({
  page,
}) => {
  test.setTimeout(180_000);
  const guard = guardBrowserErrors(page);

  // 仅在记录库首次 put 时失败一次；暴露恢复入口供用例在页面内还原
  await page.addInitScript(
    ({ dbName, storeName }) => {
      const proto = IDBObjectStore.prototype;
      const originalPut = proto.put;
      let consumed = false;

      proto.put = function (this: IDBObjectStore, value: unknown, key?: IDBValidKey) {
        const isRecordWrite =
          this.transaction.db.name === dbName && this.name === storeName;
        if (!consumed && isRecordWrite) {
          consumed = true;
          throw new DOMException('E2E injected records write failure', 'QuotaExceededError');
        }
        return key === undefined ? originalPut.call(this, value) : originalPut.call(this, value, key);
      };

      (globalThis as unknown as { __e2eRestoreIdbPut?: () => void }).__e2eRestoreIdbPut = () => {
        proto.put = originalPut;
      };
    },
    { dbName: RECORDS_DB, storeName: RECORDS_STORE },
  );

  await skipOnboarding(page);

  // 真实完成一次训练（配置仅支持 10/20/30/50 题，取最短的 10 题）
  await runRangeQuizSession(page, 10);

  // 提示条：records 来源的写失败文案 + 待写入条数
  const notice = page.getByRole('alert').filter({ hasText: NOTICE_TITLE });
  await expect(notice).toBeVisible({ timeout: 20_000 });
  await expect(notice).toContainText(NOTICE_PENDING);

  // 记录仍在内存：进度页真实计数为 1
  await goToProgressPage(page);
  await expect(progressSessionCount(page)).toHaveText('1', { timeout: 20_000 });

  // 页面内恢复原 put，点真实「重试」按钮（只重写 IDB，不重复 emit / 评分）
  await page.evaluate(() => {
    (globalThis as unknown as { __e2eRestoreIdbPut?: () => void }).__e2eRestoreIdbPut?.();
  });
  await notice.getByRole('button', { name: '重试' }).click();
  await expect(notice).toBeHidden({ timeout: 20_000 });

  // 真实落库：刷新后进度页仍为 1（records 经 IndexedDB 水合；页面内不再保留内存态）
  await page.reload();
  await expect(page).toHaveURL(/\/dezhou\/progress$/);
  await expect(progressSessionCount(page)).toHaveText('1', { timeout: 20_000 });

  guard.assertClean();
});
