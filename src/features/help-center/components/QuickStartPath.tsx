import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { QUICK_START_STEPS } from '../data/helpContent';

/**
 * 5 步快速上手路径 — 黄铜节点 + 发线连接（路径感）
 * 桌面：5 节点横向 + brass 发线；移动：纵向。
 */
export default function QuickStartPath() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="quick-path" role="list">
      {QUICK_START_STEPS.map((step, idx) => (
        <div key={idx} className="quick-path-step" role="listitem">
          <button
            type="button"
            onClick={() => navigate(step.to)}
            className="quick-path-node"
            aria-label={t(`help.${step.key}`)}
          >
            <span className="quick-path-node-num">{idx + 1}</span>
            <span className="quick-path-node-label">{t(`help.${step.key}`)}</span>
          </button>
          {idx < QUICK_START_STEPS.length - 1 && (
            <span className="quick-path-trail" aria-hidden="true" />
          )}
        </div>
      ))}
    </div>
  );
}