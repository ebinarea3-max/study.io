'use client';

// Seeded pseudo-random generator
const R = (a: number) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const svg = (s: string) =>
  `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">${s}</svg>`;

const stop = (o: number, c: string, a?: number) =>
  `<stop offset="${o}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${a}"`}/>`;

function mdisp(
  r: () => number,
  n: number,
  base: number,
  amp: number,
  rough: number
) {
  let p = [base + (r() - 0.5) * amp, base + (r() - 0.5) * amp];
  let d = amp;
  for (let i = 0; i < n; i++) {
    const q: number[] = [];
    for (let j = 0; j < p.length - 1; j++) {
      q.push(p[j]);
      q.push((p[j] + p[j + 1]) / 2 + (r() - 0.5) * d);
    }
    q.push(p[p.length - 1]);
    p = q;
    d *= rough;
  }
  return p;
}

function ridge(
  r: () => number,
  base: number,
  amp: number,
  rough: number
) {
  const p = mdisp(r, 7, base, amp, rough);
  const st = 1680 / (p.length - 1);
  let d = 'M-40 910';
  p.forEach((y, i) => {
    d += ` L${(-40 + i * st).toFixed(0)} ${y.toFixed(0)}`;
  });
  return d + ' L1640 910Z';
}

function stars(
  r: () => number,
  n: number,
  ymax: number,
  col?: string
) {
  let s = '';
  for (let i = 0; i < n; i++) {
    s += `<circle class="tw" cx="${(r() * 1600) | 0}" cy="${
      (r() * ymax) | 0
    }" r="${(0.5 + r() * 1.4).toFixed(1)}" fill="${col || '#fff'}" style="--o1:${(
      0.15 +
      r() * 0.3
    ).toFixed(2)};--o2:${(0.6 + r() * 0.4).toFixed(2)};--d:${(
      2 +
      r() * 4
    ).toFixed(1)}s;--l:-${(r() * 5).toFixed(1)}s"/>`;
  }
  return s;
}

function pine(x: number, y: number, h: number) {
  const w = h * 0.38;
  return `M${x | 0} ${(y - h) | 0}L${(x + w * 0.45) | 0} ${
    (y - h * 0.62) | 0
  }L${(x + w * 0.25) | 0} ${(y - h * 0.62) | 0}L${(x + w * 0.62) | 0} ${
    (y - h * 0.3) | 0
  }L${(x + w * 0.35) | 0} ${(y - h * 0.3) | 0}L${(x + w * 0.8) | 0} ${
    y | 0
  }L${(x - w * 0.8) | 0} ${y | 0}L${(x - w * 0.35) | 0} ${
    (y - h * 0.3) | 0
  }L${(x - w * 0.62) | 0} ${(y - h * 0.3) | 0}L${(x - w * 0.25) | 0} ${
    (y - h * 0.62) | 0
  }L${(x - w * 0.45) | 0} ${(y - h * 0.62) | 0}Z`;
}

function pines(
  r: () => number,
  base: number,
  h0: number,
  h1: number,
  s0: number,
  s1: number,
  fill: string
) {
  let d = '';
  let x = -30;
  while (x < 1650) {
    d += pine(x, base, h0 + r() * (h1 - h0));
    x += s0 + r() * (s1 - s0);
  }
  return `<path d="${d}" fill="${fill}"/><rect y="${base - 2}" width="1600" height="${
    912 - base
  }" fill="${fill}"/>`;
}

function flies(r: () => number, n: number, y0: number, y1: number) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = (40 + r() * 1520) | 0;
    const y = (y0 + r() * (y1 - y0)) | 0;
    s += `<g class="ff" style="--dx:${((r() - 0.5) * 160) | 0}px;--dy:${
      ((r() - 0.5) * 90) | 0
    }px;--t:${(7 + r() * 8).toFixed(1)}s;--g:${(2.5 + r() * 3).toFixed(
      1
    )}s;--l:-${(r() * 6).toFixed(
      1
    )}s"><circle cx="${x}" cy="${y}" r="11" fill="url(#fo-y)"/><circle cx="${x}" cy="${y}" r="2.1" fill="#f6ffc9"/></g>`;
  }
  return s;
}

