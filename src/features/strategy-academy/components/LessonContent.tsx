import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, BookOpen, PlayCircle, Flame, type LucideIcon } from 'lucide-react';
import type { Lesson, PracticeResult } from '../types';
import { ContentBlock } from './content';
import { HandExampleComponent } from './HandExample';
import { PracticeDrillComponent } from './PracticeDrill';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';

interface LessonContentProps {
  lesson: Lesson;
  onComplete: () => void;
  onPracticeComplete?: (result: PracticeResult) => void;
}

type TabValue = 'theory' | 'examples' | 'practice';

interface TabItem {
  value: TabValue;
  label: string; // Tab 按钮短词（<640px 仅图标）
  fullLabel: string; // 底部 CTA 完整词
  icon: LucideIcon;
}

export function LessonContent({ lesson, onComplete, onPracticeComplete }: LessonContentProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('theory');

  const hasExamples = lesson.examples && lesson.examples.length > 0;
  const hasPractice = !!lesson.practice;

  const tabs: TabItem[] = [
    { value: 'theory', label: '理论', fullLabel: '理论讲解', icon: BookOpen },
    ...(hasExamples ? [{ value: 'examples' as TabValue, label: '示例', fullLabel: '示例演示', icon: PlayCircle }] : []),
    ...(hasPractice ? [{ value: 'practice' as TabValue, label: '实战', fullLabel: '实战练习', icon: Flame }] : []),
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
        <TabsList className="sticky top-0 z-20 w-full bg-[var(--walnut-raised)] border border-[var(--walnut-border)]">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex-1 flex items-center justify-center gap-1.5 data-[state=active]:bg-[var(--brass-bright)] data-[state=active]:text-[var(--felt-deep)] text-[var(--ivory-muted)] text-xs sm:text-sm"
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Theory Tab */}
        <TabsContent value="theory" className="mt-4">
          {/* P2-05: 阅读区放宽至 max-w-4xl（消除宽屏左右大空白）；正文段落自身限宽保持阅读舒适 */}
          <div className="space-y-4 max-w-4xl mx-auto">
            {lesson.content.map((section, index) => (
              <ContentBlock key={index} section={section} />
            ))}
          </div>
          {nextTab && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setActiveTab(nextTab.value)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                进入{nextTab.fullLabel}
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
                  {prevTab.fullLabel}
                </button>
              ) : <div />}
              {nextTab ? (
                <button
                  onClick={() => setActiveTab(nextTab.value)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  进入{nextTab.fullLabel}
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
                  {prevTab.fullLabel}
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
