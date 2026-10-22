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

    if (sceneId === 'stars') {
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
