/**
 * 设置路由（批次 3 冻结路由表）：`/settings` = 设置纸条。
 *
 * 关闭纸条（Escape / 遮罩 / 关闭按钮）等价于离开设置：导航回学习路径首页，
 * 避免 URL 停留在 `open=false` 的空浮层上（浮层与路由同构，无独立关闭态）。
 */
import { useNavigate } from 'react-router-dom';
import { SettingsSlip } from '@/features/progress/ui';

export default function SettingsRoute() {
  const navigate = useNavigate();

  return <SettingsSlip open onClose={() => navigate('/')} />;
}
