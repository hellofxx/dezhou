import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Award, CheckCircle2, XCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { useAcademyStore } from '../store';
import { LEVELS } from '../data/courses';
// P1E-09: 题目集构建抽出为种子化纯函数（重试重置种子即重洗）
import { buildCertificationExam } from '../utils/certificationExam';
import { resolveQuizQuestion } from '../utils/contentKeys';

/** 认证通过基准正确率（%），与 store 自适应算法（70%-84%）的基准一致；ACAD-04 */
const BASE_REQUIRED_ACCURACY = 80;

export default function LevelCertification() {
  const { t } = useTranslation();
  const { level: levelParam } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const { certifications, attemptCertification, progress } = useAcademyStore();
  const level = parseInt(levelParam ?? '1', 10);
  // 审计 1.2：合并同 level 的全部条目（如 Level 4 = 4A + 4B），题池与进度均按合并口径
  const levelEntries = useMemo(() => LEVELS.filter((l) => l.level === level), [level]);
  const mergedLessons = useMemo(() => levelEntries.flatMap((e) => e.lessons), [levelEntries]);

  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  // 会话随机种子：每次进入考试题序/选项顺序不同，考试过程中保持稳定（防背位置应试）
  // P1E-09: 重试时通过 setSessionSeed 重置种子 → 题目集/题序/选项全部重洗
  const [sessionSeed, setSessionSeed] = useState(() => Math.floor(Math.random() * 2 ** 31));

  const certification = certifications[level];
  const isCertified = !!certification?.certifiedAt;
  // ACAD-04 修复：通过标准与 store 的 attemptCertification 自适应 requiredAccuracy 对齐。
  // 已有认证记录时读取其阈值；首次尝试用基准 80%（与 store 动态算法 70%-84% 的基准一致）。
  const requiredAccuracy = certification?.requiredAccuracy ?? BASE_REQUIRED_ACCURACY;

  // 从该级别全部条目的所有课程中收集测验题（种子化洗牌取最多 20 题 + 选项重排）
  // 渲染层 key 覆盖：先解析各课 quiz 文案（key 缺失回退数据层中文），再进入种子化构建
  const allQuestions = useMemo(
    () =>
      buildCertificationExam(
        mergedLessons.map((l) => ({ ...l, quiz: l.quiz.map((q) => resolveQuizQuestion(t, q)) })),
        sessionSeed,
      ),
    [mergedLessons, sessionSeed, t]
  );

  if (levelEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-[var(--ivory-muted)]">{t('academy.levelCertification.levelNotFound')}</p>
        <button onClick={() => navigate('/academy')} className="text-sm text-[var(--brass-bright)] hover:underline">
          {t('academy.levelCertification.backToAcademy')}
        </button>
      </div>
    );
  }

  const question = allQuestions[currentIndex];

  const handleSelect = (index: number) => {
    if (showExplanation) return;
    setSelectedIndex(index);
    setShowExplanation(true);
    if (question && index === question.correctIndex) {
      setCorrectCount((c) => c + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < allQuestions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedIndex(null);
      setShowExplanation(false);
    } else {
      const score = Math.round((correctCount / allQuestions.length) * 100);
      attemptCertification(level, score);
      setFinished(true);
    }
  };

  const handleRetry = () => {
    setStarted(false);
    setCurrentIndex(0);
    setSelectedIndex(null);
    setShowExplanation(false);
    setCorrectCount(0);
    setFinished(false);
    // P1E-09: 重置会话种子，使题目集/题序/选项顺序重新洗牌（防背题应试）
    setSessionSeed(Math.floor(Math.random() * 2 ** 31));
  };

  // 完成页面
  if (finished) {
    const score = Math.round((correctCount / allQuestions.length) * 100);
    const passed = score >= requiredAccuracy;

    return (
      <div className="py-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="walnut-panel rounded-lg border border-[var(--walnut-border)] p-8 text-center"
        >
          <div className="text-6xl mb-4">{passed ? '🎉' : '📚'}</div>
          <h2 className="font-display text-2xl text-[var(--ivory)] mb-2">
            {passed ? t('academy.levelCertification.passedTitle', { level }) : t('academy.levelCertification.keepGoing')}
          </h2>
          <p className="text-[var(--ivory-dim)] mb-1">
            {t('academy.quiz.answeredCount', { correct: correctCount, total: allQuestions.length })}
          </p>
          <p className="font-numeric text-4xl text-[var(--brass-bright)] mb-2">{t('academy.quiz.score', { score })}</p>
          <p className="text-xs text-[var(--ivory-muted)] mb-6">
            {passed
              ? t('academy.levelCertification.passedHint')
              : t('academy.levelCertification.needAccuracy', { required: requiredAccuracy })}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => navigate('/academy')}
              className="px-5 py-2.5 rounded-lg bg-[var(--walnut-raised)] text-[var(--ivory)] text-sm hover:bg-[var(--walnut-raised)]/80"
            >
              {t('academy.levelCertification.backToAcademy')}
            </button>
            {!passed && (
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90"
              >
                <RotateCcw className="w-4 h-4" />
                {t('academy.levelCertification.retry')}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // 开始前的介绍页面
  if (!started) {
    const levelProgress = mergedLessons.filter((l) => progress.completedLessons.includes(l.id)).length;
    const allCompleted = levelProgress === mergedLessons.length;

    return (
      <div className="h-full overflow-auto">
        <div className="py-6 space-y-6">
          <motion.section
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="walnut-panel rounded-lg border border-[var(--walnut-border)] p-5 md:p-6"
          >
            <button
              onClick={() => navigate('/academy')}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--ivory-muted)] hover:text-[var(--brass-bright)] transition-colors mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t('academy.conceptGraph.backToAcademy')}
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-lg bg-[var(--brass-bright)]/10 flex items-center justify-center">
                <Award className="w-7 h-7 text-[var(--brass-bright)]" />
              </div>
              <div>
                <h1 className="font-display text-2xl text-[var(--ivory)]">
                  {t('academy.levelCertification.title', { level })}
                </h1>
                <p className="text-sm text-[var(--ivory-dim)] mt-0.5">
                  {levelEntries.map((e) => e.title).join(' · ')}
                </p>
              </div>
            </div>

            {/* Certification info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-xs text-[var(--ivory-dim)]">
                <span className="w-2 h-2 rounded-full bg-[var(--brass-bright)]" />
                {t('academy.levelCertification.questionCount', { count: allQuestions.length })}
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--ivory-dim)]">
                <span className="w-2 h-2 rounded-full bg-[var(--brass-bright)]" />
                {t('academy.levelCertification.passStandard', { required: requiredAccuracy })}
              </div>
              {certification && (
                <div className="flex items-center gap-2 text-xs text-[var(--ivory-dim)]">
                  <span className="w-2 h-2 rounded-full bg-[var(--info)]" />
                  {t('academy.levelCertification.attemptHistory', {
                    attempts: certification.attempts,
                    best: certification.bestScore ?? 0,
                  })}
                </div>
              )}
              {isCertified && (
                <div className="flex items-center gap-2 text-xs text-[var(--poker-success)]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t('academy.levelCertification.passedOn', {
                    date: new Date(certification!.certifiedAt!).toLocaleDateString(),
                  })}
                </div>
              )}
            </div>

            {/* Prerequisites check */}
            {!allCompleted && (
              <div className="rounded-lg bg-[var(--warning)]/10 border border-[var(--warning)]/30 p-3 mb-6 text-xs text-[var(--warning)]">
                {t('academy.levelCertification.prereqHint', { progress: levelProgress, total: mergedLessons.length })}
              </div>
            )}

            <button
              onClick={() => setStarted(true)}
              disabled={allQuestions.length === 0}
              className="w-full py-3 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90 disabled:opacity-50"
            >
              {isCertified ? t('academy.levelCertification.retry') : t('academy.levelCertification.start')}
            </button>
          </motion.section>
        </div>
      </div>
    );
  }

  // 答题界面
  if (!question) return null;
  const isCorrect = selectedIndex === question.correctIndex;

  return (
    <div className="py-6">
      <div className="walnut-panel rounded-lg border border-[var(--walnut-border)] p-6">
        {/* Progress */}
        <div className="flex items-center gap-1.5 mb-6">
          {allQuestions.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                i < currentIndex ? 'bg-[var(--brass-bright)]' : i === currentIndex ? 'bg-[var(--brass)]' : 'bg-[var(--walnut-raised)]'
              )}
            />
          ))}
        </div>

        <p className="text-xs text-[var(--ivory-muted)] mb-2 font-numeric">
          {t('academy.quiz.progress', { current: currentIndex + 1, total: allQuestions.length })}
        </p>
        <h3 className="font-display text-[17px] text-[var(--ivory)] mb-5 leading-snug">
          {question.question}
        </h3>

        <div className="space-y-2.5">
          {question.options.map((option, index) => {
            const isSelected = selectedIndex === index;
            const isCorrectOption = index === question.correctIndex;
            return (
              <button
                key={index}
                onClick={() => handleSelect(index)}
                disabled={showExplanation}
                className={cn(
                  'w-full text-left px-4 py-3 rounded-lg border text-sm transition-all duration-200',
                  !showExplanation && 'border-[var(--walnut-border)] bg-[var(--felt)] hover:border-[var(--brass)]/50 text-[var(--ivory-dim)]',
                  showExplanation && isCorrectOption && 'border-[var(--poker-success)]/50 bg-[var(--poker-success-bg)] text-[var(--poker-success)]',
                  showExplanation && isSelected && !isCorrectOption && 'border-[var(--poker-danger)]/50 bg-[var(--poker-danger-bg)] text-[var(--poker-danger)]',
                  showExplanation && !isSelected && !isCorrectOption && 'opacity-40'
                )}
              >
                <span className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] shrink-0 font-numeric">
                    {String.fromCharCode(65 + index)}
                  </span>
                  {option}
                  {showExplanation && isCorrectOption && <CheckCircle2 className="w-4 h-4 ml-auto shrink-0" />}
                  {showExplanation && isSelected && !isCorrectOption && <XCircle className="w-4 h-4 ml-auto shrink-0" />}
                </span>
              </button>
            );
          })}
        </div>

        {showExplanation && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'mt-4 rounded-lg p-4 text-sm leading-relaxed',
              isCorrect ? 'bg-[var(--poker-success-bg)] border border-[var(--poker-success)]/30 text-[var(--poker-success)]/90' : 'bg-[var(--poker-danger-bg)] border border-[var(--poker-danger)]/30 text-[var(--poker-danger)]/90'
            )}
          >
            <p className="font-semibold mb-1">{isCorrect ? t('academy.quiz.correctMark') : t('academy.quiz.wrongMark')}</p>
            <p>{question.explanation}</p>
          </motion.div>
        )}

        {showExplanation && (
          <div className="mt-5 flex justify-end">
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90"
            >
              {currentIndex < allQuestions.length - 1 ? t('academy.quiz.next') : t('academy.quiz.viewResult')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
