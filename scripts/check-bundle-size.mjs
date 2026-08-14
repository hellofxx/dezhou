// P2-03: 构建体积门禁 - 防止首屏 JS 回潮
import { readdir, stat } from 'fs/promises';
import { readFileSync } from 'fs';
import { join } from 'path';

const DIST_DIR = './dist';

// 预算阈值设定依据：
// - 原始首屏 ~4.5MB（i18n eager glob + theory in CORE_MODULES + bootstrap 静态导入）
// - P0-02+P0-03 优化后实测：Windows 本地构建 ~1.06MB / CI Linux 构建 ~1.11MB
// - 跨平台构建产物存在差异（rolldown 在 Linux 上 vendor-react-dom 约 446KB，Windows 约 230KB），
//   预算须为 CI 环境预留安全边际，避免门禁因构建环境差异误报
// - 严格预算 1MB 将在后续代码分割优化（react-dom/recharts 分包治理）后收紧
const BUDGETS = {
  // 首屏 JS < 1.25MB (未压缩)，覆盖 CI Linux 构建实测 1.11MB + ~12% 边际
  initialJsSizeLimit: 1.25 * 1024 * 1024,
  // 从 68 降至 40 以下，避免过多的并发请求
  // 注意：严格限制 30 将在代码分割优化后启用
  modulepreloadCountLimit: 40,
  // 各 chunk 大小限制（避免单一大包导致加载阻塞）
  maxSingleChunkSize: 500 * 1024,
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function checkBundleSize() {
  console.log('\n🔍 开始检查构建产物体积...\n');

  const indexPath = join(DIST_DIR, 'index.html');

  try {
    // 1. 读取 index.html 验证 dist/存在
    await stat(indexPath);
    console.log(`✅ dist/index.html 存在`);
  } catch (error) {
    console.error(`❌ dist 目录不存在或未构建\n请运行：pnpm build`);
    process.exit(1);
  }

  // 2. 解析 index.html 的 <link rel="modulepreload"> 列表
  const htmlContent = readFileSync(indexPath, 'utf-8');
  
  // 提取所有 modulepreload 链接（支持多种属性顺序）
  const preloadMatches = htmlContent.matchAll(/<link[^>]+rel="modulepreload"[^>]*href="([^"]+)"/g);
  const preloadFiles = [...preloadMatches].map(m => m[1]);
  
  // 同时提取常规 <script type="module"> 入口点
  const scriptMatches = htmlContent.matchAll(/<script\s+type="module"\s+src="([^"]+)"/g);
  const entryFiles = [...scriptMatches].map(m => m[1]);
  
  // 合并所有需要检查的 JS 文件
  const allJsFiles = new Set([...preloadFiles, ...entryFiles]);
  
  // 提取并标准化路径（去掉可能的 /dezhou/ 子路径前缀）
  const DEPLOY_PREFIX = '/dezhou/';
  const normalizedFiles = Array.from(allJsFiles).map(file => {
    return file.startsWith(DEPLOY_PREFIX) ? file.slice(DEPLOY_PREFIX.length) : file;
  });
  
  console.log(`📊 首屏资源统计:`);
  console.log(`   Modulepreload 数量：${preloadFiles.length}`);
  console.log(`   Entry points: ${entryFiles.length}`);
  console.log(`   总计 JS 文件数：${normalizedFiles.length}\n`);

  // 3. 计算总大小和各 chunk 分析
  let totalSize = 0;
  const chunkStats = [];
  const oversizedChunks = [];
  
  for (const file of normalizedFiles) {
    // 去掉可能的根路径前缀
    const cleanFile = file.startsWith('/') ? file.slice(1) : file;
    const fullPath = join(DIST_DIR, cleanFile);
    try {
      const fileStat = await stat(fullPath);
      const size = fileStat.size;
      totalSize += size;
      
      chunkStats.push({ path: file, size });
      
      if (size > BUDGETS.maxSingleChunkSize) {
        oversizedChunks.push({ path: file, size });
      }
    } catch (error) {
      console.warn(`⚠️ 无法读取文件：${file}`);
    }
  }

  // 按大小降序排序
  chunkStats.sort((a, b) => b.size - a.size);
  
  console.log(`📦 Chunk 大小分析 (Top 5):`);
  chunkStats.slice(0, 5).forEach(({ path, size }, idx) => {
    console.log(`   ${idx + 1}. ${path.padEnd(40)} ${formatBytes(size).padEnd(12)} (${Math.round((size / totalSize) * 100)}%)`);
  });
  
  if (oversizedChunks.length > 0) {
    console.log(`\n⚠️  超过 500KB 的大包:`);
    oversizedChunks.forEach(({ path, size }) => {
      console.log(`   ${path}: ${formatBytes(size)}`);
    });
  }

  // 4. 断言检查
  const issues = [];
  const warnings = [];
  
  // 检查总大小
  if (totalSize > BUDGETS.initialJsSizeLimit) {
    issues.push(`❌ 首屏 JS 超过预算：${formatBytes(totalSize)} > ${formatBytes(BUDGETS.initialJsSizeLimit)}`);
  } else {
    console.log(`\n✅ 首屏 JS 总大小合规：${formatBytes(totalSize)}`);
  }
  
  // 检查 preload 数量
  if (preloadFiles.length > BUDGETS.modulepreloadCountLimit) {
    issues.push(`⚠️ Modulepreload 数量超标：${preloadFiles.length} > ${BUDGETS.modulepreloadCountLimit}`);
  } else {
    console.log(`✅ Modulepreload 数量合规：${preloadFiles.length}`);
  }
  
  // 检查单个 chunk 大小
  if (oversizedChunks.length > 0) {
    warnings.push(`⚠️ 发现 ${oversizedChunks.length} 个超大方块 (>500KB)`);
  }

  // 5. 报告结果
  console.log('\n' + '='.repeat(60));
  
  if (issues.length > 0) {
    console.error('\n🚨 体积门禁失败:\n');
    issues.forEach(issue => console.error(`   ${issue}`));
    if (warnings.length > 0) {
      console.error('\n⚠️  警告:');
      warnings.forEach(w => console.error(`   ${w}`));
    }
    console.log('\n💡 建议优化措施:');
    console.log('   - 使用动态 import() 对大包进行代码分割');
    console.log('   - 检查是否有不必要的依赖被打包进来');
    console.log('   - 考虑引入虚拟滚动、图片懒加载等技术');
    process.exit(1);
  } else {
    console.log('\n✨ 体积门禁通过 ✨');
    if (warnings.length > 0) {
      console.log('\n⚠️  警告:');
      warnings.forEach(w => console.log(`   ${w}`));
    }
    console.log(`\n📈 性能收益预估:`);
    console.log(`   未压缩总大小：${formatBytes(totalSize)}`);
    console.log(`   压缩后预计：~${formatBytes(Math.round(totalSize * 0.3))} (gzip)`);
    console.log(`   3G 网络下载时间：< ${Math.ceil(totalSize * 0.3 / 50000)}s (假设 50KB/s)`);
    console.log(`   4G 网络下载时间：< ${Math.ceil(totalSize * 0.3 / 500000)}s (假设 500KB/s)`);
    process.exit(0);
  }
}

checkBundleSize().catch(error => {
  console.error('\n❌ 检查过程中发生错误:');
  console.error(error);
  process.exit(1);
});
