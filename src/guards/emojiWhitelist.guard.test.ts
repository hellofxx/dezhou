import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * UI emoji 白名单守卫
 *
 * 交互 UI 一律用 Lucide 图标（DESIGN.md §图标语言），emoji 只保留在「庆祝 / 徽章 / 段位」
 * 这类插画场景：emoji 由各平台 emoji 字体渲染，尺寸、颜色、基线都不受控，散落到按钮、
 * 表格、标签里就会破掉牌室质感。数据层同理 —— `shared/types` 与 `shared/data` 不存 emoji 字形。
 *
 * 断言口径：
 * - 扫描 src/shared/components 全域，以及 src/features 下各级 components 目录（均为非测试 .ts(x)），
 *   以及 shared/types 的 elo / mentor / opponent / decisionFeedback 与 shared/data/opponentProfiles
 * - 判定字符集为 /\p{Extended_Pictographic}/u，命中文件集合必须与 ILLUSTRATION_ALLOWLIST 完全一致
 * - TYPOGRAPHIC_GLYPHS 登记「属于该字符集但不是插画 emoji」的排版 / 领域字形
 *   （花色与状态记号：默认文本呈现，非彩色 emoji 字体渲染），口径只减不加
 * - 扫描面 ≥ 150 文件自检；白名单外的命中直接打印 file:line → 字符
 */

const SRC_DIR = fileURLToPath(new URL('../', import.meta.url));

/** 逐字符判定用：非 global，避免 lastIndex 状态在多次 test 之间串味 */
const EMOJI_CHAR = /\p{Extended_Pictographic}/u;
/** 逐行收集用：global，供 matchAll 使用 */
const EMOJI_PATTERN = /\p{Extended_Pictographic}/gu;

/** 扫描面下限（棘轮）：实际约 210 个文件 */
const MIN_SCANNED_FILES = 150;

/** 额外点名扫描的 shared 数据 / 类型文件（相对 src/） */
const EXTRA_TARGETS = [
  'shared/types/decisionFeedback.ts',
  'shared/types/elo.ts',
  'shared/types/mentor.ts',
  'shared/types/opponent.ts',
  'shared/data/opponentProfiles.ts',
];

/**
 * 插画 emoji 白名单（相对 src/ 的 posix 路径）—— 庆祝 / 徽章 / 段位插画。
 * 口径：只减不加。新增条目必须先在 DESIGN.md 登记「插画场景」依据。
 */
const ILLUSTRATION_ALLOWLIST = [
  'features/onboarding/components/CelebrationStep.tsx',
  'features/progress/components/achievement/AchievementBadges.tsx',
  'features/progress/components/achievement/AchievementWall.tsx',
  'features/progress/components/celebration/RankUpCelebration.tsx',
  'features/progress/components/streak/StreakCelebration.tsx',
  'features/progress/components/streak/shareCard.ts',
  'shared/types/elo.ts',
].sort();

/**
 * 排版 / 领域字形豁免：均属 Extended_Pictographic，但默认文本呈现（Emoji_Presentation=No），
 * 在本项目里是扑克花色与状态记号，不是插画 emoji。口径只减不加。
 */
const TYPOGRAPHIC_GLYPHS = ['♠', '♥', '♦', '♣', 'ℹ', '⚠', '⏱'];

/**
 * 内容/文案层的排版记号豁免：↔ 是箭头字形（Extended_Pictographic），
 * 不是插画 emoji；只用于正文与 i18n 文案，不进交互 UI。
 */
const CONTENT_TYPOGRAPHIC_GLYPHS = ['↔'];

/** 内容白名单（DESIGN.md §7）：成就数据、策略/理论正文数据、i18n 既有文案 */
const CONTENT_ALLOWED_PREFIXES = [
  'features/progress/data/achievements.ts',
  'features/strategy-academy/data/',
  'features/theory-academy/data/',
  'i18n/locales/',
];

/** 内容扫描面下限（棘轮）：实际约 180 个 .ts/.tsx/.json 文件 */
const MIN_CONTENT_SCANNED_FILES = 100;

interface ScannedFile {
  /** 相对 src/ 的 posix 路径 */
  relativePath: string;
  content: string;
}

interface EmojiHit {
  line: number;
  chars: string[];
}

