"""Append Help Center Redesign note to today's memory file."""

from pathlib import Path

p = Path('.codebuddy/memory/2026-08-10.md')
text = p.read_text(encoding='utf-8')

suffix = """
## 帮助中心首页重构（Help Center Redesign）
触发：用户请求 @frontend-design 优化帮助中心 UI。目标：补齐 Hero 签名元素，与 academy/theory/progress 家族同形但差异化。

### 问题诊断
旧版 HelpHome 由 5 段平铺：panel-title + 快速上手（5 个横排 chip 按钮）+ 9 个 module-card 网格 + 6 张概念卡片（普通 div）+ FAQ 手风琴。无 hero 焦点、无主 CTA、无视觉签名；概念卡片只是边框面板；FAQ 无编号；快速上手仅按钮串，无"路径"叙事感。

### 设计方向（签名元素「House Rules 立牌」）
扑克牌桌中央立着的「House Rules」规则牌——真实存在的牌室文化物件。象牙卡面 + 黄铜顶部饰条 + 底部黄铜底座阴影 + 轻微 3D 倾斜（hover 回正）。
- Hero「House Rules 立牌」：左 eyebrow + display 标题「欢迎来到牌室」+ 副标 + 主 CTA「从快速上手开始」+ meta「9 篇模块教程 · 6 项系统规则 · 8 条常见问答」；右侧倾斜立牌，3 条编号规则（01 快速上手 / 02 模块教程 / 03 常见问答），点击锚点滚动到对应 section
- 快速上手路径：5 步黄铜节点圆 + brass 发线连接 + 箭头，桌面横向移动纵向
- 系统概念卡片：纵向卡片 + 顶部 brass 描边圆图标（gauge/flame/repeat/award/clock/database）
- FAQ：编号 01-08 + 左侧 brass 描边（walnut-border → brass 渐变提亮），展开时左侧亮 brass
- 家族差异化：academy（brass 桌布梯度）/ theory（ivory 纸感径向）/ progress（战绩牌匾横向）/ help（立体倾斜立牌）

### 代码变更
- 新文件：HelpHero.tsx（House Rules 立牌签名元素，导出 HelpHeroAnchor 类型）、ConceptCard.tsx（6 概念卡片含图标映射）
- 重写：HelpHome.tsx（HelpHero + 4 个锚点 section + 锚点 ref scrollIntoView）、QuickStartPath.tsx（5 节点轨迹）、FaqAccordion.tsx（编号 + brass 描边 + framer-motion 保留）
- data/helpContent.ts：CONCEPT_CARDS 数据结构加 iconKey 字段
- 测试：HelpHome.test.tsx 断言改"玩家须知" eyebrow（module-card 9 张与 FAQ aria-expanded 交互保持兼容）；helpContent.integrity.test.ts 新增 CONCEPT_CARDS iconKey 完整性守卫（12 tests）
- globals.css 追加 .help-hero .help-hero-* .house-rules-* .quick-path* .concept-card* .faq-item* + light theme 覆盖 + 移动端响应式（约 220 行）
- i18n：zh/en help 命名空间新增 hero.{ariaLabel,eyebrow,title,subtitle,cta,meta,cardAria,cardEyebrow,cardFooter,rules.{01,02,03}} + quickStart.subtitle + articles.subtitle + concepts.subtitle + faq.subtitle

### 验证
- pnpm verify = typecheck ✓ lint ✓ 477 tests ✓ 68 files（designTokenGuard 4 tests 通过，无新依赖）
- Playwright 截图 .visual-check/help-redesign-{desktop,mobile}-{closed,faq-open}.png（untracked）：
  - 桌面：Hero 立牌 3D 倾斜可见 + 快速上手节点轨迹 + 9 模块卡 + 6 概念卡 + FAQ 编号与 brass 描边
  - 移动：Hero 单列（立牌去 3D 倾斜），快速上手纵向节点，FAQ 第 03 条展开左 brass 描边亮起
- 桌面截图全高 ~2100px（原 ~1500px），高度增加但每段视觉密度合理
"""

if '帮助中心首页重构' in text:
    print('Already present, skipped.')
else:
    p.write_text(text.rstrip() + suffix, encoding='utf-8')
    print('Appended Help Center Redesign note.')