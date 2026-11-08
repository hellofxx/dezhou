import {
  BarChart,
  Callout,
  ChartComparisonGrid,
  ChartContainer,
  H1,
  LineChart,
  MetricsGrid,
  PieChart,
  ReportSection,
  ReportShell,
  Stack,
  Table,
  Text,
  type MetricItem,
} from "qoder/canvas";

// —— 报告数据契约（由 scripts/lib/breakdown.mjs 产出，plugin 注入）——
interface CatRow {
  key: string;
  label: string;
  tokens: number;
  share: number;
}
interface ToolRow {
  tool: string;
  tokens: number;
  calls: number;
  /** 平均每次调用带来的重发 token；无调用记录时 null（不给 0） */
  perCall?: number | null;
  share: number;
}
interface FileRow {
  attr: string;
  label: string;
  kind: string;
  tool: string | null;
  selfTokens: number;
  reads: number;
  trips: number;
  billed: number;
  /** 单次读取的总代价（含此后每一程重发）；reads=0 时 null */
  perRead?: number | null;
  share: number;
}
interface ReqRow {
  index: number;
  time: string | null;
  ratio: number;
  inputTokens: number;
  /** 代理或转录任一有真值即非 null；两者都没则 null（不写 0） */
  outputTokens?: number | null;
  /** proxy=代理实测 / transcript-tokens=转录 input_tokens / transcript-ratio=转录 ratio×window */
  usageSource?: "proxy" | "transcript-tokens" | "transcript-ratio" | "transcript";
  credits: number;
  originalCredits: number;
  afterCompact: boolean;
}
interface CatChild {
  tool: string | null;
  label: string;
  kind: string | null;
  tokens: number;
  share: number;
  catShare: number;
  trips: number;
}
interface CatDetail {
  key: string;
  label: string;
  tokens: number;
  share: number;
  children: CatChild[];
}
interface SubagentRow {
  agentId: string;
  agentType: string | null;
  description: string | null;
  toolUseId: string | null;
  roundTrips: number;
  billedInputTokens: number;
  peakContextRatio: number;
  credits: number;
  originalCredits: number;
  error: string | null;
}
interface SubagentTotals {
  roundTrips: number;
  billedInputTokens: number;
  credits: number;
  originalCredits: number;
}
interface Subagents {
  scanned: boolean;
  dir: string | null;
  /** 试过的候选目录；用于区分「真没子代理」与「路径没找对」。 */
  probedPaths?: string[];
  /** ok=已汇总 / no-dir=无子代理目录 / dir-empty=目录在但无 agent 文件 / no-usage=有文件但转录无 usage / error=读取抛错 */
  reason?: string;
  count: number;
  items: SubagentRow[];
  totals: SubagentTotals;
  combined: SubagentTotals;
}
/** 逐项可用性：报告里每个数字到底是模型上报的真值、按真值推导、回退默认、手工录入，还是本地根本没有。
 *  v2 旧报告没这个对象，故全部字段可选，读取时一律走默认值（旧报告只可能来自桌面端富转录）。 */
type Avail = "measured" | "derived" | "fallback" | "manual" | "unavailable";
interface Availability {
  credits?: Avail;
  roundTrips?: Avail;
  contextRatio?: Avail;
  tokens?: Avail;
  /** 输出 token：代理或转录 output_tokens 任一有真值即 measured */
  outputTokens?: Avail;
  /** 缓存命中 token：代理或转录 cache_read_input_tokens 任一有真值即 measured */
  cachedTokens?: Avail;
  categoryShare?: Avail;
  toolShare?: Avail;
  fileShare?: Avail;
  systemPrompt?: Avail;
  contextWindow?: Avail;
  compactions?: Avail;
  compactionCost?: Avail;
  model?: Avail;
  title?: Avail;
  toolCalls?: Avail;
  fileReads?: Avail;
  userTurns?: Avail;
  /** 用户压缩阈值：manual 覆盖 → manual；默认 200K → fallback */
  userContextLimit?: Avail;
}
/** 官方 UI 真值（手工录入，来自 .qoder-credits/overrides/<sessionId>.json）。
 *  IDE 端转录不含 usage，本地算不出 Credits，这是唯一的真值通道；绝不覆盖 totals，只并列展示。 */
interface ManualTruth {
  file?: string;
  credits: number | null;
  originalCredits: number | null;
  model: string | null;
  startedAt: string | null;
  endedAt: string | null;
  durationMin: number | null;
  note: string | null;
  /** 手工锁定模型窗口（如 qwen3-max=1000000），优先于 runtime-config / 反推 / fallback */
  contextWindow?: number | null;
  /** 手工指定 Qoder 压缩触发阈值（默认 200000），驱动 peakUserAdvice */
  userContextLimit?: number | null;
  /** 本地 credits ÷ 官方真值。有子代理时拿 combined 比（官方 UI 扣费 = 主链 + 子代理），
   *  否则覆盖率会被系统性低估（实测 ca2f7834：主链比 0.46、combined 比 0.89）。 */
  localCoverage?: number | null;
  /** main=只比主链 / combined=比主链+子代理 */
  localScope?: "main" | "combined";
  /** 参与对账的本地 credits（按 localScope 取 totals.credits 或 subagents.combined.credits） */
  localCredits?: number | null;
}
/** 峰值占比的「该不该压」结论。阈值算在数据层（breakdown.mjs peakAdvice），
 *  这里只管展示——否则 Canvas 与终端各持一套阈值迟早走偏。tone 直接喂 Callout。 */
interface PeakAdvice {
  level: "low" | "mid" | "sweet" | "high" | "over";
  tone: "info" | "success" | "warning" | "danger";
  text: string;
}
/** 一次压缩 = 一笔普通模型调用（整份上下文当 prompt、摘要当 completion），是会话里单笔最贵的开销。
 *  pre/post 是客户端自估口径；proxy 是能在代理日志里唯一对上时回填的供应商实测值，对不上就 null。 */
interface CompactionEvent {
  index: number;
  at: string | null;
  trigger: string | null;
  preTokens: number | null;
  postTokens: number | null;
  messagesSummarized: number | null;
  /** 压缩后首轮的往返序号与实测输入 = 压缩把上下文压到的地板 */
  nextRequestIndex: number | null;
  nextInputTokens: number | null;
  savedTokens: number | null;
  /** 数据层归一后的生效值：有代理实测就用实测，否则是客户端自估。
   *  渲染端直接取这两个，别自己按 proxy 分支——否则会与合计的口径分叉。 */
  effectiveInputTokens?: number | null;
  effectiveOutputTokens?: number | null;
  proxy?: {
    promptTokens: number;
    completionTokens: number;
    cachedTokens: number | null;
    ms: number | null;
    matchedBy: string;
  } | null;
}
interface CompactionCost {
  count: number;
  items: CompactionEvent[];
  /** measured = items 里有几笔拿到了供应商实测（其余为客户端自估） */
  totals: { preTokens: number; postTokens: number; savedTokens: number; measured?: number };
}
/** 链路健康度：代理覆盖率 + 最近记录时间 + 最近若干笔的三方归因计数。
 *  逐笔明细属于排障（CLI --request-log），报告只给一行结论。 */
interface LinkHealth {
  matched: number;
  requests: number;
  coverage: number;
  /** proxy / transcript-tokens / transcript-ratio / mixed / transcript（v3 旧报告）/ null */
  usageSource?: "proxy" | "transcript-tokens" | "transcript-ratio" | "mixed" | "transcript" | null;
  /** 三档拆分：代理实测 / 转录 input_tokens / 转录 ratio×window */
  breakdown?: { proxy: number; transcriptTokens: number; transcriptRatio: number };
  logRecords?: number;
  lastRecordAt?: string | null;
  /** 参与归因的最近笔数；0 = 运行中的代理是旧版或还没记到诊断 */
  recentRequests?: number;
  proxyErrors?: number | null;
  upstreamRejected?: number | null;
  aborted?: number | null;
  truncated?: number | null;
  noUsage?: number | null;
  slowestMs?: number | null;
  /** 被更新流量推翻的那条陈旧拉起失败记录；null = 没有 */
  supersededFailure?: { error: string; port?: number; at?: string | null } | null;
}
interface Report {
  schemaVersion: number;
  generatedAt: string;
  pluginVersion?: string;
  /** 转录来自哪一代客户端：桌面端富转录有 usage 真值，IDE 端精简转录没有。v2 旧报告无此字段。 */
  source?: "desktop-rich" | "ide-lite" | "unknown";
  /** usage 数字的来源：proxy=代理实测 / transcript-tokens=转录 input_tokens 真值 /
   *  transcript-ratio=转录 ratio×window 推导 / mixed=多档混合 / transcript=v3 旧报告兼容。无 usage 时 null。 */
  usageSource?: "proxy" | "transcript-tokens" | "transcript-ratio" | "mixed" | "transcript" | null;
  /** 可直接粘贴执行的插件入口命令（generate.mjs 用 proxy.mjs 的 selfCmd() 注入）。
   *  Windows 上是插件自带启动器的绝对路径，不要求用户装 Node；模板是静态文本，拿不到就只能硬编码。 */
  selfCmd?: string | null;
  /** 链路健康度一行结论（逐笔明细留给 CLI --request-log） */
  linkHealth?: LinkHealth | null;
  /** 代理 join 诊断（lib/proxylog.mjs）+ 配置/状态（generate.mjs 注入） */
  proxy?: {
    matched: number;
    requests: number;
    /** 三档拆分：代理实测 / 转录 input_tokens / 转录 ratio×window */
    breakdown?: { proxy: number; transcriptTokens: number; transcriptRatio: number };
    logPath?: string;
    logExists?: boolean;
    logRecords?: number;
    /** config.json 里 upstream 合法 = 用户已配置代理 */
    configured?: boolean;
    enabled?: boolean;
    port?: number;
    /** 最近一条代理记录的时间；null = 从无流量 */
    lastRecordAt?: string | null;
    /** 已配置但长期零流量（多半已改回官方模型）——软提示可 --stop-proxy */
    dormant?: boolean;
    /** 最近一次自动拉起失败（如端口被占）；ok 时为 null */
    status?: { error: string; port?: number; at?: string | null } | null;
    /** status 那条失败记录是否已被更新的流量推翻（代理在它之后还记到了流量）。
     *  status.json 只写不清，陈旧失败会把用户推去改本来正确的 Base URL，故必须判掉。 */
    statusSuperseded?: boolean;
  };
  availability?: Availability;
  manual?: ManualTruth | null;
  session: {
    id: string | null;
    title: string | null;
    /** custom-title / first-user / session-id —— 令产物文件名可解释 */
    titleSource?: string;
    model: string | null;
    /** runtime-config / manual / unavailable */
    modelSource?: string;
    cwd: string | null;
    turns: number;
    roundTrips: number;
    compactions: number;
    startedAt: string | null;
    endedAt: string | null;
  };
  context: {
    contextWindow: number;
    /** runtime-config=实测 / derived-from-usage=从 usage 反推 / manual=ManualTruth 手工锁定 /
     *  fallback=读不到静默回退 200000 / caller=调用方传入（旧枚举，兼容）。
     *  报告里每个 token 数字都要乘它，回退时必须标出来。 */
    contextWindowSource?: string;
    systemPromptTokens: number;
    netContextTokens: number;
    /** 峰值 = 当前窗口口径：自最近一次压缩起算，压缩边界处归零重新累积 */
    peakContextTokens: number;
    peakContextRatio: number;
    /** 本场历史峰值（跨压缩）；整场没压缩过时与上面相等 */
    peakSessionTokens?: number;
    peakSessionRatio?: number;
    /** 历史峰值是否值得单独交代（与当前窗口峰值相差 ≥1 个百分点），渲染端直接取用不再自判 */
    peakSessionNotable?: boolean;
    /** 峰值占比的「该不该压」结论（对模型窗口）；无有效占比时 null */
    peakAdvice?: PeakAdvice | null;
    /** 用户压缩阈值（Qoder 自动触发点），与模型窗口独立。默认 200000，ManualTruth 可覆盖 */
    userContextLimit?: number;
    /** default=内置 200K / manual=overrides 手写 / config=插件配置 / derived=实测反推 */
    userContextLimitSource?: "default" | "manual" | "config" | "derived";
    /** peakContextTokens ÷ userContextLimit */
    peakUserRatio?: number;
    /** 对用户阈值的「快自动压缩了吗」结论；与 peakAdvice 可矛盾（模型窗口未满但用户阈值已超） */
    peakUserAdvice?: PeakAdvice | null;
    /** v3.2 当前占用头条口径：段内单调递增 ⇒ 峰值≡当前，故以 netContextTokens 作头条，peak 退灰字 */
    currentContextTokens?: number;
    netUserRatio?: number;
    netUserAdvice?: PeakAdvice | null;
    netWindowRatio?: number;
    /** v3.2 自动压缩自校准：本场 trigger=auto 的实际触发点（无需外部配置）与「阈值是否被强制」判定 */
    observedAutoCompactions?: number;
    observedAutoTriggerTokens?: number | null;
    autoTriggerRatio?: number | null;
    thresholdNotEnforced?: boolean;
  };
  totals: {
    billedInputTokens: number;
    netContextTokens: number;
    peakContextTokens: number;
    amplification: number;
    attributedTokens: number;
    coverage: number;
    credits: number;
    originalCredits: number;
    /** 输出 token 总量：仅代理路径有真值，否则 0 且 availability.outputTokens=unavailable */
    outputTokens?: number;
    /** 供应商上下文缓存命中的那部分 prompt：仅代理路径有真值 */
    cachedTokens?: number;
    cachedTrips?: number;
    /** 缓存命中 ÷ 计费输入总量（全局实测约 91.5%：重复叠加的前缀正是缓存的命中对象） */
    cachedShare?: number;
    /** 两个不依赖 usage 的计数，IDE 端占比全缺时仍有可展示的真值 */
    toolCalls?: number;
    fileReads?: number;
  };
  /** credits 的分子到底覆盖了多少：与计费输入总量并排展示时，部分覆盖不说就等于把局部真值当全量。 */
  creditsCoverage?: {
    /** 真正累加进 totals.credits 的往返数 */
    trips: number;
    roundTrips: number;
    /** 这些往返的计费输入之和 */
    tokens: number;
    tokenShare: number;
    /** trips === roundTrips：全覆盖时不必再啰嗦覆盖范围 */
    full: boolean;
  };
  /** 压缩单笔成本（此前只显示「压缩 N 次」，而它是会话里单笔最贵的调用） */
  compactionCost?: CompactionCost;
  byCategory: CatRow[];
  byCategoryDetail: CatDetail[];
  byTool: ToolRow[];
  byFile: FileRow[];
  byRequest: ReqRow[];
  subagents?: Subagents;
  identity: { sumAttributed: number; billedInputTokens: number; absDiff: number; ok: boolean | null };
}

