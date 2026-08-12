// 一次性补漏脚本：读取 .codebuddy-gap.json（缺失 key + zh 原文 + 归属信息），
// 按 zh→en 词典翻译，并把缺失 key 注入到正确文件的正确 section 对象。
// 用法：node scripts/i18n-gap-inject.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const gapPath = join(root, '.codebuddy-gap.json');
const gap = JSON.parse(readFileSync(gapPath, 'utf8'));

// zh 原文 → en 翻译词典（覆盖 gap 中全部唯一 zh 值）
const dict = {
  '为什么位置如此重要？': 'Why Does Position Matter So Much?',
  '位置分类': 'Position Categories',
  '位置优势的体现': 'How Positional Advantage Shows Up',
  '什么是 3-Bet？': 'What Is a 3-Bet?',
  '3-Bet 的目的': 'The Purpose of a 3-Bet',
  '什么是 C-Bet？': 'What Is a C-Bet?',
  'C-Bet 大小': 'C-Bet Sizing',
  '常见听牌类型': 'Common Draw Types',
  '听牌打法': 'Playing Draws',
  '标准100BB现金桌，对手翻前跟注你的BTN open': 'Standard 100BB cash game; the opponent called your BTN open preflop',
  'BTN是一个LAG玩家，翻前用很宽的范围跟注': 'The BTN is a LAG player who called with a very wide range preflop',
  'CO是一个NIT，面对加注弃牌率很高(70%)': 'The CO is a NIT with a very high fold-to-raise rate (70%)',
  '标准100BB现金桌，3-Bet底池SPR约4.3': 'Standard 100BB cash game; 3Bet pot with SPR around 4.3',
  '标准100BB现金桌，3-Bet底池SPR约4.1': 'Standard 100BB cash game; 3Bet pot with SPR around 4.1',
  '3-Bet底池，Turn牌面T-8-3-2': '3Bet pot; turn board T-8-3-2',
  '该对手过去20手加注了14次，非常激进': 'This opponent raised 14 of the last 20 hands — very aggressive',
  '该Maniac最近3次加注后翻牌全部C-Bet': 'This maniac C-Bet every flop after his last 3 raises',
  'SNG 后期，只剩4人，前3有奖金': 'Late SNG; only 4 left, top 3 get paid',
  '深筹码现金桌，200BB有效': 'Deep-stacked cash game, 200BB effective',
  '标准100BB现金桌，BTN是TAG风格': 'Standard 100BB cash game; the BTN is a TAG',
  '多人limp入池，典型的休闲玩家桌': 'Multiway limping — a typical recreational table',
  '多人激进加注，可能是职业牌手桌': 'Multiway aggressive raising — possibly a pro table',
  '多人被动limp，休闲玩家桌': 'Multiway passive limping — a recreational table',
  '多人limp，休闲玩家桌': 'Multiway limping — a recreational table',
  '线上速度扑克（Zoom）': 'Online fast-fold poker (Zoom)',
  '线下现金桌，对手有明显 Tell': 'Live cash game; the opponent has an obvious tell',
  '线上现金桌，同时打 4 桌': 'Online cash game; playing 4 tables at once',
  '线上现金桌，HUD 显示对手 VPIP 45%，面对 C-Bet 弃牌率 20%': 'Online cash game; the HUD shows VPIP 45% and fold-to-C-Bet 20%',
  '线下现金桌，你建立了紧凶形象': 'Live cash game; you have built a tight-aggressive image',
  '锦标赛泡沫期，还有 2 人淘汰进入奖金圈': 'Tournament bubble; 2 more eliminations until the money',
  '你是中等筹码，CO 是大筹码（覆盖你），还有 2 个短筹码': 'You are a medium stack; the CO is a big stack covering you; 2 short stacks remain',
  '锦标赛泡沫期，你是大筹码': 'Tournament bubble; you are the big stack',
  '你 25BB，SB 8BB，BB 10BB，还有 2 个中等筹码': 'You 25BB; SB 8BB; BB 10BB; 2 medium stacks remain',
  'SNG 泡沫期，还有 1 人淘汰进入奖金圈': 'SNG bubble; 1 more elimination until the money',
  '你 12BB，CO 18BB，还有 2 个 5BB 短筹码': 'You 12BB; CO 18BB; 2 short stacks at 5BB',
  'MTT 泡沫期，你是大筹码': 'MTT bubble; you are the big stack',
  '你 30BB，SB 8BB，BB 10BB': 'You 30BB; SB 8BB; BB 10BB',
  'MTT 中期，距离奖金圈还有 20 人': 'MTT mid-stage; 20 players left until the money',
  '你 20BB，UTG 20BB，桌上有 3 个短筹码': 'You 20BB; UTG 20BB; 3 short stacks at the table',
  'SNG泡沫期': 'SNG bubble',
  '你15BB，CO 20BB，还有2个5BB短筹码': 'You 15BB; CO 20BB; 2 short stacks at 5BB',
  'MTT泡沫期，你非常短': 'MTT bubble; you are very short',
  '你6BB，SB 20BB，BB 25BB': 'You 6BB; SB 20BB; BB 25BB',
  'MTT 中期，距离奖金圈还有 15 人': 'MTT mid-stage; 15 players left until the money',
  '你 10BB，SB 15BB，BB 12BB': 'You 10BB; SB 15BB; BB 12BB',
  'MTT 早期，距离奖金圈还远': 'MTT early stage; far from the money',
  '你 12BB，SB 10BB': 'You 12BB; SB 10BB',
  'MTT 中期，你只有 10BB': 'MTT mid-stage; you only have 10BB',
  '你 10BB，BB 15BB': 'You 10BB; BB 15BB',
  'MTT 泡沫期，还有 3 人进入奖金圈': 'MTT bubble; 3 more players until the money',
  '你 12BB，BTN 10BB，还有 2 个 5BB 短筹码': 'You 12BB; BTN 10BB; 2 short stacks at 5BB',
  'SNG 中期，你只有 8BB': 'SNG mid-stage; you only have 8BB',
  '你 8BB，SB 12BB，BB 10BB': 'You 8BB; SB 12BB; BB 10BB',
  'MTT中期，你12BB': 'MTT mid-stage; you have 12BB',
  'MTT早期，距奖金圈远': 'MTT early stage; far from the money',
  'MTT 泡沫期，还有 2 人进入奖金圈': 'MTT bubble; 2 more players until the money',
  '你 35BB（大筹码），SB 18BB，BB 15BB（中筹码）': 'You 35BB (big stack); SB 18BB; BB 15BB (medium stack)',
  'MTT 泡沫期，你是短筹码': 'MTT bubble; you are the short stack',
  '你 12BB（短筹码），桌上有 3 个大筹码和 2 个中筹码': 'You 12BB (short stack); 3 big stacks and 2 medium stacks at the table',
  'MTT 泡沫期，你是中筹码': 'MTT bubble; you are the medium stack',
  '你 20BB（中筹码），CO 40BB（大筹码），还有 2 个 8BB 短筹码': 'You 20BB (medium); CO 40BB (big stack); 2 short stacks at 8BB',
  '你 45BB（大筹码），SB 18BB，BB 15BB（中筹码）': 'You 45BB (big stack); SB 18BB; BB 15BB (medium stack)',
  '你 10BB（短筹码），BB 25BB（大筹码）': 'You 10BB (short stack); BB 25BB (big stack)',
  'MTT泡沫期，你是短筹码': 'MTT bubble; you are the short stack',
  '你8BB，BTN 30BB，SB 25BB，BB 20BB': 'You 8BB; BTN 30BB; SB 25BB; BB 20BB',
  'MTT泡沫期，你是大筹码': 'MTT bubble; you are the big stack',
  '你30BB（大筹码），SB 15BB，BB 18BB': 'You 30BB (big stack); SB 15BB; BB 18BB',
  'MTT 决赛桌，9 人桌，payout 跳跃大': 'MTT final table; 9-handed with big payout jumps',
  '你 40BB（大筹码），SB 22BB，BB 25BB（中筹码）': 'You 40BB (big stack); SB 22BB; BB 25BB (medium stack)',
  'MTT 决赛桌，BTN 是 LAG 玩家': 'MTT final table; the BTN is a LAG',
  '你 20BB，BTN 30BB': 'You 20BB; BTN 30BB',
  'MTT 决赛桌，你是大筹码': 'MTT final table; you are the big stack',
  '你 35BB（大筹码），SB 18BB，BB 20BB（中筹码）': 'You 35BB (big stack); SB 18BB; BB 20BB (medium stack)',
  'MTT 决赛桌，BTN 偷盲频率高': 'MTT final table; the BTN steals blinds at high frequency',
  '你 18BB，BTN 28BB': 'You 18BB; BTN 28BB',
  'MTT 决赛桌，你是短筹码': 'MTT final table; you are the short stack',
  '你 15BB（短筹码），BB 30BB（大筹码）': 'You 15BB (short stack); BB 30BB (big stack)',
  '决赛桌，你是大筹码': 'Final table; you are the big stack',
  '你25BB，SB 18BB，BB 20BB': 'You 25BB; SB 18BB; BB 20BB',
  '决赛桌，BTN频繁偷盲': 'Final table; the BTN steals blinds frequently',
  '你20BB，BTN 35BB': 'You 20BB; BTN 35BB',
  'PKO锦标赛，CO头上有大赏金': 'PKO tournament; a big bounty on the CO',
  'PKO锦标赛，你头上有大赏金': 'PKO tournament; a big bounty on your head',
  'PKO锦标赛，BTN头上有大赏金': 'PKO tournament; a big bounty on the BTN',
  '深筹码现金桌，250BB 有效': 'Deep-stacked cash game, 250BB effective',
  '深筹码现金桌，240BB 有效': 'Deep-stacked cash game, 240BB effective',
  '4 人底池，UTG/MP/BB 都 call 了': '4-way pot; UTG/MP/BB all called',
  '4 人底池，翻前多人 call': '4-way pot; multiple preflop calls',
  'UTG Straddle 2BB，100BB 买入': 'UTG straddle 2BB; 100BB buy-in',
  '桌上有2个明显弱玩家（高VPIP）': 'Two clearly weak players at the table (high VPIP)',
  '刚入座，观察到桌上有一个喝酒的玩家': 'Just sat down; noticed a drinking player at the table',
  '桌上有多个REG，频繁3-Bet': 'Multiple REGs at the table who 3Bet frequently',
  '弱玩家在你右边': 'The weak player is to your right',
  'Players/Flop% = 45%，有明显弱玩家': 'Players/Flop% = 45% with clearly weak players',
  'NL5，对手们跟注太多': 'NL5; opponents call too much',
  'NL5，对手fold to cbet 30%': 'NL5; opponents fold to cbet 30%',
  'NL5，盲注位玩家过度defend': 'NL5; blind players over-defend',
  'NL10，对手们打得紧被动': 'NL10; opponents play tight and passive',
  'NL25，对手翻后过度fold': 'NL25; opponents over-fold postflop',
  'NL50，Pool平均fold to 3-bet 70%': 'NL50; pool averages fold-to-3bet 70%',
  'NL25，Pool WTSD% = 30%（较高）': 'NL25; pool WTSD% = 30% (high)',
  'NL100，Pool平均VPIP 22%, PFR 18%': 'NL100; pool averages VPIP 22%, PFR 18%',
  'NL5，Pool平均fold to cbet 65%': 'NL5; pool averages fold-to-cbet 65%',
  '从NL10升级到NL25': 'Moving up from NL10 to NL25',
  'SB是Nit（VPIP 10%）': 'The SB is a Nit (VPIP 10%)',
  'BTN是Calling Station（VPIP 60%）': 'The BTN is a Calling Station (VPIP 60%)',
  'CO是Maniac（VPIP 70%, PFR 50%）': 'The CO is a Maniac (VPIP 70%, PFR 50%)',
  'UTG是Nit（VPIP 8%）': 'The UTG is a Nit (VPIP 8%)',
  '对手是未知玩家': 'The opponent is an unknown player',
  '短牌现金桌': 'Short-deck cash game',
  '短牌现金桌，湿滑连接面': 'Short-deck cash game; wet connected board',
  '短牌现金桌，湿润连接面': 'Short-deck cash game; wet connected board',
  '短牌现金桌，干燥高牌面': 'Short-deck cash game; dry high board',
  '短牌现金桌，两张方块': 'Short-deck cash game; two diamonds',
  '短牌现金桌，BTN 面对 3-Bet 弃牌率高': 'Short-deck cash game; the BTN has a high fold-to-3Bet rate',
  '短牌现金桌，三张红桃': 'Short-deck cash game; three hearts',
  '短牌现金桌，3-Bet 底池': 'Short-deck cash game; 3Bet pot',
  '短牌现金桌，极湿连接面': 'Short-deck cash game; ultra-wet connected board',
  '短牌现金桌，已输 30 买入接近波动预算': 'Short-deck cash game; down 30 buy-ins, near the variance budget',
  '短牌现金桌，连输后情绪不稳': 'Short-deck cash game; emotionally unstable after losses',
  '短牌现金桌，已输 45BB 接近止损点': 'Short-deck cash game; down 45BB, near the stop-loss point',
  '短牌 MTT，短筹码 15 ante': 'Short-deck MTT; short stack 15 ante',
  '短牌 MTT，中筹码 45 ante': 'Short-deck MTT; medium stack 45 ante',
  '短牌 MTT，泡沫期，筹码健康': 'Short-deck MTT; bubble with a healthy stack',
  '短牌 MTT，钱圈边缘，中筹码': 'Short-deck MTT; money-bubble edge with a medium stack',
  '短牌 MTT 决赛桌剩 3 人，深筹码，两短筹码': 'Short-deck MTT final table, 3 left; deep stack vs two short stacks',
  '短牌深筹码现金桌': 'Short-deck deep-stacked cash game',
  '短牌深筹码现金桌，成坚果同花听牌': 'Short-deck deep-stacked cash game; making a nut-flush draw',
  '短牌深筹码现金桌，湿润连接面': 'Short-deck deep-stacked cash game; wet connected board',
  '短牌浅筹码': 'Short-deck shallow stacks',
  '短牌浅筹码，BB 面对全下弃牌率高': 'Short-deck shallow stacks; the BB has a high fold-to-shove rate',
  '短牌现金桌，BB 追听过松': 'Short-deck cash game; the BB chases draws too loosely',
  '短牌现金桌，BB 低估同花价值': 'Short-deck cash game; the BB underrates flush value',
  '短牌现金桌，BTN 面对 x/r 弃牌率高': 'Short-deck cash game; the BTN has a high fold-to-x/r rate',
  '短牌现金桌，BB 已 tilt': 'Short-deck cash game; the BB is tilting',
  '短牌现金桌，BB 短筹码 25 ante': 'Short-deck cash game; the BB is a short stack at 25 ante',
  '短牌现金桌，BTN 开始频繁 3-Bet 反制你的偷盲': 'Short-deck cash game; the BTN started 3Betting frequently to counter your steals',
  'HU 现金桌': 'Heads-up cash game',
  'HU 现金桌，湿润连接面': 'Heads-up cash game; wet connected board',
  'HU 现金桌，3-Bet 底池': 'Heads-up cash game; 3Bet pot',
  'HU 现金桌，BB 面对 min-raise 弃牌 55%': 'Heads-up cash game; the BB folds to min-raise 55%',
  'HU 现金桌，BB 3-Bet 频率 20%': 'Heads-up cash game; the BB 3Bets 20%',
  'HU 现金桌，BB 面对 min-raise 弃牌 65%': 'Heads-up cash game; the BB folds to min-raise 65%',
  'HU 现金桌，BB 面对 C-Bet 弃牌 60%': 'Heads-up cash game; the BB folds to C-Bet 60%',
  'HU 现金桌，SB 面对 x/r 弃牌 55%': 'Heads-up cash game; the SB folds to x/r 55%',
  'HU 现金桌，SB 面对 x/r 弃牌 60%': 'Heads-up cash game; the SB folds to x/r 60%',
  'HU 现金桌，已打 2 小时疲劳状态': 'Heads-up cash game; 2 hours in, fatigued',
  'HU 现金桌，SB 面对 x/r 弃牌率高': 'Heads-up cash game; the SB has a high fold-to-x/r rate',
  'HU 现金桌，SB 下注节奏反常': 'Heads-up cash game; the SB\'s bet rhythm is abnormal',
  '单挑 SNG 决赛桌，浅筹码 15BB': 'HU SNG final table; short stack 15BB',
  '单挑 SNG 决赛桌，浅筹码 12BB，盲注即将上涨': 'HU SNG final table; short stack 12BB, blinds about to rise',
  '单挑 MTT 决赛，深筹码 45BB，对手 nit': 'HU MTT final; deep stack 45BB vs a nit',
  'HU 现金桌，对手是紧弱型': 'Heads-up cash game; the opponent is tight-passive',
  'HU 现金桌，SB 面对 3-Bet 弃牌 40%（偏离）': 'Heads-up cash game; the SB folds to 3Bet 40% (deviation)',
};

