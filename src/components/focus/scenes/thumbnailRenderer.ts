'use client';

const thumbnailCache = new Map<string, string>();

export function getSceneThumbnailDataUrl(sceneId: string): string | null {
  if (typeof document === 'undefined') return null;
  if (thumbnailCache.has(sceneId)) {
    return thumbnailCache.get(sceneId)!;
  }

  try {
    const width = 320;
    const height = 180; // 16:9
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (sceneId === 'dusk') {
      // Dusk peaks: sunset sky, mountains, warm glow
      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, '#171040');
      sky.addColorStop(0.35, '#4a2372');
      sky.addColorStop(0.65, '#b9487c');
      sky.addColorStop(0.85, '#f58a69');
      sky.addColorStop(1, '#ffc47c');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height);

      // Sunset sun
      const sunGlow = ctx.createRadialGradient(210, 130, 0, 210, 130, 70);
      sunGlow.addColorStop(0, '#fff0c4');
      sunGlow.addColorStop(0.25, '#ffb36b');
      sunGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(210, 130, 70, 0, Math.PI * 2);
      ctx.fill();

      // Ridge layers
      ctx.fillStyle = '#8a4a86';
      ctx.beginPath();
      ctx.moveTo(0, 125);
      ctx.lineTo(60, 115);
      ctx.lineTo(130, 130);
      ctx.lineTo(200, 110);
      ctx.lineTo(260, 125);
      ctx.lineTo(320, 118);
      ctx.lineTo(320, 180);
      ctx.lineTo(0, 180);
      ctx.fill();

      ctx.fillStyle = '#552a63';
      ctx.beginPath();
      ctx.moveTo(0, 140);
      ctx.lineTo(90, 125);
      ctx.lineTo(170, 145);
      ctx.lineTo(250, 132);
      ctx.lineTo(320, 148);
      ctx.lineTo(320, 180);
      ctx.lineTo(0, 180);
      ctx.fill();

      ctx.fillStyle = '#2b1646';
      ctx.beginPath();
      ctx.moveTo(0, 155);
      ctx.lineTo(70, 145);
      ctx.lineTo(160, 160);
      ctx.lineTo(240, 150);
      ctx.lineTo(320, 162);
      ctx.lineTo(320, 180);
      ctx.lineTo(0, 180);
      ctx.fill();
    } else if (sceneId === 'forest') {
      // Moonlit forest: dark teal sky, moon, pine silhouettes, mist
      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, '#030d14');
      sky.addColorStop(0.55, '#0a2630');
      sky.addColorStop(1, '#15494c');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height);

      // Moon
      const moonGlow = ctx.createRadialGradient(235, 42, 0, 235, 42, 50);
      moonGlow.addColorStop(0, '#bff5e6');
      moonGlow.addColorStop(0.2, '#bff5e6');
      moonGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(235, 42, 50, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#eefaf5';
      ctx.beginPath();
      ctx.arc(235, 42, 10, 0, Math.PI * 2);
      ctx.fill();

      // Moon rays
      const ray = ctx.createLinearGradient(235, 42, 180, 180);
      ray.addColorStop(0, 'rgba(207, 255, 240, 0.2)');
      ray.addColorStop(1, 'transparent');
      ctx.fillStyle = ray;
      ctx.beginPath();
      ctx.moveTo(235, 42);
      ctx.lineTo(140, 180);
      ctx.lineTo(200, 180);
      ctx.closePath();
      ctx.fill();

      // Pines & hills
      ctx.fillStyle = '#0b3036';
      for (let x = 0; x < width + 20; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x, 180);
        ctx.lineTo(x + 8, 120 + ((x * 7) % 25));
        ctx.lineTo(x + 16, 180);
        ctx.fill();
      }

      ctx.fillStyle = '#072329';
      for (let x = -5; x < width + 20; x += 22) {
        ctx.beginPath();
        ctx.moveTo(x, 180);
        ctx.lineTo(x + 11, 135 + ((x * 11) % 30));
        ctx.lineTo(x + 22, 180);
        ctx.fill();
      }

      // Fireflies
      ctx.fillStyle = '#e4ff9e';
      for (let i = 0; i < 12; i++) {
        const fx = ((i * 47 + 10) % (width - 40)) + 20;
        const fy = 110 + ((i * 31) % 60);
        ctx.beginPath();
        ctx.arc(fx, fy, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (sceneId === 'neon') {
      // Neon skyline: retro synthwave night, glowing pink sun, city skyline
      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, '#06021a');
      sky.addColorStop(0.4, '#1a0945');
      sky.addColorStop(0.7, '#5a1a78');
      sky.addColorStop(1, '#d1307f');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height);

      // Glowing Neon Sun
      const sun = ctx.createRadialGradient(width / 2, 95, 0, width / 2, 95, 75);
      sun.addColorStop(0, '#ffe08a');
      sun.addColorStop(0.4, '#ff4f9a');
      sun.addColorStop(0.85, 'rgba(255, 61, 139, 0.3)');
      sun.addColorStop(1, 'transparent');
      ctx.fillStyle = sun;
      ctx.beginPath();
      ctx.arc(width / 2, 95, 75, 0, Math.PI * 2);
      ctx.fill();

      // City buildings
      ctx.fillStyle = '#2b1163';
      for (let x = 0; x < width; x += 22) {
        const bh = 45 + ((x * 17) % 55);
        ctx.fillRect(x, height - bh - 20, 18, bh + 20);
      }

      ctx.fillStyle = '#170a3c';
      for (let x = 5; x < width; x += 28) {
        const bh = 55 + ((x * 23) % 65);
        ctx.fillRect(x, height - bh, 24, bh);
      }

      ctx.fillStyle = '#080419';
      for (let x = 2; x < width; x += 34) {
        const bh = 35 + ((x * 19) % 45);
        ctx.fillRect(x, height - bh, 30, bh);
        // Neon rooftop line
        ctx.fillStyle = (x % 2 === 0 ? '#ff3d8b' : '#38e8ff');
        ctx.fillRect(x, height - bh, 30, 2);
        ctx.fillStyle = '#080419';
      }

      // Neon rain lines
      ctx.strokeStyle = 'rgba(200, 225, 255, 0.45)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 20; i++) {
        const rx = ((i * 37) % width);
        const ry = ((i * 29) % (height - 30));
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 3, ry + 12);
        ctx.stroke();
      }
    } else if (sceneId === 'sea') {
      // Moonlit sea: starry ocean night, moon, shimmer reflection, waves
      const sky = ctx.createLinearGradient(0, 0, 0, height * 0.65);
      sky.addColorStop(0, '#040a1c');
      sky.addColorStop(0.55, '#0c2147');
      sky.addColorStop(1, '#1f4f80');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height * 0.65);

      // Sea water
      const seaGrad = ctx.createLinearGradient(0, height * 0.62, 0, height);
      seaGrad.addColorStop(0, '#0e3a68');
      seaGrad.addColorStop(1, '#020813');
      ctx.fillStyle = seaGrad;
      ctx.fillRect(0, height * 0.62, width, height * 0.38);

      // Moon
      const moon = ctx.createRadialGradient(160, 50, 0, 160, 50, 55);
      moon.addColorStop(0, '#f4f7ff');
      moon.addColorStop(0.25, '#bcd6ff');
      moon.addColorStop(1, 'transparent');
      ctx.fillStyle = moon;
      ctx.beginPath();
      ctx.arc(160, 50, 55, 0, Math.PI * 2);
      ctx.fill();

      // Moon shimmer on water
      ctx.fillStyle = '#eaf2ff';
      for (let j = 0; j < 14; j++) {
        const sw = 50 - j * 2.5;
        const sy = height * 0.65 + j * 4.5;
        ctx.globalAlpha = 0.6 - j * 0.03;
        ctx.fillRect(160 - sw / 2, sy, sw, 1.8);
      }
      ctx.globalAlpha = 1.0;

      // Wave strokes
      ctx.strokeStyle = 'rgba(175, 210, 255, 0.28)';
      ctx.lineWidth = 1;
      for (let w = 0; w < 6; w++) {
        const wy = height * 0.66 + w * 11;
        ctx.beginPath();
        ctx.moveTo(0, wy);
        for (let x = 0; x < width; x += 40) {
          ctx.quadraticCurveTo(x + 20, wy - 3, x + 40, wy);
        }
        ctx.stroke();
      }
    } else if (sceneId === 'aurora') {
      // Polar aurora: arctic night, glowing neon ribbons (cyan, purple, emerald), snowy peaks
      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, '#02060f');
      sky.addColorStop(0.6, '#07152a');
      sky.addColorStop(1, '#0c2540');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height);

      // Aurora ribbon 1 (Emerald/cyan)
      ctx.save();
      ctx.globalAlpha = 0.55;
      const au1 = ctx.createLinearGradient(0, 0, width, 0);
      au1.addColorStop(0, '#5dffb3');
      au1.addColorStop(0.5, '#2fd4c9');
      au1.addColorStop(1, '#8a6bff');
      ctx.strokeStyle = au1;
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.moveTo(-10, 60);
      ctx.bezierCurveTo(80, 25, 170, 85, 330, 45);
      ctx.stroke();

      // Aurora ribbon 2 (Magenta/purple/cyan)
      const au2 = ctx.createLinearGradient(0, 0, width, 0);
      au2.addColorStop(0, '#ff7ad9');
      au2.addColorStop(0.5, '#9b7bff');
      au2.addColorStop(1, '#4fe3ff');
      ctx.strokeStyle = au2;
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(-10, 85);
      ctx.bezierCurveTo(70, 50, 200, 105, 330, 75);
      ctx.stroke();
      ctx.restore();

      // Mountain ridges
      ctx.fillStyle = '#0b1d33';
      ctx.beginPath();
      ctx.moveTo(0, 150);
      ctx.lineTo(80, 130);
      ctx.lineTo(160, 155);
      ctx.lineTo(240, 135);
      ctx.lineTo(320, 160);
      ctx.lineTo(320, 180);
      ctx.lineTo(0, 180);
      ctx.fill();

      ctx.strokeStyle = 'rgba(190, 220, 255, 0.4)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = '#050c18';
      ctx.beginPath();
      ctx.moveTo(0, 165);
      ctx.lineTo(100, 150);
      ctx.lineTo(200, 168);
      ctx.lineTo(320, 155);
      ctx.lineTo(320, 180);
      ctx.lineTo(0, 180);
      ctx.fill();
    } else if (sceneId === 'stars') {
      // 1. Sky vertical gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#0B1030');
      skyGrad.addColorStop(0.5, '#070A1C');
      skyGrad.addColorStop(1, '#03040B');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Milky Way band
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(-0.55);
      const mwGrad = ctx.createLinearGradient(-180, 0, 180, 0);
      mwGrad.addColorStop(0, 'rgba(186, 210, 255, 0)');
      mwGrad.addColorStop(0.3, 'rgba(186, 210, 255, 0.05)');
      mwGrad.addColorStop(0.48, 'rgba(224, 215, 250, 0.16)');
      mwGrad.addColorStop(0.52, 'rgba(255, 238, 220, 0.20)');
      mwGrad.addColorStop(0.7, 'rgba(186, 210, 255, 0.06)');
      mwGrad.addColorStop(1, 'rgba(186, 210, 255, 0)');
      ctx.fillStyle = mwGrad;
      ctx.fillRect(-200, -50, 400, 100);
      ctx.restore();

      // 3. Nebula clouds
      const neb1 = ctx.createRadialGradient(210, 60, 0, 210, 60, 80);
      neb1.addColorStop(0, 'rgba(147, 51, 234, 0.28)');
      neb1.addColorStop(0.5, 'rgba(126, 34, 206, 0.12)');
      neb1.addColorStop(1, 'rgba(126, 34, 206, 0)');
      ctx.fillStyle = neb1;
      ctx.fillRect(110, 0, 200, 140);

      const neb2 = ctx.createRadialGradient(90, 120, 0, 90, 120, 75);
      neb2.addColorStop(0, 'rgba(14, 165, 233, 0.25)');
      neb2.addColorStop(0.55, 'rgba(20, 184, 166, 0.10)');
      neb2.addColorStop(1, 'rgba(14, 165, 233, 0)');
      ctx.fillStyle = neb2;
      ctx.fillRect(10, 45, 170, 145);

      const neb3 = ctx.createRadialGradient(160, 90, 0, 160, 90, 50);
      neb3.addColorStop(0, 'rgba(236, 72, 153, 0.20)');
      neb3.addColorStop(1, 'rgba(236, 72, 153, 0)');
      ctx.fillStyle = neb3;
      ctx.fillRect(110, 40, 100, 100);

      // 4. Dense Stars
      for (let i = 0; i < 110; i++) {
        const x = (i * 37) % width;
        const y = (i * 59) % height;
        const size = (i % 3 === 0 ? 1.4 : i % 2 === 0 ? 0.9 : 0.6);
        const alpha = 0.4 + (i % 5) * 0.12;

        ctx.fillStyle = i % 4 === 0 ? `rgba(254, 240, 138, ${alpha})` : `rgba(224, 242, 254, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Hero stars with glow & spikes
      const heroStars = [
        { x: 70, y: 45, r: 2.2, warm: false, spike: true },
        { x: 230, y: 55, r: 2.4, warm: true, spike: true },
        { x: 175, y: 135, r: 2.0, warm: false, spike: false },
        { x: 275, y: 110, r: 2.1, warm: false, spike: true },
      ];

      for (const h of heroStars) {
        // Glow
        const hg = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, 16);
        hg.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
        hg.addColorStop(0.2, h.warm ? 'rgba(254, 240, 138, 0.9)' : 'rgba(219, 234, 254, 0.9)');
        hg.addColorStop(0.5, h.warm ? 'rgba(251, 191, 36, 0.35)' : 'rgba(147, 197, 253, 0.35)');
        hg.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.arc(h.x, h.y, 16, 0, Math.PI * 2);
        ctx.fill();

        // 4-point cross spike
        if (h.spike) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(h.x - 14, h.y);
          ctx.lineTo(h.x + 14, h.y);
          ctx.moveTo(h.x, h.y - 14);
          ctx.lineTo(h.x, h.y + 14);
          ctx.stroke();
        }
      }

      // Shooting star streak
      const ssGrad = ctx.createLinearGradient(120, 20, 200, 65);
      ssGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      ssGrad.addColorStop(0.7, 'rgba(219, 234, 254, 0.6)');
      ssGrad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');
      ctx.strokeStyle = ssGrad;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(120, 20);
      ctx.lineTo(200, 65);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(200, 65, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (sceneId === 'rain') {
      // 1. Dark blue-grey base
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#070c14');
      bgGrad.addColorStop(0.5, '#0e1726');
      bgGrad.addColorStop(1, '#060a12');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. City light bokeh orbs
      const bokehs = [
        { x: 60, y: 50, r: 45, col: 'rgba(245, 158, 11, 0.45)' },
        { x: 240, y: 70, r: 55, col: 'rgba(56, 189, 248, 0.42)' },
        { x: 120, y: 130, r: 40, col: 'rgba(244, 63, 94, 0.38)' },
        { x: 170, y: 40, r: 35, col: 'rgba(251, 191, 36, 0.40)' },
        { x: 270, y: 135, r: 42, col: 'rgba(251, 146, 60, 0.42)' },
        { x: 30, y: 125, r: 35, col: 'rgba(6, 182, 212, 0.35)' },
      ];

      for (const b of bokehs) {
        const bg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        bg.addColorStop(0, b.col);
        bg.addColorStop(0.6, b.col.replace(/0\.\d+/, '0.12'));
        bg.addColorStop(1, 'transparent');
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Fog haze at bottom
      const fogGrad = ctx.createLinearGradient(0, height - 50, 0, height);
      fogGrad.addColorStop(0, 'rgba(160, 200, 235, 0)');
      fogGrad.addColorStop(1, 'rgba(160, 200, 235, 0.22)');
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, height - 50, width, 50);

      // 4. Glass Droplet Beads
      const drawDroplet = (x: number, y: number, r: number, warm = false) => {
        // Dark center
        ctx.fillStyle = 'rgba(8, 14, 24, 0.7)';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        // Reflected bottom glow
        ctx.fillStyle = warm ? 'rgba(251, 191, 36, 0.55)' : 'rgba(56, 189, 248, 0.55)';
        ctx.beginPath();
        ctx.arc(x, y + r * 0.2, r * 0.8, 0, Math.PI);
        ctx.fill();

        // Bright rim
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(x, y, r - 0.5, 0, Math.PI * 2);
        ctx.stroke();

        // Specular dot
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.arc(x - r * 0.3, y - r * 0.3, Math.max(0.7, r * 0.25), 0, Math.PI * 2);
        ctx.fill();
      };

      for (let i = 0; i < 40; i++) {
        const x = (i * 29 + 15) % (width - 20) + 10;
        const y = (i * 43 + 12) % (height - 20) + 10;
        const r = (i % 5 === 0 ? 4.5 : i % 2 === 0 ? 3.0 : 2.2);
        drawDroplet(x, y, r, i % 3 === 0);
      }

      // Running droplet with wet trail
      const rx = 185;
      const ry = 95;
      ctx.strokeStyle = 'rgba(219, 234, 254, 0.45)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(rx - 1, 35);
      ctx.lineTo(rx + 2, 60);
      ctx.lineTo(rx, ry);
      ctx.stroke();
      drawDroplet(rx, ry, 5.0, true);
    } else {
      // Default: Clean obsidian-slate gradient with subtle inner glow
      const defGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        width * 0.6
      );
      defGrad.addColorStop(0, '#222738');
      defGrad.addColorStop(0.55, '#0e111a');
      defGrad.addColorStop(1, '#050609');
      ctx.fillStyle = defGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle border line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.strokeRect(1, 1, width - 2, height - 2);
    }

    const dataUrl = canvas.toDataURL('image/webp', 0.92);
    thumbnailCache.set(sceneId, dataUrl);
    return dataUrl;
  } catch {
    return null;
  }
}
