import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Search, CheckCircle2 } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { useAcademyStore } from '../store';
import { BASICS_STEPS, GLOSSARY_TERMS } from '../data/basicsContent';
import type { LessonSection, Term } from '../types';

const CATEGORY_TABS = [
  { key: 'basic', label: '基础' },
  { key: 'hand', label: '手牌' },
  { key: 'action', label: '行动' },
  { key: 'strategy', label: '策略' },
] as const;

export default function BasicsIntro() {
  const navigate = useNavigate();
  const { basicsProgress, updateBasicsStep, completeBasics } = useAcademyStore();
  const [currentStep, setCurrentStep] = useState(basicsProgress.currentStep);
  const [showCompletion, setShowCompletion] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const totalSteps = BASICS_STEPS.length;
  const step = BASICS_STEPS[currentStep]!;
  const isLastStep = currentStep === totalSteps - 1;
  const isGlossaryStep = step.id === 'basics-glossary';

  const goNext = () => {
    if (isLastStep) {
      handleComplete();
      return;
    }
    const next = currentStep + 1;
    setCurrentStep(next);
    updateBasicsStep(next);
  };

  const goPrev = () => {
    if (currentStep === 0) return;
    const prev = currentStep - 1;
    setCurrentStep(prev);
    updateBasicsStep(prev);
  };

  const handleComplete = () => {
    completeBasics();
    setShowCompletion(true);
  };

  useEffect(() => {
    if (!showCompletion) return;
    if (countdown <= 0) {
      navigate('/academy/lesson/l1-basics');
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [showCompletion, countdown, navigate]);

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col min-h-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--brass-deep)] font-medium mb-1">
            Poker Basics
          </p>
          <h1 className="font-display text-[24px] md:text-[28px] text-[var(--ivory)] mb-3">
            德州扑克基础入门
          </h1>
          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-[var(--walnut-raised)] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[var(--brass-bright)]"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-xs text-[var(--ivory-muted)] font-numeric shrink-0">
              Step {currentStep + 1} / {totalSteps}
            </span>
          </div>
        </motion.div>

        {/* Step indicator dots */}
        <div className="flex items-center gap-1.5 mb-6">
          {BASICS_STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => { setCurrentStep(i); updateBasicsStep(i); }}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors',
                i === currentStep
                  ? 'bg-[var(--brass-bright)]/15 text-[var(--brass-bright)]'
                  : i < currentStep
                    ? 'text-[var(--ivory-dim)] hover:text-[var(--ivory)]'
                    : 'text-[var(--ivory-muted)] hover:text-[var(--ivory-dim)]'
              )}
            >
              <span>{s.icon}</span>
              <span className="hidden md:inline">{s.title}</span>
            </button>
          ))}
        </div>

        {/* Content area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="flex-1"
          >
            <div className="walnut-panel rounded-lg border border-[var(--walnut-border)] p-5 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{step.icon}</span>
                <h2 className="font-display text-lg text-[var(--ivory)]">{step.title}</h2>
              </div>

              {/* Render lesson sections */}
              <div className="space-y-3">
                {step.content.map((section, i) => (
                  <SectionRenderer key={i} section={section} />
                ))}
              </div>

              {/* Glossary special UI */}
              {isGlossaryStep && <GlossaryGrid />}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bottom navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--walnut-border)]">
          <button
            onClick={goPrev}
            disabled={currentStep === 0}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-md text-sm transition-colors',
              currentStep === 0
                ? 'text-[var(--ivory-muted)] cursor-not-allowed opacity-50'
                : 'text-[var(--ivory-dim)] hover:text-[var(--ivory)] hover:bg-[var(--walnut-raised)]'
            )}
          >
            <ChevronLeft size={16} />
            上一步
          </button>

          <button
            onClick={goNext}
            className={cn(
              'flex items-center gap-1.5 px-5 py-2 rounded-md text-sm font-medium transition-colors',
              isLastStep
                ? 'bg-[var(--brass-bright)] text-[var(--felt-deep)] hover:bg-[var(--brass)]'
                : 'bg-[var(--walnut-raised)] text-[var(--ivory)] hover:bg-[var(--walnut-raised)]/80'
            )}
          >
            {isLastStep ? '完成入门' : '下一步'}
            {!isLastStep && <ChevronRight size={16} />}
            {isLastStep && <CheckCircle2 size={16} />}
          </button>
        </div>
      </div>

      {/* Completion overlay */}
      <AnimatePresence>
        {showCompletion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 15, stiffness: 300 }}
              className="text-center"
            >
              <div className="text-6xl mb-4">✅</div>
              <h2 className="font-display text-2xl text-[var(--ivory)] mb-2">
                基础入门完成！
              </h2>
              <p className="text-[var(--ivory-dim)] text-sm">
                即将跳转到第一课... {countdown}s
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Renders a single LessonSection */
function SectionRenderer({ section }: { section: LessonSection }) {
  switch (section.type) {
    case 'heading':
      return (
        <h3 className="font-display text-[15px] text-[var(--brass-bright)] mt-4 first:mt-0">
          {section.content}
        </h3>
      );
    case 'text':
      return (
        <p className="text-sm text-[var(--ivory-dim)] leading-relaxed whitespace-pre-line">
          {section.content}
        </p>
      );
    case 'key-point':
      return (
        <div className="rounded-md border border-[var(--brass-bright)]/30 bg-[var(--brass-bright)]/5 px-4 py-3 text-sm text-[var(--ivory)]">
          💡 {section.content}
        </div>
      );
    case 'highlight':
      return (
        <div className="rounded-md border-l-2 border-[var(--brass-bright)] bg-[var(--walnut-raised)]/50 px-4 py-3 text-sm text-[var(--ivory-dim)]">
          {section.content}
        </div>
      );
    case 'example':
      return (
        <pre className="rounded-md bg-[var(--felt-deep)]/60 border border-[var(--walnut-border)] px-4 py-3 text-xs text-[var(--ivory-dim)] leading-relaxed whitespace-pre-line overflow-x-auto font-mono">
          {section.content}
        </pre>
      );
    case 'pro-tip':
      return (
        <div className="rounded-md bg-[var(--poker-success-bg)] border border-[var(--poker-success)]/30 px-4 py-3 text-sm text-[var(--poker-success)]/90">
          🎯 {section.content}
        </div>
      );
    default:
      return (
        <p className="text-sm text-[var(--ivory-dim)]">{section.content}</p>
      );
  }
}

