const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(process.env.TEMP, 'chrome_cdp_shot_' + Date.now());

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  `--user-data-dir=${userDataDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  'about:blank'
]);

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  await sleep(1500);
  const targetRes = await fetch('http://127.0.0.1:9222/json/new?http://localhost:3000/dev/avatars', { method: 'PUT' });
  const tab = await targetRes.json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const curId = id++;
    const handler = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id === curId) {
        ws.removeEventListener('message', handler);
        resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  ws.onopen = async () => {
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 950, deviceScaleFactor: 1, mobile: false });
    await sleep(2500);

    // 1. Unlocked screenshot
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    const out1 = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\d25f5ab0-6e73-4883-acd2-57484a9b35f3\\premium_avatars_unlocked.png';
    fs.writeFileSync(out1, Buffer.from(shot1.data, 'base64'));
    console.log('Saved unlocked screenshot to:', out1);

    // 2. Click "Free (Locked)" button
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const lockBtn = btns.find(b => b.textContent && b.textContent.includes('Free (Locked)'));
          if (lockBtn) lockBtn.click();
        })()
      `
    });
    await sleep(1000);

    // 3. Locked screenshot
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    const out2 = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\d25f5ab0-6e73-4883-acd2-57484a9b35f3\\premium_avatars_locked.png';
    fs.writeFileSync(out2, Buffer.from(shot2.data, 'base64'));
    console.log('Saved locked screenshot to:', out2);

    ws.close();
    chrome.kill();
    process.exit(0);
  };
}

run().catch(err => {
  console.error(err);
  try { chrome.kill(); } catch {}
  process.exit(1);
});
