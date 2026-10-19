#!/usr/bin/env node
// 仓库卫生门禁：拦截嵌套 git 仓库、一次性生成物与临时调试脚本入库。
// 只做静态事实判定（是否存在 / 是否被跟踪），不改动任何文件。
// 说明：docs/analysis 与 docs/superpowers 已归档至 .archive/（不入库），被跟踪即视为违规。
import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const LOG_PREFIX = '[repo-hygiene]';

const TMP_SCRIPT_PATTERN = /^scripts\/tmp-/;
const PREFLIGHT_PATTERN = /^poker-ui-demo\/\.preflight\//;
const ARCHIVED_DOC_PATTERN = /^docs\/(analysis|superpowers)\//;
const GENERATED_JSON_FILES = new Set([
  'poker-ui-demo/runtime-orchestration-summary.json',
  'poker-ui-demo/validation-report.json',
]);

function runGit(args, cwd) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
}

function resolveRepoRoot() {
  return runGit(['rev-parse', '--show-toplevel'], process.cwd()).trim();
}

function listTrackedFiles(repoRoot) {
  // -z：NUL 分隔，避免含空格/非 ASCII 的路径被转义或误切分
  return runGit(['ls-files', '-z'], repoRoot)
    .split('\0')
    .filter((path) => path.length > 0);
}

function isRealDirectory(target) {
  try {
    return existsSync(target) && statSync(target).isDirectory();
  } catch {
    return false;
  }
}

function collectNestedGitViolations(repoRoot) {
  const nestedGit = join(repoRoot, 'docs', '.git');
  if (!isRealDirectory(nestedGit)) return [];

  return [
    {
      rule: '嵌套 git 仓库',
      detail: 'docs/.git 是独立仓库，会让 docs/ 在主仓库中表现为不可正常 diff 的 gitlink',
      paths: ['docs/.git'],
      fix: [
        '先备份历史：git -C docs bundle create ../.archive/docs-nested.bundle --all',
        '校验备份：git bundle verify .archive/docs-nested.bundle',
        '再删除嵌套仓库元数据：rm -rf docs/.git（只删 .git，保留 docs 文件）',
      ],
    },
  ];
}

function collectTrackedFileViolations(trackedFiles) {
  const tmpScripts = trackedFiles.filter((path) => TMP_SCRIPT_PATTERN.test(path));
  const preflight = trackedFiles.filter((path) => PREFLIGHT_PATTERN.test(path));
  const archivedDocs = trackedFiles.filter((path) => ARCHIVED_DOC_PATTERN.test(path));
  const generatedJson = trackedFiles.filter((path) => GENERATED_JSON_FILES.has(path));

  const violations = [];

  if (tmpScripts.length > 0) {
    violations.push({
      rule: '临时调试脚本入库',
      detail: 'scripts/tmp-* 为一次性排查脚本，不应进入版本库',
      paths: tmpScripts,
      fix: ['逐个移出版本库：git rm <path>（如仍在使用，改名为 scripts/ 下的正式工具并补充说明）'],
    });
  }

  if (preflight.length > 0) {
    violations.push({
      rule: '一次性质检产物入库',
      detail: 'poker-ui-demo/.preflight/ 为静态原型的一次性预检产物',
      paths: preflight,
      fix: ['移出版本库：git rm -r poker-ui-demo/.preflight，并在 .gitignore 中忽略该目录'],
    });
  }

  if (archivedDocs.length > 0) {
    violations.push({
      rule: '已归档文档重新入库',
      detail: 'docs/analysis/ 与 docs/superpowers/ 已归档至 .archive/（不入库），仅可从 git 历史追溯',
      paths: archivedDocs,
      fix: ['移出版本库：git rm -r --cached docs/analysis docs/superpowers（保留本地文件）'],
    });
  }

  if (generatedJson.length > 0) {
    violations.push({
      rule: '生成报告入库',
      detail: '运行时编排摘要与校验报告均为可再生成的产物',
      paths: generatedJson,
      fix: ['移出版本库：git rm <path>，并在 .gitignore 中忽略该报告文件'],
    });
  }

  return violations;
}

function report(violations) {
  console.error(`${LOG_PREFIX} 仓库卫生检查未通过，共 ${violations.length} 类违规：\n`);

  violations.forEach((violation, index) => {
    console.error(`  ${index + 1}. [${violation.rule}] ${violation.detail}`);
    violation.paths.forEach((path) => console.error(`     - ${path}`));
    console.error('     修复建议：');
    violation.fix.forEach((step) => console.error(`       ${step}`));
    console.error('');
  });

  console.error(
    `${LOG_PREFIX} 检查范围：docs/.git、scripts/tmp-*、poker-ui-demo/.preflight/、docs/analysis/、docs/superpowers/、两份生成 JSON。`,
  );
}

function main() {
  let repoRoot;
  try {
    repoRoot = resolveRepoRoot();
  } catch (error) {
    console.error(`${LOG_PREFIX} 无法定位 git 仓库根目录：${error instanceof Error ? error.message : String(error)}`);
    console.error('修复建议：在 git 工作树内执行本脚本，并确认 git 已安装且可用。');
    process.exit(1);
  }

  let trackedFiles;
  try {
    trackedFiles = listTrackedFiles(repoRoot);
  } catch (error) {
    console.error(`${LOG_PREFIX} 读取被跟踪文件列表失败：${error instanceof Error ? error.message : String(error)}`);
    console.error('修复建议：检查 git 状态是否正常（git status），或清理 .git/index.lock 后重试。');
    process.exit(1);
  }

  const violations = [...collectNestedGitViolations(repoRoot), ...collectTrackedFileViolations(trackedFiles)];

  if (violations.length > 0) {
    report(violations);
    process.exit(1);
  }

  console.log(`${LOG_PREFIX} 通过：无嵌套 git 仓库，被跟踪文件（${trackedFiles.length} 个）中无临时脚本、生成物与已归档文档。`);
  process.exit(0);
}

main();
