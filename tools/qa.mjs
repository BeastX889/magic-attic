// Smoke test: node tools/qa.mjs [baseUrl] [outDir]
// Serve the folder first (python3 -m http.server 8765). Plays every room to the win popup and the lose popup at
// desktop, phone portrait and phone landscape sizes, screenshots each, taps the "More games" link once and checks
// it opened a new tab, and fails on any console error, warning or exception.
import { mkdirSync } from 'node:fs';
import { launch, openPage, sleep } from './cdp.mjs';

const BASE = process.argv[2] || 'http://localhost:8765/';
const OUT = process.argv[3] || 'qa-out';
mkdirSync(OUT, { recursive: true });
const SIZES = [[1280, 720], [390, 844], [844, 390]];
const ROOMS = 6;

const chrome = await launch(9341);
let fail = 0;
// poll until the popup of the given type is up (the room intro banner and popup animation take a moment)
async function waitPopup(page, type, ms = 6000) {
  for (let t = 0; t < ms; t += 250) {
    if (await page.eval(`(__ha.popup && __ha.popup.type) === '${type}'`)) { await sleep(900); return true; }
    await sleep(250);
  }
  return false;
}
const tabs = async () => (await (await fetch(`http://127.0.0.1:${chrome.port}/json/list`)).json()).filter(t => t.type === 'page');
try {
  for (const [w, h] of SIZES) {
    const page = await openPage(chrome.port);
    await page.size(w, h);
    for (let lv = 1; lv <= ROOMS; lv++) {
      await page.goto(BASE + 'index.html?level=' + lv, 1500);
      await page.eval(`localStorage.clear(); 1`);
      await page.eval(`__ha.settle(); __ha.findN(99); 1`);
      await waitPopup(page, 'win');
      await page.eval(`__ha.settle(); 1`);
      const r = await page.eval(`({ popup: __ha.popup && __ha.popup.type, more: __ha.buttons.find(b => b.id === 'more') || null })`);
      if (r.popup !== 'win' || !r.more) { console.log(`FAIL ${w}x${h} room ${lv}: popup=${r.popup} more=${!!r.more}`); fail++; }
      else if (r.more.y + r.more.h > (w > h ? 900 : 1560) + 60) { console.log(`WARN ${w}x${h} room ${lv}: link low`, r.more); }
      await page.shot(`${OUT}/${w}x${h}-L${lv}-win.png`);
      if (lv === 1) {   // tap the link once: a new tab should open on the studio page
        const before = (await tabs()).length;
        const c = await page.eval(`__ha.stageToClient(${r.more.x + r.more.w / 2}, ${r.more.y + r.more.h / 2})`);
        await page.click(c.x, c.y); await sleep(800);
        const list = await tabs();
        const opened = list.length > before && list.some(t => t.url.includes('lumiolab.itch.io'));
        console.log(`${w}x${h}: link tap opened new tab: ${opened}`);
        if (!opened) fail++;
        for (const t of list) if (t.url.includes('lumiolab.itch.io')) await fetch(`http://127.0.0.1:${chrome.port}/json/close/${t.id}`);
        await page.send('Page.bringToFront'); await sleep(300);   // the game pauses while its tab is hidden
      }
    }
    // lose popup
    await page.goto(BASE + 'index.html?level=3', 1500);
    await page.eval(`__ha.settle(); __ha.G.started = true; __ha.findN(2); __ha.G.timeLeft = 0.01; 1`);
    await waitPopup(page, 'lose');
    await page.eval(`__ha.settle(); 1`);
    const lose = await page.eval(`({ popup: __ha.popup && __ha.popup.type, more: !!__ha.buttons.find(b => b.id === 'more') })`);
    if (lose.popup !== 'lose' || !lose.more) { console.log(`FAIL ${w}x${h} lose: ${JSON.stringify(lose)}`); fail++; }
    await page.shot(`${OUT}/${w}x${h}-lose.png`);
    // ignore errors logged by the external studio page that the link test opened
    const errs = page.logs.filter(l => !l.includes('itch.io'));
    if (errs.length) { console.log(`FAIL ${w}x${h} console:\n  ` + errs.join('\n  ')); fail++; }
    else console.log(`${w}x${h}: ${ROOMS} rooms won + lose popup, 0 console errors`);
    page.close();
  }
} finally { chrome.close(); }
console.log(fail ? `${fail} FAILURE(S)` : 'ALL PASS');
process.exit(fail ? 1 : 0);
