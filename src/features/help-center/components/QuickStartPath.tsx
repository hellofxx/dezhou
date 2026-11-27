import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { QUICK_START_STEPS } from '../data/helpContent';

type QuickStartStep = (typeof QUICK_START_STEPS)[number];

interface QuickStartPathProps {
  steps?: readonly QuickStartStep[];
}

/**
 * 5 步快速上手路径 — 黄铜节点 + 发线连接（路径感）
 * 桌面：5 节点横向 + brass 发线；移动：纵向。
 */
export default function QuickStartPath({ steps = QUICK_START_STEPS }: QuickStartPathProps) {
  const { t } = useTranslation();

  return (
    <div className="quick-path" role="list">
      {steps.map((step, idx) => {
        const sourceIndex = QUICK_START_STEPS.indexOf(step);
        return (
          <div key={step.to} className="quick-path-step" role="listitem">
            <Link
              to={step.to}
              className="quick-path-node"
              aria-label={t(`help.${step.key}`)}
            >
              <span className="quick-path-node-num">{sourceIndex >= 0 ? sourceIndex + 1 : idx + 1}</span>
              <span className="quick-path-node-label">{t(`help.${step.key}`)}</span>
            </Link>
            {idx < steps.length - 1 && (
              <span className="quick-path-trail" aria-hidden="true" />
            )}
          </div>
        );
      })}
    </div>
  );
}