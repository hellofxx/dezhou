import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, BookOpen, Lock, Link2 } from 'lucide-react';
import { ConceptGraph } from './ConceptGraph';
import { useAcademyStore } from '../store';
import { getTotalLessonCount } from '../utils/courseProgress';
import { CONCEPT_NODES } from '../data/conceptNodes';

export default function ConceptGraphView() {
  const navigate = useNavigate();
  const { progress } = useAcademyStore();

  const totalLessons = getTotalLessonCount();
  const completedCount = progress.completedLessons.length;
  const remainingCount = totalLessons - completedCount;

  const handleNodeClick = (lessonId: string) => {
    navigate(`/academy/lesson/${lessonId}`);
  };

  return (
    <div className="h-full overflow-auto">
      <div className="py-6 space-y-6">
        {/* Header */}
        <motion.section
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="walnut-panel rounded-lg border border-[var(--walnut-border)] relative brass-rail overflow-hidden"
        >
          <div className="p-5 md:p-6">
            <button
              onClick={() => navigate('/academy')}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--ivory-muted)] hover:text-[var(--brass-bright)] transition-colors mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              返回策略学院
            </button>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[var(--brass-bright)]/10 flex items-center justify-center">
                <Brain className="w-6 h-6 text-[var(--brass-bright)]" />
              </div>
              <div>
                <h1 className="font-display text-2xl text-[var(--ivory)]">知识图谱</h1>
                <p className="text-sm text-[var(--ivory-dim)] mt-0.5">
                  可视化课程知识依赖关系，点击节点跳转到对应课程
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          <div className="rounded-lg bg-[var(--walnut-raised)] border border-[var(--walnut-border)] p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <BookOpen className="w-4 h-4 text-[var(--poker-success)]" />
              <span className="font-numeric text-2xl text-[var(--poker-success)]">{completedCount}</span>
            </div>
            <p className="text-xs text-[var(--ivory-muted)]">已学习</p>
          </div>
          <div className="rounded-lg bg-[var(--walnut-raised)] border border-[var(--walnut-border)] p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Lock className="w-4 h-4 text-[var(--ivory-dim)]" />
              <span className="font-numeric text-2xl text-[var(--ivory-dim)]">{remainingCount}</span>
            </div>
            <p className="text-xs text-[var(--ivory-muted)]">未学习</p>
          </div>
          <div className="rounded-lg bg-[var(--walnut-raised)] border border-[var(--walnut-border)] p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Brain className="w-4 h-4 text-[var(--brass-bright)]" />
              <span className="font-numeric text-2xl text-[var(--brass-bright)]">{totalLessons}</span>
            </div>
            <p className="text-xs text-[var(--ivory-muted)]">总课程</p>
          </div>
        </motion.div>

        {/* Concept Graph */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="walnut-panel rounded-lg border border-[var(--walnut-border)] p-4 md:p-6"
        >
          <ConceptGraph onNodeClick={handleNodeClick} />
        </motion.section>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.3 }}
          className="text-center text-xs text-[var(--ivory-dim)] pb-2"
        >
          💡 提示：滚轮缩放 · 拖拽平移 · 悬停高亮依赖链 · 点击节点跳转课程
        </motion.div>

        {/* Concept Nodes - 跨模块概念关联 */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.35 }}
          className="walnut-panel rounded-lg border border-[var(--walnut-border)] p-4 md:p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Link2 className="w-4 h-4 text-[var(--brass-bright)]" />
            <h2 className="font-display text-[16px] text-[var(--ivory)]">核心概念关联</h2>
          </div>
          <p className="text-xs text-[var(--ivory-muted)] mb-4">
            点击概念查看关联课程和训练模块，实现跨模块知识联动
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {CONCEPT_NODES.map((concept) => {
              const categoryColors: Record<string, string> = {
                fundamental: 'bg-[var(--poker-success-bg)] border-[var(--poker-success)]/30 text-[var(--poker-success)]',
                mathematical: 'bg-[var(--poker-info-bg)] border-[var(--poker-info)]/30 text-[var(--poker-info)]',
                strategic: 'bg-[var(--poker-indigo)]/15 border-[var(--poker-indigo)]/40 text-[var(--poker-indigo-bright)]',
                psychological: 'bg-[var(--poker-terra)]/15 border-[var(--poker-terra)]/40 text-[var(--poker-terra-bright)]',
              };
              const colorClass = categoryColors[concept.category] ?? categoryColors.fundamental;
              const relatedLessonExists = concept.relatedLessons[0];

              return (
                <button
                  key={concept.id}
                  onClick={() => {
                    if (relatedLessonExists) {
                      handleNodeClick(relatedLessonExists);
                    }
                  }}
                  className={`text-left rounded-md border px-3 py-2.5 transition-all hover:-translate-y-0.5 hover:shadow-md ${colorClass}`}
                >
                  <div className="text-xs font-semibold mb-0.5">{concept.name}</div>
                  <div className="text-[10px] opacity-70 leading-snug">{concept.description}</div>
                  {concept.relatedModules.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {concept.relatedModules.map((mod) => (
                        <span key={mod} className="text-[9px] px-1.5 py-0.5 rounded bg-black/20">
                          {mod === 'pot-odds' ? '赔率' : mod === 'range-trainer' ? '范围' : mod === 'gto-simulator' ? 'GTO' : '复盘'}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
