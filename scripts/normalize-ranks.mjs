import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const RANKS = [
  'bronze-1', 'bronze-2', 'bronze-3', 'bronze-4',
  'silver-1', 'silver-2', 'silver-3', 'silver-4',
  'gold-1', 'gold-2', 'gold-3', 'gold-4',
  'platinum-1', 'platinum-2', 'platinum-3', 'platinum-4',
  'diamond-1', 'diamond-2', 'diamond-3', 'diamond-4',
  'champion', 'master', 'grandmaster'
];

const TARGET_CANVAS_SIZE = 512;
const DEFAULT_TARGET_ART_WIDTH = 380; // Perfectly fits all new rank icons on 512x512 with >= 28px margin
const DEFAULT_ALPHA_THRESHOLD = 40;

const SCRATCH_SOURCE_DIR = path.resolve('scratch/rank_icons/ranks');
const DIRS = [
  path.resolve('public/images/ranks'),
  path.resolve('public/ranks'),
];

async function measureArtwork(filePath, alphaThreshold = DEFAULT_ALPHA_THRESHOLD) {
  const image = sharp(filePath);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  let minX = width, maxX = 0, minY = height, maxY = 0;
  let count = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const alpha = channels === 4 ? data[idx + 3] : 255;
      if (alpha >= alphaThreshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        count++;
      }
    }
  }

  if (count === 0) {
    return {
      width,
      height,
      bbox: { minX: 0, maxX: width - 1, minY: 0, maxY: height - 1 },
      artWidth: width,
      artHeight: height,
      artCenterX: width / 2,
      artCenterY: height / 2,
      offsetX: 0,
      offsetY: 0,
    };
  }

  const artWidth = maxX - minX + 1;
  const artHeight = maxY - minY + 1;
  const artCenterX = (minX + maxX) / 2;
  const artCenterY = (minY + maxY) / 2;

  return {
    width,
    height,
    bbox: { minX, maxX, minY, maxY },
    artWidth,
    artHeight,
    artCenterX,
    artCenterY,
    offsetX: minX,
    offsetY: minY,
  };
}