function city(
  r: () => number,
  o: {
    base: number;
    w0: number;
    w1: number;
    h0: number;
    h1: number;
    fill: string;
    wc: string;
    wo: number;
    p: number;
    neon?: boolean;
  }
) {
  let x = -20;
  let d = '';
  let w = '';
  let pk = '';
  let cy = '';
  while (x < 1640) {
    const bw = o.w0 + r() * (o.w1 - o.w0);
    const bh = o.h0 + r() * (o.h1 - o.h0);
    const y = o.base - bh;
    d += `M${x | 0} ${o.base}V${y | 0}h${bw | 0}V${o.base}Z`;
    for (let wy = y + 12; wy < o.base - 16; wy += 15) {
      for (let wx = x + 9; wx < x + bw - 12; wx += 13) {
        if (r() < o.p) w += `M${wx | 0} ${wy | 0}h5v7h-5z`;
      }
    }
    if (o.neon && r() < 0.4) {
      const s = `M${x | 0} ${y | 0}h${bw | 0}`;
      if (r() < 0.5) pk += s;
      else cy += s;
    }
    x += bw + (r() < 0.3 ? r() * 10 : 0);
  }
  let out = `<path d="${d}" fill="${o.fill}"/><path d="${w}" fill="${o.wc}" opacity="${o.wo}"/>`;
  if (o.neon) {
    out += `<g class="pu" style="--d:4s"><path d="${pk}" stroke="#ff3d8b" stroke-width="12" opacity=".16" fill="none"/><path d="${pk}" stroke="#ff7ab6" stroke-width="2.2" fill="none"/></g><g class="pu" style="--d:5.3s"><path d="${cy}" stroke="#38e8ff" stroke-width="12" opacity=".14" fill="none"/><path d="${cy}" stroke="#9bf3ff" stroke-width="2.2" fill="none"/></g>`;
  }
  return out;
}

function rib(d: string, g: string, dur: number, a: number) {
  return (
    `<g class="au" style="--d:${dur}s" opacity="${a}">` +
    [
      [170, 0.05],
      [110, 0.09],
      [60, 0.15],
      [24, 0.32],
    ]
      .map(
        (k) =>
          `<path d="${d}" stroke="url(#${g})" stroke-width="${
            k[0]
          }" stroke-linecap="round" fill="none" opacity="${(
            (k[1] / 0.32) *
            0.32
          ).toFixed(3)}"/>`
      )
      .join('') +
    '</g>'
  );
}

// Procedural SVG Scene Generators (Pure, deterministic and cached)
const sceneCache: Record<string, string> = {};

