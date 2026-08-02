(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var danger = style.getPropertyValue('--danger').trim();
  var success = style.getPropertyValue('--success').trim();
  var warning = style.getPropertyValue('--warning').trim();
  var info = style.getPropertyValue('--info').trim();

  // --- Chart 1: Pain Points Radar ---
  var chart1 = echarts.init(document.getElementById('chart-painpoints'), null, { renderer: 'svg' });
  chart1.setOption({
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '8%',
      bottom: '3%',
      top: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      max: 5,
      axisLabel: { color: muted },
      axisLine: { lineStyle: { color: rule } },
      splitLine: { lineStyle: { color: rule, type: 'dashed' } }
    },
    yAxis: {
      type: 'category',
      data: ['合规焦虑', '情绪失控(Tilt)', '本土规则不匹配', 'GTO走火入魔', '学用脱节', '位置意识缺失', '数学恐惧'],
      axisLabel: { color: ink, fontSize: 12 },
      axisLine: { lineStyle: { color: rule } },
      axisTick: { show: false }
    },
    series: [{
      type: 'bar',
      data: [
        { value: 3, itemStyle: { color: info } },
        { value: 4, itemStyle: { color: warning } },
        { value: 4, itemStyle: { color: warning } },
        { value: 4.5, itemStyle: { color: accent } },
        { value: 5, itemStyle: { color: danger } },
        { value: 4.5, itemStyle: { color: accent } },
        { value: 5, itemStyle: { color: danger } }
      ],
      barWidth: '60%',
      label: {
        show: true,
        position: 'right',
        color: muted,
        fontSize: 11,
        formatter: function(p) {
          var labels = ['', '', '', '', '最严重', '严重', '最严重'];
          return labels[p.dataIndex];
        }
      },
      itemStyle: {
        borderRadius: [0, 4, 4, 0]
      }
    }]
  });

  // --- Chart 2: Teaching Principles Mapping ---
  var chart2 = echarts.init(document.getElementById('chart-principles'), null, { renderer: 'svg' });
  chart2.setOption({
    tooltip: {
      trigger: 'item',
      appendToBody: true
    },
    legend: {
      top: 'bottom',
      textStyle: { color: muted },
      itemGap: 20
    },
    radar: {
      indicator: [
        { name: '新手引导体验', max: 100 },
        { name: '即时反馈', max: 100 },
        { name: '渐进式难度', max: 100 },
        { name: '习惯养成(Streak)', max: 100 },
        { name: '间隔重复', max: 100 },
        { name: '能力分级', max: 100 }
      ],
      shape: 'polygon',
      splitNumber: 4,
      axisName: { color: ink, fontSize: 11 },
      splitLine: { lineStyle: { color: rule } },
      splitArea: { areaStyle: { color: ['transparent'] } },
      axisLine: { lineStyle: { color: rule } }
    },
    series: [{
      type: 'radar',
      data: [
        {
          value: [95, 90, 95, 100, 70, 60],
          name: 'Duolingo (语言学习)',
          areaStyle: { color: accent + '30' },
          lineStyle: { color: accent, width: 2 },
          itemStyle: { color: accent }
        },
        {
          value: [75, 95, 90, 70, 90, 100],
          name: 'Chess.com (国际象棋)',
          areaStyle: { color: accent2 + '30' },
          lineStyle: { color: accent2, width: 2 },
          itemStyle: { color: accent2 }
        },
        {
          value: [40, 80, 60, 40, 30, 50],
          name: '你的项目(当前)',
          areaStyle: { color: danger + '30' },
          lineStyle: { color: danger, width: 2, type: 'dashed' },
          itemStyle: { color: danger }
        },
        {
          value: [90, 95, 90, 95, 85, 90],
          name: '优化后目标',
          areaStyle: { color: success + '20' },
          lineStyle: { color: success, width: 2 },
          itemStyle: { color: success }
        }
      ]
    }]
  });

  // --- Chart 3: Rank System Gauge ---
  var chart3 = echarts.init(document.getElementById('chart-ranks'), null, { renderer: 'svg' });
  
  var rankData = [
    { name: '新手', min: 0, max: 500, color: '#9ca3af', desc: '掌握规则、牌力排名' },
    { name: '入门', min: 500, max: 800, color: info, desc: '翻前范围、底池赔率' },
    { name: '进阶', min: 800, max: 1200, color: success, desc: '翻后决策、位置意识' },
    { name: '中级', min: 1200, max: 1600, color: warning, desc: '范围vs范围、下注尺度' },
    { name: '高级', min: 1600, max: 2000, color: accent, desc: '高级GTO、动态调整' },
    { name: '专家', min: 2000, max: 2500, color: danger, desc: '接近Solver级策略' }
  ];

  var categories = rankData.map(function(r) { return r.name; });
  var barData = rankData.map(function(r) { return { value: r.max - r.min, itemStyle: { color: r.color } }; });

  chart3.setOption({
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      axisPointer: { type: 'shadow' },
      formatter: function(params) {
        var idx = params[0].dataIndex;
        var r = rankData[idx];
        return '<strong>' + r.name + '</strong> (' + r.min + '-' + r.max + '分)<br/>' + r.desc;
      }
    },
    grid: {
      left: '3%',
      right: '12%',
      bottom: '10%',
      top: '8%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: 2500,
      axisLabel: { color: muted },
      axisLine: { lineStyle: { color: rule } },
      splitLine: { lineStyle: { color: rule, type: 'dashed' } }
    },
    yAxis: {
      type: 'category',
      data: categories.reverse(),
      axisLabel: { 
        color: ink, 
        fontSize: 13,
        fontWeight: 600
      },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [{
      type: 'bar',
      data: barData.reverse(),
      barWidth: '50%',
      label: {
        show: true,
        position: 'right',
        color: muted,
        fontSize: 11,
        formatter: function(params) {
          var r = rankData[rankData.length - 1 - params.dataIndex];
          return r.min + '-' + r.max;
        }
      },
      itemStyle: {
        borderRadius: 4
      },
      markLine: {
        silent: true,
        symbol: 'none',
        lineStyle: { color: accent, type: 'solid', width: 2 },
        data: [{ xAxis: 1000, label: { formatter: '当前目标用户', color: accent, position: 'end' } }]
      }
    }]
  });

  // Resize listeners
  window.addEventListener('resize', function() {
    chart1.resize();
    chart2.resize();
    chart3.resize();
  });
})();