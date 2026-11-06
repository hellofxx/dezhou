import { describe, expect, it } from 'vitest';
import {
  analyzeAdmission,
  buildGraph,
  consumerId,
  isTestPath,
  resolveSpecifier,
  stripComments,
} from './admissionGraph';

function graphFrom(sources: Record<string, string>) {
  const files = Object.keys(sources);
  return buildGraph(files, (file) => sources[file] ?? '');
}

describe('shared 准入分析器', () => {
  it('统计直接、传递、barrel、动态与 side-effect 消费者', () => {
    const graph = graphFrom({
      'src/shared/utils/a.ts': "import { h } from './h';\nexport const a = 1;",
      'src/shared/utils/b.ts': "import { a } from './a';\nexport const b = a;",
      'src/shared/utils/h.ts': 'export const h = 1;',
      'src/shared/utils/c.ts': 'export const c = 1;',
      'src/shared/utils/c.test.ts': "import { c } from './c';\nc;",
      'src/shared/utils/d.ts': 'export const d = 1;',
      'src/shared/utils/e.ts': 'export const e = 1;',
      'src/shared/utils/f.ts': 'export const f = 1;',
      'src/shared/utils/g.ts': 'export const g = 1;',
      'src/shared/components/academy/index.ts': "export { Card } from './Card';",
      'src/shared/components/academy/Card.tsx': 'export const Card = 1;',
      'src/features/x/one.ts':
        "import { a } from '@/shared/utils/a';\nimport { Card } from '@/shared/components/academy';\nimport { f } from '@/shared/utils/f';\nimport '@/shared/utils/g';\na; Card; f;",
      'src/features/x/two.ts':
        "import { b } from '@/shared/utils/b';\nimport { f } from '@/shared/utils/f';\nf;",
      'src/features/x/dyn.ts': "export async function load() { return import('@/shared/utils/d'); }",
      'src/features/y/one.ts':
        "import { b } from '@/shared/utils/b';\nimport { Card } from '@/shared/components/academy';\nb; Card;",
      'src/features/y/e.ts': "import { e } from '@/shared/utils/e';\ne;",
      'src/features/x/comment.ts':
        "// import { e } from '@/shared/utils/e';\n/* export { e } from '@/shared/utils/e'; */\nexport const x = 1;",
    });

    const admissions = analyzeAdmission(graph);
    const prod = (file: string) => admissions.get(file)?.prodConsumers;
    const test = (file: string) => admissions.get(file)?.testConsumers;

    expect(prod('src/shared/utils/a.ts')).toEqual(['feature:x', 'feature:y']);
    expect(prod('src/shared/utils/h.ts')).toEqual(['feature:x', 'feature:y']);
    expect(prod('src/shared/utils/b.ts')).toEqual(['feature:x', 'feature:y']);
    expect(prod('src/shared/components/academy/Card.tsx')).toEqual(['feature:x', 'feature:y']);
    expect(prod('src/shared/utils/f.ts')).toEqual(['feature:x']);
    expect(prod('src/shared/utils/g.ts')).toEqual(['feature:x']);
    expect(prod('src/shared/utils/d.ts')).toEqual(['feature:x']);
    expect(prod('src/shared/utils/e.ts')).toEqual(['feature:y']);
    expect(prod('src/shared/utils/c.ts')).toEqual([]);
    expect(test('src/shared/utils/c.ts')).toEqual(['test:shared']);
  });

  it('注释里的 import 不产生边', () => {
    const graph = graphFrom({
      'src/shared/utils/e.ts': 'export const e = 1;',
      'src/features/x/comment.ts':
        "// import { e } from '@/shared/utils/e';\n/* export { e } from '@/shared/utils/e'; */",
    });
    expect(graph.edges.get('src/features/x/comment.ts')).toEqual([]);
    expect(analyzeAdmission(graph).get('src/shared/utils/e.ts')?.prodConsumers).toEqual([]);
  });

  it('同模块多文件只算一个消费者', () => {
    const graph = graphFrom({
      'src/shared/utils/f.ts': 'export const f = 1;',
      'src/features/x/a.ts': "import { f } from '@/shared/utils/f';",
      'src/features/x/b.ts': "import { f } from '@/shared/utils/f';",
    });
    expect(analyzeAdmission(graph).get('src/shared/utils/f.ts')?.prodConsumers).toEqual([
      'feature:x',
    ]);
  });

  it('解析别名、相对路径与 index barrel', () => {
    const fileSet = new Set([
      'src/shared/utils/a.ts',
      'src/shared/components/academy/index.ts',
      'src/shared/components/academy/Card.tsx',
    ]);
    expect(resolveSpecifier('src/features/x/a.ts', '@/shared/utils/a', fileSet)).toBe(
      'src/shared/utils/a.ts',
    );
    expect(
      resolveSpecifier('src/shared/components/academy/index.ts', './Card', fileSet),
    ).toBe('src/shared/components/academy/Card.tsx');
    expect(
      resolveSpecifier('src/features/x/a.ts', '@/shared/components/academy', fileSet),
    ).toBe('src/shared/components/academy/index.ts');
    expect(resolveSpecifier('src/features/x/a.ts', 'react', fileSet)).toBeNull();
  });

  it('识别测试路径与消费者层级', () => {
    expect(isTestPath('src/features/x/a.test.tsx')).toBe(true);
    expect(isTestPath('src/features/x/a.tsx')).toBe(false);
    expect(consumerId('src/features/x/a.ts')).toBe('feature:x');
    expect(consumerId('src/layouts/AppLayout.tsx')).toBe('shell:layouts');
    expect(consumerId('src/main.tsx')).toBe('shell:main');
    expect(consumerId('src/shared/utils/cn.ts')).toBeNull();
  });

  it('stripComments 保留字符串与正则字面量中的内容', () => {
    const source = [
      "const url = 'https://example.com';",
      'const re = /a\\/b/;',
      "// import { x } from '@/shared/utils/x';",
      '/* import { y } from "@/shared/utils/y"; */',
      "import { z } from '@/shared/utils/z';",
    ].join('\n');
    const stripped = stripComments(source);
    expect(stripped).toContain("'https://example.com'");
    expect(stripped).toContain('/a\\/b/');
    expect(stripped).not.toContain('shared/utils/x');
    expect(stripped).not.toContain('shared/utils/y');
    expect(stripped).toContain("from '@/shared/utils/z'");
  });
});
