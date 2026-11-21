/* 程序化胡桃木纹理：整数频率 value-noise fbm，逐倍频周期回绕 → 数学上无缝；
   各向异性频率产生连续导管纹，无斜条纹。生成后注入 --wood-h / --wood-v。 */
(function () {
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext && canvas.getContext('2d');
  if (!ctx) return;
  var S = 512, N = 64;
  var seed = 20261121;
  function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
  var lat = new Float32Array(N * N);
  for (var i = 0; i < lat.length; i++) lat[i] = rnd();
  function latAt(ix, iy, px, py) { return lat[(((iy % py) + py) % py) * N + (((ix % px) + px) % px)]; }
  function sm(t) { return t * t * (3 - 2 * t); }
  function noiseP(u, v, px, py) {
    var ix = Math.floor(u), iy = Math.floor(v), fx = sm(u - ix), fy = sm(v - iy);
    var a = latAt(ix, iy, px, py), b = latAt(ix + 1, iy, px, py), c = latAt(ix, iy + 1, px, py), d = latAt(ix + 1, iy + 1, px, py);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }
  function fbm(u, v, fx, fy, oct) {
    var s = 0, amp = 0.5, m = 1, norm = 0;
    for (var o = 0; o < oct; o++) {
      var px = fx * m, py = fy * m;
      if (px > N || py > N) break;
      s += amp * noiseP(u * px, v * py, px, py);
      norm += amp; amp *= 0.5; m *= 2;
    }
    return s / norm;
  }
  function clamp01(t) { return t < 0 ? 0 : t > 1 ? 1 : t; }
  function make(vertical) {
    canvas.width = S; canvas.height = S;
    var img = ctx.createImageData(S, S), d = img.data;
    var gx = vertical ? 32 : 2, gy = vertical ? 2 : 32;
    var fx = vertical ? 2 : 1, fy = vertical ? 1 : 2;
    for (var y = 0; y < S; y++) {
      var v = y / S;
      for (var x = 0; x < S; x++) {
        var u = x / S;
        var fig = fbm(u + 0.37, v + 0.11, fx, fy, 2);
        var g = fbm(u, v + 0.025 * fig, gx, gy, 2);
        var pore = noiseP(u * 64 + 31.7, v * 64 + 17.3, 64, 64);
        var r = 62, gg = 43, b = 27;
        var da = clamp01((g - 0.50) / 0.22); da = da * da * 0.5;
        r += (24 - r) * da; gg += (15 - gg) * da; b += (9 - b) * da;
        var la = clamp01((0.47 - g) / 0.20); la = la * la * 0.3;
        r += (138 - r) * la; gg += (104 - gg) * la; b += (60 - b) * la;
        var fa = (fig - 0.5) * 0.12;
        r *= 1 + fa; gg *= 1 + fa; b *= 1 + fa;
        var pa = (pore - 0.5) * 0.05;
        r *= 1 + pa; gg *= 1 + pa; b *= 1 + pa;
        var idx = (y * S + x) * 4;
        d[idx] = r; d[idx + 1] = gg; d[idx + 2] = b; d[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return canvas.toDataURL('image/png');
  }
  var st = document.documentElement.style;
  st.setProperty('--wood-h', 'url("' + make(false) + '")');
  st.setProperty('--wood-v', 'url("' + make(true) + '")');
})();