import type { ConsoleMessage, Page, Request, Response } from '@playwright/test';

/**
 * 浏览器错误护栏：把「意外噪声」变成失败证据。
 *
 * 任何 console error / pageerror / 失败请求 / 4xx-5xx 响应都视为用例失败，
 * 除非调用方用**精确文本**登记为「场景注入的期望错误」。禁止用宽泛正则一次性放行，
 * 否则回归信号会被静默吞掉（例如某个 chunk 404 被当成离线场景的正常现象）。
 */
export interface BrowserErrorGuard {
  /** 登记一条精确的期望 console error 文本（子串精确匹配） */
  allowConsoleError: (exactText: string) => void;
  /** 断言除已登记项外没有其它错误 */
  assertClean: () => void;
  /** 清空累计证据，用于分段断言（如「在线阶段干净 / 离线阶段只有已登记错误」） */
  reset: () => void;
}

/** 不产生网络语义的 URL 前缀（blob / data 由页面内部生成） */
const NON_NETWORK_PREFIXES = ['data:', 'blob:', 'about:'];

function describeFailedRequest(request: Request): string {
  const failure = request.failure();
  return `${request.method()} ${request.url()} → ${failure?.errorText ?? 'unknown'}`;
}

export function guardBrowserErrors(page: Page): BrowserErrorGuard {
  const allowedConsoleErrors: string[] = [];
  let consoleErrors: string[] = [];
  let pageErrors: string[] = [];
  let failedRequests: string[] = [];
  let badResponses: string[] = [];

  page.on('console', (message: ConsoleMessage) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (allowedConsoleErrors.some((allowed) => text.includes(allowed))) return;
    consoleErrors.push(text);
  });

  page.on('pageerror', (error: Error) => {
    pageErrors.push(error.message);
  });

  page.on('requestfailed', (request: Request) => {
    if (NON_NETWORK_PREFIXES.some((prefix) => request.url().startsWith(prefix))) return;
    failedRequests.push(describeFailedRequest(request));
  });

  page.on('response', (response: Response) => {
    const status = response.status();
    if (status < 400) return;
    badResponses.push(`${status} ${response.request().method()} ${response.url()}`);
  });

  const report = (): string =>
    [
      consoleErrors.length > 0 ? `console error:\n  - ${consoleErrors.join('\n  - ')}` : '',
      pageErrors.length > 0 ? `pageerror:\n  - ${pageErrors.join('\n  - ')}` : '',
      failedRequests.length > 0 ? `failed request:\n  - ${failedRequests.join('\n  - ')}` : '',
      badResponses.length > 0 ? `bad response (>=400):\n  - ${badResponses.join('\n  - ')}` : '',
    ]
      .filter((section) => section.length > 0)
      .join('\n');

  return {
    allowConsoleError: (exactText: string) => {
      allowedConsoleErrors.push(exactText);
      consoleErrors = consoleErrors.filter((text) => !text.includes(exactText));
    },
    assertClean: () => {
      const detail = report();
      if (detail.length > 0) {
        throw new Error(`页面出现未登记的浏览器错误（期望为零噪声）：\n${detail}`);
      }
    },
    reset: () => {
      consoleErrors = [];
      pageErrors = [];
      failedRequests = [];
      badResponses = [];
    },
  };
}
