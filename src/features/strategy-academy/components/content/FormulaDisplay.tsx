/**
 * FormulaDisplay — 公式展示块薄 shim（§13.3.2 设计规范）。
 * 实现已提升至 shared/components/academy/FormulaDerivation（理论 / 策略两院单源）：
 * 纯公式简单行保持 legacy DOM（brass 底 + mono 居中 + 变量高亮），
 * 含散文/标题/注脚时走结构化推导布局（编号步骤 + 散文左对齐）。
 * 本文件保留原导出名避免扰动既有消费方 import 路径。
 */
export { FormulaDerivation as FormulaDisplay } from '@/shared/components/academy/FormulaDerivation';