function toPosix(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

/** 递归收集非测试源文件（跳过 node_modules 等非源码目录） */
function walk(dirPath: string, collected: string[] = []): string[] {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git'].includes(entry.name)) continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, collected);
    } else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
      collected.push(fullPath);
    }
  }
  return collected;
}

/** 扫描面：shared/components 全域 + features 下的 components 目录 + 点名的 shared 文件 */
function scanTargets(): string[] {
  const sharedComponents = walk(path.join(SRC_DIR, 'shared', 'components'));
  const featureComponents = walk(path.join(SRC_DIR, 'features')).filter((file) =>
    toPosix(file).includes('/components/'),
  );
  const extras = EXTRA_TARGETS.map((relativePath) => path.join(SRC_DIR, relativePath)).filter(
    (absolutePath) => fs.existsSync(absolutePath),
  );
  return [...new Set([...sharedComponents, ...featureComponents, ...extras])].sort();
}

const SCANNED_FILES: ScannedFile[] = scanTargets().map((absolutePath) => ({
  relativePath: toPosix(path.relative(SRC_DIR, absolutePath)),
  content: fs.readFileSync(absolutePath, 'utf8'),
}));

/** 去掉登记字形后剩下的才是违规 emoji */
function emojiInLine(line: string): string[] {
  const stripped = TYPOGRAPHIC_GLYPHS.reduce((acc, glyph) => acc.replaceAll(glyph, ''), line);
  return [...stripped.matchAll(EMOJI_PATTERN)].map((match) => match[0]);
}

const HITS = new Map<string, EmojiHit[]>();
for (const file of SCANNED_FILES) {
  file.content.split(/\r?\n/).forEach((line, index) => {
    const chars = emojiInLine(line);
    if (chars.length === 0) return;
    const existing = HITS.get(file.relativePath) ?? [];
    existing.push({ line: index + 1, chars });
    HITS.set(file.relativePath, existing);
  });
}

const HIT_FILES = [...HITS.keys()].sort();

/** 递归收集内容层文件（.ts/.tsx/.json，跳过测试） */
function walkContent(dirPath: string, collected: string[] = []): string[] {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git'].includes(entry.name)) continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkContent(fullPath, collected);
    } else if (/\.(ts|tsx|json)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
      collected.push(fullPath);
    }
  }
  return collected;
}

/** 内容层扫描面：features 下 data 目录 + shared/data + i18n */
function scanContentTargets(): string[] {
  const featureData = walkContent(path.join(SRC_DIR, 'features')).filter((file) =>
    toPosix(file).includes('/data/'),
  );
  const sharedData = walkContent(path.join(SRC_DIR, 'shared', 'data'));
  const i18n = walkContent(path.join(SRC_DIR, 'i18n'));
  return [...new Set([...featureData, ...sharedData, ...i18n])].sort();
}

const CONTENT_SCANNED_FILES: ScannedFile[] = scanContentTargets().map((absolutePath) => ({
  relativePath: toPosix(path.relative(SRC_DIR, absolutePath)),
  content: fs.readFileSync(absolutePath, 'utf8'),
}));

/** 去掉排版类豁免后剩下的才是需要白名单覆盖的内容 emoji */
function contentEmojiInLine(line: string): string[] {
  const stripped = CONTENT_TYPOGRAPHIC_GLYPHS.reduce(
    (acc, glyph) => acc.replaceAll(glyph, ''),
    line,
  );
  return emojiInLine(stripped);
}

const CONTENT_HITS = new Map<string, EmojiHit[]>();
for (const file of CONTENT_SCANNED_FILES) {
  file.content.split(/\r?\n/).forEach((line, index) => {
    const chars = contentEmojiInLine(line);
    if (chars.length === 0) return;
    const existing = CONTENT_HITS.get(file.relativePath) ?? [];
    existing.push({ line: index + 1, chars });
    CONTENT_HITS.set(file.relativePath, existing);
  });
}

const CONTENT_HIT_FILES = [...CONTENT_HITS.keys()].sort();

/** 登记字形的实际出现次数：为 0 说明条目已失效，必须删除 */
function registeredGlyphUsage(): Map<string, number> {
  const usage = new Map<string, number>();
  for (const file of SCANNED_FILES) {
    for (const glyph of TYPOGRAPHIC_GLYPHS) {
      const count = file.content.split(glyph).length - 1;
      if (count > 0) usage.set(glyph, (usage.get(glyph) ?? 0) + count);
    }
  }
  return usage;
}

