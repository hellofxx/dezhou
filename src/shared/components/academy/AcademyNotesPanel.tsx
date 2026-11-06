import { useId } from 'react';
import { NotebookPen, Save, Trash2 } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { SectionLabel } from '@/shared/components/layout/SectionLabel';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';

export interface AcademyNotesLabels {
  title: string;
  placeholder: string;
  /** 字数提示（调用方负责插值与单位） */
  charCount: (count: number, max: number) => string;
  save: string;
  clear: string;
  /** 无笔记且未输入时的提示 */
  empty: string;
  /** 保存成功提示（由调用方 toast 呈现，面板本身不渲染） */
  saved: string;
  /** 清空成功提示（由调用方 toast 呈现，面板本身不渲染） */
  cleared: string;
}

export interface AcademyNotesPanelProps {
  /** 受控草稿（截断在 maxLength 内；初值由调用方决定，可用 key 重挂载切换章节） */
  value: string;
  onChange: (value: string) => void;
  /** 显式保存：仅点击按钮触发，不做输入即存（避免写放大） */
  onSave: () => void;
  onClear: () => void;
  /** 字数上限：组件同时做输入截断与 maxLength 兜底 */
  maxLength: number;
  /** 是否已有落库笔记：决定清空按钮是否出现 */
  hasStoredNote: boolean;
  labels: AcademyNotesLabels;
  /** 追加禁用条件（如草稿与已存内容一致时禁用保存，避免空写） */
  saveDisabled?: boolean;
  className?: string;
}

/**
 * 学院笔记面板（理论章节 / 策略课时共用）。
 *
 * 纯受控展示：不读 store、不 toast、不做持久化；草稿状态与写入路径由调用方持有。
 * 不做任何门禁 / 掌握度联动（笔记是阅读辅助，不参与进度判定）。
 * 字段与按钮交互状态由 `Textarea` / `Button` 接管；保存按钮的黄铜平铺底是临时覆盖，
 * V1 统一为 `variant="default"` 金属件后删除。
 */
export function AcademyNotesPanel({
  value,
  onChange,
  onSave,
  onClear,
  maxLength,
  hasStoredNote,
  labels,
  saveDisabled,
  className,
}: AcademyNotesPanelProps) {
  const countId = useId();
  const trimmedLength = value.trim().length;
  const canSave = trimmedLength > 0 && !saveDisabled;
  const showEmptyHint = !hasStoredNote && trimmedLength === 0;

  return (
    <section aria-label={labels.title} className={cn('panel space-y-2.5', className)}>
      <div className="flex items-center gap-2">
        <NotebookPen className="w-4 h-4 text-[var(--brass-bright)] shrink-0" aria-hidden="true" />
        <SectionLabel as="h2">{labels.title}</SectionLabel>
      </div>

      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, maxLength))}
        maxLength={maxLength}
        rows={4}
        aria-describedby={countId}
        placeholder={labels.placeholder}
        className="w-full min-h-24 bg-[var(--walnut-raised)]/40 border border-[var(--walnut-border)] rounded-lg p-2.5 text-sm text-[var(--ivory)] placeholder:text-[var(--ivory-muted)] resize-y"
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p id={countId} className="font-numeric text-[11px] text-[var(--ivory-muted)]">
          {labels.charCount(value.length, maxLength)}
        </p>
        <div className="flex items-center gap-2">
          {hasStoredNote ? (
            <Button
              type="button"
              variant="quiet"
              onClick={onClear}
              aria-label={labels.clear}
              className="inline-flex h-auto min-h-11 items-center justify-start gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-normal text-[var(--ivory-dim)] [&_svg]:size-3.5 hover:text-[var(--ivory)] hover:bg-[var(--walnut-raised)]/60 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              {labels.clear}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="quiet"
            onClick={onSave}
            disabled={!canSave}
            className="inline-flex h-auto min-h-11 items-center justify-start gap-1.5 rounded-md bg-[var(--brass-fill)] px-3 py-1.5 text-xs font-semibold text-[var(--brass-fill-ink)] [&_svg]:size-3.5 transition-opacity hover:bg-[var(--brass-fill)] hover:text-[var(--brass-fill-ink)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="w-3.5 h-3.5" aria-hidden="true" />
            {labels.save}
          </Button>
        </div>
      </div>

      {showEmptyHint ? (
        <p className="text-[11px] text-[var(--ivory-dim)] leading-relaxed">{labels.empty}</p>
      ) : null}
    </section>
  );
}
