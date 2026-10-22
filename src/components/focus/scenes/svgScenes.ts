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
  `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" pointer-events="none">${s}</svg>`;

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
    const cx = (r() * 1600) | 0;
    const cy = (r() * ymax) | 0;
    const radius = (0.6 + r() * 1.3).toFixed(1);
    const dur = (2.2 + r() * 3.8).toFixed(1);
    const del = -(r() * 5).toFixed(1);
    const minOp = (0.15 + r() * 0.25).toFixed(2);
    const maxOp = (0.7 + r() * 0.3).toFixed(2);

    s += `<circle class="focus-star" cx="${cx}" cy="${cy}" r="${radius}" fill="${col || '#fff'}" style="--st-dur:${dur}s;--st-del:${del}s;--star-min:${minOp};--star-max:${maxOp}"/>`;
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

function fireflies(r: () => number, n: number, y0: number, y1: number) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = (40 + r() * 1520) | 0;
    const y = (y0 + r() * (y1 - y0)) | 0;
    const fx1 = ((r() - 0.5) * 80) | 0;
    const fy1 = ((r() - 0.5) * 60) | 0;
    const fx2 = ((r() - 0.5) * 80) | 0;
    const fy2 = ((r() - 0.5) * 60) | 0;
    const fx3 = ((r() - 0.5) * 70) | 0;
    const fy3 = ((r() - 0.5) * 50) | 0;
    const dur = (6 + r() * 6).toFixed(1);
    const del = -(r() * 6).toFixed(1);

    s += `<g class="focus-firefly" style="--fx1:${fx1}px;--fy1:${fy1}px;--fx2:${fx2}px;--fy2:${fy2}px;--fx3:${fx3}px;--fy3:${fy3}px;--ff-dur:${dur}s;--ff-del:${del}s"><circle cx="${x}" cy="${y}" r="11" fill="url(#fo-y)"/><circle cx="${x}" cy="${y}" r="2.2" fill="#f6ffc9"/></g>`;
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
    out += `<g class="focus-neon-pulse" style="--np-dur:4s;--neon-glow:#ff3d8b"><path d="${pk}" stroke="#ff3d8b" stroke-width="10" opacity=".22" fill="none"/><path d="${pk}" stroke="#ff7ab6" stroke-width="2.4" fill="none"/></g><g class="focus-neon-pulse" style="--np-dur:5.2s;--neon-glow:#38e8ff"><path d="${cy}" stroke="#38e8ff" stroke-width="10" opacity=".2" fill="none"/><path d="${cy}" stroke="#9bf3ff" stroke-width="2.4" fill="none"/></g>`;
  }
  return out;
}

// Seamless continuous rain generator (multi-layer looping with 0 stutter)
function continuousRain(r: () => number) {
  let farDrops = '';
  let nearDrops = '';

  for (let i = 0; i < 45; i++) {
    const x = (r() * 1750 - 50) | 0;
    const y = (r() * 900) | 0;
    farDrops += `M${x} ${y}l-5 28`;
    // Duplicate offset by (x + 30, y - 900) for mathematically seamless wrap
    farDrops += `M${x + 30} ${y - 900}l-5 28`;
  }

  for (let i = 0; i < 35; i++) {
    const x = (r() * 1750 - 50) | 0;
    const y = (r() * 900) | 0;
    nearDrops += `M${x} ${y}l-7 40`;
    // Duplicate offset by (x + 45, y - 900) for mathematically seamless wrap
    nearDrops += `M${x + 45} ${y - 900}l-7 40`;
  }

  return (
    `<g class="focus-rain-far"><path d="${farDrops}" stroke="rgba(180,215,255,.32)" stroke-width="1.2" fill="none"/></g>` +
    `<g class="focus-rain-near"><path d="${nearDrops}" stroke="rgba(220,240,255,.55)" stroke-width="1.6" fill="none"/></g>`
  );
}