describe('UI emoji 白名单守卫', () => {
  it('扫描自检：文件数量与字符集判定均有效', () => {
    expect(
      SCANNED_FILES.length,
      '扫描面文件数偏低，目录解析可能失效',
    ).toBeGreaterThanOrEqual(MIN_SCANNED_FILES);
    // 字符集判定自检：正则失效（例如运行环境不支持 Unicode 属性转义）会退化为零命中
    expect(EMOJI_CHAR.test('🎉'), 'Extended_Pictographic 判定失效').toBe(true);
    expect(EMOJI_CHAR.test('A'), 'Extended_Pictographic 误判普通字母').toBe(false);
    expect(EMOJI_CHAR.test('♠'), '花色字形应属 Extended_Pictographic（靠豁免表排除）').toBe(true);
  });

  it('豁免表自检：条目均为待豁免字形且仍在使用（只减不加）', () => {
    expect(new Set(TYPOGRAPHIC_GLYPHS).size, '豁免表存在重复字形').toBe(
      TYPOGRAPHIC_GLYPHS.length,
    );
    const usage = registeredGlyphUsage();
    for (const glyph of TYPOGRAPHIC_GLYPHS) {
      expect(
        EMOJI_CHAR.test(glyph),
        `豁免表条目「${glyph}」不属于 Extended_Pictographic，无需登记`,
      ).toBe(true);
      expect(
        usage.get(glyph) ?? 0,
        `豁免表条目「${glyph}」在扫描面中已不再出现，请删除该条目`,
      ).toBeGreaterThan(0);
    }
  });

  it('白名单外不得出现 emoji（file:line → 字符）', () => {
    const violations = HIT_FILES.filter((file) => !ILLUSTRATION_ALLOWLIST.includes(file)).flatMap(
      (file) =>
        (HITS.get(file) ?? []).map((hit) => `${file}:${hit.line} → ${hit.chars.join(' ')}`),
    );
    expect(
      violations,
      '交互 UI 请改用 Lucide 图标；确属庆祝 / 徽章插画须在 ILLUSTRATION_ALLOWLIST 与 DESIGN.md 登记',
    ).toEqual([]);
  });

  it('失效条目：白名单文件必须仍然含有插画 emoji（只减不加）', () => {
    const stale = ILLUSTRATION_ALLOWLIST.filter((file) => !HIT_FILES.includes(file));
    expect(stale, '以下文件已无 emoji，请从 ILLUSTRATION_ALLOWLIST 删除对应条目').toEqual([]);
  });

  it('含 emoji 的文件集合与插画白名单完全一致', () => {
    expect(HIT_FILES).toEqual(ILLUSTRATION_ALLOWLIST);
  });

  it('内容扫描自检：文件数量与排版豁免均有效', () => {
    expect(
      CONTENT_SCANNED_FILES.length,
      '内容扫描面文件数偏低，目录解析可能失效',
    ).toBeGreaterThanOrEqual(MIN_CONTENT_SCANNED_FILES);
    expect(CONTENT_TYPOGRAPHIC_GLYPHS).toEqual(['↔']);
    const arrowUsage = CONTENT_SCANNED_FILES.reduce(
      (sum, file) => sum + file.content.split('↔').length - 1,
      0,
    );
    expect(arrowUsage, '↔ 已不再出现在内容层，请删除豁免').toBeGreaterThan(0);
  });

  it('内容/文案白名单外不得出现 emoji（file:line → 字符）', () => {
    const violations = CONTENT_HIT_FILES.filter(
      (file) => !CONTENT_ALLOWED_PREFIXES.some((prefix) => file.startsWith(prefix)),
    ).flatMap((file) =>
      (CONTENT_HITS.get(file) ?? []).map(
        (hit) => `${file}:${hit.line} → ${hit.chars.join(' ')}`,
      ),
    );
    expect(
      violations,
      '内容 emoji 只允许出现在 DESIGN.md §7 白名单：成就数据 / 策略与理论正文 / i18n 既有文案',
    ).toEqual([]);
  });

  it('puzzleBank 在剔除花色与排版记号后不得残留 emoji', () => {
    expect(CONTENT_HITS.get('features/puzzle-trainer/data/puzzleBank.ts')).toBeUndefined();
  });
});