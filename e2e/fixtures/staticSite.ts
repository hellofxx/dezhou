import { createServer, type Server } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';

/**
 * 升级用例专用静态服务器（同 origin 依次提供 A / B 两套真实构建产物）。
 *
 * - 只映射 `/dezhou/` 子路径（与 vite base 一致），其余路径 404；
 * - 导航请求（无扩展名 / .html）回落 `index.html`，模拟 GitHub Pages 的 SPA 行为；
 * - 缺失的哈希资产返回真 404（不回落 index.html），用于证明「切到 B 后 A-only chunk
 *   已从服务器消失，旧页面仍能靠旧 SW 缓存拿到」；
 * - `cache-control: no-store`：避免 HTTP 缓存把 A 的响应喂给 B 的安装期预缓存；
 * - `switchRoot()` 让同 origin 在运行时从 A 切到 B（不换端口、不重建 context）。
 */
export interface StaticSite {
  readonly origin: string;
  /** 切换当前服务的构建目录（同步生效，后续请求全部走新目录） */
  switchRoot(rootDir: string): void;
  /** 当前服务的构建目录（测试断言用） */
  currentRoot(): string;
  close(): Promise<void>;
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.txt': 'text/plain; charset=utf-8',
};

export function startStaticSite(initialRoot: string): Promise<StaticSite> {
  let rootDir = path.resolve(initialRoot);

  const server: Server = createServer((request, response) => {
    const method = request.method ?? 'GET';
    if (method !== 'GET' && method !== 'HEAD') {
      response.writeHead(405, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('method not allowed');
      return;
    }

    const rawUrl = request.url ?? '/';
    const pathname = decodeURIComponent(new URL(rawUrl, 'http://localhost').pathname);

    if (!pathname.startsWith('/dezhou/')) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('not found');
      return;
    }

    const relative = pathname.slice('/dezhou/'.length);
    const normalized = path.posix.normalize(relative || 'index.html');
    const filePath = path.resolve(rootDir, normalized);
    // 路径穿越防护：解析后必须仍在当前构建根目录内
    const withinRoot = filePath === rootDir || filePath.startsWith(rootDir + path.sep);

    const isFile = withinRoot && existsSync(filePath) && statSync(filePath).isFile();
    const extension = path.posix.extname(normalized).toLowerCase();
    const isNavigation = normalized === '' || extension === '.html' || extension === '';

    let servedPath = filePath;
    if (!isFile) {
      if (!isNavigation) {
        // 哈希资产缺失 → 真 404（不回落 index.html）
        response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        response.end('not found');
        return;
      }
      servedPath = path.join(rootDir, 'index.html');
      if (!existsSync(servedPath)) {
        response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        response.end('index.html missing');
        return;
      }
    }

    const contentType = MIME[path.extname(servedPath).toLowerCase()] ?? 'application/octet-stream';
    const size = statSync(servedPath).size;
    response.writeHead(200, {
      'content-type': contentType,
      'content-length': size,
      'cache-control': 'no-store',
    });
    if (method === 'HEAD') {
      response.end();
      return;
    }
    createReadStream(servedPath).pipe(response);
  });

  return new Promise<StaticSite>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address === null || typeof address === 'string') {
        reject(new Error('静态服务器未获得端口'));
        return;
      }
      const origin = `http://127.0.0.1:${address.port}`;
      resolve({
        origin,
        switchRoot(nextRoot: string) {
          rootDir = path.resolve(nextRoot);
        },
        currentRoot() {
          return rootDir;
        },
        close() {
          return new Promise<void>((done, fail) => {
            server.close((error) => (error ? fail(error) : done()));
          });
        },
      });
    });
  });
}