// Falling sakura petals generator with continuous wind flow
function sakuraPetals(r: () => number, count: number) {
  let s = '';
  for (let i = 0; i < count; i++) {
    const px0 = ((i / count) * 1650 - 200) | 0;
    const py0 = -40;
    const dur = (9.5 + r() * 5.5).toFixed(1);
    const del = -((i / count) * 12).toFixed(1);
    const driftX = (340 + r() * 200) | 0;
    const rot = (240 + r() * 240) | 0;
    const scale = (0.7 + r() * 0.55).toFixed(2);
    const petalColor = r() < 0.65 ? '#ffb9d8' : '#ffe4f0';

    s += `<g transform="translate(${px0}, ${py0})">` +
      `<g class="focus-petal" style="--pdx:${driftX}px;--prot:${rot}deg;--pt-dur:${dur}s;--pt-del:${del}s">` +
      `<path transform="scale(${scale})" d="M0 0 C-6 -10, -10 -22, 0 -30 C10 -22, 6 -10, 0 0 Z" fill="${petalColor}" opacity="0.88" />` +
      `</g></g>`;
  }
  return s;
}

// Rising campfire embers generator with continuous turbulent flow
function campfireEmbers(r: () => number, count: number) {
  let s = '';
  for (let i = 0; i < count; i++) {
    const dur = (5 + r() * 4).toFixed(1);
    const del = -((i / count) * 7.5).toFixed(1);
    const startX = 800 + (((r() - 0.5) * 50) | 0);
    const startY = 770;
    const ex1 = (((r() - 0.5) * 50) | 0);
    const ex2 = (((r() - 0.5) * 80) | 0);
    const rad = (1.8 + r() * 2.2).toFixed(1);
    const color = r() < 0.6 ? '#ffb74d' : r() < 0.85 ? '#ffa726' : '#ffe082';

    s += `<g transform="translate(${startX}, ${startY})">` +
      `<g class="focus-ember" style="--ex1:${ex1}px;--ex2:${ex2}px;--em-dur:${dur}s;--em-del:${del}s">` +
      `<circle cx="0" cy="0" r="${rad}" fill="${color}" filter="drop-shadow(0 0 5px ${color})"/>` +
      `</g></g>`;
  }
  return s;
}

// Procedural SVG Scene Generators (Pure, deterministic and cached)
const sceneCache: Record<string, string> = {};

