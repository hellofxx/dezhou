import { useState } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, AlertTriangle, ArrowRight, ArrowLeft, BookOpen, Lightbulb, ExternalLink, Sigma } from 'lucide-react';
import type { Lesson, LessonSection, PracticeResult } from '../types';
import { ProTip } from './ProTip';
import { HandExampleComponent } from './HandExample';
import { PracticeDrillComponent } from './PracticeDrill';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';

interface LessonContentProps {
  lesson: Lesson;
  onComplete: () => void;
  onPracticeComplete?: (result: PracticeResult) => void;
}

type TabValue = 'theory' | 'examples' | 'practice';

export function LessonContent({ lesson, onComplete, onPracticeComplete }: LessonContentProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('theory');

  const hasExamples = lesson.examples && lesson.examples.length > 0;
  const hasPractice = !!lesson.practice;

  const tabs: { value: TabValue; label: string }[] = [
    { value: 'theory', label: '📖 理论讲解' },
    ...(hasExamples ? [{ value: 'examples' as TabValue, label: '🎴 示例演示' }] : []),
    ...(hasPractice ? [{ value: 'practice' as TabValue, label: '⚔️ 实战练习' }] : []),
  ];

  const currentTabIndex = tabs.findIndex((t) => t.value === activeTab);
  const nextTab = tabs[currentTabIndex + 1];
  const prevTab = tabs[currentTabIndex - 1];

  const handlePracticeComplete = (result: PracticeResult) => {
    onPracticeComplete?.(result);
    onComplete();
  };

  return (
    <div>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <TabsList className="w-full bg-[var(--walnut-raised)] border border-[var(--walnut-border)]">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex-1 data-[state=active]:bg-[var(--brass-bright)] data-[state=active]:text-[var(--felt-deep)] text-[var(--ivory-muted)] text-xs sm:text-sm"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Theory Tab */}
        <TabsContent value="theory" className="mt-4">
          <div className="space-y-4">
            {lesson.content.map((section, index) => (
              <SectionRenderer key={index} section={section} />
            ))}
          </div>
          {nextTab && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setActiveTab(nextTab.value)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                进入{nextTab.label.replace(/^[^\s]+\s/, '')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
          {!nextTab && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={onComplete}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                完成学习
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </TabsContent>

        {/* Examples Tab */}
        {hasExamples && (
          <TabsContent value="examples" className="mt-4">
            <div className="space-y-8">
              {lesson.examples!.map((example, index) => (
                <HandExampleComponent key={example.id} example={example} index={index} />
              ))}
            </div>
            {/* Navigation */}
            <div className="mt-6 flex items-center justify-between">
              {prevTab ? (
                <button
                  onClick={() => setActiveTab(prevTab.value)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--walnut-raised)] text-[var(--ivory)] text-sm hover:bg-[var(--walnut-raised)]/80 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {prevTab.label.replace(/^[^\s]+\s/, '')}
                </button>
              ) : <div />}
              {nextTab ? (
                <button
                  onClick={() => setActiveTab(nextTab.value)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  进入{nextTab.label.replace(/^[^\s]+\s/, '')}
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={onComplete}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  完成学习
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </TabsContent>
        )}

        {/* Practice Tab */}
        {hasPractice && (
          <TabsContent value="practice" className="mt-4">
            <PracticeDrillComponent
              drill={lesson.practice!}
              lessonId={lesson.id}
              onComplete={handlePracticeComplete}
            />
            {/* Back navigation (only show when not finished) */}
            {prevTab && (
              <div className="mt-4 flex justify-start">
                <button
                  onClick={() => setActiveTab(prevTab.value)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--walnut-raised)] text-[var(--ivory)] text-sm hover:bg-[var(--walnut-raised)]/80 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {prevTab.label.replace(/^[^\s]+\s/, '')}
                </button>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Empty state for lessons without examples/practice */}
      {!hasExamples && !hasPractice && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 flex items-center gap-2 text-xs text-[var(--ivory-muted)]"
        >
          <BookOpen className="w-3.5 h-3.5" />
          本课仅有理论内容
        </motion.div>
      )}
    </div>
  );
}

function SectionRenderer({ section }: { section: LessonSection }) {
  switch (section.type) {
    case 'heading':
      return (
        <h2 className="font-display text-[18px] text-[var(--ivory)] tracking-wide pt-2">
          {section.content}
        </h2>
      );

    case 'text':
      return (
        <p className="text-sm text-[var(--ivory-dim)] leading-relaxed whitespace-pre-line">
          {section.content}
        </p>
      );

    case 'highlight':
      return (
        <div className="rounded-lg border border-[var(--warning)]/30 bg-[var(--warning)]/10 p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-[var(--warning)] shrink-0 mt-0.5" />
          <p className="text-sm text-[var(--ivory-muted)] leading-relaxed">{section.content}</p>
        </div>
      );

    case 'key-point':
      return (
        <div className="rounded-lg border border-[var(--felt-light)]/50 bg-[var(--felt-light)]/10 p-4 flex items-start gap-3">
          <KeyRound className="w-4 h-4 text-[var(--success)] shrink-0 mt-0.5" />
          <p className="text-sm text-[var(--ivory-muted)] leading-relaxed">{section.content}</p>
        </div>
      );

    case 'pro-tip':
      return <ProTip content={section.content} />;

    case 'example':
      return (
        <div className="rounded-lg bg-[var(--felt-deep)] border border-[var(--walnut-border)] p-4">
          <p className="text-sm text-[var(--ivory-dim)] font-mono whitespace-pre-line">
            {section.content}
          </p>
        </div>
      );

    case 'formula':
      return (
        <div className="rounded-lg bg-[var(--felt-deep)] border border-[var(--brass-deep)]/40 p-4">
          <div className="flex items-start gap-2">
            <Sigma className="w-4 h-4 text-[var(--brass-bright)] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-[var(--brass-bright)] font-semibold mb-1">公式推导</p>
              <pre className="text-sm text-[var(--ivory-dim)] font-mono whitespace-pre-line leading-relaxed">
                {section.content}
              </pre>
            </div>
          </div>
        </div>
      );

    case 'theory-reference':
      return (
        <div className="rounded-lg border border-[var(--info)]/30 bg-[var(--info)]/10 p-4">
          <div className="flex items-start gap-3">
            <ExternalLink className="w-4 h-4 text-[var(--info)] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-[var(--info)] font-semibold mb-1">理论支撑</p>
              <p className="text-sm text-[var(--ivory-muted)] leading-relaxed">{section.content}</p>
            </div>
          </div>
        </div>
      );

    case 'counter-intuitive':
      return (
        <div className="rounded-lg border border-[var(--warning)]/40 bg-[var(--warning)]/8 p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-4 h-4 text-[var(--warning)] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-[var(--warning)] font-semibold mb-1">反直觉点</p>
              <p className="text-sm text-[var(--ivory-muted)] leading-relaxed">{section.content}</p>
            </div>
          </div>
        </div>
      );

    default:
      return (
        <p className="text-sm text-[var(--ivory-dim)] leading-relaxed">{section.content}</p>
      );
  }
}