// 归属修正：l3sd/l4sd/... → short-deck.json；l3hu/l4hu/... → heads-up.json
function resolveFile(file, fullKey) {
  if (/^academy\.unitTitle\./.test(fullKey)) {
    const lessonId = fullKey.split('.')[2];
    if (/^l\d+sd-/.test(lessonId)) return 'short-deck.json';
    if (/^l\d+hu-/.test(lessonId)) return 'heads-up.json';
    const m = /^l(\d+)/.exec(lessonId);
    if (m) return `level${m[1]}.json`;
  }
  const m = /^academy\.(lessonExample|lessonPractice)\.(l\d+(?:sd|hu)?-[^.]+)\./.exec(fullKey);
  if (m) {
    const lessonId = m[2];
    if (/^l\d+sd-/.test(lessonId)) return 'short-deck.json';
    if (/^l\d+hu-/.test(lessonId)) return 'heads-up.json';
    const lm = /^l(\d+)/.exec(lessonId);
    if (lm) return `level${lm[1]}.json`;
  }
  return file;
}

// 解析 key → { section, subId, field }（subId 为空表示 section 是 unitTitle，直接用 lessonId+unitId 两级）
function parseKey(fullKey) {
  const parts = fullKey.split('.');
  // academy.unitTitle.<lessonId>.<unitId>
  if (parts[1] === 'unitTitle') return { section: 'unitTitle', subId: parts[2], field: parts[3] };
  // academy.lessonExample.<exId>.<field> / academy.lessonPractice.<qId>.<field>
  if (parts[1] === 'lessonExample' || parts[1] === 'lessonPractice') {
    return { section: parts[1], subId: parts[2], field: parts[3] };
  }
  throw new Error(`Unexpected key: ${fullKey}`);
}

function stripPrefix(fullKey) {
  return fullKey.replace(/^academy\./, '');
}

// 按文件分组缺失项
const byFile = new Map();
for (const [fullKey, info] of Object.entries(gap)) {
  const file = resolveFile(info.file, fullKey);
  if (!byFile.has(file)) byFile.set(file, []);
  byFile.get(file).push({ fullKey, ...info, file });
}

for (const [file, items] of byFile) {
  for (const lang of ['zh', 'en']) {
    const target = join(root, 'src/i18n/locales', lang, 'academy-course', file);
    let json = JSON.parse(readFileSync(target, 'utf8'));
    let changed = 0;
    for (const item of items) {
      const { section, subId, field } = parseKey(item.fullKey);
      const value = lang === 'zh' ? item.zh : dict[item.zh];
      if (value === undefined) throw new Error(`Missing en dict for: ${item.zh}`);
      const outer = (json[section] ??= {});
      const inner = (outer[subId] ??= {});
      if (inner[field] === undefined) {
        inner[field] = value;
        changed++;
      }
    }
    if (changed > 0) {
      writeFileSync(target, JSON.stringify(json, null, 2) + '\n', 'utf8');
      console.log(`${lang}/${file}: +${changed} keys`);
    }
  }
}
console.log('done');
