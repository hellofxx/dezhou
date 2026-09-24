import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HeartCrack } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { useProgressStore } from '../../store';

/**
 * P2-5.3: Tilt 前兆识别组件。
 *
 * 监听 `progressStore.emotion.consecutiveWrongCount`，当从 <3 跨越到 >=3 时
 * 弹出 Dialog 提示"要不要休息一下？"。提供两个按钮：
 *  - 休息一下：关闭 Dialog 并跳转到 Dashboard
 *  - 继续训练：仅关闭 Dialog
 *
 * 渲染位置：AppLayout 全局渲染一次，覆盖所有训练页面。
 * 触发策略：仅在"跨越阈值"时触发一次，避免每答错一题都弹出。
 */
export default function TiltWarning() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const consecutiveWrongCount = useProgressStore((s) => s.emotion.consecutiveWrongCount);

  const [open, setOpen] = useState(false);
  const prevCountRef = useRef(consecutiveWrongCount);

  useEffect(() => {
    const prev = prevCountRef.current;
    // 跨越阈值：从 <3 到 >=3 才触发
    if (consecutiveWrongCount >= 3 && prev < 3) {
      setOpen(true);
    }
    prevCountRef.current = consecutiveWrongCount;
  }, [consecutiveWrongCount]);

  const handleRest = () => {
    setOpen(false);
    navigate('/');
  };

  // P4 修复（4.5-P2-1）：继续训练时给出后续动作
  // 1. 跳转到情绪管理课程（local-mental-tilt-recognition）帮助用户调整心态
  // 2. 不强制降级（降级由 shouldDownshiftDifficulty 在各训练模块独立处理）
  const handleContinue = () => {
    setOpen(false);
    // 跳转到情绪管理课程，提供具体可执行的学习路径
    navigate('/academy/lesson/local-mental-tilt-recognition');
  };

  // P4 修复（4.5-P2-1）：新增"硬继续"选项，仅关闭弹窗不跳转
  // 用于用户明确知道状态、想立即继续当前训练的场景
  const handleDismiss = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-[var(--surface)] border-[var(--walnut-border)] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[var(--ivory)] flex items-center gap-2">
            <HeartCrack className="w-5 h-5 text-[var(--danger)]" />
            {t('tilt.title', { defaultValue: '要不要休息一下？' })}
          </DialogTitle>
          <DialogDescription className="text-[var(--ivory-muted)] pt-2">
            {t('tilt.message', {
              defaultValue: '连续答错可能是疲劳的信号。短暂休息能帮你保持长期进步。',
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2 flex-wrap">
          <Button variant="outline" onClick={handleDismiss}>
            {t('tilt.dismiss', { defaultValue: '我知道了' })}
          </Button>
          <Button variant="outline" onClick={handleContinue}>
            {t('tilt.continue', { defaultValue: '学习情绪管理' })}
          </Button>
          <Button
            onClick={handleRest}
            className="bg-[var(--brass-bright)] text-[var(--felt-deep)] hover:opacity-90"
          >
            {t('tilt.rest', { defaultValue: '休息一下' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