async function run() {
  const alphaThreshold = Number(process.argv[2]) || DEFAULT_ALPHA_THRESHOLD;
  const targetArtWidth = Number(process.argv[3]) || DEFAULT_TARGET_ART_WIDTH;

  console.log(`\n========================================================================`);
  console.log(`RANK BADGE MEASUREMENT & NORMALIZATION SCRIPT`);
  console.log(`Alpha Threshold: ${alphaThreshold}/255`);
  console.log(`Target Canvas Size: ${TARGET_CANVAS_SIZE}x${TARGET_CANVAS_SIZE}`);
  console.log(`Target Artwork Width: ${targetArtWidth}px (${((targetArtWidth / TARGET_CANVAS_SIZE) * 100).toFixed(1)}% of canvas)`);
  console.log(`========================================================================\n`);

  // If user provided fresh icons in scratch/rank_icons/ranks, ingest and back them up
  if (fs.existsSync(SCRATCH_SOURCE_DIR)) {
    console.log(`Found newly added rank icons in ${SCRATCH_SOURCE_DIR}! Ingesting as primary source...`);
    for (const dir of DIRS) {
      const backupDir = path.join(dir, 'original');
      fs.mkdirSync(backupDir, { recursive: true });
      for (const r of RANKS) {
        const scratchFile = path.join(SCRATCH_SOURCE_DIR, `${r}.png`);
        if (fs.existsSync(scratchFile)) {
          const dstFile = path.join(backupDir, `${r}.png`);
          fs.copyFileSync(scratchFile, dstFile);
        }
      }
    }
    console.log(`Synced newly added rank icons into public/images/ranks/original and public/ranks/original.\n`);
  }

  for (const dir of DIRS) {
    if (!fs.existsSync(dir)) continue;

    console.log(`\n------------------------------------------------------------------------`);
    console.log(`Directory: ${dir}`);
    console.log(`------------------------------------------------------------------------`);

    const backupDir = path.join(dir, 'original');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Step 1: Measure original files
    console.log(`\nSTEP 1: BEFORE NORMALIZATION MEASUREMENTS:`);
    console.log(
      `${'Rank'.padEnd(16)} | ${'Orig Canvas'.padEnd(12)} | ${'BBox [x1, y1, x2, y2]'.padEnd(26)} | ${'Art W'.padEnd(7)} | ${'Art H'.padEnd(7)} | ${'Offset (x,y)'.padEnd(14)}`
    );
    console.log('-'.repeat(95));

    const origStats = {};
    for (const r of RANKS) {
      const origFile = path.join(backupDir, `${r}.png`);
      if (!fs.existsSync(origFile)) continue;
      const stats = await measureArtwork(origFile, alphaThreshold);
      origStats[r] = stats;
      const bboxStr = `[${stats.bbox.minX}, ${stats.bbox.minY}, ${stats.bbox.maxX}, ${stats.bbox.maxY}]`;
      const offsetStr = `(${stats.offsetX}, ${stats.offsetY})`;
      console.log(
        `${r.padEnd(16)} | ${(stats.width + 'x' + stats.height).padEnd(12)} | ${bboxStr.padEnd(26)} | ${String(stats.artWidth).padEnd(7)} | ${String(stats.artHeight).padEnd(7)} | ${offsetStr.padEnd(14)}`
      );
    }

    // Reference width: Silver-2 artwork width
    const refSilver = origStats['silver-2'] || origStats['silver-3'] || { artWidth: 940 };
    console.log(`\nReference Badge: Silver II (artWidth = ${refSilver.artWidth}px in original source)`);

    // Step 2: Normalize every PNG and WebP
    console.log(`\nSTEP 2: NORMALIZING EVERY PNG & WEBP TO EXACT ${targetArtWidth}px ARTWORK WIDTH...`);

    for (const r of RANKS) {
      const origFile = path.join(backupDir, `${r}.png`);
      if (!fs.existsSync(origFile)) continue;

      const stats = origStats[r];
      const scale = targetArtWidth / stats.artWidth;

      // Generous padding to preserve all glow, haze, and glint dots
      const padOrig = Math.round(50 / scale);
      const cropLeft = Math.max(0, stats.bbox.minX - padOrig);
      const cropTop = Math.max(0, stats.bbox.minY - padOrig);
      const cropRight = Math.min(stats.width, stats.bbox.maxX + padOrig + 1);
      const cropBottom = Math.min(stats.height, stats.bbox.maxY + padOrig + 1);

      const cropW = cropRight - cropLeft;
      const cropH = cropBottom - cropTop;

      const newW = Math.round(cropW * scale);
      const newH = Math.round(cropH * scale);

      // Extract and resize
      const croppedBuffer = await sharp(origFile)
        .extract({ left: cropLeft, top: cropTop, width: cropW, height: cropH })
        .resize(newW, newH, { kernel: sharp.kernel.lanczos3 })
        .toBuffer();

      // Artwork center relative to crop in resized pixels
      const relArtCenterX = (stats.artCenterX - cropLeft) * scale;
      const relArtCenterY = (stats.artCenterY - cropTop) * scale;

      // Paste position so artwork center is exactly at (256, 256)
      let pasteLeft = Math.round((TARGET_CANVAS_SIZE / 2) - relArtCenterX);
      let pasteTop = Math.round((TARGET_CANVAS_SIZE / 2) - relArtCenterY);

      // Clamping in case of boundary overflow
      let extractX = 0;
      let extractY = 0;
      let compW = newW;
      let compH = newH;

      if (pasteLeft < 0) {
        extractX = -pasteLeft;
        compW += pasteLeft;
        pasteLeft = 0;
      }
      if (pasteTop < 0) {
        extractY = -pasteTop;
        compH += pasteTop;
        pasteTop = 0;
      }
      if (pasteLeft + compW > TARGET_CANVAS_SIZE) {
        compW = TARGET_CANVAS_SIZE - pasteLeft;
      }
      if (pasteTop + compH > TARGET_CANVAS_SIZE) {
        compH = TARGET_CANVAS_SIZE - pasteTop;
      }

      const inputBuffer = (extractX > 0 || extractY > 0 || compW < newW || compH < newH)
        ? await sharp(croppedBuffer).extract({ left: extractX, top: extractY, width: compW, height: compH }).toBuffer()
        : croppedBuffer;

      // Composite onto empty transparent 512x512 canvas
      const finalPngBuffer = await sharp({
        create: {
          width: TARGET_CANVAS_SIZE,
          height: TARGET_CANVAS_SIZE,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      })
        .composite([{ input: inputBuffer, left: pasteLeft, top: pasteTop }])
        .png({ compressionLevel: 6 })
        .toBuffer();

      // Save PNG
      const outPng = path.join(dir, `${r}.png`);
      fs.writeFileSync(outPng, finalPngBuffer);

      // Save WebP
      const finalWebpBuffer = await sharp(finalPngBuffer)
        .webp({ quality: 92, effort: 4 })
        .toBuffer();
      const outWebp = path.join(dir, `${r}.webp`);
      fs.writeFileSync(outWebp, finalWebpBuffer);
    }

    // Step 4: Verification measurements
    console.log(`\nSTEP 4: VERIFICATION MEASUREMENTS AFTER NORMALIZATION:`);
    console.log(
      `${'Rank'.padEnd(16)} | ${'Canvas'.padEnd(10)} | ${'Art Width'.padEnd(11)} | ${'Art Height'.padEnd(11)} | ${'Center (x,y)'.padEnd(14)} | ${'Delta from Target'.padEnd(18)}`
    );
    console.log('-'.repeat(90));

    let maxDelta = 0;
    for (const r of RANKS) {
      const normFile = path.join(dir, `${r}.png`);
      const stats = await measureArtwork(normFile, alphaThreshold);
      const delta = Math.abs(stats.artWidth - targetArtWidth);
      if (delta > maxDelta) maxDelta = delta;
      const centerStr = `(${Math.round(stats.artCenterX)}, ${Math.round(stats.artCenterY)})`;
      const deltaStr = `${delta === 0 ? '0px (EXACT)' : delta + 'px'}`;

      console.log(
        `${r.padEnd(16)} | ${(stats.width + 'x' + stats.height).padEnd(10)} | ${(stats.artWidth + 'px').padEnd(11)} | ${(stats.artHeight + 'px').padEnd(11)} | ${centerStr.padEnd(14)} | ${deltaStr.padEnd(18)}`
      );
    }

    console.log(`\nMax Width Variance across all ranks in ${dir}: ${maxDelta}px (Target: within 1px)`);
  }

  console.log(`\nNormalization complete! All rank badges now have identical artwork widths.\n`);
}

run().catch((err) => {
  console.error('Error normalizing ranks:', err);
  process.exit(1);
});
