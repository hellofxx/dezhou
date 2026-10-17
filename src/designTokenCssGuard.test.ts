import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * CSS 面填充守卫（DESIGN.md §1.2 三不原则 / §5.21 交互状态矩阵 / §4.2 阴影黑调）：
 * designTokenGuard.test.ts 只扫 src/**\/*.{ts,tsx}，globals.css 的样式实现完全在门禁外，
 * 象牙卡面上的 rgba(255,255,255,0.7) 这类"白透底提亮"曾经无人看守（Design QA 2026-10 发现）。
 *
 * 三条规则**只作用于 background / background-color 声明**（面填充），因此：
 * - box-shadow / inset 描边里的 rgba(255,255,255,x) 高光天然合规（§4.3 牌面内描金）；
 * - 自定义属性天然不在扫描范围，含 @media (prefers-contrast: high) 里刻意提亮的 --ivory: #ffffff。
 *
 * A. rgba(255,255,255,α) 且 α > WHITE_ALPHA_LIMIT → 违规（§1.2 最亮色为 ivory，
 *    §5.21 仅授权 hover 中性底色 0.03–0.04）
 * B. rgba(0,0,0,α) 且 α ≥ BLACK_ALPHA_LIMIT → 违规（§4.2 阴影黑调允许压暗层）
 * C. background 里的纯黑/纯白 hex → 违规
 *
 * 豁免白名单遵循「只删不加」：新增豁免必须先在 DESIGN.md 登记设计依据。
 */

/**
 * Vitest 默认 css: false，CSS 导入会被 stub 成空模块，import.meta.glob('?raw') 拿不到源码，
 * 因此走 node fs（同 huPositionOrderGuard.test.ts 的读取方式）。目录扫描，新增 CSS 自动纳入。
 */
const STYLES_DIR = fileURLToPath(new URL('../src/styles', import.meta.url));

const CSS_FILES: Record<string, string> = Object.fromEntries(
  readdirSync(STYLES_DIR)
    .filter((name) => name.endsWith('.css'))
    .map((name) => [name, readFileSync(`${STYLES_DIR}/${name}`, 'utf8')]),
);

/** §5.21 授权 hover 中性底色 0.03–0.04，超过即视为面填充过亮 */
const WHITE_ALPHA_LIMIT = 0.05;
/** 压暗层合法，接近不透明才等同纯黑实底 */
const BLACK_ALPHA_LIMIT = 0.9;

const WHITE_RGBA = /rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*\.?(\d+(?:\.\d+)?)\s*\)/g;
const BLACK_RGBA = /rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*\.?(\d+(?:\.\d+)?)\s*\)/g;
const PURE_HEX = /#(?:fff|ffffff|000|000000)\b/gi;

/**
 * 豁免清单（选择器 + 声明子串指纹，抗行号漂移）。
 * 仅 1px 发线类高光允许超过白阈值，依据 §5.9「黄铜横幅 ::before 顶部 4px 处一道白高光细线」。
 */
const EXEMPT_FILLS: { selector: string; decl: string; reason: string }[] = [
  {
    selector: '.quick-drill-card::before',
    decl: 'rgba(255,255,255,0.25)',
    reason: '§5.9 黄铜横幅金属打磨顶高光（1px 发线，非面填充）',
  },
  {
    selector: '.path-banner::before',
    decl: 'rgba(255,255,255,0.22)',
    reason: '§5.9 同上',
  },
];

interface BackgroundDecl {
  file: string;
  line: number;
  selector: string;
  value: string;
}

/** 去注释但保留行数，保证违规行号与源文件一致 */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, (match) =>
    '\n'.repeat((match.match(/\n/g) ?? []).length),
  );
}

/**
 * 剥离出所有「选择器 + 规则体」。正则只匹配不含花括号的最内层块，
 * 因此 @media / @keyframes 包裹下的规则会以自身选择器被捕获（外层 at-rule 成为残余片段被忽略）。
 */
function collectBackgroundDecls(file: string, css: string): BackgroundDecl[] {
  const text = stripComments(css);
  const decls: BackgroundDecl[] = [];
  const RULE = /([^{}]+)\{([^{}]*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = RULE.exec(text)) !== null) {
    const selector = match[1]!.trim().split('\n').pop()!.trim();
    const body = match[2]!;
    const bodyStart = match.index + match[1]!.length + 1;

    let offset = 0;
    for (const statement of body.split(';')) {
      offset += statement.length + 1;
      const colon = statement.indexOf(':');
      if (colon === -1) continue;
      const prop = statement.slice(0, colon).trim();
      if (!/^background(-color)?$/i.test(prop)) continue;
      decls.push({
        file,
        line: text.slice(0, bodyStart + offset).split('\n').length,
        selector,
        value: statement.slice(colon + 1).trim(),
      });
    }
  }

  return decls;
}