export function getSvgScene(key: string): string {
  if (sceneCache[key]) return sceneCache[key];

  let markup = '';

  switch (key) {
    case 'dusk': {
      const r = R(1);
      const far = ridge(r, 610, 130, 0.55);
      const mid = ridge(r, 690, 150, 0.55);
      const near = ridge(r, 770, 130, 0.55);
      const front = ridge(r, 850, 80, 0.5);
      markup = svg(`<defs><linearGradient id="dk-s" x1="0" y1="0" x2="0" y2="1">${
        stop(0, '#171040') +
        stop(0.35, '#4a2372') +
        stop(0.62, '#b9487c') +
        stop(0.82, '#f58a69') +
        stop(1, '#ffc47c')
      }</linearGradient>
  <radialGradient id="dk-g">${
    stop(0, '#fff0c4', 1) + stop(0.18, '#ffb36b', 0.55) + stop(1, '#ff7a5c', 0)
  }</radialGradient>
  <linearGradient id="dk-h" x1="0" y1="0" x2="0" y2="1">${
    stop(0, '#ff9a7a', 0) + stop(1, '#ffb08a', 0.35)
  }</linearGradient>
  <radialGradient id="dk-c">${
    stop(0, '#ffc9a0', 0.5) + stop(1, '#ffc9a0', 0)
  }</radialGradient></defs>
  <rect width="1600" height="900" fill="url(#dk-s)"/>${stars(r, 45, 260)}
  <circle cx="1060" cy="640" r="460" fill="url(#dk-g)"/><circle cx="1060" cy="640" r="44" fill="#fff4d6"/>
  <g class="drift" style="--x:160px;--d:70s"><ellipse cx="400" cy="400" rx="320" ry="26" fill="url(#dk-c)"/><ellipse cx="560" cy="440" rx="220" ry="16" fill="url(#dk-c)"/></g>
  <g class="drift" style="--x:-140px;--d:90s"><ellipse cx="1200" cy="340" rx="300" ry="22" fill="url(#dk-c)"/><ellipse cx="1000" cy="380" rx="200" ry="14" fill="url(#dk-c)"/></g>
  <path d="${far}" fill="#8a4a86"/><rect y="560" width="1600" height="160" fill="url(#dk-h)"/>
  <path d="${mid}" fill="#552a63"/><rect y="640" width="1600" height="160" fill="url(#dk-h)" opacity=".7"/>
  <path d="${near}" fill="#2b1646"/><path d="${front}" fill="#120a24"/>`);
      break;
    }

    case 'forest': {
      const r = R(7);
      const hills = ridge(r, 640, 90, 0.5);
      markup = svg(`<defs><linearGradient id="fo-s" x1="0" y1="0" x2="0" y2="1">${
        stop(0, '#030d14') + stop(0.55, '#0a2630') + stop(1, '#15494c')
      }</linearGradient>
  <radialGradient id="fo-m">${
    stop(0, '#bff5e6', 0.45) + stop(1, '#bff5e6', 0)
  }</radialGradient>
  <linearGradient id="fo-r" x1="0" y1="0" x2="0" y2="1">${
    stop(0, '#cffff0', 0.22) + stop(1, '#cffff0', 0)
  }</linearGradient>
  <radialGradient id="fo-f">${
    stop(0, '#8fd6cc', 0.24) + stop(1, '#8fd6cc', 0)
  }</radialGradient>
  <radialGradient id="fo-y">${
    stop(0, '#e4ff9e', 0.9) + stop(1, '#e4ff9e', 0)
  }</radialGradient></defs>
  <rect width="1600" height="900" fill="url(#fo-s)"/>${stars(
    r,
    55,
    300,
    '#dffff6'
  )}
  <circle cx="1180" cy="210" r="360" fill="url(#fo-m)"/><circle cx="1180" cy="210" r="50" fill="#eefaf5"/>
  <g class="pu" style="--d:9s"><path d="M1180 210L820 900H1020Z" fill="url(#fo-r)"/><path d="M1180 210L1000 900H1240Z" fill="url(#fo-r)"/><path d="M1180 210L1320 900H1500Z" fill="url(#fo-r)"/></g>
  <path d="${hills}" fill="#0e3a40"/>${pines(
        r,
        720,
        70,
        130,
        20,
        34,
        '#0b3036'
      )}
  <g class="drift" style="--x:120px;--d:50s"><ellipse cx="500" cy="730" rx="520" ry="46" fill="url(#fo-f)"/><ellipse cx="1250" cy="760" rx="480" ry="40" fill="url(#fo-f)"/></g>
  ${pines(r, 790, 120, 200, 30, 50, '#072329')}
  <g class="drift" style="--x:-140px;--d:62s"><ellipse cx="800" cy="800" rx="640" ry="50" fill="url(#fo-f)"/></g>
  ${pines(r, 870, 190, 300, 48, 80, '#03131a')}${flies(r, 22, 560, 860)}`);
      break;
    }

    case 'neon': {
      const r = R(21);
      const far = city(r, {
        base: 690,
        w0: 50,
        w1: 100,
        h0: 120,
        h1: 300,
        fill: '#2b1163',
        wc: '#ffd9a0',
        wo: 0.5,
        p: 0.18,
      });
      const mid = city(r, {
        base: 780,
        w0: 60,
        w1: 120,
        h0: 150,
        h1: 340,
        fill: '#170a3c',
        wc: '#8fe8ff',
        wo: 0.55,
        p: 0.22,
      });
      const near = city(r, {
        base: 900,
        w0: 70,
        w1: 140,
        h0: 100,
        h1: 260,
        fill: '#080419',
        wc: '#ffb0d8',
        wo: 0.7,
        p: 0.12,
        neon: true,
      });
      let rain = '';
      for (let i = 0; i < 55; i++) {
        rain += `<path class="rain" d="M${
          (-100 + r() * 1800) | 0
        } -120l-7 38" stroke="rgba(200,225,255,.4)" stroke-width="1.2" style="--d:${(
          1.2 +
          r() * 0.7
        ).toFixed(2)}s;--l:-${(r() * 2).toFixed(2)}s"/>`;
      }
      markup = svg(`<defs><linearGradient id="nx-s" x1="0" y1="0" x2="0" y2="1">${
        stop(0, '#06021a') +
        stop(0.4, '#1a0945') +
        stop(0.7, '#5a1a78') +
        stop(1, '#d1307f')
      }</linearGradient>
  <radialGradient id="nx-g">${
    stop(0, '#ff6ab0', 0.55) + stop(1, '#ff3d8b', 0)
  }</radialGradient>
  <linearGradient id="nx-o" x1="0" y1="0" x2="0" y2="1">${
    stop(0, '#ffe08a') + stop(1, '#ff4f9a')
  }</linearGradient>
  <linearGradient id="nx-b" x1="0" y1="0" x2="0" y2="1">${
    stop(0, '#ff3d8b', 0) + stop(1, '#ff3d8b', 0.4)
  }</linearGradient></defs>
  <rect width="1600" height="900" fill="url(#nx-s)"/>${stars(r, 30, 260)}
  <circle cx="800" cy="480" r="520" fill="url(#nx-g)"/><circle cx="800" cy="470" r="170" fill="url(#nx-o)"/>
  ${far}${mid}${near}<rect y="640" width="1600" height="260" fill="url(#nx-b)"/>${rain}`);
      break;
    }

    case 'sea': {
      const r = R(33);
      let w = '';
      for (let i = 0; i < 14; i++) {
        const y = 572 + 5 * i + i * i * 1.1;
        const a = 1.5 + i * 0.55;
        w += `<g class="wv" style="--d:${80 - i * 4}s"><path d="M0 ${y.toFixed(
          0
        )}q100 ${(-a * 2).toFixed(1)} 200 0${' t200 0'.repeat(
          15
        )}" stroke="rgba(175,210,255,${(0.08 + 0.025 * i).toFixed(
          2
        )})" stroke-width="${(1 + i * 0.22).toFixed(1)}" fill="none"/></g>`;
      }
      let sh = '';
      for (let j = 0; j < 18; j++) {
        const ww = 140 - j * 5;
        sh += `<rect class="sh" x="${
          (800 - ww / 2 + (r() - 0.5) * 20) | 0
        }" y="${590 + j * 15}" width="${ww}" height="2.6" rx="1.3" fill="#eaf2ff" style="--d:${(
          2 +
          r() * 3
        ).toFixed(1)}s;--l:-${(r() * 4).toFixed(1)}s"/>`;
      }
      markup = svg(`<defs><linearGradient id="sa-s" x1="0" y1="0" x2="0" y2="1">${
        stop(0, '#040a1c') + stop(0.55, '#0c2147') + stop(1, '#1f4f80')
      }</linearGradient>
  <linearGradient id="sa-w" x1="0" y1="0" x2="0" y2="1">${
    stop(0, '#0e3a68') + stop(1, '#020813')
  }</linearGradient>
  <radialGradient id="sa-m">${
    stop(0, '#bcd6ff', 0.5) + stop(1, '#bcd6ff', 0)
  }</radialGradient>
  <radialGradient id="sa-c">${
    stop(0, '#9fbfee', 0.3) + stop(1, '#9fbfee', 0)
  }</radialGradient></defs>
  <rect width="1600" height="580" fill="url(#sa-s)"/>${stars(r, 70, 420)}
  <circle cx="800" cy="250" r="400" fill="url(#sa-m)"/><circle cx="800" cy="250" r="62" fill="#f4f7ff"/>
  <g class="drift" style="--x:120px;--d:80s"><ellipse cx="420" cy="330" rx="300" ry="14" fill="url(#sa-c)"/></g><g class="drift" style="--x:-100px;--d:95s"><ellipse cx="1220" cy="400" rx="340" ry="16" fill="url(#sa-c)"/></g>
  <rect y="562" width="1600" height="338" fill="url(#sa-w)"/><ellipse cx="800" cy="564" rx="760" ry="22" fill="url(#sa-m)"/>${sh}${w}`);
      break;
    }

    case 'aurora': {
      const r = R(55);
      const far = ridge(r, 720, 190, 0.55);
      const near = ridge(r, 800, 120, 0.55);
      markup = svg(`<defs><linearGradient id="au-s" x1="0" y1="0" x2="0" y2="1">${
        stop(0, '#02060f') + stop(0.6, '#07152a') + stop(1, '#0c2540')
      }</linearGradient>
  <linearGradient id="au-1" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1600" y2="0">${
    stop(0, '#5dffb3') + stop(0.5, '#2fd4c9') + stop(1, '#8a6bff')
  }</linearGradient>
  <linearGradient id="au-2" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1600" y2="0">${
    stop(0, '#8a6bff') + stop(0.5, '#3ac8ff') + stop(1, '#5dffb3')
  }</linearGradient>
  <linearGradient id="au-3" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1600" y2="0">${
    stop(0, '#ff7ad9') + stop(0.5, '#9b7bff') + stop(1, '#4fe3ff')
  }</linearGradient></defs>
  <rect width="1600" height="900" fill="url(#au-s)"/>${stars(r, 95, 520)}
  ${rib('M-100 300C300 160 650 420 900 250S1400 130 1750 300', 'au-1', 20, 1)}
  ${rib('M-100 400C250 300 700 500 1000 360S1450 260 1750 420', 'au-2', 24, 0.8)}
  ${rib('M-100 210C350 110 600 300 950 170S1350 90 1750 230', 'au-3', 17, 0.55)}
  <path d="${far}" fill="#0b1d33"/><path d="${far}" fill="none" stroke="rgba(190,220,255,.28)" stroke-width="1.5"/>
  <path d="${near}" fill="#050c18"/>`);
      break;
    }

    default:
      markup = '';
      break;
  }

  sceneCache[key] = markup;
  return markup;
}
