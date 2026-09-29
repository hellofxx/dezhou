import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Heads-up 位置方向守卫（零容忍）。
 *
 * 防的缺陷：单挑翻前/翻后的「谁先行动 / 谁有位置」被写反。该错误曾同时存在于两学院
 * 正文（152 处），且**互有正反**——同一变体里既有正确段落也有错误段落，读者看到的是自相矛盾。
 *
 * 判据单源：`theory-academy/data/levels/variants/variantRules.ts` 的 headsUpRules——
 * SB 即按钮位；翻前 SB 先行动、BB 最后行动；翻后 BB 先行动、SB 最后行动（SB=IP，BB=OOP）。
 *
 * 扫描面选取：4 份 HU locale（zh 侧由 contentAlignment 与数据层逐字镜像锁定，故覆盖数据层）
 * + 单源文件本身。**排除选择题的 options**——干扰项按设计就是错误陈述，守卫会把它当违规。
 *
 * 子句级判定而非全文正则：跨子句匹配会把「翻前 SB 先行动、BB 最后行动」这类正确句误判为违规，
 * 因此先按标点切子句，取「盲注主语 + 街道 + 方向谓语」三元组再判。子句无街道标记时继承段落，
 * 段落同时含翻前与翻后标记则不可判（返回 null，不产生假绿）。
 */

const HU_KEYS = [
  { file: 'i18n/locales/zh/theory.json', huOnly: true },
  { file: 'i18n/locales/en/theory.json', huOnly: true },
  { file: 'i18n/locales/zh/academy-course/heads-up.json', huOnly: false },
  { file: 'i18n/locales/en/academy-course/heads-up.json', huOnly: false },
] as const;

/** 干扰项容器：locale 里以 `.options` 结尾的层级（含 `options.0` 与数组式 `options`） */
const IS_OPTION_FIELD = /(?:^|\.)options(?:\.\d+)?$/;
/** theory.json 里的单挑键：章节/课时 id 形如 t<n>hu-... 或 l<n>hu-... */
const HU_KEY = /(?:^|\.)(?:t|l)\dhu-/;

const DELIM = /[。；，、：！？\n()（）\[\]【】"'“”‘’]/;
const FIRST = /先行动|先说话|先下注|先手|第一个|率先|acts? first|to act first|first to act/i;
const LAST = /最后行动|后行动|最后说话|最后下手|最后|acts? last|to act last|last to act/i;
const OOP = /OOP|Out-of-Position|Out of Position|无位置|位置劣势|劣势方|位置不好|不在位置/i;
const IP = /(?<![\w])IP(?![\w])|In-Position|In Position|有位置|位置优势|优势方/i;
const BUTTON = /按钮|BTN|button|dealer/i;
const PREFLOP = /翻前|pre-?flop|preflop/i;
const POSTFLOP = /翻后|翻牌后|翻牌圈|post-?flop|flop|turn|river|转牌|河牌/i;
/**
 * 显式满员桌对比句豁免：单挑课文里「与满员桌不同」是常用教学手法，而满员桌的 SB 确实翻后先行动、
 * 确实 OOP。仅当**子句自身**点名满员桌时豁免（跨子句不豁免），避免把单挑正文也豁免掉。
 */
const FULL_RING_SCOPE = /满员桌|六人桌|九人桌|6-?max|9-?max|full[- ]?ring/i;

/** 返回违规理由数组；空数组 = 该子句合规；null = 不可判（双盲同现或无盲主语） */
function inverted(clause: string, paragraph: string): string[] | null {
  const sb = /\bSB\b/.test(clause);
  const bb = /\bBB\b/.test(clause);
  if (sb === bb) return null; // 双盲同现时子句内不可判；都不含则与本守卫无关

  const clausePre = PREFLOP.test(clause);
  const clausePost = POSTFLOP.test(clause);
  const ctxPre = PREFLOP.test(paragraph);
  const ctxPost = POSTFLOP.test(paragraph);
  let pre: boolean;
  let post: boolean;
  if (clausePre || clausePost) {
    pre = clausePre;
    post = clausePost;
  } else if (ctxPre && ctxPost) {
    pre = false;
    post = false; // 段落两街都提，子句无标记 → 不可判
  } else {
    pre = ctxPre;
    post = ctxPost;
  }

  const first = FIRST.test(clause);
  const last = LAST.test(clause);
  const v: string[] = [];
  if (sb) {
    if (FULL_RING_SCOPE.test(clause)) return null; // 子句点名满员桌 → 该陈述谈的不是单挑
    if (OOP.test(clause)) v.push('SB 被标为 OOP（单挑 SB 是按钮位 = IP）');
    if (post && first) v.push('SB 被写为翻后先行动（翻后先行动的是 BB）');
    if (pre && !post && last) v.push('SB 被写为翻前最后行动（翻前最后行动的是 BB）');
  } else {
    if (IP.test(clause)) v.push('BB 被标为 IP（单挑 BB 翻后先行动 = OOP）');
    if (post && last) v.push('BB 被写为翻后最后行动（翻后最后行动的是 SB）');
    if (pre && !post && first) v.push('BB 被写为翻前先行动（翻前先行动的是 SB）');
    if (BUTTON.test(clause)) v.push('BB 被写成按钮位（单挑按钮位 = SB）');
  }
  return v;
}

function flatten(obj: unknown, prefix = '', acc: Record<string, string> = {}): Record<string, string> {
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') acc[path] = v;
    else if (Array.isArray(v)) {
      v.forEach((it, i) => {
        if (typeof it === 'string') acc[`${path}.${i}`] = it;
        else if (it) flatten(it, `${path}.${i}`, acc);
      });
    } else if (v && typeof v === 'object') flatten(v, path, acc);
  }
  return acc;
}