/** Glossary grid with search and category tabs */
function GlossaryGrid() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>('basic');

  const filteredTerms = useMemo(() => {
    let terms = GLOSSARY_TERMS.filter((t) => t.category === activeTab);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      terms = GLOSSARY_TERMS.filter(
        (t) =>
          t.english.toLowerCase().includes(q) ||
          t.chinese.includes(q) ||
          t.explanation.includes(q)
      );
    }
    return terms;
  }, [search, activeTab]);

  return (
    <div className="mt-6 border-t border-[var(--walnut-border)] pt-5">
      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ivory-muted)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索术语（中英文）..."
          className="w-full pl-9 pr-4 py-2 rounded-md bg-[var(--felt-deep)]/60 border border-[var(--walnut-border)] text-sm text-[var(--ivory)] placeholder:text-[var(--ivory-muted)] focus:outline-none focus:border-[var(--brass-bright)]/50 transition-colors"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 mb-4">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSearch(''); }}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              activeTab === tab.key && !search
                ? 'bg-[var(--brass-bright)]/15 text-[var(--brass-bright)]'
                : 'text-[var(--ivory-muted)] hover:text-[var(--ivory-dim)] hover:bg-[var(--walnut-raised)]/50'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Term cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {filteredTerms.map((term) => (
          <TermCard key={term.id} term={term} />
        ))}
      </div>

      {filteredTerms.length === 0 && (
        <p className="text-center text-sm text-[var(--ivory-muted)] py-6">
          未找到匹配的术语
        </p>
      )}
    </div>
  );
}

function TermCard({ term }: { term: Term }) {
  return (
    <div className="rounded-md border border-[var(--walnut-border)] bg-[var(--felt-deep)]/40 px-3.5 py-3 transition-all hover:border-[var(--brass-bright)]/40 hover:-translate-y-0.5 hover:shadow-md">
      <div className="text-sm font-semibold text-[var(--ivory)]">{term.english}</div>
      <div className="text-xs text-[var(--brass-bright)] mb-1">{term.chinese}</div>
      <div className="text-[11px] text-[var(--ivory-muted)] leading-snug">{term.explanation}</div>
    </div>
  );
}