// 注入点：下一行的 REPORT 初值会被 render-canvas.mjs 按整行替换为真实报告 JSON。
const REPORT = {"schemaVersion":3.2,"generatedAt":"2026-11-07T03:05:20.675Z","source":"desktop-rich","usageSource":"transcript-ratio","availability":{"credits":"measured","roundTrips":"measured","contextRatio":"measured","tokens":"derived","outputTokens":"unavailable","cachedTokens":"unavailable","categoryShare":"derived","toolShare":"derived","fileShare":"derived","systemPrompt":"derived","contextWindow":"fallback","compactions":"measured","compactionCost":"measured","model":"measured","title":"measured","toolCalls":"measured","fileReads":"measured","userTurns":"measured","userContextLimit":"fallback"},"session":{"id":"29d86d15-6bea-4b54-bf8a-f16185376110","title":"Shared Component Parallel Refactor","titleSource":"custom-title","model":"dfmodel","modelSource":"runtime-config","cwd":"F:\\code\\dezhou","turns":7,"roundTrips":293,"compactions":0,"startedAt":"2026-11-06T08:14:37.035Z","endedAt":"2026-11-07T03:05:19.793Z"},"context":{"contextWindow":200000,"contextWindowSource":"fallback","systemPromptTokens":0,"netContextTokens":130852,"peakContextTokens":130852,"peakContextRatio":0.65426,"peakSessionTokens":130852,"peakSessionRatio":0.65426,"peakSessionNotable":false,"peakAdvice":{"level":"sweet","tone":"success","text":"正处性价比区间（65–85%）。此时压一次每轮省得最多，且第一轮就回本"},"userContextLimit":1000000,"userContextLimitSource":"config","peakUserRatio":0.130852,"peakUserAdvice":{"level":"low","tone":"info","text":"低于盈亏线（39%）。此时压缩在 token 上是亏的：省下的还不够付摘要输出加压缩后重读，别压"},"currentContextTokens":130852,"netUserRatio":0.130852,"netUserAdvice":{"level":"low","tone":"info","text":"低于盈亏线（39%）。此时压缩在 token 上是亏的：省下的还不够付摘要输出加压缩后重读，别压"},"netWindowRatio":0.65426,"observedAutoCompactions":0,"observedAutoTriggerTokens":null,"autoTriggerRatio":null,"thresholdNotEnforced":false},"totals":{"billedInputTokens":28217319,"netContextTokens":130852,"peakContextTokens":130852,"amplification":215.64,"attributedTokens":28217319,"coverage":1,"credits":214.274,"originalCredits":214.274,"outputTokens":0,"cachedTokens":0,"cachedTrips":0,"cachedShare":0,"toolCalls":491,"fileReads":288},"creditsCoverage":{"trips":293,"roundTrips":293,"tokens":28217319,"tokenShare":0.9999999858243086,"full":true},"compactionCost":{"count":0,"items":[],"totals":{"preTokens":0,"postTokens":0,"savedTokens":0,"measured":0}},"proxy":{"matched":0,"requests":293,"breakdown":{"proxy":0,"transcriptTokens":0,"transcriptRatio":293},"logPath":"C:\\Users\\24533\\.qoder-credits-proxy\\usage.jsonl","logExists":false,"logRecords":0,"configured":false,"enabled":true,"port":49787,"lastRecordAt":null,"dormant":false,"status":null,"statusSuperseded":false},"byCategory":[{"key":"tool_result","label":"工具返回","tokens":13312389,"share":0.47178078557220077},{"key":"assistant_thinking","label":"模型思考","tokens":8461702,"share":0.29987619098527885},{"key":"assistant_tool_use","label":"工具调用","tokens":3137880,"share":0.11120403338061123},{"key":"assistant_text","label":"模型回复","tokens":262275,"share":0.009294838672516894},{"key":"user_input","label":"用户输入","tokens":167450,"share":0.005934306753765889},{"key":"attachment","label":"附件/技能","tokens":2875622,"share":0.10190983045993018}],"byCategoryDetail":[{"key":"tool_result","label":"工具返回","tokens":13312389,"share":0.47178078557220077,"children":[{"tool":"Bash","label":"（无路径）","kind":"shell","tokens":1991831,"share":0.07058895629894756,"catShare":0.1496223637283861,"trips":14696},{"tool":"SearchWorkspace","label":"（无路径）","kind":"other","tokens":1617569,"share":0.057325386023629306,"catShare":0.12150852212877224,"trips":562},{"tool":"Agent","label":"（无路径）","kind":"other","tokens":1157361,"share":0.04101598710309484,"catShare":0.08693865531922516,"trips":3074},{"tool":"SearchKnowledge","label":"shared 共享组件架构、设计令牌、组件库规范","kind":"other","tokens":606392,"share":0.021490051789351095,"catShare":0.04555092629151231,"trips":292},{"tool":"Grep","label":"src","kind":"search","tokens":584838,"share":0.020726219564141002,"catShare":0.043931885735878674,"trips":3553},{"tool":"ExitPlanMode","label":"（无路径）","kind":"other","tokens":450684,"share":0.01597188425339159,"catShare":0.033854461101081174,"trips":222},{"tool":"Grep","label":"src/features","kind":"search","tokens":425100,"share":0.015065202902969052,"catShare":0.031932633468099325,"trips":1509},{"tool":"Read","label":"DESIGN.md","kind":"read","tokens":347473,"share":0.01231417534901038,"catShare":0.02610147705374456,"trips":576},{"tool":"Read","label":"C:/Users/24533/.qoder-cn/plans/fond-hollow-ibis.md","kind":"read","tokens":310537,"share":0.011005207232987905,"catShare":0.02332695092624471,"trips":458},{"tool":"Read","label":"docs/AI_GUIDE.md","kind":"read","tokens":250339,"share":0.00887182470370048,"catShare":0.018804972510570263,"trips":276},{"tool":"Read","label":"docs/TDD.md","kind":"read","tokens":247838,"share":0.008783187978787335,"catShare":0.018617095582081876,"trips":440},{"tool":"Read","label":"src/styles/globals.css","kind":"read","tokens":247708,"share":0.008778564954315223,"catShare":0.01860729648764333,"trips":1520},{"tool":"Read","label":"src/guards/README.md","kind":"read","tokens":245476,"share":0.008699487717193448,"catShare":0.018439682121946206,"trips":291},{"tool":"mcp_call","label":"（无路径）","kind":"other","tokens":188296,"share":0.006673050485040561,"catShare":0.014144388006279507,"trips":4423},{"tool":"Read","label":"src/test-utils/admissionGraph.ts","kind":"read","tokens":168947,"share":0.005987349691013397,"catShare":0.012690957059117238,"trips":291},{"tool":null,"label":"其他 146 项","kind":null,"tokens":4472001,"share":0.15848424952463716,"catShare":0.3359277324794376,"trips":52413}]},{"key":"assistant_thinking","label":"模型思考","tokens":8461702,"share":0.29987619098527885,"children":[]},{"key":"assistant_tool_use","label":"工具调用","tokens":3137880,"share":0.11120403338061123,"children":[{"tool":"Agent","label":"（无路径）","kind":"other","tokens":626879,"share":0.022216090166819493,"catShare":0.1997777372946703,"trips":3074},{"tool":"Write","label":"C:/Users/24533/.qoder-cn/plans/fond-hollow-ibis.md","kind":"write","tokens":467284,"share":0.016560200526690553,"catShare":0.14891726516799056,"trips":263},{"tool":"Edit","label":"C:/Users/24533/.qoder-cn/plans/fond-hollow-ibis.md","kind":"write","tokens":403101,"share":0.014285585913715131,"catShare":0.1284628396959374,"trips":10462},{"tool":"Bash","label":"（无路径）","kind":"shell","tokens":302737,"share":0.010728757169191467,"catShare":0.09647812982170177,"trips":14696},{"tool":"Edit","label":"src/features/pot-odds/components/PotOddsQuizPage.tsx","kind":"write","tokens":98420,"share":0.003487937961431344,"catShare":0.03136521091364908,"trips":1096},{"tool":"Edit","label":"src/shared/AGENTS.md","kind":"write","tokens":89524,"share":0.0031726454730491714,"catShare":0.028529949648412056,"trips":1369},{"tool":"Edit","label":"src/shared/components/ui/button.tsx","kind":"write","tokens":70154,"share":0.0024862143370719975,"catShare":0.022357231671288256,"trips":420},{"tool":"mcp_call","label":"（无路径）","kind":"other","tokens":63535,"share":0.0022516486479266565,"catShare":0.020247904500190896,"trips":4423},{"tool":"Edit","label":"src/shared/components/data-display/StatCard.tsx","kind":"write","tokens":63079,"share":0.0022354666823911386,"catShare":0.020102388505459545,"trips":1035},{"tool":"Write","label":"src/guards/sharedPrimitiveUsage.guard.test.ts","kind":"write","tokens":57993,"share":0.0020552276227848443,"catShare":0.018481592441440885,"trips":174},{"tool":"Write","label":"src/guards/duplicateLiteralRatchet.guard.test.ts","kind":"write","tokens":50885,"share":0.0018033266225773894,"catShare":0.016216377839509237,"trips":173},{"tool":"SearchWorkspace","label":"（无路径）","kind":"other","tokens":50474,"share":0.0017887464435507243,"catShare":0.01608526587725907,"trips":562},{"tool":"AskUserQuestion","label":"（无路径）","kind":"other","tokens":36939,"share":0.001309099775783191,"catShare":0.01177205300910818,"trips":265},{"tool":"Edit","label":"src/guards/README.md","kind":"write","tokens":34017,"share":0.0012055376795269959,"catShare":0.01084077297269314,"trips":309},{"tool":"Edit","label":"src/shared/components/data-display/StatCard.test.tsx","kind":"write","tokens":32850,"share":0.0011641942940804324,"catShare":0.010468993423069612,"trips":615},{"tool":null,"label":"其他 146 项","kind":null,"tokens":690008,"share":0.024453354064017187,"catShare":0.21989628721758853,"trips":45660}]},{"key":"assistant_text","label":"模型回复","tokens":262275,"share":0.009294838672516894,"children":[]},{"key":"user_input","label":"用户输入","tokens":167450,"share":0.005934306753765889,"children":[]},{"key":"attachment","label":"附件/技能","tokens":2875622,"share":0.10190983045993018,"children":[]}],"byTool":[{"tool":"Read","tokens":5562208,"calls":97,"perCall":57342,"share":0.19712035093094227},{"tool":"Bash","tokens":2294568,"calls":93,"perCall":24673,"share":0.08131771346813922},{"tool":"Agent","tokens":1784240,"calls":15,"perCall":118949,"share":0.06323207726991412},{"tool":"SearchWorkspace","tokens":1668042,"calls":2,"perCall":834021,"share":0.059114132467180065},{"tool":"Grep","tokens":1564691,"calls":57,"perCall":27451,"share":0.05545145757779185},{"tool":"Edit","tokens":1281780,"calls":121,"perCall":10593,"share":0.045425286204387044},{"tool":"Write","tokens":736663,"calls":9,"perCall":81851,"share":0.02610677293886892},{"tool":"SearchKnowledge","tokens":609918,"calls":1,"perCall":609918,"share":0.021615035081882148},{"tool":"ExitPlanMode","tokens":453577,"calls":1,"perCall":453577,"share":0.016074404094770164},{"tool":"mcp_call","tokens":251831,"calls":79,"perCall":3188,"share":0.008924699132967217},{"tool":"Glob","tokens":161873,"calls":3,"perCall":53958,"share":0.005736647211463172},{"tool":"AskUserQuestion","tokens":44160,"calls":1,"perCall":44160,"share":0.0015649981164451714},{"tool":"mcp_list","tokens":15238,"calls":1,"perCall":15238,"share":0.000540039891272844},{"tool":"mcp_get","tokens":15189,"calls":4,"perCall":3797,"share":0.0005382763189563951},{"tool":"Skill","tokens":4924,"calls":1,"perCall":4924,"share":0.0001745049744773379},{"tool":"mcp__browser-use__evaluate_script","tokens":832,"calls":2,"perCall":416,"share":0.00002948004564616356},{"tool":"UpdateGoal","tokens":317,"calls":1,"perCall":317,"share":0.000011225728198297984},{"tool":"mcp__browser-use__navigate_page</｜｜DSML｜｜ parameter>\n<｜｜DSML｜｜ parameter name=","tokens":133,"calls":1,"perCall":133,"share":0.0000047294021215390945},{"tool":"mcp__browser-use__press_key","tokens":67,"calls":1,"perCall":67,"share":0.0000023896813000417012},{"tool":"TaskStop","tokens":17,"calls":1,"perCall":17,"share":5.98416092189719e-7}],"byFile":[{"attr":"file:C:\\Users\\24533\\.qoder-cn\\plans\\fond-hollow-ibis.md","label":"C:/Users/24533/.qoder-cn/plans/fond-hollow-ibis.md","kind":"write","tool":"Write","selfTokens":25686,"reads":50,"trips":24332,"billed":1422869,"perRead":28457,"share":0.05042538801806011},{"attr":"file:f:\\code\\dezhou\\src","label":"src","kind":"search","tool":"Grep","selfTokens":12073,"reads":15,"trips":7106,"billed":610386,"perRead":40692,"share":0.0216316227436438},{"attr":"file:shared 共享组件架构、设计令牌、组件库规范","label":"shared 共享组件架构、设计令牌、组件库规范","kind":"other","tool":"SearchKnowledge","selfTokens":9166,"reads":1,"trips":584,"billed":609918,"perRead":609918,"share":0.021615035081882148},{"attr":"file:f:\\code\\dezhou\\src\\features","label":"src/features","kind":"search","tool":"Grep","selfTokens":9154,"reads":6,"trips":3018,"billed":438938,"perRead":73156,"share":0.015555616125322419},{"attr":"file:f:\\code\\dezhou\\DESIGN.md","label":"DESIGN.md","kind":"search","tool":"Grep","selfTokens":6070,"reads":5,"trips":2316,"billed":376619,"perRead":75324,"share":0.01334709540585236},{"attr":"file:f:\\code\\dezhou\\src\\styles\\globals.css","label":"src/styles/globals.css","kind":"search","tool":"Grep","selfTokens":7045,"reads":16,"trips":6656,"billed":370871,"perRead":23179,"share":0.013143372617177398},{"attr":"file:f:\\code\\dezhou\\docs\\AI_GUIDE.md","label":"docs/AI_GUIDE.md","kind":"search","tool":"Grep","selfTokens":5802,"reads":6,"trips":2568,"billed":336537,"perRead":56090,"share":0.011926627905522666},{"attr":"file:f:\\code\\dezhou\\docs\\TDD.md","label":"docs/TDD.md","kind":"search","tool":"Grep","selfTokens":5418,"reads":4,"trips":1760,"billed":303075,"perRead":75769,"share":0.010740743987206947},{"attr":"file:f:\\code\\dezhou\\src\\guards\\README.md","label":"src/guards/README.md","kind":"read","tool":"Read","selfTokens":4698,"reads":3,"trips":1200,"billed":281802,"perRead":93934,"share":0.009986829129529234},{"attr":"file:f:\\code\\dezhou\\src\\features\\pot-odds\\components\\PotOddsQuizPage.tsx","label":"src/features/pot-odds/components/PotOddsQuizPage.tsx","kind":"read","tool":"Read","selfTokens":7677,"reads":14,"trips":4244,"billed":277512,"perRead":19822,"share":0.009834815169510094},{"attr":"file:f:\\code\\dezhou\\src\\shared\\AGENTS.md","label":"src/shared/AGENTS.md","kind":"read","tool":"Read","selfTokens":4906,"reads":10,"trips":3320,"billed":243604,"perRead":24360,"share":0.008633145888478659},{"attr":"file:f:\\code\\dezhou\\src\\test-utils\\admissionGraph.ts","label":"src/test-utils/admissionGraph.ts","kind":"read","tool":"Read","selfTokens":2569,"reads":1,"trips":582,"billed":170072,"perRead":170072,"share":0.0060272340737513455},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\academy\\AcademyNotesPanel.tsx","label":"src/shared/components/academy/AcademyNotesPanel.tsx","kind":"read","tool":"Read","selfTokens":3485,"reads":6,"trips":2272,"billed":157745,"perRead":26291,"share":0.005590377025413495},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\academy\\ContentIssueReportDialog.tsx","label":"src/shared/components/academy/ContentIssueReportDialog.tsx","kind":"read","tool":"Read","selfTokens":2973,"reads":3,"trips":1128,"billed":149625,"perRead":49875,"share":0.005302584906099928},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\ui\\select.tsx","label":"src/shared/components/ui/select.tsx","kind":"read","tool":"Read","selfTokens":2805,"reads":6,"trips":2260,"billed":149127,"perRead":24855,"share":0.005284957036925045},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\academy\\AcademyBridgeCard.tsx","label":"src/shared/components/academy/AcademyBridgeCard.tsx","kind":"read","tool":"Read","selfTokens":3210,"reads":4,"trips":1408,"billed":143911,"perRead":35978,"share":0.005100096049674674},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\data-display\\StatCard.tsx","label":"src/shared/components/data-display/StatCard.tsx","kind":"read","tool":"Read","selfTokens":2648,"reads":6,"trips":2640,"billed":142331,"perRead":23722,"share":0.005044098264019103},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\academy\\AcademyBookmarksPanel.tsx","label":"src/shared/components/academy/AcademyBookmarksPanel.tsx","kind":"read","tool":"Read","selfTokens":2254,"reads":4,"trips":1868,"billed":136204,"perRead":34051,"share":0.004826962133369848},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\ui\\button.tsx","label":"src/shared/components/ui/button.tsx","kind":"read","tool":"Read","selfTokens":3251,"reads":5,"trips":1722,"billed":135709,"perRead":27142,"share":0.004809428844379093},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\data-display\\StatCard.test.tsx","label":"src/shared/components/data-display/StatCard.test.tsx","kind":"read","tool":"Read","selfTokens":2640,"reads":4,"trips":1648,"billed":123212,"perRead":30803,"share":0.004366527586592853},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\feedback\\DecisionAnalysis.tsx","label":"src/shared/components/feedback/DecisionAnalysis.tsx","kind":"read","tool":"Read","selfTokens":2364,"reads":2,"trips":932,"billed":120937,"perRead":60469,"share":0.00428592339014083},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\layout\\BackLink.tsx","label":"src/shared/components/layout/BackLink.tsx","kind":"read","tool":"Read","selfTokens":2121,"reads":2,"trips":928,"billed":120282,"perRead":60141,"share":0.004262710597030422},{"attr":"file:f:\\code\\dezhou\\src\\shared\\admission-guard.test.ts","label":"src/shared/admission-guard.test.ts","kind":"read","tool":"Read","selfTokens":1732,"reads":1,"trips":582,"billed":114661,"perRead":114661,"share":0.004063514758947962},{"attr":"file:c:\\Users\\24533\\.qoder-cn\\plugins\\cache\\qoder-marketplace\\design-review\\0.1.0\\skills\\component-library-alignment\\scripts\\audit-components.mjs","label":"c:/Users/24533/.qoder-cn/plugins/cache/qoder-marketplace/design-review/0.1.0/skills/component-library-alignment/scripts/audit-components.mjs","kind":"read","tool":"Read","selfTokens":1668,"reads":1,"trips":578,"billed":109445,"perRead":109445,"share":0.0038786347029943755},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\academy\\AcademyMasteryCard.tsx","label":"src/shared/components/academy/AcademyMasteryCard.tsx","kind":"read","tool":"Read","selfTokens":1764,"reads":3,"trips":1430,"billed":109078,"perRead":36359,"share":0.0038656315769765937},{"attr":"file:src/features/**/components/**/*.tsx","label":"src/features/**/components/**/*.tsx","kind":"search","tool":"Glob","selfTokens":1599,"reads":1,"trips":580,"billed":105384,"perRead":105384,"share":0.0037347363979415836},{"attr":"file:c:\\Users\\24533\\.qoder-cn\\plugins\\cache\\qoder-marketplace\\design-review\\0.1.0\\shared\\lib\\config.mjs","label":"c:/Users/24533/.qoder-cn/plugins/cache/qoder-marketplace/design-review/0.1.0/shared/lib/config.mjs","kind":"read","tool":"Read","selfTokens":1305,"reads":1,"trips":576,"billed":85251,"perRead":85251,"share":0.003021244374968705},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\data-display\\ProgressRing.tsx","label":"src/shared/components/data-display/ProgressRing.tsx","kind":"read","tool":"Read","selfTokens":1342,"reads":2,"trips":964,"billed":85054,"perRead":42527,"share":0.0030142625041160295},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\academy\\AcademySearchShell.tsx","label":"src/shared/components/academy/AcademySearchShell.tsx","kind":"read","tool":"Read","selfTokens":1321,"reads":1,"trips":566,"billed":84538,"perRead":84538,"share":0.00299594687699074},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\ui\\dialog.tsx","label":"src/shared/components/ui/dialog.tsx","kind":"read","tool":"Read","selfTokens":1403,"reads":3,"trips":1168,"billed":82767,"perRead":27589,"share":0.0029331934982388852},{"attr":"file:f:\\code\\dezhou\\src\\features\\strategy-academy\\components\\drills\\DrillResultView.tsx","label":"src/features/strategy-academy/components/drills/DrillResultView.tsx","kind":"read","tool":"Read","selfTokens":1772,"reads":1,"trips":382,"billed":75798,"perRead":75798,"share":0.002686206474577764},{"attr":"file:f:\\code\\dezhou\\src\\app\\routes.tsx","label":"src/app/routes.tsx","kind":"read","tool":"Read","selfTokens":3164,"reads":1,"trips":210,"billed":74286,"perRead":74286,"share":0.0026326369982736047},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\poker\\Card.tsx","label":"src/shared/components/poker/Card.tsx","kind":"read","tool":"Read","selfTokens":1141,"reads":1,"trips":564,"billed":72728,"perRead":72728,"share":0.0025774383520421737},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\feedback\\MobileFeedbackSheet.tsx","label":"src/shared/components/feedback/MobileFeedbackSheet.tsx","kind":"read","tool":"Read","selfTokens":1115,"reads":1,"trips":568,"billed":71644,"perRead":71644,"share":0.00253900868006679},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\academy\\AcademyVariantRuleCard.tsx","label":"src/shared/components/academy/AcademyVariantRuleCard.tsx","kind":"read","tool":"Read","selfTokens":1117,"reads":1,"trips":566,"billed":71483,"perRead":71483,"share":0.0025332874046923985},{"attr":"file:f:\\code\\dezhou\\src\\guards\\duplicateLiteralRatchet.guard.test.ts","label":"src/guards/duplicateLiteralRatchet.guard.test.ts","kind":"write","tool":"Write","selfTokens":1937,"reads":3,"trips":882,"billed":70006,"perRead":23335,"share":0.002480969455880985},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\feedback\\ResultHeader.tsx","label":"src/shared/components/feedback/ResultHeader.tsx","kind":"read","tool":"Read","selfTokens":1058,"reads":1,"trips":570,"billed":68259,"perRead":68259,"share":0.0024190422424075894},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\quiz\\QuizCard.tsx","label":"src/shared/components/quiz/QuizCard.tsx","kind":"read","tool":"Read","selfTokens":1008,"reads":1,"trips":564,"billed":64251,"perRead":64251,"share":0.0022770007527243737},{"attr":"file:f:\\code\\dezhou\\src\\guards\\sharedPrimitiveUsage.guard.test.ts","label":"src/guards/sharedPrimitiveUsage.guard.test.ts","kind":"write","tool":"Write","selfTokens":1617,"reads":2,"trips":692,"billed":62897,"perRead":31448,"share":0.002229013533581942},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\quiz\\quizCardModel.ts","label":"src/shared/components/quiz/quizCardModel.ts","kind":"read","tool":"Read","selfTokens":1010,"reads":1,"trips":544,"billed":61932,"perRead":61932,"share":0.0021948078565946104},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\data-display\\ProgressBar.test.tsx","label":"src/shared/components/data-display/ProgressBar.test.tsx","kind":"read","tool":"Read","selfTokens":1328,"reads":2,"trips":830,"billed":61784,"perRead":30892,"share":0.0021895911206683202},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\ui\\button.test.tsx","label":"src/shared/components/ui/button.test.tsx","kind":"read","tool":"Read","selfTokens":1095,"reads":2,"trips":976,"billed":61370,"perRead":30685,"share":0.002174921098361627},{"attr":"file:f:\\code\\dezhou\\src\\features\\strategy-academy\\components\\drills\\DrillProgressHeader.tsx","label":"src/features/strategy-academy/components/drills/DrillProgressHeader.tsx","kind":"read","tool":"Read","selfTokens":1407,"reads":1,"trips":382,"billed":60185,"perRead":60185,"share":0.0021328964501867455},{"attr":"file:src/shared/components/**/*.{tsx,ts}","label":"src/shared/components/**/*.{tsx,ts}","kind":"search","tool":"Glob","selfTokens":841,"reads":1,"trips":584,"billed":55961,"perRead":55961,"share":0.001983225453181636},{"attr":"file:f:\\code\\dezhou\\src\\features\\strategy-academy\\components\\drills\\ChoiceDrillRenderer.tsx","label":"src/features/strategy-academy/components/drills/ChoiceDrillRenderer.tsx","kind":"read","tool":"Read","selfTokens":826,"reads":1,"trips":556,"billed":51837,"perRead":51837,"share":0.0018370774037928283},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\ui\\progress.tsx","label":"src/shared/components/ui/progress.tsx","kind":"read","tool":"Read","selfTokens":945,"reads":3,"trips":1404,"billed":51316,"perRead":17105,"share":0.0018186076802845371},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\academy\\academy-primitives.test.ts","label":"src/shared/components/academy/academy-primitives.test.ts","kind":"read","tool":"Read","selfTokens":1176,"reads":1,"trips":382,"billed":50304,"perRead":50304,"share":0.0017827194210516093},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\academy\\ContentBlocks.tsx","label":"src/shared/components/academy/ContentBlocks.tsx","kind":"read","tool":"Read","selfTokens":739,"reads":1,"trips":566,"billed":47292,"perRead":47292,"share":0.001676006617786645},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\feedback\\LoadingState.tsx","label":"src/shared/components/feedback/LoadingState.tsx","kind":"read","tool":"Read","selfTokens":716,"reads":1,"trips":568,"billed":46006,"perRead":46006,"share":0.001630430686033922},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\data-display\\ProgressBar.tsx","label":"src/shared/components/data-display/ProgressBar.tsx","kind":"read","tool":"Read","selfTokens":832,"reads":2,"trips":986,"billed":45473,"perRead":22736,"share":0.0016115122928532528},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\feedback\\RelatedLessonChip.tsx","label":"src/shared/components/feedback/RelatedLessonChip.tsx","kind":"read","tool":"Read","selfTokens":884,"reads":2,"trips":932,"billed":45203,"perRead":22601,"share":0.0016019453075946145},{"attr":"file:f:\\code\\dezhou\\package.json","label":"package.json","kind":"read","tool":"Read","selfTokens":728,"reads":1,"trips":532,"billed":43612,"perRead":43612,"share":0.001545558776061772},{"attr":"file:f:\\code\\dezhou\\src\\guards\\cssLineCountGuard.test.ts","label":"src/guards/cssLineCountGuard.test.ts","kind":"read","tool":"Read","selfTokens":717,"reads":1,"trips":532,"billed":42953,"perRead":42953,"share":0.0015222055527971056},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\ui\\tooltip.tsx","label":"src/shared/components/ui/tooltip.tsx","kind":"read","tool":"Read","selfTokens":780,"reads":3,"trips":1354,"billed":41137,"perRead":13712,"share":0.0014578736583831953},{"attr":"file:f:\\code\\dezhou\\src\\features\\hand-history\\components\\GtoDeviationPanel.tsx","label":"src/features/hand-history/components/GtoDeviationPanel.tsx","kind":"read","tool":"Read","selfTokens":651,"reads":1,"trips":556,"billed":40855,"perRead":40855,"share":0.0014478660894299378},{"attr":"file:f:\\code\\dezhou\\src\\features\\progress","label":"src/features/progress","kind":"search","tool":"Grep","selfTokens":1719,"reads":2,"trips":418,"billed":39827,"perRead":19913,"share":0.0014114219318995846},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\feedback\\ResultActions.tsx","label":"src/shared/components/feedback/ResultActions.tsx","kind":"read","tool":"Read","selfTokens":606,"reads":1,"trips":570,"billed":39097,"perRead":39097,"share":0.0013855761804338368},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\feedback\\EmptyState.tsx","label":"src/shared/components/feedback/EmptyState.tsx","kind":"read","tool":"Read","selfTokens":567,"reads":1,"trips":568,"billed":36432,"perRead":36432,"share":0.0012911371494151315},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\ui\\input.tsx","label":"src/shared/components/ui/input.tsx","kind":"read","tool":"Read","selfTokens":852,"reads":4,"trips":1470,"billed":35876,"perRead":8969,"share":0.0012714290221346332},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\ui\\card.tsx","label":"src/shared/components/ui/card.tsx","kind":"read","tool":"Read","selfTokens":542,"reads":1,"trips":572,"billed":35111,"perRead":35111,"share":0.0012443207363315762},{"attr":"file:f:\\code\\dezhou\\src\\features\\pot-odds\\components\\PotOddsResultView.tsx","label":"src/features/pot-odds/components/PotOddsResultView.tsx","kind":"write","tool":"Write","selfTokens":1133,"reads":1,"trips":266,"billed":33655,"perRead":33655,"share":0.0011926992946364925},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\feedback\\ComparisonView.tsx","label":"src/shared/components/feedback/ComparisonView.tsx","kind":"read","tool":"Read","selfTokens":522,"reads":1,"trips":568,"billed":33541,"perRead":33541,"share":0.0011886659470805951},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\ui\\progress.test.tsx","label":"src/shared/components/ui/progress.test.tsx","kind":"read","tool":"Read","selfTokens":717,"reads":2,"trips":830,"billed":33419,"perRead":16710,"share":0.0011843503942434424},{"attr":"file:f:\\code\\dezhou\\src\\i18n\\locales\\zh\\drills.json","label":"src/i18n/locales/zh/drills.json","kind":"read","tool":"Read","selfTokens":537,"reads":1,"trips":528,"billed":31922,"perRead":31922,"share":0.0011313070276216398},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\ui\\focusRing.ts","label":"src/shared/components/ui/focusRing.ts","kind":"write","tool":"Write","selfTokens":728,"reads":3,"trips":1040,"billed":29399,"perRead":9800,"share":0.0010418783967452527},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\academy\\index.ts","label":"src/shared/components/academy/index.ts","kind":"read","tool":"Read","selfTokens":427,"reads":1,"trips":582,"billed":28268,"perRead":28268,"share":0.0010018018487706584},{"attr":"file:f:\\code\\dezhou\\src\\features\\progress\\components\\dashboard\\Dashboard.tsx","label":"src/features/progress/components/dashboard/Dashboard.tsx","kind":"read","tool":"Read","selfTokens":449,"reads":1,"trips":556,"billed":28178,"perRead":28178,"share":0.0009986050294224932},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\feedback\\GradeIcon.tsx","label":"src/shared/components/feedback/GradeIcon.tsx","kind":"read","tool":"Read","selfTokens":419,"reads":1,"trips":568,"billed":26923,"perRead":26923,"share":0.000954120750625996},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\layout\\SectionLabel.test.tsx","label":"src/shared/components/layout/SectionLabel.test.tsx","kind":"write","tool":"Write","selfTokens":520,"reads":1,"trips":440,"billed":25699,"perRead":25699,"share":0.0009107437321393385},{"attr":"file:f:\\code\\dezhou\\src\\i18n\\locales\\en\\drills.json","label":"src/i18n/locales/en/drills.json","kind":"read","tool":"Read","selfTokens":423,"reads":1,"trips":528,"billed":25146,"perRead":25146,"share":0.0008911412899142522},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\layout\\SectionLabel.tsx","label":"src/shared/components/layout/SectionLabel.tsx","kind":"write","tool":"Write","selfTokens":498,"reads":1,"trips":440,"billed":24611,"perRead":24611,"share":0.0008722122665488276},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\academy","label":"src/shared/components/academy","kind":"search","tool":"Grep","selfTokens":505,"reads":1,"trips":430,"billed":24382,"perRead":24382,"share":0.0008640626182961396},{"attr":"file:f:\\code\\dezhou\\src\\features\\progress\\store.ts","label":"src/features/progress/store.ts","kind":"search","tool":"Grep","selfTokens":964,"reads":4,"trips":834,"billed":22476,"perRead":5619,"share":0.0007965245713911987},{"attr":"file:f:\\code\\dezhou\\src\\guards\\line-count-guard.test.ts","label":"src/guards/line-count-guard.test.ts","kind":"read","tool":"Read","selfTokens":337,"reads":1,"trips":532,"billed":20188,"perRead":20188,"share":0.0007154578400176072},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\feedback\\TryAgainButton.tsx","label":"src/shared/components/feedback/TryAgainButton.tsx","kind":"read","tool":"Read","selfTokens":306,"reads":1,"trips":568,"billed":19662,"perRead":19662,"share":0.0006968041758748318},{"attr":"file:f:\\code\\dezhou\\src\\layouts\\BlankLayout.tsx","label":"src/layouts/BlankLayout.tsx","kind":"read","tool":"Read","selfTokens":1640,"reads":2,"trips":204,"billed":19096,"perRead":9548,"share":0.0006767526212544967},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\ui\\toast.tsx","label":"src/shared/components/ui/toast.tsx","kind":"read","tool":"Read","selfTokens":290,"reads":1,"trips":564,"billed":18485,"perRead":18485,"share":0.0006550895022718935},{"attr":"file:f:\\code\\dezhou\\AGENTS.md","label":"AGENTS.md","kind":"write","tool":"Edit","selfTokens":567,"reads":2,"trips":588,"billed":18262,"perRead":9131,"share":0.0006471888088818827},{"attr":"file:f:\\code\\dezhou\\vite.config.ts","label":"vite.config.ts","kind":"read","tool":"Read","selfTokens":763,"reads":1,"trips":214,"billed":18253,"perRead":18253,"share":0.0006468609686674724},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\poker\\HandDisplay.tsx","label":"src/shared/components/poker/HandDisplay.tsx","kind":"read","tool":"Read","selfTokens":273,"reads":1,"trips":564,"billed":17401,"perRead":17401,"share":0.000616687703862852},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\data-display\\StatPair.tsx","label":"src/shared/components/data-display/StatPair.tsx","kind":"read","tool":"Read","selfTokens":263,"reads":1,"trips":570,"billed":16968,"perRead":16968,"share":0.0006013309165909223},{"attr":"file:f:\\code\\dezhou\\src\\shared\\stores\\debugMode.ts","label":"src/shared/stores/debugMode.ts","kind":"read","tool":"Read","selfTokens":691,"reads":1,"trips":214,"billed":16530,"perRead":16530,"share":0.0005858203530133987},{"attr":"file:f:\\code\\dezhou\\src\\shared","label":"src/shared","kind":"search","tool":"Grep","selfTokens":391,"reads":1,"trips":308,"billed":13461,"perRead":13461,"share":0.0004770592147637417},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\ui\\textarea.tsx","label":"src/shared/components/ui/textarea.tsx","kind":"read","tool":"Read","selfTokens":306,"reads":1,"trips":382,"billed":13089,"perRead":13089,"share":0.0004638708697634289},{"attr":"file:C:\\Users\\24533\\.qoder-cn\\tmp\\F--code-dezhou\\tool-outputs\\session-29d86d15-6bea-4b54-bf8a-f16185376110\\b8u2lzwh3.output","label":"C:/Users/24533/.qoder-cn/tmp/F--code-dezhou/tool-outputs/session-29d86d15-6bea-4b54-bf8a-f16185376110/b8u2lzwh3.output","kind":"search","tool":"Grep","selfTokens":483,"reads":1,"trips":226,"billed":12198,"perRead":12198,"share":0.0004322754934741396},{"attr":"file:f:\\code\\dezhou\\src\\features\\strategy-academy\\data\\lessons\\variants\\standard","label":"src/features/strategy-academy/data/lessons/variants/standard","kind":"search","tool":"Grep","selfTokens":635,"reads":1,"trips":168,"billed":11947,"perRead":11947,"share":0.00042337651740655385},{"attr":"file:f:\\code\\dezhou\\src\\features\\strategy-academy\\data","label":"src/features/strategy-academy/data","kind":"search","tool":"Grep","selfTokens":581,"reads":1,"trips":170,"billed":11060,"perRead":11060,"share":0.0003919582157700798},{"attr":"file:f:\\code\\dezhou","label":"f:/code/dezhou","kind":"search","tool":"Grep","selfTokens":330,"reads":1,"trips":274,"billed":10099,"perRead":10099,"share":0.0003579012883336023},{"attr":"file:C:\\Users\\24533\\.qoder-cn\\tmp\\F--code-dezhou\\tool-outputs\\session-29d86d15-6bea-4b54-bf8a-f16185376110\\b81iiakij.output","label":"C:/Users/24533/.qoder-cn/tmp/F--code-dezhou/tool-outputs/session-29d86d15-6bea-4b54-bf8a-f16185376110/b81iiakij.output","kind":"search","tool":"Grep","selfTokens":235,"reads":1,"trips":360,"billed":9465,"perRead":9465,"share":0.0003354323567892467},{"attr":"file:f:\\code\\dezhou\\src\\features\\progress\\types.ts","label":"src/features/progress/types.ts","kind":"read","tool":"Read","selfTokens":399,"reads":1,"trips":208,"billed":9279,"perRead":9279,"share":0.0003288551228534855},{"attr":"file:f:\\code\\dezhou\\components.json","label":"components.json","kind":"read","tool":"Read","selfTokens":134,"reads":1,"trips":580,"billed":8831,"perRead":8831,"share":0.00031297978569366677},{"attr":"file:f:\\code\\dezhou\\src\\features\\progress\\components\\gate\\OnboardingGate.tsx","label":"src/features/progress/components/gate/OnboardingGate.tsx","kind":"read","tool":"Read","selfTokens":328,"reads":1,"trips":214,"billed":7847,"perRead":7847,"share":0.0002780739157574454},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\academy\\AcademyMasteryCard.test.tsx","label":"src/shared/components/academy/AcademyMasteryCard.test.tsx","kind":"search","tool":"Grep","selfTokens":145,"reads":1,"trips":428,"billed":6968,"perRead":6968,"share":0.00024692307270511495},{"attr":"file:C:\\Users\\24533\\.qoder-cn\\tmp\\F--code-dezhou\\tool-outputs\\session-29d86d15-6bea-4b54-bf8a-f16185376110\\b0zrgqe6j.output","label":"C:/Users/24533/.qoder-cn/tmp/F--code-dezhou/tool-outputs/session-29d86d15-6bea-4b54-bf8a-f16185376110/b0zrgqe6j.output","kind":"search","tool":"Grep","selfTokens":235,"reads":1,"trips":230,"billed":6039,"perRead":6039,"share":0.0002140143312521466},{"attr":"file:C:\\Users\\24533\\.qoder-cn\\tmp\\F--code-dezhou\\tool-outputs\\session-29d86d15-6bea-4b54-bf8a-f16185376110\\b2wvplvfk.output","label":"C:/Users/24533/.qoder-cn/tmp/F--code-dezhou/tool-outputs/session-29d86d15-6bea-4b54-bf8a-f16185376110/b2wvplvfk.output","kind":"search","tool":"Grep","selfTokens":133,"reads":1,"trips":402,"billed":5995,"perRead":5995,"share":0.00021245104674711706},{"attr":"file:f:\\code\\dezhou\\src\\features\\strategy-academy\\components\\StrategyBookmarksPage.test.tsx","label":"src/features/strategy-academy/components/StrategyBookmarksPage.test.tsx","kind":"search","tool":"Grep","selfTokens":119,"reads":1,"trips":426,"billed":5691,"perRead":5691,"share":0.00020168317619884038},{"attr":"file:f:\\code\\dezhou\\src\\features\\strategy-academy\\components\\AcademyResume.tsx","label":"src/features/strategy-academy/components/AcademyResume.tsx","kind":"write","tool":"Edit","selfTokens":100,"reads":1,"trips":394,"billed":4415,"perRead":4415,"share":0.00015647537268348498},{"attr":"file:f:\\code\\dezhou\\src\\features\\strategy-academy\\components\\ConceptGraph.tsx","label":"src/features/strategy-academy/components/ConceptGraph.tsx","kind":"write","tool":"Edit","selfTokens":99,"reads":1,"trips":394,"billed":4371,"perRead":4371,"share":0.00015491061895665017},{"attr":"file:f:\\code\\dezhou\\src\\features\\theory-academy\\components\\TheoryResume.tsx","label":"src/features/theory-academy/components/TheoryResume.tsx","kind":"write","tool":"Edit","selfTokens":98,"reads":1,"trips":394,"billed":4327,"perRead":4327,"share":0.00015334586522981536},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\layout\\BackLink.test.tsx","label":"src/shared/components/layout/BackLink.test.tsx","kind":"write","tool":"Edit","selfTokens":126,"reads":1,"trips":294,"billed":4140,"perRead":4140,"share":0.00014670356635699535},{"attr":"file:f:\\code\\dezhou\\src\\shared\\components\\data-display\\ProgressRing.test.tsx","label":"src/shared/components/data-display/ProgressRing.test.tsx","kind":"write","tool":"Edit","selfTokens":83,"reads":1,"trips":394,"billed":3665,"perRead":3665,"share":0.0001298745593272926},{"attr":"file:C:\\Users\\24533\\.qoder-cn\\tmp\\F--code-dezhou\\tool-outputs\\session-29d86d15-6bea-4b54-bf8a-f16185376110\\b2me5ptj8.output","label":"C:/Users/24533/.qoder-cn/tmp/F--code-dezhou/tool-outputs/session-29d86d15-6bea-4b54-bf8a-f16185376110/b2me5ptj8.output","kind":"search","tool":"Grep","selfTokens":94,"reads":1,"trips":256,"billed":2687,"perRead":2687,"share":0.00009521077746010979},{"attr":"file:f:\\code\\dezhou\\src\\features\\pot-odds\\components\\PotOddsQuizPage.test.tsx","label":"src/features/pot-odds/components/PotOddsQuizPage.test.tsx","kind":"search","tool":"Grep","selfTokens":65,"reads":1,"trips":286,"billed":2077,"perRead":2077,"share":0.00007360639465725199},{"attr":"file:f:\\code\\dezhou\\src\\layouts","label":"src/layouts","kind":"search","tool":"Grep","selfTokens":116,"reads":1,"trips":104,"billed":1353,"perRead":1353,"share":0.00004795878774600092},{"attr":"file:f:\\code\\dezhou\\src\\shared\\constants\\app.ts","label":"src/shared/constants/app.ts","kind":"search","tool":"Grep","selfTokens":55,"reads":1,"trips":212,"billed":1304,"perRead":1304,"share":0.00004619584628633504},{"attr":"file:C:\\Users\\24533\\AppData\\Local\\Temp\\qoder-cli-cn\\F--code-dezhou\\aa9c0ded-c4f6-4c04-8722-1b5bc0020ac8\\tasks\\bbz9c0gkd.output","label":"C:/Users/24533/AppData/Local/Temp/qoder-cli-cn/F--code-dezhou/aa9c0ded-c4f6-4c04-8722-1b5bc0020ac8/tasks/bbz9c0gkd.output","kind":"read","tool":"Read","selfTokens":55,"reads":1,"trips":202,"billed":1243,"perRead":1243,"share":0.000044033722983301106},{"attr":"file:DESIGN.md","label":"DESIGN.md","kind":"search","tool":"Glob","selfTokens":8,"reads":1,"trips":580,"billed":527,"perRead":527,"share":0.00001868536033992039},{"attr":"file:C:\\Users\\24533\\.qoder-cn\\tmp\\F--code-dezhou\\tool-outputs\\session-29d86d15-6bea-4b54-bf8a-f16185376110\\bbm80isbb.output","label":"C:/Users/24533/.qoder-cn/tmp/F--code-dezhou/tool-outputs/session-29d86d15-6bea-4b54-bf8a-f16185376110/bbm80isbb.output","kind":"search","tool":"Grep","selfTokens":94,"reads":1,"trips":10,"billed":106,"perRead":106,"share":0.0000037481072916710263},{"attr":"file:C:\\Users\\24533\\.qoder-cn\\tmp\\F--code-dezhou\\tool-outputs\\session-29d86d15-6bea-4b54-bf8a-f16185376110\\b1m78m20r.output","label":"C:/Users/24533/.qoder-cn/tmp/F--code-dezhou/tool-outputs/session-29d86d15-6bea-4b54-bf8a-f16185376110/b1m78m20r.output","kind":"search","tool":"Grep","selfTokens":235,"reads":1,"trips":4,"billed":106,"perRead":106,"share":0.00000374945035732206}],"byAttr":[{"attr":"assistant_thinking","tokens":8461702,"share":0.29987619098527885},{"attr":"tool_result|Read","tokens":5449075,"share":0.19311099560511102},{"attr":"attachment","tokens":2875622,"share":0.10190983045993018},{"attr":"tool_result|Bash","tokens":1991831,"share":0.07058895629894756},{"attr":"tool_result|SearchWorkspace","tokens":1617569,"share":0.057325386023629306},{"attr":"tool_result|Grep","tokens":1460972,"share":0.05177570646850405},{"attr":"tool_result|Agent","tokens":1157361,"share":0.04101598710309484},{"attr":"tool_use|Edit","tokens":1105734,"share":0.03918636019923126},{"attr":"tool_use|Write","tokens":720152,"share":0.025521618484160517},{"attr":"tool_use|Agent","tokens":626879,"share":0.022216090166819493},{"attr":"tool_result|SearchKnowledge","tokens":606392,"share":0.021490051789351095},{"attr":"tool_result|ExitPlanMode","tokens":450684,"share":0.01597188425339159},{"attr":"tool_use|Bash","tokens":302737,"share":0.010728757169191467},{"attr":"assistant_text","tokens":262275,"share":0.009294838672516894},{"attr":"tool_result|mcp_call","tokens":188296,"share":0.006673050485040561},{"attr":"tool_result|Edit","tokens":176046,"share":0.006238926005155175},{"attr":"user_input","tokens":167450,"share":0.005934306753765889},{"attr":"tool_result|Glob","tokens":159888,"share":0.005666307046729034},{"attr":"tool_use|Read","tokens":113133,"share":0.004009355325835382},{"attr":"tool_use|Grep","tokens":103720,"share":0.0036757511092880167},{"attr":"tool_use|mcp_call","tokens":63535,"share":0.0022516486479266565},{"attr":"tool_use|SearchWorkspace","tokens":50474,"share":0.0017887464435507243},{"attr":"tool_use|AskUserQuestion","tokens":36939,"share":0.001309099775783191},{"attr":"tool_result|Write","tokens":16511,"share":0.0005851544547083404},{"attr":"tool_result|mcp_list","tokens":14927,"share":0.0005290186690019696},{"attr":"tool_result|mcp_get","tokens":14115,"share":0.0005002243847739105},{"attr":"tool_result|AskUserQuestion","tokens":7221,"share":0.0002558983406619807},{"attr":"tool_use|Skill","tokens":3926,"share":0.00013913234451571528},{"attr":"tool_use|SearchKnowledge","tokens":3527,"share":0.00012498329253106635},{"attr":"tool_use|ExitPlanMode","tokens":2893,"share":0.00010251984137856488},{"attr":"tool_use|Glob","tokens":1985,"share":0.00007034016473411901},{"attr":"tool_use|mcp_get","tokens":1074,"share":0.00003805193418248448},{"attr":"tool_result|Skill","tokens":998,"share":0.000035372629961622546},{"attr":"tool_use|mcp__browser-use__evaluate_script","tokens":711,"share":0.000025180246655608332},{"attr":"tool_use|mcp_list","tokens":311,"share":0.000011021222270874364},{"attr":"tool_result|UpdateGoal","tokens":195,"share":0.000006908140429721837},{"attr":"tool_result|mcp__browser-use__navigate_page</｜｜DSML｜｜ parameter>\n<｜｜DSML｜｜ parameter name=","tokens":129,"share":0.000004554239080000609},{"attr":"tool_use|UpdateGoal","tokens":122,"share":0.000004317587768576149},{"attr":"tool_result|mcp__browser-use__evaluate_script","tokens":121,"share":0.000004299798990555221},{"attr":"tool_result|mcp__browser-use__press_key","tokens":44,"share":0.0000015532928450271065},{"attr":"tool_use|mcp__browser-use__press_key","tokens":24,"share":8.363884550145956e-7},{"attr":"tool_result|TaskStop","tokens":16,"share":5.505428048145414e-7},{"attr":"tool_use|mcp__browser-use__navigate_page</｜｜DSML｜｜ parameter>\n<｜｜DSML｜｜ parameter name=","tokens":5,"share":1.75163041538485e-7},{"attr":"tool_use|TaskStop","tokens":1,"share":4.787328737517752e-8},{"attr":"system","tokens":0,"share":0}],"byRequest":[{"index":1,"time":"16:14","ratio":0.039379,"inputTokens":7876,"outputTokens":null,"usageSource":"transcript-ratio","credits":1.866,"originalCredits":1.866,"afterCompact":false},{"index":2,"time":"16:14","ratio":0.051733,"inputTokens":10347,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.722,"originalCredits":0.722,"afterCompact":false},{"index":3,"time":"16:15","ratio":0.06558,"inputTokens":13116,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.81,"originalCredits":0.81,"afterCompact":false},{"index":4,"time":"16:15","ratio":0.068907,"inputTokens":13781,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.23,"originalCredits":0.23,"afterCompact":false},{"index":5,"time":"16:15","ratio":0.073636,"inputTokens":14727,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.314,"originalCredits":0.314,"afterCompact":false},{"index":6,"time":"16:15","ratio":0.081137,"inputTokens":16227,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.643,"originalCredits":0.643,"afterCompact":false},{"index":7,"time":"16:15","ratio":0.090698,"inputTokens":18140,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.581,"originalCredits":0.581,"afterCompact":false},{"index":8,"time":"16:15","ratio":0.095248,"inputTokens":19050,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.327,"originalCredits":0.327,"afterCompact":false},{"index":9,"time":"16:15","ratio":0.100797,"inputTokens":20159,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.402,"originalCredits":0.402,"afterCompact":false},{"index":10,"time":"16:15","ratio":0.106571,"inputTokens":21314,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.432,"originalCredits":0.432,"afterCompact":false},{"index":11,"time":"16:16","ratio":0.118384,"inputTokens":23677,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.733,"originalCredits":0.733,"afterCompact":false},{"index":12,"time":"16:16","ratio":0.125914,"inputTokens":25183,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.579,"originalCredits":0.579,"afterCompact":false},{"index":13,"time":"16:19","ratio":0.154315,"inputTokens":30863,"outputTokens":null,"usageSource":"transcript-ratio","credits":1.835,"originalCredits":1.835,"afterCompact":false},{"index":14,"time":"16:19","ratio":0.164636,"inputTokens":32927,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.638,"originalCredits":0.638,"afterCompact":false},{"index":15,"time":"16:19","ratio":0.168564,"inputTokens":33713,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.967,"originalCredits":0.967,"afterCompact":false},{"index":16,"time":"16:20","ratio":0.176255,"inputTokens":35251,"outputTokens":null,"usageSource":"transcript-ratio","credits":1.217,"originalCredits":1.217,"afterCompact":false},{"index":17,"time":"16:20","ratio":0.182326,"inputTokens":36465,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.239,"originalCredits":0.239,"afterCompact":false},{"index":18,"time":"16:20","ratio":0.189788,"inputTokens":37958,"outputTokens":null,"usageSource":"transcript-ratio","credits":1.088,"originalCredits":1.088,"afterCompact":false},{"index":19,"time":"16:20","ratio":0.195668,"inputTokens":39134,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.349,"originalCredits":0.349,"afterCompact":false},{"index":20,"time":"16:20","ratio":0.197937,"inputTokens":39587,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.36,"originalCredits":0.36,"afterCompact":false},{"index":21,"time":"16:21","ratio":0.198866,"inputTokens":39773,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.272,"originalCredits":0.272,"afterCompact":false},{"index":22,"time":"16:21","ratio":0.202239,"inputTokens":40448,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.569,"originalCredits":0.569,"afterCompact":false},{"index":23,"time":"16:22","ratio":0.205708,"inputTokens":41142,"outputTokens":null,"usageSource":"transcript-ratio","credits":2.688,"originalCredits":2.688,"afterCompact":false},{"index":24,"time":"16:23","ratio":0.220519,"inputTokens":44104,"outputTokens":null,"usageSource":"transcript-ratio","credits":2.056,"originalCredits":2.056,"afterCompact":false},{"index":25,"time":"16:25","ratio":0.231899,"inputTokens":46380,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.854,"originalCredits":0.854,"afterCompact":false},{"index":26,"time":"16:31","ratio":0.24215,"inputTokens":48430,"outputTokens":null,"usageSource":"transcript-ratio","credits":1.478,"originalCredits":1.478,"afterCompact":false},{"index":27,"time":"16:34","ratio":0.253762,"inputTokens":50752,"outputTokens":null,"usageSource":"transcript-ratio","credits":2.131,"originalCredits":2.131,"afterCompact":false},{"index":28,"time":"16:34","ratio":0.265155,"inputTokens":53031,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.516,"originalCredits":0.516,"afterCompact":false},{"index":29,"time":"16:36","ratio":0.266279,"inputTokens":53256,"outputTokens":null,"usageSource":"transcript-ratio","credits":2.202,"originalCredits":2.202,"afterCompact":false},{"index":30,"time":"16:38","ratio":0.27846,"inputTokens":55692,"outputTokens":null,"usageSource":"transcript-ratio","credits":4.067,"originalCredits":4.067,"afterCompact":false},{"index":31,"time":"16:38","ratio":0.299704,"inputTokens":59941,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.948,"originalCredits":0.948,"afterCompact":false},{"index":32,"time":"16:38","ratio":0.303552,"inputTokens":60710,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.323,"originalCredits":0.323,"afterCompact":false},{"index":33,"time":"16:39","ratio":0.303862,"inputTokens":60772,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.633,"originalCredits":0.633,"afterCompact":false},{"index":34,"time":"16:39","ratio":0.305903,"inputTokens":61181,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.345,"originalCredits":0.345,"afterCompact":false},{"index":35,"time":"16:39","ratio":0.306412,"inputTokens":61282,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.31,"originalCredits":0.31,"afterCompact":false},{"index":36,"time":"16:39","ratio":0.307352,"inputTokens":61470,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.393,"originalCredits":0.393,"afterCompact":false},{"index":37,"time":"16:39","ratio":0.307943,"inputTokens":61589,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.442,"originalCredits":0.442,"afterCompact":false},{"index":38,"time":"16:39","ratio":0.30889,"inputTokens":61778,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.498,"originalCredits":0.498,"afterCompact":false},{"index":39,"time":"16:39","ratio":0.310607,"inputTokens":62121,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.498,"originalCredits":0.498,"afterCompact":false},{"index":40,"time":"16:39","ratio":0.31193,"inputTokens":62386,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.598,"originalCredits":0.598,"afterCompact":false},{"index":41,"time":"16:40","ratio":0.31383,"inputTokens":62766,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.338,"originalCredits":0.338,"afterCompact":false},{"index":42,"time":"16:40","ratio":0.314163,"inputTokens":62833,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.55,"originalCredits":0.55,"afterCompact":false},{"index":43,"time":"16:40","ratio":0.3157,"inputTokens":63140,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.553,"originalCredits":0.553,"afterCompact":false},{"index":44,"time":"16:40","ratio":0.317248,"inputTokens":63450,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.356,"originalCredits":0.356,"afterCompact":false},{"index":45,"time":"16:40","ratio":0.317678,"inputTokens":63536,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.55,"originalCredits":0.55,"afterCompact":false},{"index":46,"time":"16:40","ratio":0.319236,"inputTokens":63847,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.33,"originalCredits":0.33,"afterCompact":false},{"index":47,"time":"16:40","ratio":0.319493,"inputTokens":63899,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.324,"originalCredits":0.324,"afterCompact":false},{"index":48,"time":"16:40","ratio":0.320396,"inputTokens":64079,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.373,"originalCredits":0.373,"afterCompact":false},{"index":49,"time":"16:40","ratio":0.320757,"inputTokens":64151,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.616,"originalCredits":0.616,"afterCompact":false},{"index":50,"time":"16:41","ratio":0.322711,"inputTokens":64542,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.389,"originalCredits":0.389,"afterCompact":false},{"index":51,"time":"16:41","ratio":0.325434,"inputTokens":65087,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.966,"originalCredits":0.966,"afterCompact":false},{"index":52,"time":"16:41","ratio":0.328753,"inputTokens":65751,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.344,"originalCredits":0.344,"afterCompact":false},{"index":53,"time":"16:41","ratio":0.329057,"inputTokens":65811,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.384,"originalCredits":0.384,"afterCompact":false},{"index":54,"time":"16:41","ratio":0.329576,"inputTokens":65915,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.621,"originalCredits":0.621,"afterCompact":false},{"index":55,"time":"16:42","ratio":0.331422,"inputTokens":66284,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.598,"originalCredits":0.598,"afterCompact":false},{"index":56,"time":"16:42","ratio":0.333254,"inputTokens":66651,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.363,"originalCredits":0.363,"afterCompact":false},{"index":57,"time":"16:42","ratio":0.333734,"inputTokens":66747,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.564,"originalCredits":0.564,"afterCompact":false},{"index":58,"time":"16:42","ratio":0.335363,"inputTokens":67073,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.697,"originalCredits":0.697,"afterCompact":false},{"index":59,"time":"16:42","ratio":0.3376,"inputTokens":67520,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.36,"originalCredits":0.36,"afterCompact":false},{"index":60,"time":"16:42","ratio":0.33795,"inputTokens":67590,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.429,"originalCredits":0.429,"afterCompact":false},{"index":61,"time":"16:42","ratio":0.338691,"inputTokens":67738,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.522,"originalCredits":0.522,"afterCompact":false},{"index":62,"time":"16:43","ratio":0.339928,"inputTokens":67986,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.585,"originalCredits":0.585,"afterCompact":false},{"index":63,"time":"16:43","ratio":0.341524,"inputTokens":68305,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.412,"originalCredits":0.412,"afterCompact":false},{"index":64,"time":"16:43","ratio":0.342155,"inputTokens":68431,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.665,"originalCredits":0.665,"afterCompact":false},{"index":65,"time":"16:43","ratio":0.350565,"inputTokens":70113,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.64,"originalCredits":0.64,"afterCompact":false},{"index":66,"time":"16:43","ratio":0.350861,"inputTokens":70172,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.778,"originalCredits":0.778,"afterCompact":false},{"index":67,"time":"16:43","ratio":0.35353,"inputTokens":70706,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.862,"originalCredits":0.862,"afterCompact":false},{"index":68,"time":"16:44","ratio":0.356591,"inputTokens":71318,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.422,"originalCredits":0.422,"afterCompact":false},{"index":69,"time":"16:44","ratio":0.357224,"inputTokens":71445,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.371,"originalCredits":0.371,"afterCompact":false},{"index":70,"time":"16:44","ratio":0.358388,"inputTokens":71678,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.544,"originalCredits":0.544,"afterCompact":false},{"index":71,"time":"16:44","ratio":0.359421,"inputTokens":71884,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.426,"originalCredits":0.426,"afterCompact":false},{"index":72,"time":"16:44","ratio":0.369706,"inputTokens":73941,"outputTokens":null,"usageSource":"transcript-ratio","credits":1.186,"originalCredits":1.186,"afterCompact":false},{"index":73,"time":"16:45","ratio":0.37234,"inputTokens":74468,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.792,"originalCredits":0.792,"afterCompact":false},{"index":74,"time":"16:45","ratio":0.375195,"inputTokens":75039,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.491,"originalCredits":0.491,"afterCompact":false},{"index":75,"time":"16:45","ratio":0.376212,"inputTokens":75242,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.424,"originalCredits":0.424,"afterCompact":false},{"index":76,"time":"16:45","ratio":0.376876,"inputTokens":75375,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.52,"originalCredits":0.52,"afterCompact":false},{"index":77,"time":"16:45","ratio":0.378236,"inputTokens":75647,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.472,"originalCredits":0.472,"afterCompact":false},{"index":78,"time":"16:45","ratio":0.379211,"inputTokens":75842,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.458,"originalCredits":0.458,"afterCompact":false},{"index":79,"time":"16:45","ratio":0.380532,"inputTokens":76106,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.412,"originalCredits":0.412,"afterCompact":false},{"index":80,"time":"16:45","ratio":0.38102,"inputTokens":76204,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.392,"originalCredits":0.392,"afterCompact":false},{"index":81,"time":"16:45","ratio":0.381466,"inputTokens":76293,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.387,"originalCredits":0.387,"afterCompact":false},{"index":82,"time":"16:46","ratio":0.382509,"inputTokens":76502,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.437,"originalCredits":0.437,"afterCompact":false},{"index":83,"time":"16:46","ratio":0.383421,"inputTokens":76684,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.424,"originalCredits":0.424,"afterCompact":false},{"index":84,"time":"16:46","ratio":0.384493,"inputTokens":76899,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.647,"originalCredits":0.647,"afterCompact":false},{"index":85,"time":"16:47","ratio":0.389193,"inputTokens":77839,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.706,"originalCredits":0.706,"afterCompact":false},{"index":86,"time":"16:47","ratio":0.390745,"inputTokens":78149,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.663,"originalCredits":0.663,"afterCompact":false},{"index":87,"time":"16:47","ratio":0.39298,"inputTokens":78596,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.78,"originalCredits":0.78,"afterCompact":false},{"index":88,"time":"16:47","ratio":0.395563,"inputTokens":79113,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.417,"originalCredits":0.417,"afterCompact":false},{"index":89,"time":"16:47","ratio":0.396044,"inputTokens":79209,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.43,"originalCredits":0.43,"afterCompact":false},{"index":90,"time":"16:47","ratio":0.396632,"inputTokens":79326,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.414,"originalCredits":0.414,"afterCompact":false},{"index":91,"time":"16:47","ratio":0.397304,"inputTokens":79461,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.452,"originalCredits":0.452,"afterCompact":false},{"index":92,"time":"16:49","ratio":0.399305,"inputTokens":79861,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.477,"originalCredits":0.477,"afterCompact":false},{"index":93,"time":"16:49","ratio":0.3999,"inputTokens":79980,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.404,"originalCredits":0.404,"afterCompact":false},{"index":94,"time":"16:49","ratio":0.40062,"inputTokens":80124,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.421,"originalCredits":0.421,"afterCompact":false},{"index":95,"time":"16:49","ratio":0.401387,"inputTokens":80277,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.485,"originalCredits":0.485,"afterCompact":false},{"index":96,"time":"16:49","ratio":0.403977,"inputTokens":80795,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.664,"originalCredits":0.664,"afterCompact":false},{"index":97,"time":"16:49","ratio":0.405733,"inputTokens":81147,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.463,"originalCredits":0.463,"afterCompact":false},{"index":98,"time":"16:50","ratio":0.406645,"inputTokens":81329,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.431,"originalCredits":0.431,"afterCompact":false},{"index":99,"time":"16:50","ratio":0.407431,"inputTokens":81486,"outputTokens":null,"usageSource":"transcript-ratio","credits":1.162,"originalCredits":1.162,"afterCompact":false},{"index":100,"time":"16:50","ratio":0.41286,"inputTokens":82572,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.91,"originalCredits":0.91,"afterCompact":false},{"index":101,"time":"17:04","ratio":0.428514,"inputTokens":85703,"outputTokens":null,"usageSource":"transcript-ratio","credits":1.074,"originalCredits":1.074,"afterCompact":false},{"index":102,"time":"17:04","ratio":0.431966,"inputTokens":86393,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.577,"originalCredits":0.577,"afterCompact":false},{"index":103,"time":"17:04","ratio":0.437247,"inputTokens":87449,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.967,"originalCredits":0.967,"afterCompact":false},{"index":104,"time":"17:04","ratio":0.439811,"inputTokens":87962,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.515,"originalCredits":0.515,"afterCompact":false},{"index":105,"time":"17:05","ratio":0.441882,"inputTokens":88376,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.574,"originalCredits":0.574,"afterCompact":false},{"index":106,"time":"17:05","ratio":0.443987,"inputTokens":88797,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.504,"originalCredits":0.504,"afterCompact":false},{"index":107,"time":"17:05","ratio":0.444956,"inputTokens":88991,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.447,"originalCredits":0.447,"afterCompact":false},{"index":108,"time":"17:05","ratio":0.445751,"inputTokens":89150,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.449,"originalCredits":0.449,"afterCompact":false},{"index":109,"time":"17:05","ratio":0.446261,"inputTokens":89252,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.867,"originalCredits":0.867,"afterCompact":false},{"index":110,"time":"17:17","ratio":0.460752,"inputTokens":92150,"outputTokens":null,"usageSource":"transcript-ratio","credits":1.008,"originalCredits":1.008,"afterCompact":false},{"index":111,"time":"17:18","ratio":0.462542,"inputTokens":92508,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.574,"originalCredits":0.574,"afterCompact":false},{"index":112,"time":"17:18","ratio":0.465869,"inputTokens":93174,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.611,"originalCredits":0.611,"afterCompact":false},{"index":113,"time":"17:20","ratio":0.466985,"inputTokens":93397,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.484,"originalCredits":0.484,"afterCompact":false},{"index":114,"time":"17:20","ratio":0.467461,"inputTokens":93492,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.493,"originalCredits":0.493,"afterCompact":false},{"index":115,"time":"17:20","ratio":0.467994,"inputTokens":93599,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.503,"originalCredits":0.503,"afterCompact":false},{"index":116,"time":"17:21","ratio":0.469367,"inputTokens":93873,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.519,"originalCredits":0.519,"afterCompact":false},{"index":117,"time":"17:21","ratio":0.470529,"inputTokens":94106,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.504,"originalCredits":0.504,"afterCompact":false},{"index":118,"time":"17:21","ratio":0.471544,"inputTokens":94309,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.957,"originalCredits":0.957,"afterCompact":false},{"index":119,"time":"17:22","ratio":0.47477,"inputTokens":94954,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.963,"originalCredits":0.963,"afterCompact":false},{"index":120,"time":"17:22","ratio":0.47777,"inputTokens":95554,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.738,"originalCredits":0.738,"afterCompact":false},{"index":121,"time":"17:22","ratio":0.479538,"inputTokens":95908,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.617,"originalCredits":0.617,"afterCompact":false},{"index":122,"time":"17:22","ratio":0.480626,"inputTokens":96125,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.599,"originalCredits":0.599,"afterCompact":false},{"index":123,"time":"17:22","ratio":0.481566,"inputTokens":96313,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.483,"originalCredits":0.483,"afterCompact":false},{"index":124,"time":"17:23","ratio":0.482122,"inputTokens":96424,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.943,"originalCredits":0.943,"afterCompact":false},{"index":125,"time":"17:23","ratio":0.487211,"inputTokens":97442,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.619,"originalCredits":0.619,"afterCompact":false},{"index":126,"time":"17:23","ratio":0.489201,"inputTokens":97840,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.585,"originalCredits":0.585,"afterCompact":false},{"index":127,"time":"17:23","ratio":0.489703,"inputTokens":97941,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.538,"originalCredits":0.538,"afterCompact":false},{"index":128,"time":"17:23","ratio":0.490255,"inputTokens":98051,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.532,"originalCredits":0.532,"afterCompact":false},{"index":129,"time":"17:26","ratio":0.490795,"inputTokens":98159,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.475,"originalCredits":0.475,"afterCompact":false},{"index":130,"time":"17:26","ratio":0.491557,"inputTokens":98311,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.606,"originalCredits":0.606,"afterCompact":false},{"index":131,"time":"17:26","ratio":0.492343,"inputTokens":98469,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.556,"originalCredits":0.556,"afterCompact":false},{"index":132,"time":"17:26","ratio":0.493001,"inputTokens":98600,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.511,"originalCredits":0.511,"afterCompact":false},{"index":133,"time":"17:27","ratio":0.494709,"inputTokens":98942,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.559,"originalCredits":0.559,"afterCompact":false},{"index":134,"time":"17:27","ratio":0.495132,"inputTokens":99026,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.476,"originalCredits":0.476,"afterCompact":false},{"index":135,"time":"17:27","ratio":0.495459,"inputTokens":99092,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.493,"originalCredits":0.493,"afterCompact":false},{"index":136,"time":"17:27","ratio":0.496305,"inputTokens":99261,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.574,"originalCredits":0.574,"afterCompact":false},{"index":137,"time":"17:30","ratio":0.496982,"inputTokens":99396,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.793,"originalCredits":0.793,"afterCompact":false},{"index":138,"time":"10:22","ratio":0.49918,"inputTokens":99836,"outputTokens":null,"usageSource":"transcript-ratio","credits":22.645,"originalCredits":22.645,"afterCompact":false},{"index":139,"time":"10:23","ratio":0.508804,"inputTokens":101761,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.849,"originalCredits":0.849,"afterCompact":false},{"index":140,"time":"10:23","ratio":0.515939,"inputTokens":103188,"outputTokens":null,"usageSource":"transcript-ratio","credits":1.209,"originalCredits":1.209,"afterCompact":false},{"index":141,"time":"10:23","ratio":0.519655,"inputTokens":103931,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.598,"originalCredits":0.598,"afterCompact":false},{"index":142,"time":"10:23","ratio":0.520213,"inputTokens":104043,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.773,"originalCredits":0.773,"afterCompact":false},{"index":143,"time":"10:23","ratio":0.521976,"inputTokens":104395,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.56,"originalCredits":0.56,"afterCompact":false},{"index":144,"time":"10:23","ratio":0.52256,"inputTokens":104512,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.709,"originalCredits":0.709,"afterCompact":false},{"index":145,"time":"10:24","ratio":0.524229,"inputTokens":104846,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.724,"originalCredits":0.724,"afterCompact":false},{"index":146,"time":"10:24","ratio":0.526822,"inputTokens":105364,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.588,"originalCredits":0.588,"afterCompact":false},{"index":147,"time":"10:24","ratio":0.527227,"inputTokens":105445,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.528,"originalCredits":0.528,"afterCompact":false},{"index":148,"time":"10:25","ratio":0.527659,"inputTokens":105532,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.947,"originalCredits":0.947,"afterCompact":false},{"index":149,"time":"10:33","ratio":0.533123,"inputTokens":106625,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.662,"originalCredits":0.662,"afterCompact":false},{"index":150,"time":"10:34","ratio":0.536128,"inputTokens":107226,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.972,"originalCredits":0.972,"afterCompact":false},{"index":151,"time":"10:34","ratio":0.538257,"inputTokens":107651,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.873,"originalCredits":0.873,"afterCompact":false},{"index":152,"time":"10:34","ratio":0.540607,"inputTokens":108121,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.566,"originalCredits":0.566,"afterCompact":false},{"index":153,"time":"10:34","ratio":0.544973,"inputTokens":108995,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.933,"originalCredits":0.933,"afterCompact":false},{"index":154,"time":"10:34","ratio":0.5468,"inputTokens":109360,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.633,"originalCredits":0.633,"afterCompact":false},{"index":155,"time":"10:35","ratio":0.549128,"inputTokens":109826,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.871,"originalCredits":0.871,"afterCompact":false},{"index":156,"time":"10:35","ratio":0.55096,"inputTokens":110192,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.544,"originalCredits":0.544,"afterCompact":false},{"index":157,"time":"10:35","ratio":0.551557,"inputTokens":110311,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.607,"originalCredits":0.607,"afterCompact":false},{"index":158,"time":"10:35","ratio":0.55341,"inputTokens":110682,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.698,"originalCredits":0.698,"afterCompact":false},{"index":159,"time":"10:37","ratio":0.557187,"inputTokens":111437,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.848,"originalCredits":0.848,"afterCompact":false},{"index":160,"time":"10:37","ratio":0.558723,"inputTokens":111745,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.714,"originalCredits":0.714,"afterCompact":false},{"index":161,"time":"10:37","ratio":0.559908,"inputTokens":111982,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.792,"originalCredits":0.792,"afterCompact":false},{"index":162,"time":"10:37","ratio":0.561692,"inputTokens":112338,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.565,"originalCredits":0.565,"afterCompact":false},{"index":163,"time":"10:38","ratio":0.56394,"inputTokens":112788,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.649,"originalCredits":0.649,"afterCompact":false},{"index":164,"time":"10:38","ratio":0.564337,"inputTokens":112867,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.617,"originalCredits":0.617,"afterCompact":false},{"index":165,"time":"10:39","ratio":0.565686,"inputTokens":113137,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.57,"originalCredits":0.57,"afterCompact":false},{"index":166,"time":"10:39","ratio":0.565966,"inputTokens":113193,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.801,"originalCredits":0.801,"afterCompact":false},{"index":167,"time":"10:39","ratio":0.569239,"inputTokens":113848,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.634,"originalCredits":0.634,"afterCompact":false},{"index":168,"time":"10:40","ratio":0.570139,"inputTokens":114028,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.614,"originalCredits":0.614,"afterCompact":false},{"index":169,"time":"10:40","ratio":0.571424,"inputTokens":114285,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.659,"originalCredits":0.659,"afterCompact":false},{"index":170,"time":"10:40","ratio":0.572938,"inputTokens":114588,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.605,"originalCredits":0.605,"afterCompact":false},{"index":171,"time":"10:40","ratio":0.574227,"inputTokens":114845,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.648,"originalCredits":0.648,"afterCompact":false},{"index":172,"time":"10:40","ratio":0.575351,"inputTokens":115070,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.57,"originalCredits":0.57,"afterCompact":false},{"index":173,"time":"10:41","ratio":0.57597,"inputTokens":115194,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.56,"originalCredits":0.56,"afterCompact":false},{"index":174,"time":"10:41","ratio":0.576368,"inputTokens":115274,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.578,"originalCredits":0.578,"afterCompact":false},{"index":175,"time":"10:41","ratio":0.577118,"inputTokens":115424,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.571,"originalCredits":0.571,"afterCompact":false},{"index":176,"time":"10:41","ratio":0.57809,"inputTokens":115618,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.575,"originalCredits":0.575,"afterCompact":false},{"index":177,"time":"10:41","ratio":0.578487,"inputTokens":115697,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.55,"originalCredits":0.55,"afterCompact":false},{"index":178,"time":"10:44","ratio":0.579443,"inputTokens":115889,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.586,"originalCredits":0.586,"afterCompact":false},{"index":179,"time":"10:44","ratio":0.580013,"inputTokens":116003,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.556,"originalCredits":0.556,"afterCompact":false},{"index":180,"time":"10:44","ratio":0.580865,"inputTokens":116173,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.586,"originalCredits":0.586,"afterCompact":false},{"index":181,"time":"10:44","ratio":0.581653,"inputTokens":116331,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.575,"originalCredits":0.575,"afterCompact":false},{"index":182,"time":"10:44","ratio":0.582131,"inputTokens":116426,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.551,"originalCredits":0.551,"afterCompact":false},{"index":183,"time":"10:44","ratio":0.582551,"inputTokens":116510,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.555,"originalCredits":0.555,"afterCompact":false},{"index":184,"time":"10:44","ratio":0.582896,"inputTokens":116579,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.606,"originalCredits":0.606,"afterCompact":false},{"index":185,"time":"10:44","ratio":0.583349,"inputTokens":116670,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.638,"originalCredits":0.638,"afterCompact":false},{"index":186,"time":"10:50","ratio":0.583983,"inputTokens":116797,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.684,"originalCredits":0.684,"afterCompact":false},{"index":187,"time":"10:50","ratio":0.587248,"inputTokens":117450,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.708,"originalCredits":0.708,"afterCompact":false},{"index":188,"time":"10:50","ratio":0.588212,"inputTokens":117642,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.647,"originalCredits":0.647,"afterCompact":false},{"index":189,"time":"10:51","ratio":0.592098,"inputTokens":118420,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.912,"originalCredits":0.912,"afterCompact":false},{"index":190,"time":"10:51","ratio":0.594515,"inputTokens":118903,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.624,"originalCredits":0.624,"afterCompact":false},{"index":191,"time":"10:51","ratio":0.596186,"inputTokens":119237,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.623,"originalCredits":0.623,"afterCompact":false},{"index":192,"time":"10:51","ratio":0.596555,"inputTokens":119311,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.563,"originalCredits":0.563,"afterCompact":false},{"index":193,"time":"10:51","ratio":0.596701,"inputTokens":119340,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.582,"originalCredits":0.582,"afterCompact":false},{"index":194,"time":"10:51","ratio":0.597601,"inputTokens":119520,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.587,"originalCredits":0.587,"afterCompact":false},{"index":195,"time":"10:51","ratio":0.597766,"inputTokens":119553,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.55,"originalCredits":0.55,"afterCompact":false},{"index":196,"time":"10:51","ratio":0.600197,"inputTokens":120039,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.715,"originalCredits":0.715,"afterCompact":false},{"index":197,"time":"10:51","ratio":0.600927,"inputTokens":120185,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.733,"originalCredits":0.733,"afterCompact":false},{"index":198,"time":"10:51","ratio":0.601997,"inputTokens":120399,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.56,"originalCredits":0.56,"afterCompact":false},{"index":199,"time":"10:51","ratio":0.602232,"inputTokens":120446,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.559,"originalCredits":0.559,"afterCompact":false},{"index":200,"time":"10:51","ratio":0.602613,"inputTokens":120523,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.624,"originalCredits":0.624,"afterCompact":false},{"index":201,"time":"10:52","ratio":0.603783,"inputTokens":120757,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.754,"originalCredits":0.754,"afterCompact":false},{"index":202,"time":"10:52","ratio":0.605781,"inputTokens":121156,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.65,"originalCredits":0.65,"afterCompact":false},{"index":203,"time":"10:52","ratio":0.606201,"inputTokens":121240,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.563,"originalCredits":0.563,"afterCompact":false},{"index":204,"time":"10:52","ratio":0.606582,"inputTokens":121316,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.62,"originalCredits":0.62,"afterCompact":false},{"index":205,"time":"10:52","ratio":0.607754,"inputTokens":121551,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.629,"originalCredits":0.629,"afterCompact":false},{"index":206,"time":"10:52","ratio":0.608423,"inputTokens":121685,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.616,"originalCredits":0.616,"afterCompact":false},{"index":207,"time":"10:52","ratio":0.608779,"inputTokens":121756,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.56,"originalCredits":0.56,"afterCompact":false},{"index":208,"time":"10:52","ratio":0.60916,"inputTokens":121832,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.608,"originalCredits":0.608,"afterCompact":false},{"index":209,"time":"10:52","ratio":0.610333,"inputTokens":122067,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.608,"originalCredits":0.608,"afterCompact":false},{"index":210,"time":"10:52","ratio":0.611231,"inputTokens":122246,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.605,"originalCredits":0.605,"afterCompact":false},{"index":211,"time":"10:52","ratio":0.611421,"inputTokens":122284,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.567,"originalCredits":0.567,"afterCompact":false},{"index":212,"time":"10:52","ratio":0.61181,"inputTokens":122362,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.589,"originalCredits":0.589,"afterCompact":false},{"index":213,"time":"10:52","ratio":0.612002,"inputTokens":122400,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.574,"originalCredits":0.574,"afterCompact":false},{"index":214,"time":"10:53","ratio":0.612439,"inputTokens":122488,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.588,"originalCredits":0.588,"afterCompact":false},{"index":215,"time":"10:53","ratio":0.612763,"inputTokens":122553,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.58,"originalCredits":0.58,"afterCompact":false},{"index":216,"time":"10:53","ratio":0.612934,"inputTokens":122587,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.566,"originalCredits":0.566,"afterCompact":false},{"index":217,"time":"10:53","ratio":0.613315,"inputTokens":122663,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.665,"originalCredits":0.665,"afterCompact":false},{"index":218,"time":"10:53","ratio":0.614891,"inputTokens":122978,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.674,"originalCredits":0.674,"afterCompact":false},{"index":219,"time":"10:53","ratio":0.615562,"inputTokens":123112,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.664,"originalCredits":0.664,"afterCompact":false},{"index":220,"time":"10:53","ratio":0.616186,"inputTokens":123237,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.571,"originalCredits":0.571,"afterCompact":false},{"index":221,"time":"10:53","ratio":0.617107,"inputTokens":123421,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.606,"originalCredits":0.606,"afterCompact":false},{"index":222,"time":"10:53","ratio":0.617223,"inputTokens":123445,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.567,"originalCredits":0.567,"afterCompact":false},{"index":223,"time":"10:53","ratio":0.617455,"inputTokens":123491,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.573,"originalCredits":0.573,"afterCompact":false},{"index":224,"time":"10:53","ratio":0.617551,"inputTokens":123510,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.571,"originalCredits":0.571,"afterCompact":false},{"index":225,"time":"10:53","ratio":0.617932,"inputTokens":123586,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.588,"originalCredits":0.588,"afterCompact":false},{"index":226,"time":"10:53","ratio":0.618103,"inputTokens":123621,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.573,"originalCredits":0.573,"afterCompact":false},{"index":227,"time":"10:54","ratio":0.618484,"inputTokens":123697,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.603,"originalCredits":0.603,"afterCompact":false},{"index":228,"time":"10:54","ratio":0.618733,"inputTokens":123747,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.601,"originalCredits":0.601,"afterCompact":false},{"index":229,"time":"10:54","ratio":0.619423,"inputTokens":123885,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.608,"originalCredits":0.608,"afterCompact":false},{"index":230,"time":"10:54","ratio":0.619652,"inputTokens":123930,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.574,"originalCredits":0.574,"afterCompact":false},{"index":231,"time":"10:54","ratio":0.620054,"inputTokens":124011,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.591,"originalCredits":0.591,"afterCompact":false},{"index":232,"time":"10:54","ratio":0.620197,"inputTokens":124039,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.571,"originalCredits":0.571,"afterCompact":false},{"index":233,"time":"10:54","ratio":0.620506,"inputTokens":124101,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.706,"originalCredits":0.706,"afterCompact":false},{"index":234,"time":"10:54","ratio":0.621533,"inputTokens":124307,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.599,"originalCredits":0.599,"afterCompact":false},{"index":235,"time":"10:54","ratio":0.622058,"inputTokens":124412,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.611,"originalCredits":0.611,"afterCompact":false},{"index":236,"time":"10:54","ratio":0.622468,"inputTokens":124494,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.598,"originalCredits":0.598,"afterCompact":false},{"index":237,"time":"10:54","ratio":0.62277,"inputTokens":124554,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.581,"originalCredits":0.581,"afterCompact":false},{"index":238,"time":"10:55","ratio":0.623191,"inputTokens":124638,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.591,"originalCredits":0.591,"afterCompact":false},{"index":239,"time":"10:55","ratio":0.62372,"inputTokens":124744,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.6,"originalCredits":0.6,"afterCompact":false},{"index":240,"time":"10:55","ratio":0.623894,"inputTokens":124779,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.599,"originalCredits":0.599,"afterCompact":false},{"index":241,"time":"10:55","ratio":0.624253,"inputTokens":124851,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.665,"originalCredits":0.665,"afterCompact":false},{"index":242,"time":"10:55","ratio":0.626974,"inputTokens":125395,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.79,"originalCredits":0.79,"afterCompact":false},{"index":243,"time":"10:55","ratio":0.627888,"inputTokens":125578,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.742,"originalCredits":0.742,"afterCompact":false},{"index":244,"time":"10:55","ratio":0.628997,"inputTokens":125799,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.593,"originalCredits":0.593,"afterCompact":false},{"index":245,"time":"10:55","ratio":0.629952,"inputTokens":125990,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.649,"originalCredits":0.649,"afterCompact":false},{"index":246,"time":"10:55","ratio":0.630282,"inputTokens":126056,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.589,"originalCredits":0.589,"afterCompact":false},{"index":247,"time":"10:56","ratio":0.630472,"inputTokens":126094,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.605,"originalCredits":0.605,"afterCompact":false},{"index":248,"time":"10:56","ratio":0.630744,"inputTokens":126149,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.631,"originalCredits":0.631,"afterCompact":false},{"index":249,"time":"10:56","ratio":0.631122,"inputTokens":126224,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.634,"originalCredits":0.634,"afterCompact":false},{"index":250,"time":"10:56","ratio":0.631607,"inputTokens":126321,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.618,"originalCredits":0.618,"afterCompact":false},{"index":251,"time":"10:56","ratio":0.632015,"inputTokens":126403,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.625,"originalCredits":0.625,"afterCompact":false},{"index":252,"time":"10:56","ratio":0.632632,"inputTokens":126526,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.673,"originalCredits":0.673,"afterCompact":false},{"index":253,"time":"10:57","ratio":0.63317,"inputTokens":126634,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.593,"originalCredits":0.593,"afterCompact":false},{"index":254,"time":"10:57","ratio":0.633651,"inputTokens":126730,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.812,"originalCredits":0.812,"afterCompact":false},{"index":255,"time":"10:57","ratio":0.635194,"inputTokens":127039,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.63,"originalCredits":0.63,"afterCompact":false},{"index":256,"time":"10:57","ratio":0.635505,"inputTokens":127101,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.587,"originalCredits":0.587,"afterCompact":false},{"index":257,"time":"10:57","ratio":0.635934,"inputTokens":127187,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.693,"originalCredits":0.693,"afterCompact":false},{"index":258,"time":"10:57","ratio":0.636592,"inputTokens":127318,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.609,"originalCredits":0.609,"afterCompact":false},{"index":259,"time":"10:57","ratio":0.636932,"inputTokens":127386,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.602,"originalCredits":0.602,"afterCompact":false},{"index":260,"time":"10:57","ratio":0.63711,"inputTokens":127422,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.599,"originalCredits":0.599,"afterCompact":false},{"index":261,"time":"10:57","ratio":0.637313,"inputTokens":127463,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.611,"originalCredits":0.611,"afterCompact":false},{"index":262,"time":"10:57","ratio":0.637532,"inputTokens":127506,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.589,"originalCredits":0.589,"afterCompact":false},{"index":263,"time":"10:57","ratio":0.638463,"inputTokens":127693,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.62,"originalCredits":0.62,"afterCompact":false},{"index":264,"time":"10:58","ratio":0.63856,"inputTokens":127712,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.589,"originalCredits":0.589,"afterCompact":false},{"index":265,"time":"10:58","ratio":0.638886,"inputTokens":127777,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.594,"originalCredits":0.594,"afterCompact":false},{"index":266,"time":"10:58","ratio":0.638981,"inputTokens":127796,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.615,"originalCredits":0.615,"afterCompact":false},{"index":267,"time":"10:58","ratio":0.639199,"inputTokens":127840,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.605,"originalCredits":0.605,"afterCompact":false},{"index":268,"time":"10:58","ratio":0.63938,"inputTokens":127876,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.606,"originalCredits":0.606,"afterCompact":false},{"index":269,"time":"10:58","ratio":0.639884,"inputTokens":127977,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.871,"originalCredits":0.871,"afterCompact":false},{"index":270,"time":"10:58","ratio":0.641521,"inputTokens":128304,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.599,"originalCredits":0.599,"afterCompact":false},{"index":271,"time":"10:58","ratio":0.642337,"inputTokens":128467,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.626,"originalCredits":0.626,"afterCompact":false},{"index":272,"time":"10:58","ratio":0.642449,"inputTokens":128490,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.598,"originalCredits":0.598,"afterCompact":false},{"index":273,"time":"10:58","ratio":0.642601,"inputTokens":128520,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.657,"originalCredits":0.657,"afterCompact":false},{"index":274,"time":"10:58","ratio":0.643075,"inputTokens":128615,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.607,"originalCredits":0.607,"afterCompact":false},{"index":275,"time":"10:59","ratio":0.643382,"inputTokens":128676,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.659,"originalCredits":0.659,"afterCompact":false},{"index":276,"time":"10:59","ratio":0.6439,"inputTokens":128780,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.702,"originalCredits":0.702,"afterCompact":false},{"index":277,"time":"10:59","ratio":0.644615,"inputTokens":128923,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.592,"originalCredits":0.592,"afterCompact":false},{"index":278,"time":"10:59","ratio":0.644996,"inputTokens":128999,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.632,"originalCredits":0.632,"afterCompact":false},{"index":279,"time":"10:59","ratio":0.645257,"inputTokens":129051,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.594,"originalCredits":0.594,"afterCompact":false},{"index":280,"time":"10:59","ratio":0.645354,"inputTokens":129071,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.609,"originalCredits":0.609,"afterCompact":false},{"index":281,"time":"10:59","ratio":0.645651,"inputTokens":129130,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.602,"originalCredits":0.602,"afterCompact":false},{"index":282,"time":"10:59","ratio":0.645761,"inputTokens":129152,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.61,"originalCredits":0.61,"afterCompact":false},{"index":283,"time":"10:59","ratio":0.64605,"inputTokens":129210,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.717,"originalCredits":0.717,"afterCompact":false},{"index":284,"time":"10:59","ratio":0.646846,"inputTokens":129369,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.616,"originalCredits":0.616,"afterCompact":false},{"index":285,"time":"11:00","ratio":0.647447,"inputTokens":129489,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.755,"originalCredits":0.755,"afterCompact":false},{"index":286,"time":"11:00","ratio":0.648409,"inputTokens":129682,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.653,"originalCredits":0.653,"afterCompact":false},{"index":287,"time":"11:00","ratio":0.649134,"inputTokens":129827,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.741,"originalCredits":0.741,"afterCompact":false},{"index":288,"time":"11:02","ratio":0.651405,"inputTokens":130281,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.678,"originalCredits":0.678,"afterCompact":false},{"index":289,"time":"11:02","ratio":0.651683,"inputTokens":130337,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.606,"originalCredits":0.606,"afterCompact":false},{"index":290,"time":"11:02","ratio":0.652112,"inputTokens":130422,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.635,"originalCredits":0.635,"afterCompact":false},{"index":291,"time":"11:04","ratio":0.653315,"inputTokens":130663,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.657,"originalCredits":0.657,"afterCompact":false},{"index":292,"time":"11:04","ratio":0.653779,"inputTokens":130756,"outputTokens":null,"usageSource":"transcript-ratio","credits":0.611,"originalCredits":0.611,"afterCompact":false},{"index":293,"time":"11:05","ratio":0.65426,"inputTokens":130852,"outputTokens":null,"usageSource":"transcript-ratio","credits":1.093,"originalCredits":1.093,"afterCompact":false}],"identity":{"sumAttributed":28217319,"billedInputTokens":28217319,"absDiff":0,"ok":true},"pluginVersion":"2.7.4","selfCmd":"\"C:\\Users\\24533\\.qoder-cn\\plugins\\cache\\qoder-marketplace\\qoder-credits-inspector\\2.7.4\\bin\\credits-inspector.cmd\" cli","linkHealth":{"matched":0,"requests":293,"coverage":0,"usageSource":"transcript-ratio","breakdown":{"proxy":0,"transcriptTokens":0,"transcriptRatio":293},"logRecords":0,"lastRecordAt":null,"recentRequests":0,"proxyErrors":null,"clientAbort":null,"clientAbortMaxMs":null,"upstreamRejected":null,"aborted":null,"truncated":null,"noUsage":null,"slowestMs":null,"supersededFailure":null},"subagents":{"scanned":true,"dir":"C:\\Users\\24533\\.qoder-cn\\projects\\F--code-dezhou\\29d86d15-6bea-4b54-bf8a-f16185376110\\subagents","probedPaths":["C:\\Users\\24533\\.qoder-cn\\projects\\F--code-dezhou\\29d86d15-6bea-4b54-bf8a-f16185376110\\subagents","C:\\Users\\24533\\.qoder-cn\\projects\\29d86d15-6bea-4b54-bf8a-f16185376110\\subagents"],"reason":"ok","count":12,"items":[{"agentId":"astrategy-academy-dev-d14038d19863c81d","agentType":"strategy-academy-dev","description":"W2 drills 结果页模板","toolUseId":"call_01_AalrsYZqq8G7luZWHdhH9144","roundTrips":95,"billedInputTokens":2828817,"peakContextRatio":0.2089,"credits":34.328,"originalCredits":34.328,"error":null},{"agentId":"aplatform-dev-f6ca96a215e7887c","agentType":"platform-dev","description":"W4 feedback 去路由","toolUseId":"call_00_hndkPqUtSAdA4m2PuarS1569","roundTrips":95,"billedInputTokens":1992233,"peakContextRatio":0.1546,"credits":23.856,"originalCredits":23.856,"error":null},{"agentId":"aplatform-dev-9f3c6682c945b14b","agentType":"platform-dev","description":"W1 shared dogfooding","toolUseId":"call_00_FU2RLu70ubFlHwVMDG9r6844","roundTrips":68,"billedInputTokens":1305731,"peakContextRatio":0.1433,"credits":20.951,"originalCredits":20.951,"error":null},{"agentId":"astrategy-academy-dev-617218989b8cd0e7","agentType":"strategy-academy-dev","description":"W6 strategy 非 drills 清扫","toolUseId":"call_02_LLFLRpoGMmupRf3y5GnY7106","roundTrips":48,"billedInputTokens":735413,"peakContextRatio":0.1117,"credits":13.655,"originalCredits":13.655,"error":null},{"agentId":"atheory-academy-dev-fa29f5f229bded0a","agentType":"theory-academy-dev","description":"V1 theory flat CTA","toolUseId":"call_00_2VmZvTBJrb9JeUjJThrn2182","roundTrips":39,"billedInputTokens":617812,"peakContextRatio":0.1116,"credits":11.733,"originalCredits":11.733,"error":null},{"agentId":"aExplore-ba294e2248878795","agentType":"Explore","description":"映射样式重复与并行冲突","toolUseId":"call_02_Uahl1CUOpxolgJF3gAB02554","roundTrips":16,"billedInputTokens":246830,"peakContextRatio":0.1212,"credits":11.146,"originalCredits":11.146,"error":null},{"agentId":"atheory-academy-dev-498b7c5045a37716","agentType":"theory-academy-dev","description":"W5 theory-B 样式清扫","toolUseId":"call_01_pusDMyK3U8aVC03fzm9x0108","roundTrips":40,"billedInputTokens":572291,"peakContextRatio":0.1032,"credits":10.924,"originalCredits":10.924,"error":null},{"agentId":"atheory-academy-dev-1a4d3ef8eecc69d0","agentType":"theory-academy-dev","description":"W3 theory-A 样式清扫","toolUseId":"call_02_HF7hZSz7A8QOkw2Chkii0453","roundTrips":41,"billedInputTokens":624905,"peakContextRatio":0.1024,"credits":10.594,"originalCredits":10.594,"error":null},{"agentId":"astrategy-academy-dev-de6c7f2688323e16","agentType":"strategy-academy-dev","description":"V1 strategy flat CTA","toolUseId":"call_01_XcjRgygRz0siSFMinMHC2072","roundTrips":48,"billedInputTokens":632934,"peakContextRatio":0.0878,"credits":9.343,"originalCredits":9.343,"error":null},{"agentId":"aExplore-38c03f75137fd65b","agentType":"Explore","description":"映射共享基础件与测试","toolUseId":"call_00_KOBqEZyEuFjNgGQ74YUn8413","roundTrips":14,"billedInputTokens":175830,"peakContextRatio":0.0995,"credits":7.54,"originalCredits":7.54,"error":null},{"agentId":"aExplore-9023db13043104d7","agentType":"Explore","description":"映射 drills 结果页重复","toolUseId":"call_01_jhaCPCB3GXiwS13ilSxr8064","roundTrips":23,"billedInputTokens":286991,"peakContextRatio":0.0861,"credits":6.268,"originalCredits":6.268,"error":null},{"agentId":"aPlan-2fa4062205a6b4c9","agentType":"Plan","description":"设计并行修复计划","toolUseId":"call_00_fUAfws795aMrnZBmzqC30824","roundTrips":14,"billedInputTokens":110459,"peakContextRatio":0.0518,"credits":4.838,"originalCredits":4.838,"error":null}],"totals":{"roundTrips":541,"billedInputTokens":10130246,"credits":165.176,"originalCredits":165.176},"combined":{"roundTrips":834,"billedInputTokens":38347565,"credits":379.45,"originalCredits":379.45}},"manual":null,"artifacts":{"report":"report.json","canvas":"Shared Component Parallel Refactor__29d86d15.canvas.tsx"}} as unknown as Report;

