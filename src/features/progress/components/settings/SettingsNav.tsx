/**
 * 设置页分区导航（签名元素「分区台卡导航」）。
 *
 * 桌面端左侧 sticky 竖向导航：黄铜节点脊柱（与 LevelLadder 同 DNA），
 * 点击立即激活 + 滚动到对应设置分区，滚动 spy 高亮当前分区。
 * 移动端（<768px）隐藏——折叠分组本身已足够导航。
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Palette, GraduationCap, SlidersHorizontal, Gamepad2, Database, Bug, Info } from 'lucide-react';

interface SettingsNavItem {
  id: string;
  icon: React.ReactNode;
  label: string;
}

interface SettingsNavProps {
  /** 分区 id 列表（与 SettingsSection id 一一对应） */
  sectionIds: string[];
  /** 点击分区时回调（供父组件强制展开折叠 section） */
  onActivate?: (id: string) => void;
}

export default function SettingsNav({ sectionIds, onActivate }: SettingsNavProps) {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState(sectionIds[0] ?? '');
  // 用 ref 标记「click 触发的滚动」期间跳过 scroll spy，避免 IO 与 click 互相打架
  const ignoreScrollUntil = useRef(0);

  const items: SettingsNavItem[] = [
    { id: 'appearance', icon: <Palette className="w-4 h-4" />, label: t('settings.appearance', { defaultValue: '外观' }) },
    { id: 'coach', icon: <GraduationCap className="w-4 h-4" />, label: t('mentor.settings.title') },
    { id: 'training', icon: <SlidersHorizontal className="w-4 h-4" />, label: t('settings.training', { defaultValue: '训练偏好' }) },
    { id: 'game-streak', icon: <Gamepad2 className="w-4 h-4" />, label: t('gameVariant.title') },
    { id: 'data', icon: <Database className="w-4 h-4" />, label: t('settings.data', { defaultValue: '数据管理' }) },
    { id: 'developer', icon: <Bug className="w-4 h-4" />, label: t('settings.developer', { defaultValue: '开发者选项' }) },
    { id: 'about', icon: <Info className="w-4 h-4" />, label: t('settings.about', { defaultValue: '关于' }) },
  ];

  const scrollTo = (id: string) => {
    // 立即激活该 item（关键修复：content 短到不可滚动时，scrollIntoView 是 no-op，
    // 必须直接 setActiveId 才能让 nav 高亮跟随 click）
    setActiveId(id);
    // 标记短时忽略 scroll spy，避免 IO 反馈把状态改回初始项
    ignoreScrollUntil.current = Date.now() + 600;
    // 通知父组件强制展开目标 section（解决 main 不可滚动时 scrollIntoView 无效）
    onActivate?.(id);
    document
      .getElementById(`settings-section-${id}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ScrollSpy：监听 main 局部滚动容器，用 getBoundingClientRect 找出「已越过
  // trigger 线」的最靠后 section；滚到底部时强制激活最后一项。
  useEffect(() => {
    if (sectionIds.length === 0) return;
    const main = document.querySelector('main');
    if (!main) return;

    const TRIGGER = 120;

    const update = () => {
      // click 触发的滚动期间不更新（避免 IO 与 click 互相打架）
      if (Date.now() < ignoreScrollUntil.current) return;

      let best = sectionIds[0] ?? '';
      for (const id of sectionIds) {
        const el = document.getElementById(`settings-section-${id}`);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= TRIGGER) {
          best = id;
        }
      }
      // 滚到底部时强制激活最后一项
      const hasOverflow = main.scrollHeight > main.clientHeight + 4;
      if (hasOverflow && main.scrollTop > 80) {
        const remaining = main.scrollHeight - main.scrollTop - main.clientHeight;
        if (remaining < 60) {
          best = sectionIds[sectionIds.length - 1] ?? best;
        }
      }
      setActiveId(best);
    };

    let rafId: number | null = null;
    const schedule = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        update();
        rafId = null;
      });
    };

    update();
    main.addEventListener('scroll', schedule, { passive: true });
    // 监听 DOM 变化（折叠展开、内容增减）触发重算
    const mo = new MutationObserver(schedule);
    mo.observe(main, { childList: true, subtree: true });

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      main.removeEventListener('scroll', schedule);
      mo.disconnect();
    };
  }, [sectionIds]);

  return (
    <nav className="settings-nav" aria-label={t('settings.navAria', { defaultValue: '设置分区导航' })}>
      <ul className="settings-nav-list">
        {items
          .filter((item) => sectionIds.includes(item.id))
          .map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => scrollTo(item.id)}
                aria-current={activeId === item.id ? 'true' : undefined}
                className={`settings-nav-item${activeId === item.id ? ' active' : ''}`}
              >
                <span className="settings-nav-icon">{item.icon}</span>
                <span className="settings-nav-label">{item.label}</span>
              </button>
            </li>
          ))}
      </ul>
    </nav>
  );
}