function violationsOf(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.split(DELIM)) {
    const clause = raw.trim();
    if (clause.length < 4) continue;
    const v = inverted(clause, text);
    if (v && v.length) out.push(`${v.join(' + ')}\n        ▸ ${clause.slice(0, 120)}`);
  }
  return out;
}

describe('heads-up 翻前/翻后位置方向守卫（PRD §6.7.1 呈现诚实性）', () => {
  it('判定器自检：已知倒置必判红、已知正确句必判绿', () => {
    // 正样本锁判定器强度：任一倒置句被后续改动放过，此用例先红，避免全量用例空洞通过
    const BAD = [
      '翻后 BB 最后行动',
      'BB 是有位置方',
      'SB 是翻后位置劣势方',
      '单挑 SB 翻前最后行动',
      'BB 每手都是 BTN',
      'the BB acts last postflop',
      'the SB is out of position',
    ];
    for (const s of BAD) expect(violationsOf(s), `应判红却放过：${s}`).not.toEqual([]);

    const GOOD = [
      '翻前 SB 先行动、BB 最后行动',
      '翻后 BB 先行动，SB（按钮位）最后行动并持有位置优势',
      'SB 是 IP，BB 是 OOP',
      'BB 翻前最后行动，但翻后最先表态',
      'the SB closes every postflop street',
      '满员桌的 SB 翻后先行动，这里说的是 6-max 而非单挑',
    ];
    for (const s of GOOD) expect(violationsOf(s), `误伤正确句：${s}`).toEqual([]);
  });

  it('四份 HU locale 的可判字段中不存在位置归属倒置', () => {
    let scanned = 0;
    const found: string[] = [];
    for (const spec of HU_KEYS) {
      const json = JSON.parse(readFileSync(fileURLToPath(new URL(`../src/${spec.file}`, import.meta.url)), 'utf8'));
      const leaves = flatten(json);
      for (const [key, text] of Object.entries(leaves)) {
        if (spec.huOnly && !HU_KEY.test(key)) continue;
        if (IS_OPTION_FIELD.test(key)) continue; // 干扰项按设计可以是假命题
        scanned += 1;
        for (const v of violationsOf(text)) found.push(`${spec.file} @${key}\n      ${v}`);
      }
    }
    // 扫描面自检：locale 路径解析失效时不得空洞通过（教训见 CHANGELOG 2026-09-25 守卫路径修复）
    expect(scanned, 'HU locale 字符串扫描数异常偏低，疑似路径或键过滤器失效').toBeGreaterThan(700);
    expect(found, `发现 ${found.length} 处位置归属倒置：\n    ${found.slice(0, 12).join('\n    ')}`).toEqual([]);
  });

  it('variantRules 单源自身保持正确方向（SB=按钮、翻后 BB 先行动）', () => {
    const src = readFileSync(
      fileURLToPath(new URL('../src/features/theory-academy/data/levels/variants/variantRules.ts', import.meta.url)),
      'utf8',
    );
    // 只取 headsUpRules 区块（含其上方 JSDoc）：标准/短牌区描述的是满员桌位置，
    // 那里「SB 翻后先行动」是正确的，用单挑判据扫会误伤。
    const decl = src.indexOf('export const headsUpRules');
    const nextExport = src.indexOf('export const', decl + 1);
    const hu = src.slice(src.lastIndexOf('/**', decl), nextExport === -1 ? src.length : nextExport);
    expect(hu).toMatch(/SB\s*(即|就是)按钮/);
    expect(hu).toMatch(/翻后\s*BB\s*先行动/);
    expect(hu).toMatch(/sbFirstActionPreflop:\s*true/);
    expect(hu).toMatch(/bbFirstActionPostflop:\s*true/);
    for (const line of hu.split('\n')) {
      for (const raw of line.split(DELIM)) {
        const clause = raw.trim();
        if (clause.length < 4) continue;
        const v = inverted(clause, line);
        expect(v ?? [], `单源出现倒置：${v?.join(' + ')} ▸ ${clause}`).toEqual([]);
      }
    }
  });
});