function human(n: number): string {
  if (!isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (abs >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (abs >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(Math.round(n));
}

function pct(x: number): string {
  return (x * 100).toFixed(1) + "%";
}

// —— 可用性口径：把 report.availability 翻成人话，并决定某个数字该显示值、「≈」还是「—」——
const AVAIL_LABEL: Record<string, string> = {
  measured: "实测",
  derived: "推导",
  fallback: "回退",
  manual: "手工",
  unavailable: "不可用",
};

const SOURCE_LABEL: Record<string, string> = {
  "desktop-rich": "桌面端富转录",
  "ide-lite": "IDE 端精简转录",
  unknown: "来源未知",
};

function availOf(av: Availability | undefined, key: keyof Availability, dflt: Avail = "measured"): Avail {
  return (av?.[key] as Avail | undefined) ?? dflt;
}

/** 段标题旁的性质标注：实测不标（默认就是实测），其余标出来。 */
function availTag(av: Availability | undefined, key: keyof Availability, dflt: Avail = "measured"): string {
  const v = availOf(av, key, dflt);
  return v === "measured" ? "" : `（${AVAIL_LABEL[v]}）`;
}

/** 不可用的量显示「—」而不是 0：IDE 端的 0 是「读不到」，不是「没发生」。 */
function orDash(
  v: number,
  av: Availability | undefined,
  key: keyof Availability,
  fmt: (n: number) => string = String
): string {
  return availOf(av, key) === "unavailable" ? "—" : fmt(v);
}

function kindLabel(kind: string): string {
  switch (kind) {
    case "read":
      return "读取";
    case "write":
      return "写入";
    case "search":
      return "搜索";
    case "shell":
      return "命令";
    default:
      return "其他";
  }
}

function shortTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  const p = (v: number) => String(v).padStart(2, "0");
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function SessionTokensReport() {
  if (!REPORT) {
    return (
      <ReportShell width="wide" ariaLabel="会话 token 消耗截析">
        <Stack gap="component">
          <H1>会话 token 消耗截析</H1>
          <Text tone="secondary">报告数据尚未注入。请在会话中触发一次 Stop 钩子，或运行 CLI 生成 report.json。</Text>
        </Stack>
      </ReportShell>
    );
  }

  const r = REPORT;
  const s = r.session;
  const c = r.context;
  const t = r.totals;
  const av = r.availability;
  const manual = r.manual ?? null;
  const sourceLabel = SOURCE_LABEL[r.source ?? "unknown"] ?? "来源未知";
  // 有没有 usage 决定整份报告是「真值/推导」还是「一律 —」。手工回填的 credits 不算有 usage，
  // 否则下面按 ratio 推导的图表会照画一堆 0。
  const hasUsage = availOf(av, "roundTrips") === "measured";
  const manualCredits = manual?.credits ?? null;

  // 报告里出现的命令一律用数据层注入的插件入口（Windows 上是自带启动器的绝对路径，免装 Node）。
  // 旧报告没有这个字段时回退原写法，不比改动前更差。
  const CLI = r.selfCmd || "node scripts/cli.mjs";

  // credits 覆盖范围：credits 与「计费输入总量」并排放在头部，读者一除就得到单价。
  // 混合会话里 credits 只来自转录路径的那几笔（实测某会话 413 笔里只有 1 笔带 credits），
  // 部分覆盖不说出来 = 把局部真值当全量展示。
  const cov = r.creditsCoverage ?? null;
  const covPartial = !!(cov && !cov.full && cov.roundTrips > 0);
  const covNote = covPartial ? ` · 仅覆盖 ${cov!.trips}/${cov!.roundTrips} 笔往返（占计费输入 ${pct(cov!.tokenShare)}）` : "";

  // 缓存命中：代理记录里一直带着 cachedTokens，此前采集了却从不呈现。
  const cachedMeasured = availOf(av, "cachedTokens") === "measured";
  const cachedText = cachedMeasured
    ? `输入 ${human(t.billedInputTokens)}，其中缓存命中 ${human(t.cachedTokens ?? 0)}（${pct(t.cachedShare ?? 0)}，${t.cachedTrips ?? 0} 笔往返带缓存）——供应商对重复叠加的前缀打折，故按 token 数的节省大于按计费的节省。`
    : "";

  // 代理告警只在「失败记录仍然成立」时才报：status.json 只写不清，陈旧失败会把用户推去改
  // 本来正确的 Base URL，越修越坏；而同一份报告里的 lastRecordAt / matched 是它在跑的硬证据。
  const proxyAlarm = r.proxy?.status && !r.proxy.statusSuperseded ? r.proxy.status : null;
  const proxyAlive = !proxyAlarm && (r.proxy?.logRecords ?? 0) > 0;

  // 官方 UI 一场会话扣费 = 主链 + 子代理，故有子代理时 headline 必须给 combined，否则比 UI 少一截
  const creditScope =
    r.subagents && r.subagents.count > 0
      ? {
          credits: r.subagents.combined.credits,
          note: `主链 ${t.credits} + 子代理 ${r.subagents.totals.credits} · 原始 ${r.subagents.combined.originalCredits}`,
        }
      : { credits: t.credits, note: `原始 ${t.originalCredits}（实测）` };

  const headline: MetricItem[] = [
    {
      label: "计费输入总量",
      value: hasUsage ? human(t.billedInputTokens) : "—",
      description: hasUsage
        ? availOf(av, "tokens") === "measured"
          ? `Σ prompt_tokens（实测真值）${covPartial ? ` · 覆盖全部 ${cov!.roundTrips} 笔往返` : ""}`
          : `Σ 上下文 × 往返${availTag(av, "tokens", "derived")}${covPartial ? ` · 覆盖全部 ${cov!.roundTrips} 笔往返` : ""}`
        : "转录无 usage",
    },
    {
      label: "当前上下文",
      value: hasUsage ? human(t.netContextTokens) : "—",
      description: hasUsage
        ? `峰值 ${pct(c.peakContextRatio)}${s.compactions ? "（压缩后起算）" : ""}`
        : "转录无 usage",
    },
    {
      label: "重发放大",
      value: hasUsage ? `${t.amplification}×` : "—",
      description: `往返 ${hasUsage ? `${s.roundTrips} 次` : "—"}`,
    },
    {
      label: "Credits",
      // 代理路径（自定义模型）token 是实测真值但 credits 无来源：hasUsage 为真也要显示「—」，
      // 否则 t.credits=0 会被读成「这次没花钱」。
      value:
        manualCredits != null
          ? `${manualCredits}`
          : hasUsage && availOf(av, "credits") !== "unavailable"
            ? `${creditScope.credits}`
            : "—",
      description:
        manualCredits != null
          ? `官方 UI 手工录入 · 本地 ${creditScope.credits}`
          : hasUsage && availOf(av, "credits") !== "unavailable"
            ? `${creditScope.note}${covNote}`
            : r.usageSource === "proxy" || r.usageSource === "transcript-tokens" || r.usageSource === "mixed"
              ? "自定义模型（BYOK）不经 Qoder 计费网关，无 credits 真值"
              : hasUsage
                ? "转录带 usage 但没有 credits 字段，本地无计费真值"
                : "本地不可用，见下方告警",
    },
  ];

  const pieData = r.byCategory.map((x) => ({ label: x.label, value: x.tokens }));

  // 系统提示词是报告里少数「用户能直接动」的一项：它每轮被完整重发，总量 = 每请求规模 × 往返数，
  // 而它的大小由装了多少插件与技能决定。占比小时不必啰嗦。
  const sysCat = r.byCategory.find((x) => x.key === "system");
  const sysNote =
    hasUsage && sysCat && sysCat.share >= 0.1
      ? ` 系统提示词占 ${pct(sysCat.share)}（${human(c.systemPromptTokens)}/请求 × ${s.roundTrips} 次往返 = ${human(sysCat.tokens)}）：它每轮都被完整重发，大小由你装了多少插件与技能决定，精简技能能直接压低这一项——本插件自己的技能描述也常驻在里面（约 170 token）。`
      : "";

  const tools = r.byTool.slice(0, 8);
  const toolCategories = tools.map((x) => x.tool);
  const toolSeries = [{ name: "重发 tokens", data: tools.map((x) => x.tokens) }];
  // 「单次」= 平均每次调用带来的重发 token。总量榜会埋掉次数少但每次极贵的工具：
  // 实测 Read 只 29 次却吃 335 万，单次是 Edit 的 2.6 倍。
  const toolRows = tools.map((x) => [
    x.tool,
    human(x.tokens),
    pct(x.share),
    String(x.calls),
    x.perCall == null ? "—" : human(x.perCall),
  ]);

  const files = r.byFile.slice(0, 20);
  const fileRows = files.map((f) => [
    f.label,
    kindLabel(f.kind),
    human(f.billed),
    pct(f.share),
    f.perRead == null ? "—" : human(f.perRead),
    String(f.trips),
    String(f.reads),
  ]);

  const byReq = r.byRequest ?? [];
  const reqLabels = byReq.map((x, i) => x.time || `#${x.index ?? i + 1}`);
  const reqInputs = byReq.map((x) => x.inputTokens);
  const reqCredits = byReq.map((x) => x.credits);
  // credits 只在覆盖全部往返时才画曲线：部分覆盖（BYOK 混合会话实测 413 笔里 1 笔有 credits）
  // 画出来是一地零，既读不出形状，还会暗示「其余往返没花钱」。
  const showCreditsChart = hasUsage && !covPartial && availOf(av, "credits") !== "unavailable";

  // 按类别下钻：类别小计行（accent/neutral）+ 其工具/文件明细行（default），用 rowTone 分组着色。
  const catDetail = r.byCategoryDetail ?? [];
  const detailRows: string[][] = [];
  const detailTones: ("accent" | "neutral" | "default")[] = [];
  for (const cc of catDetail) {
    const hasKids = cc.children.length > 0;
    detailRows.push([cc.label, "—", hasKids ? "小计" : "（整体，无工具/文件归属）", human(cc.tokens), pct(cc.share), "100%", "—"]);
    detailTones.push(hasKids ? "accent" : "neutral");
    for (const k of cc.children) {
      detailRows.push(["", k.tool || "—", k.label, human(k.tokens), pct(k.share), pct(k.catShare), String(k.trips)]);
      detailTones.push("default");
    }
  }

  // 子代理账：Agent 派发的子代理消耗不在主链里，单独一段呈现（无子代理则整段不渲染）。
  const sub = r.subagents;
  const subItems = sub?.items ?? [];
  const subRows: string[][] = [];
  const subTones: ("accent" | "default")[] = [];
  for (const a of subItems) {
    subRows.push([
      a.description || a.agentId,
      a.agentType || "—",
      String(a.roundTrips),
      human(a.billedInputTokens),
      pct(a.peakContextRatio),
      String(a.credits),
      String(a.originalCredits),
      a.error || "—",
    ]);
    subTones.push("default");
  }
  if (sub && subItems.length > 0) {
    subRows.push([
      "合计（主链 + 子代理）",
      "—",
      String(sub.combined.roundTrips),
      human(sub.combined.billedInputTokens),
      "—",
      String(sub.combined.credits),
      String(sub.combined.originalCredits),
      `主链 ${t.credits} / 子代理 ${sub.totals.credits}`,
    ]);
    subTones.push("accent");
  }

  // 压缩单笔成本：输入/摘要一律取数据层归一后的生效值（有代理实测就是实测，否则是客户端自估），
  // 并用「口径」列把两者分开——混着显示会让自估值被当成实测。
  const ccost = r.compactionCost;
  const ccItems = ccost?.items ?? [];
  const compactRows: string[][] = ccItems.map((e) => [
    `#${e.index}`,
    shortTime(e.at),
    e.trigger || "—",
    e.effectiveInputTokens == null ? "—" : human(e.effectiveInputTokens),
    e.effectiveOutputTokens == null ? "—" : human(e.effectiveOutputTokens),
    e.nextInputTokens == null ? "—" : human(e.nextInputTokens),
    e.savedTokens == null ? "—" : human(e.savedTokens),
    e.proxy && e.proxy.ms != null ? `${Math.round(e.proxy.ms / 1000)}s` : "—",
    e.proxy ? "实测" : "自估",
  ]);

  // IDE 端仅剩的真值：工具调用次数与文件读取次数（不依赖 usage，两种转录都写 tool_use 块）。
  const residueRows: string[][] = [];
  if (!hasUsage) {
    for (const x of r.byTool.filter((v) => v.calls > 0).sort((a, b) => b.calls - a.calls).slice(0, 15)) {
      residueRows.push([x.tool, "工具", String(x.calls), "—", "—"]);
    }
    for (const f of r.byFile.filter((v) => v.reads > 0).sort((a, b) => b.reads - a.reads).slice(0, 15)) {
      residueRows.push([f.label, kindLabel(f.kind), "—", String(f.reads), String(f.trips)]);
    }
  }

  // A1 三值：一次带 usage 的往返都没有时 0 <= max(2,0) 恒成立，会把「没数据」判成「校验通过」，
  // 故 breakdown.mjs 在 reqCount===0 时给 null；这里必须显示「不适用」而不是绿色通过。
  const identityText =
    r.identity.ok == null
      ? "恒等式 A1 不适用（本转录没有一次带 usage 的往返）。"
      : r.identity.ok
        ? `归因覆盖 ${pct(t.coverage)}${availTag(av, "categoryShare", "derived")}，恒等式 A1 通过（|Δ|=${r.identity.absDiff}）。`
        : `归因覆盖 ${pct(t.coverage)}，恒等式 A1 未通过（|Δ|=${r.identity.absDiff}）。`;
  // 窗口读不到时是静默回退的 200000，而所有 token 数字都乘它 —— 必须显式标 ≈ 与来源。
  const cwIsFallback = availOf(av, "contextWindow") === "fallback";
  const cwText = cwIsFallback ? `≈${human(c.contextWindow)}（回退值）` : human(c.contextWindow);
  // 当前占用头条：以最新上下文（currentContextTokens）为准；段内单调递增 ⇒ 旧版峰值与当前恒等，故合并为一条。
  const curCtx = c.currentContextTokens ?? c.peakContextTokens;
  const netAdv = c.netUserAdvice || c.peakUserAdvice || c.peakAdvice || null;
  const limitSrcLabel =
    c.userContextLimitSource === "manual" ? "手工"
    : c.userContextLimitSource === "config" ? "配置"
    : c.userContextLimitSource === "derived" ? "实测反推"
    : "默认";
  // 阈值来源非 manual/config/derived ⇒ 用的是内置兜底 200K，不是用户在 Qoder 设的真值，需显式提示如何改。
  const limitIsDefault = c.userContextLimitSource !== "manual" && c.userContextLimitSource !== "config" && c.userContextLimitSource !== "derived";
  // 上下文对比表：把旧版挤成一段小字的「界面显示 / 自动压缩实况 / 历史高点」拆成可扫读的行，无数据不占位。
  const ctxRows: string[][] = [];
  if (c.userContextLimit != null && Number.isFinite(c.contextWindow)) {
    ctxRows.push(
      c.contextWindow > c.userContextLimit
        ? ["Qoder 界面进度条", pct(c.netWindowRatio ?? c.peakContextRatio), `按模型物理窗口 ${cwText} 算，比你真实占比低约 ${(c.contextWindow / c.userContextLimit).toFixed(1)} 倍——界面显得偏空、有迷惑性，别信它`]
        : ["Qoder 界面进度条", pct(c.netWindowRatio ?? c.peakContextRatio), `按模型窗口 ${cwText} 算，与你实设上限一致，显示无偏差`],
    );
  }
  if (c.observedAutoCompactions != null && c.observedAutoCompactions > 0 && c.observedAutoTriggerTokens != null) {
    ctxRows.push(["自动压缩实况", `自动 ${c.observedAutoCompactions} 次`, `触发点在 ~${human(c.observedAutoTriggerTokens)}（窗口的 ${pct(c.autoTriggerRatio ?? 0)}）`]);
  } else if (s.compactions > 0) {
    ctxRows.push(["压缩实况", `手动 ${s.compactions} 次`, "本场未见自动压缩，均为你手动触发"]);
  }
  if (c.peakSessionNotable) {
    ctxRows.push(["压缩前历史高点", `${pct(c.peakSessionRatio ?? 0)}（${human(c.peakSessionTokens ?? 0)}）`, "本场曾达到的最高占用"]);
  }

  // 链路健康度：把 --request-log 的逐笔归因压成一行结论（明细属于排障，留在 CLI）。
  // 分两档：本会话确实走在代理链路上（proxy/mixed）才印「最近 N 笔」的失败统计与排障命令；
  // token 全来自转录的会话里，那些统计说的是别的会话，印成 warning + 命令是噪音，只留覆盖率与最近记录时间。
  // 纯官方模型用户从没配过代理，整行不渲染。
  const lhRaw = r.linkHealth ?? null;
  const lh = lhRaw && (r.proxy?.configured || lhRaw.matched > 0) ? lhRaw : null;
  const lhOnPath = !!lh && (lh.matched > 0 || lh.usageSource === "proxy" || lh.usageSource === "mixed");
  const lhErrors = lh ? lh.proxyErrors ?? 0 : 0;
  const lhBad = lhOnPath && lhErrors > 0;
  const lhTone: "info" | "warning" = lhBad ? "warning" : "info";
  // 三档拆分一行说清：代理实测 / 转录 input_tokens / 转录 ratio×window 各多少笔。
  // 旧报告（v3）无 breakdown 字段时退回到只报 matched。
  const lhBd = lh?.breakdown ?? null;
  const lhBdText = lhBd
    ? `拆分：代理 ${lhBd.proxy} 笔 · 转录 input_tokens ${lhBd.transcriptTokens} 笔 · 转录 ratio×窗口 ${lhBd.transcriptRatio} 笔`
    : "";
  const lhSrcNote = !lh
    ? ""
    : lh.usageSource === "proxy"
      ? "：全部为供应商实测"
      : lh.usageSource === "transcript-tokens"
        ? "：本会话 token 全来自转录 input_tokens（BYOK，代理未在链路上）"
        : lh.usageSource === "transcript-ratio"
          ? "：本会话 token 由 ratio×窗口推导（官方模型）"
          : lh.usageSource === "mixed"
            ? "：多源混合，以下拆分列为准"
            : lh.usageSource === "transcript"
              ? "：本会话 token 全部来自转录，代理不在链路上"
              : "";
  const lhText = !lh
    ? ""
    : [
        lh.requests > 0
          ? `代理覆盖 ${lh.matched}/${lh.requests} 笔往返（${pct(lh.coverage)}）${lhSrcNote}`
          : "本会话没有带 usage 的往返，代理无从覆盖",
        lhBdText,
        lh.lastRecordAt ? `代理最近记录 ${shortTime(lh.lastRecordAt)}` : proxyAlive ? "代理有记录但无时间戳" : "代理从未记到流量",
        lhOnPath && lh.recentRequests
          ? `最近 ${lh.recentRequests} 笔：代理失败 ${lh.proxyErrors} · 上游报错 ${lh.upstreamRejected} · 客户端提前断开 ${lh.aborted} · 成功但无 usage ${lh.noUsage}${
              lh.slowestMs != null ? ` · 最慢 ${Math.round(lh.slowestMs / 1000)}s` : ""
            }`
          : lhOnPath
            ? "请求诊断日志为空（运行中的代理是旧版，或还没记到）"
            : "",
        lhBad ? `有「代理失败」= 请求没出得去或代理自己抛了，跑 ${CLI} --request-log 看归因` : "",
        !lhOnPath && lhErrors > 0 ? `代理另有 ${lhErrors} 笔失败，属于走代理的那些会话` : "",
        lh.supersededFailure
          ? `${shortTime(lh.supersededFailure.at ?? null)} 那条「拉起失败（${lh.supersededFailure.error}）」已被之后的流量推翻，无需处理`
          : "",
      ]
        .filter(Boolean)
        .join("。") + "。";

  return (
    <ReportShell width="wide" ariaLabel="会话 token 消耗截析">
      <Stack gap="sectionCompact">
        <header>
          <Stack gap="component">
            <H1>会话 token 消耗截析</H1>
            <Text tone="secondary">
              {s.model || "未知模型"}
              {s.modelSource === "manual" ? "（手工录入）" : ""} · {sourceLabel} · 会话{" "}
              {String(s.id || "").slice(0, 8)}
              {s.title ? `「${s.title}」` : ""} · {shortTime(s.startedAt)} →{" "}
              {shortTime(s.endedAt)} · 压缩{" "}
              {availOf(av, "compactions") === "unavailable" ? "—" : `${s.compactions} 次`}
              {r.usageSource ? ` · usage 来源 ${
                r.usageSource === "proxy"
                  ? "代理实测"
                  : r.usageSource === "transcript-tokens"
                    ? "转录 input_tokens"
                    : r.usageSource === "transcript-ratio"
                      ? "转录 ratio×窗口"
                      : r.usageSource === "mixed"
                        ? "多源混合"
                        : "转录"
              }` : ""}
              {r.pluginVersion ? ` · v${r.pluginVersion}` : ""} · schema v{r.schemaVersion}
            </Text>
            <MetricsGrid variant="header" columns={4} items={headline} />
          </Stack>
        </header>

        {!hasUsage && r.source === "desktop-rich" && (
          <Callout tone="danger" title="本报告数值不可用：自定义模型（BYOK）不经 Qoder 计费网关">
            转录是桌面端富布局，但 assistant entry 里没有 message.usage——自定义模型（如千问
            tokenplan）的响应不经 Qoder 计费网关，credits / context_usage_ratio 无来源，提供商返回的
            usage 客户端也不落盘（已实测扫过 ~/.qoder-cn、~/.qoder、~/.qoder-cli 与 %APPDATA%\QoderCN）。
            本地补救（改一个配置文件即可，免装 Node、之后全自动）：编辑 {"`~/.qoder-credits-proxy/config.json`"}，
            把 {"`upstream`"} 填成你的供应商根地址（= Base URL 去掉结尾 /v1），再把自定义模型 Base URL 的 host:port
            换成 {`127.0.0.1:${r.proxy?.port ?? 49787}`}（路径保留），新开一个会话即自动拉起代理、按 message.id
            精确 join 出实测 token（credits 仍无真值）。装了 Node 也可用 {"`--setup-proxy`"} / {"`--check-proxy`"} 一步到位。
            手工回填通道同样可用：
            {"`.qoder-credits/overrides/<sessionId>.json`"}。
          </Callout>
        )}

        {!hasUsage && r.source !== "desktop-rich" && (
          <Callout tone="danger" title="本报告数值不可用：转录不含 message.usage">
            这是 {sourceLabel}（IDE 端客户端）。它的转录只写 session_meta / user / assistant / progress 四种 entry，
            message.usage 整个字段不存在，也不落到本地任何其它文件（已实测扫过 ~/.qoder-cn、~/.qoder、
            ~/.qoder-cli 与 %APPDATA%\QoderCN）。因此 Credits、token 与各类占比一律显示「—」而不是 0 ——
            0 会被误读成「这次没花钱」。真值只有官方 UI 有：把它填进{" "}
            {"`.qoder-credits/overrides/<sessionId>.json`"} 后重跑，上方会出现「官方 UI 真值」一段并与本地并列对账。
          </Callout>
        )}

        {manual && (
          <Callout tone="success" title="官方 UI 真值（手工录入，未覆盖任何本地数字）">
            Credits {manual.credits ?? "—"} · 原价 {manual.originalCredits ?? "—"}
            {manual.model ? ` · 模型 ${manual.model}` : ""}
            {manual.durationMin != null ? ` · 时长 ${manual.durationMin} min` : ""}
            {manual.startedAt ? ` · ${shortTime(manual.startedAt)}` : ""}
            {manual.localCoverage != null
              ? ` · 本地${manual.localScope === "combined" ? "合计（主链+子代理）" : "主链"} ${manual.localCredits ?? t.credits}，覆盖 ${pct(manual.localCoverage)}`
              : " · 本地无 usage，无法对账"}
            {manual.note ? `。备注：${manual.note}` : ""}
          </Callout>
        )}

        {sub && sub.count === 0 && sub.reason && sub.reason !== "no-dir" && (
          <Callout tone="warning" title={`子代理账未汇总（${sub.reason}）`}>
            探测过的候选目录：{(sub.probedPaths ?? []).join("  |  ") || "（无）"}
          </Callout>
        )}

        {proxyAlarm && (
          <Callout tone="warning" title={`代理自动启动失败（${proxyAlarm.error}）`}>
            {proxyAlarm.error === "EADDRINUSE"
              ? `端口 ${proxyAlarm.port ?? "—"} 被占用，自定义模型将无法对话。请换一个空闲端口重启代理：${CLI} --setup-proxy --port <新端口>，并把模型 Base URL 改成新端口。`
              : `代理未就绪（${proxyAlarm.error}），自定义模型可能无法对话。请运行 ${CLI} --check-proxy 查看链路状态。`}
          </Callout>
        )}

        {r.proxy?.dormant && !proxyAlarm && (
          <Callout tone="info" title="代理长期空闲">
            代理已配置但超过 14 天没有记录到流量（可能你已改回官方模型）。如不再使用自定义模型，可运行{" "}
            {CLI} --stop-proxy 停用代理；保留也不影响官方模型。
          </Callout>
        )}

        {cwIsFallback && (
          <Callout tone="warning" title="上下文窗口为回退值 200K（未从 runtime-config / usage 反推 / ManualTruth 拿到真值）">
            本会话所有以窗口为分母的占比与「峰值建议」都可能偏大，而绝对 token 数（已改以 S 真值为底）不受影响。
            建议在 {"`.qoder-credits/overrides/<sessionId>.json`"} 里手工填 {"`contextWindow`"}（如 qwen3-max=1000000），或等一笔带 input_tokens+ratio 的往返写入转录后自动反推生效。
          </Callout>
        )}

        {hasUsage && netAdv && c.userContextLimit != null && (
          <Stack gap="component">
            <Callout
              tone={netAdv.tone}
              title={`你真实的上下文占用 ${pct(c.netUserRatio ?? c.peakUserRatio ?? 0)}（${human(curCtx)} / 阈值 ${human(c.userContextLimit)}・${limitSrcLabel}）`}
            >
              {netAdv.text}
              {limitIsDefault && (
                <Text tone="secondary">
                  {` ⚙ 这里的 ${human(c.userContextLimit)} 是插件内置默认值，不是你在 Qoder「模型管理」里设的真实上限（插件读不到那个设置）。想按真实阈值算：在 ~/.qoder-credits-proxy/config.json 填 "userContextLimit": <你的上限>（对所有会话生效），或对本会话在 .qoder-credits/overrides/<会话id>.json 填同名字段，重跑报告即生效。`}
                </Text>
              )}
            </Callout>
            {ctxRows.length > 0 && (
              <Table
                headers={["对比口径", "数值", "说明"]}
                rows={ctxRows}
                density="compact"
              />
            )}
          </Stack>
        )}

        {c.thresholdNotEnforced && (
          <Callout tone="warning" title="⚠ 自动压缩不会在你设的阈值触发（本条最重要）">
            你的模型物理窗口是 {cwText}，Qoder 的自动压缩要等上下文涨到窗口 ~85%（≈{human(Math.round(c.contextWindow * 0.85))}）才触发；
            你在模型管理里设的 {human(c.userContextLimit)} 上限远在其下，永远不会触发自动压缩。
            请照上面「你真实的上下文占用」那条，到点自己手动压缩，别等它自动压。
          </Callout>
        )}

        {lh && (
          <Callout tone={lhTone} title="链路健康度">
            {lhText}
          </Callout>
        )}

        <Callout tone="info" title="度量口径">
          计费输入总量逐笔锁定真值（优先级：代理 promptTokens &gt; 转录 usage.input_tokens &gt; ratio{availTag(av, "contextRatio")} × {cwText}
          {cwIsFallback ? "，未拿到真窗口、全部 token 数字随之带 ≈" : ""}）；各类别/文件按块估算规模比例分摊
          {availTag(av, "categoryShare", "derived")}。{identityText}
          {cachedText ? ` ${cachedText}` : ""}
          {covPartial
            ? ` Credits 只来自 ${cov!.trips}/${cov!.roundTrips} 笔往返（占计费输入 ${pct(cov!.tokenShare)}），其余往返走代理实测、不经 Qoder 计费，故不要拿 Credits 去除以计费输入总量算单价。`
            : ""}
        </Callout>

        {byReq.length > 0 && (
          <ReportSection
            title="逐请求明细（每一次往返）"
            description={
              showCreditsChart
                ? "每个 round-trip 的真实输入规模与 credits；曲线骤降处为上下文压缩重置（顶部四项为会话累计，此处为每一次）"
                : `每个 round-trip 的真实输入规模；曲线骤降处为上下文压缩重置。credits 曲线未画：本会话只有 ${cov?.trips ?? 0}/${cov?.roundTrips ?? byReq.length} 笔往返带 credits（其余走代理实测、不经 Qoder 计费），画出来是一地零。`
            }
            meta={`${byReq.length} 次往返 · 压缩 ${orDash(s.compactions, av, "compactions")} 次`}
            divided
          >
            {showCreditsChart ? (
              <ChartComparisonGrid>
                <ChartContainer title="每次输入 tokens" ariaLabel="每次输入 tokens">
                  <LineChart
                    categories={reqLabels}
                    series={[{ name: "输入 tokens", data: reqInputs, tone: "info" }]}
                    height={220}
                    valueFormatter={human}
                    ariaLabel="每次请求输入 tokens"
                  />
                </ChartContainer>
                <ChartContainer title="每次 credits" ariaLabel="每次 credits">
                  <LineChart
                    categories={reqLabels}
                    series={[{ name: "credits", data: reqCredits, tone: "warning" }]}
                    height={220}
                    ariaLabel="每次请求 credits"
                  />
                </ChartContainer>
              </ChartComparisonGrid>
            ) : (
              <ChartContainer title="每次输入 tokens" ariaLabel="每次输入 tokens">
                <LineChart
                  categories={reqLabels}
                  series={[{ name: "输入 tokens", data: reqInputs, tone: "info" }]}
                  height={220}
                  valueFormatter={human}
                  ariaLabel="每次请求输入 tokens"
                />
              </ChartContainer>
            )}
          </ReportSection>
        )}

        {hasUsage && ccItems.length > 0 && (
          <ReportSection
            title="压缩单笔成本（会话里最贵的那几笔调用）"
            description="每次压缩本身就是一笔普通模型调用：整份上下文当 prompt 进去、摘要当 completion 出来。此前报告只显示「压缩 N 次」，把单笔最贵的开销藏成了一个计数。「省下」= 压缩前规模 − 压缩后首轮实测输入（地板）。口径列：实测=能在代理日志里唯一对上的供应商真值；自估=客户端在压缩边界里写的前后规模。"
            meta={`${ccItems.length} 次 · 输入累计 ${human(ccost?.totals.preTokens ?? 0)} · 摘要累计 ${human(ccost?.totals.postTokens ?? 0)} · 累计省下 ${human(ccost?.totals.savedTokens ?? 0)} · 其中 ${ccost?.totals.measured ?? 0} 笔为供应商实测`}
            divided
          >
            <Table
              headers={["第几次", "时刻", "触发", "输入", "摘要输出", "压缩后首轮", "省下", "耗时", "口径"]}
              rows={compactRows}
              density="compact"
              stickyHeader
            />
          </ReportSection>
        )}

        {sub && subItems.length > 0 && (
          <ReportSection
            title="子代理账（Agent 派发）"
            description="子代理的每次往返只写进它自己的独立转录，不计入上方主链任何数字；官方 UI 的一场会话扣费 = 主链 + 各子代理。"
            meta={`${subItems.length} 个子代理 · 主链 ${t.credits} + 子代理 ${sub.totals.credits} = 合计 ${sub.combined.credits} Credits`}
            divided
          >
            <Table
              headers={["子代理", "类型", "往返", "计费输入", "峰值占比", "Credits", "原价", "备注"]}
              rows={subRows}
              rowTone={subTones}
              density="compact"
              stickyHeader
            />
          </ReportSection>
        )}

        {hasUsage && r.byCategory.length > 0 && (
          <ReportSection
            title="按类别占比"
            description={`会话计费输入 token 在各来源间的分布（完整划分，占比之和 = 100%）${sysNote}`}
            meta={human(t.billedInputTokens) + ` tokens${availTag(av, "categoryShare", "derived")}`}
            divided
          >
            <ChartContainer ariaLabel="按类别占比">
              <PieChart donut data={pieData} centerLabel="计费输入" valueFormatter={human} />
            </ChartContainer>
          </ReportSection>
        )}

        {hasUsage && catDetail.length > 0 && (
          <ReportSection
            title="按类别下钻（工具 / 文件路径）"
            description="每个类别的消耗再拆到工具与具体文件/路径：工具返回、工具调用可精确到路径，其余类别为整体（无文件归属）。数值均为重发计费 token。"
            meta={`占总额=占计费输入总量 · 占本类=占该类别 · 程数=存活往返累计${availTag(av, "fileShare", "derived")}`}
            divided
          >
            <Table
              headers={["类别", "工具", "文件 / 路径", "重发 tokens", "占总额", "占本类", "程数"]}
              rows={detailRows}
              rowTone={detailTones}
              density="compact"
              stickyHeader
            />
          </ReportSection>
        )}

        {hasUsage && tools.length > 0 && (
          <ReportSection
            title="按工具占比"
            description="各工具相关内容（调用参数 + 返回）重发累计的计费 token 占比（仅工具相关块，非完整划分，占比之和 < 100%）。「单次」= 平均每次调用带来的重发 token：总量榜会把「次数少但每次极贵」的工具埋掉，这一列专门把它捞出来。"
            meta={`token 占比${availTag(av, "toolShare", "derived")} · 调用次数为实测`}
            divided
          >
            <Stack gap="component">
              <ChartContainer ariaLabel="按工具占比">
                <BarChart horizontal categories={toolCategories} series={toolSeries} valueFormatter={human} ariaLabel="按工具占比" />
              </ChartContainer>
              <Table
                headers={["工具", "重发 tokens", "占比", "调用", "单次"]}
                rows={toolRows}
                density="compact"
                stickyHeader
              />
            </Stack>
          </ReportSection>
        )}

        {hasUsage && fileRows.length > 0 && (
          <ReportSection
            title="按文件占比"
            description="精确到路径/文件名：内容随上下文被重复发送累计的计费 token 占比（Top 20，仅可归因文件的块）。「单次读取」= 这个文件平均每次被读取最终烧掉多少（含此后每一程的重发）——读一次就烧掉十几万的文件，在按总量排序的榜上毫不起眼。"
            meta={`程数=存活往返累计 · 读取=返回次数（实测）${availTag(av, "fileShare", "derived")}`}
            divided
          >
            <Table
              headers={["文件", "种类", "重发 tokens", "占比", "单次读取", "程数", "读取"]}
              rows={fileRows}
              density="compact"
              stickyHeader
            />
          </ReportSection>
        )}

        {!hasUsage && residueRows.length > 0 && (
          <ReportSection
            title="工具调用与文件读取（计数为实测）"
            description="占比与 token 一律不可用，但 tool_use 块两种转录都写，所以「谁被调了几次、谁被读了几次」仍是真值 —— IDE 端不是一无所有。"
            meta={`${t.toolCalls ?? 0} 次工具调用${availTag(av, "toolCalls")} · ${t.fileReads ?? 0} 次文件读取${availTag(av, "fileReads")} · ${s.turns} 轮对话`}
            divided
          >
            <Table
              headers={["工具 / 文件", "种类", "调用", "读取", "程数"]}
              rows={residueRows}
              density="compact"
              stickyHeader
            />
          </ReportSection>
        )}
      </Stack>
    </ReportShell>
  );
}