function findViolations(): string[] {
  const violations: string[] = [];

  for (const [file, css] of Object.entries(CSS_FILES)) {
    for (const { selector, value, line } of collectBackgroundDecls(file, css)) {
      if (EXEMPT_FILLS.some((e) => e.selector === selector && value.includes(e.decl))) {
        continue;
      }

      const whites = [...value.matchAll(WHITE_RGBA)];
      if (whites.some((m) => Number(m[1]) > WHITE_ALPHA_LIMIT)) {
        violations.push(`${file}:${line} ${selector} → 白透面填充超过 ${WHITE_ALPHA_LIMIT}：${value}`);
      }

      const blacks = [...value.matchAll(BLACK_RGBA)];
      if (blacks.some((m) => Number(m[1]) >= BLACK_ALPHA_LIMIT)) {
        violations.push(`${file}:${line} ${selector} → 黑实面填充达纯黑：${value}`);
      }

      if (PURE_HEX.test(value)) {
        violations.push(`${file}:${line} ${selector} → background 使用纯黑/纯白 hex：${value}`);
      }
    }
  }

  return violations;
}

/** 取某选择器的规则体（用于结构类断言，如触摸目标） */
function ruleBody(selector: string): string | undefined {
  for (const css of Object.values(CSS_FILES)) {
    const text = stripComments(css);
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?:^|[^{}])(${escaped})\\s*\\{([^{}]*)\\}`, 'g');
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      if (match[1]!.trim() === selector) return match[2];
    }
  }
  return undefined;
}

/** 取规则体内的 transition 声明（多行折行合并为单行） */
function transitionDecl(body: string): string | undefined {
  const stmt = body.split(';').find((s) => /^\s*transition\s*:/i.test(s));
  return stmt?.replace(/\s+/g, ' ').trim();
}

describe('CSS 面填充守卫（防纯白/纯黑实底回流，DESIGN.md §1.2）', () => {
  it('扫描范围有效（应覆盖 styles 下全部 CSS）', () => {
    const files = Object.keys(CSS_FILES);
    expect(files.length).toBeGreaterThanOrEqual(1);
    expect(files).toContain('globals.css');
    expect(CSS_FILES['globals.css']!.split('\n').length).toBeGreaterThan(2000);
  });

  it('background 声明不得出现超过 §5.21 授权档的白透面填充', () => {
    expect(findViolations()).toEqual([]);
  });

  it('豁免白名单与契约依据成对登记（只删不加）', () => {
    for (const exempt of EXEMPT_FILLS) {
      expect(exempt.reason, `豁免项 ${exempt.selector} 缺少 DESIGN.md 依据`).toMatch(/§/);
      expect(ruleBody(exempt.selector), `豁免项 ${exempt.selector} 已不存在，应从白名单删除`).toBeDefined();
    }
  });

  it('help 段可点击元素保持 44px 触摸目标（§6.3 / §13.7.4）', () => {
    for (const selector of ['.help-hero-cta', '.house-rules-item', '.faq-item-button', '.quick-path-node']) {
      const body = ruleBody(selector);
      expect(body, `${selector} 规则缺失`).toBeDefined();
      expect(body, `${selector} 应有 min-height: 44px`).toMatch(/min-height:\s*44px/);
    }
  });

  it('help 段 transition 一律引用动效 token（§8.4 不写裸数字）', () => {
    const BARE_MOTION = /\b\d+(?:\.\d+)?m?s\b|cubic-bezier|\b(?:ease|ease-in|ease-out|ease-in-out|linear)\b/;
    for (const selector of [
      '.help-hero-cta',
      '.house-rules-card',
      '.house-rules-item',
      '.quick-path-node-num',
      '.concept-card',
      '.faq-item',
      '.faq-item-chevron',
    ]) {
      const body = ruleBody(selector);
      expect(body, `${selector} 规则缺失`).toBeDefined();
      const decl = transitionDecl(body!);
      expect(decl, `${selector} 缺少 transition 声明`).toBeDefined();
      // 先摘掉 token 引用，避免 --poker-ease-standard 里的 ease 被裸值正则误报
      const residue = decl!.replace(/var\(--poker-(?:duration|ease)-[a-z]+\)/g, '');
      expect(residue, `${selector} 的 transition 残留裸值：${residue}`).not.toMatch(BARE_MOTION);
      expect(decl, `${selector} 的 transition 应引用 var(--poker-duration-*)`).toMatch(/var\(--poker-duration-/);
    }
  });
});
