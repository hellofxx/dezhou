import { useTranslation } from 'react-i18next';
import { Database, Download, Trash2, Upload } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { cn } from '@/shared/utils/cn';
import { useProgressStore } from '../../../store';
import { useDataManagement } from '../useDataManagement';
import { SettingsSection } from '../primitives';

export function DataSection() {
  const { t } = useTranslation();
  const records = useProgressStore((s) => s.records);
  const {
    messages,
    busy,
    fileInputRef,
    requestImport,
    handleFileChange,
    exportData,
    clearDialogOpen,
    setClearDialogOpen,
    confirmClear,
  } = useDataManagement();

  return (
    <SettingsSection
      id="data"
      icon={<Database className="h-4 w-4" />}
      title={t('settings.data', { defaultValue: '数据管理' })}
      hint={t('settings.dataHint', { defaultValue: '导出、导入或清除训练数据' })}
      summary={t('settings.recordCount', {
        defaultValue: '当前共 {{count}} 条训练记录',
        count: records.length,
      })}
    >
      {messages.length > 0 && (
        <div className="space-y-1">
          {messages.map((message) => (
            <p
              key={message.id}
              role="status"
              className={cn(
                'rounded-lg px-3 py-2 text-sm',
                message.kind === 'error'
                  ? 'bg-[var(--danger-bg)] text-[var(--danger-text)]'
                  : 'bg-[var(--brass-glow)] text-[var(--brass-text)]',
              )}
            >
              {message.text}
            </p>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            void exportData();
          }}
          disabled={busy}
          className="gap-1"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          {t('settings.exportData', { defaultValue: '导出数据' })}
        </Button>
        <Button variant="outline" size="sm" onClick={requestImport} disabled={busy} className="gap-1">
          <Upload className="h-4 w-4" aria-hidden="true" />
          {t('settings.importData', { defaultValue: '导入数据' })}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setClearDialogOpen(true)}
          className="gap-1 border-[var(--danger)]/30 text-[var(--danger-text)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger-text)]"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          {t('settings.clearRecords', { defaultValue: '清除训练记录' })}
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        tabIndex={-1}
        className="hidden"
      />
      <p className="font-numeric text-xs text-[var(--ivory-dim)]">
        {t('settings.recordCount', { defaultValue: '当前共 {{count}} 条训练记录', count: records.length })}
      </p>
      <p className="text-xs text-[var(--ivory-dim)]">
        {t('settings.dataScopeNote', {
          defaultValue:
            '导出为完整备份（含个人偏好与牌局复盘数据）；导入逐条校验记录字段，重复记录自动跳过。',
        })}
      </p>

      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent className="border-[var(--walnut-border)] bg-[var(--surface)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--ivory)]">
              {t('settings.clearConfirmTitle', { defaultValue: '确认清除训练记录' })}
            </DialogTitle>
            <DialogDescription>
              {t('settings.clearConfirmDesc', {
                defaultValue:
                  '只删除训练记录（统计与历史列表中的数据）。ELO 段位、复习队列、个人设置、学院进度与牌局复盘数据都会保留。此操作不可撤销。',
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setClearDialogOpen(false)}>
              {t('settings.cancel', { defaultValue: '取消' })}
            </Button>
            <Button variant="destructive" onClick={confirmClear}>
              {t('settings.confirmClear', { defaultValue: '确认清除' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingsSection>
  );
}