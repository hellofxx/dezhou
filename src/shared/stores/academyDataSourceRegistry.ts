/**
 * 学院课程数据源注册表（依赖倒置）。
 * strategy-academy 在自身 bootstrap 文件中调用 registerAcademyDataSource 注册，
 * progress 模块经 getAcademyDataSource() 查询，不再直接 import strategy-academy。
 * 注册由应用入口 import '@/features/strategy-academy/store.bootstrap' 触发（见 src/main.tsx）。
 */
import type { AcademyDataSource } from '@/shared/types/academyDataSource';

let dataSource: AcademyDataSource | undefined;

export function registerAcademyDataSource(source: AcademyDataSource): void {
  dataSource = source;
}

export function getAcademyDataSource(): AcademyDataSource | undefined {
  return dataSource;
}