export function getSvgScene(key: string): string {
  // Alias legacy scene keys
  if (key === 'sea') key = 'sakura';
  if (key === 'aurora') key = 'campfire';
  if (key === 'rain') key = 'neon';
  if (key === 'stars') key = 'dusk';

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
    stop(0, '#ffc9a0', 0.45) + stop(1, '#ffc9a0', 0)
  }</radialGradient></defs>
  <rect width="1600" height="900" fill="url(#dk-s)"/>${stars(r, 45, 260)}
  <circle cx="1060" cy="640" r="460" fill="url(#dk-g)"/><circle cx="1060" cy="640" r="44" fill="#fff4d6"/>
  <g class="focus-cloud-drift" style="--cd-dur:65s"><ellipse cx="400" cy="400" rx="320" ry="26" fill="url(#dk-c)"/><ellipse cx="560" cy="440" rx="220" ry="16" fill="url(#dk-c)"/></g>
  <g class="focus-cloud-drift" style="--cd-dur:80s"><ellipse cx="1200" cy="340" rx="300" ry="22" fill="url(#dk-c)"/><ellipse cx="1000" cy="380" rx="200" ry="14" fill="url(#dk-c)"/></g>
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
  <g class="focus-neon-pulse" style="--np-dur:8s"><path d="M1180 210L820 900H1020Z" fill="url(#fo-r)"/><path d="M1180 210L1000 900H1240Z" fill="url(#fo-r)"/><path d="M1180 210L1320 900H1500Z" fill="url(#fo-r)"/></g>
  <path d="${hills}" fill="#0e3a40"/>${pines(
        r,
        720,
        70,
        130,
        20,
        34,
        '#0b3036'
      )}
  <g class="focus-cloud-drift" style="--cd-dur:50s"><ellipse cx="500" cy="730" rx="520" ry="46" fill="url(#fo-f)"/><ellipse cx="1250" cy="760" rx="480" ry="40" fill="url(#fo-f)"/></g>
  ${pines(r, 790, 120, 200, 30, 50, '#072329')}
  <g class="focus-cloud-drift" style="--cd-dur:62s"><ellipse cx="800" cy="800" rx="640" ry="50" fill="url(#fo-f)"/></g>
  ${pines(r, 870, 190, 300, 48, 80, '#03131a')}${fireflies(r, 22, 560, 860)}`);
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
  ${far}${mid}${near}<rect y="640" width="1600" height="260" fill="url(#nx-b)"/>
  ${continuousRain(r)}`);
      break;
    }

    case 'sakura': {
      const r = R(42);
      const farMountains = ridge(r, 680, 110, 0.55);
      const nearMountains = ridge(r, 770, 90, 0.5);

      markup = svg(`<defs>
  <linearGradient id="sk-sky" x1="0" y1="0" x2="0" y2="1">
    ${stop(0, '#070719') + stop(0.4, '#141133') + stop(0.7, '#2a1e4c') + stop(1, '#45265e')}
  </linearGradient>
  <radialGradient id="sk-moon-glow">
    ${stop(0, '#fff0f7', 1) + stop(0.25, '#ffb8de', 0.45) + stop(1, 'transparent')}
  </radialGradient>
  <radialGradient id="sk-lantern-glow">
    ${stop(0, '#fff4cc', 1) + stop(0.35, '#ff9800', 0.5) + stop(1, 'transparent')}
  </radialGradient>
  <radialGradient id="sk-mist">
    ${stop(0, '#d1b3e8', 0.22) + stop(1, 'transparent')}
  </radialGradient>
</defs>
<rect width="1600" height="900" fill="url(#sk-sky)"/>
${stars(r, 75, 450, '#ffe8f4')}
<!-- Moon -->
<circle cx="1200" cy="240" r="380" fill="url(#sk-moon-glow)"/>
<circle cx="1200" cy="240" r="56" fill="#fff5fa"/>
<!-- Mountains -->
<path d="${farMountains}" fill="#1e1338"/>
<g class="focus-cloud-drift" style="--cd-dur:58s"><ellipse cx="600" cy="710" rx="600" ry="40" fill="url(#sk-mist)"/></g>
<path d="${nearMountains}" fill="#110a22"/>
<!-- Distant Pagoda Silhouette -->
<path d="M420 620 L400 635 H440 Z M410 635 V650 M405 650 H435 L438 658 H402 Z M405 658 V680 M390 680 H450 L455 692 H385 Z M395 692 V740 H445 V692 Z" fill="#0d071a"/>
<!-- Tree Silhouette & Hanging Blossom Branches -->
<path d="M-20 -20 Q180 80 340 180 T680 230 M240 120 Q320 220 420 260 M-20 60 Q120 180 200 320 M1620 -20 Q1400 90 1220 160 T980 220 M1340 120 Q1240 220 1160 270" stroke="#0b0615" stroke-width="16" stroke-linecap="round" fill="none"/>
<path d="M-20 -20 Q180 80 340 180 T680 230 M240 120 Q320 220 420 260 M-20 60 Q120 180 200 320 M1620 -20 Q1400 90 1220 160 T980 220 M1340 120 Q1240 220 1160 270" stroke="#160c29" stroke-width="8" stroke-linecap="round" fill="none"/>
<!-- Blossom Clusters -->
<g fill="#ffc2dc" opacity="0.85">
  <circle cx="340" cy="180" r="14"/><circle cx="355" cy="175" r="11"/><circle cx="330" cy="190" r="12"/><circle cx="348" cy="195" r="10"/>
  <circle cx="420" cy="260" r="16"/><circle cx="438" cy="250" r="13"/><circle cx="410" cy="272" r="12"/>
  <circle cx="680" cy="230" r="15"/><circle cx="698" cy="225" r="12"/><circle cx="670" cy="242" r="11"/>
  <circle cx="200" cy="320" r="16"/><circle cx="218" cy="315" r="12"/><circle cx="190" cy="335" r="14"/>
  <circle cx="1220" cy="160" r="16"/><circle cx="1205" cy="155" r="12"/><circle cx="1235" cy="172" r="14"/>
  <circle cx="980" cy="220" r="15"/><circle cx="965" cy="215" r="12"/><circle cx="995" cy="235" r="11"/>
  <circle cx="1160" cy="270" r="17"/><circle cx="1142" cy="265" r="13"/><circle cx="1178" cy="282" r="14"/>
</g>
<!-- Swaying Hanging Lantern -->
<g class="focus-lantern">
  <line x1="230" y1="140" x2="230" y2="250" stroke="#0b0615" stroke-width="2"/>
  <circle cx="230" cy="285" r="85" fill="url(#sk-lantern-glow)"/>
  <rect x="212" y="250" width="36" height="6" rx="2" fill="#2b140a"/>
  <path d="M214 256 Q200 285 214 314 H246 Q260 285 246 256 Z" fill="#ff7043" stroke="#ffcc80" stroke-width="2"/>
  <circle cx="230" cy="285" r="12" fill="#fff9c4"/>
  <rect x="214" y="314" width="32" height="5" rx="1.5" fill="#2b140a"/>
  <line x1="230" y1="319" x2="230" y2="345" stroke="#ff7043" stroke-width="2.5"/>
</g>
<!-- Continuous Flowing Sakura Petals -->
${sakuraPetals(r, 28)}`);
      break;
    }

    case 'campfire': {
      const r = R(88);
      const mountains = ridge(r, 680, 130, 0.55);

      markup = svg(`<defs>
  <linearGradient id="cp-sky" x1="0" y1="0" x2="0" y2="1">
    ${stop(0, '#030712') + stop(0.45, '#0b162c') + stop(0.8, '#1a2744') + stop(1, '#272033')}
  </linearGradient>
  <radialGradient id="cp-hearth">
    ${stop(0, '#fff2b2', 1) + stop(0.18, '#ff9800', 0.8) + stop(0.45, '#e65100', 0.45) + stop(1, 'transparent')}
  </radialGradient>
  <radialGradient id="cp-glow">
    ${stop(0, '#ff9800', 0.35) + stop(0.5, '#e65100', 0.15) + stop(1, 'transparent')}
  </radialGradient>
</defs>
<rect width="1600" height="900" fill="url(#cp-sky)"/>
${stars(r, 110, 520, '#fffae8')}
<!-- Distant Mountains -->
<path d="${mountains}" fill="#0b172a"/>
<!-- Pines framing the campsite -->
${pines(r, 760, 110, 190, 26, 42, '#07101e')}
${pines(r, 840, 160, 260, 44, 75, '#040913')}
<!-- Ground clearing -->
<ellipse cx="800" cy="850" rx="720" ry="120" fill="#08070e"/>
<!-- Ambient Hearth Ground Glow -->
<ellipse cx="800" cy="800" rx="460" ry="180" fill="url(#cp-glow)"/>
<!-- Campfire Hearth & Pulsing Flame -->
<g>
  <!-- Firewood logs -->
  <path d="M720 830 L880 770 M880 830 L720 770 M700 810 L900 810" stroke="#23130d" stroke-width="26" stroke-linecap="round"/>
  <path d="M720 830 L880 770 M880 830 L720 770 M700 810 L900 810" stroke="#120805" stroke-width="18" stroke-linecap="round"/>
  <!-- Glowing flame layers -->
  <circle cx="800" cy="780" r="160" fill="url(#cp-hearth)"/>
  <g class="focus-hearth">
    <path d="M800 660 Q730 740 760 800 Q800 820 840 800 Q870 740 800 660 Z" fill="#ff5722"/>
    <path d="M800 690 Q750 750 770 795 Q800 812 830 795 Q850 750 800 690 Z" fill="#ff9800"/>
    <path d="M800 720 Q770 760 782 795 Q800 805 818 795 Q830 760 800 720 Z" fill="#ffeb3b"/>
  </g>
</g>
<!-- Continuous Rising Embers Stream -->
${campfireEmbers(r, 36)}`);
      break;
    }

    default:
      markup = '';
      break;
  }

  sceneCache[key] = markup;
  return markup;
}

