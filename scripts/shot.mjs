// 개발용: 웹 빌드를 띄워 화면을 390×844로 찍는다.
// 사용: node scripts/shot.mjs <web 빌드 폴더> <출력 폴더> <seed.json|-> <경로> [<경로> ...]
// seed.json은 가짜 서버 데이터(Data). "-"면 빈 상태로 시작
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = require('/opt/node22/lib/node_modules/playwright'));
}

const [root, out, seedPath, ...routes] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });

const types = { '.js': 'application/javascript', '.html': 'text/html', '.css': 'text/css', '.ttf': 'font/ttf', '.png': 'image/png', '.json': 'application/json', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let file = path.join(root, url);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
  res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'ko-KR', timezoneId: 'Asia/Seoul' });
const seed = seedPath && seedPath !== '-' ? fs.readFileSync(seedPath, 'utf8') : null;
if (seed) {
  await ctx.addInitScript((s) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('jaksim30k', JSON.stringify({ state: JSON.parse(s), version: 1 }));
      sessionStorage.setItem('seeded', '1');
    }
  }, seed);
}
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
for (const r of routes) {
  await page.goto(`http://localhost:${port}${r}`);
  await page.waitForTimeout(1500);
  const name = r.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '') || 'root';
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  console.log('shot', r, '->', `${name}.png`);
}
if (errors.length) console.log('ERRORS:\n' + [...new Set(errors)].join('\n'));

// 여러 장을 한 장으로 모아 보기 (가로 4장씩, 1배율)
if (routes.length > 1) {
  const files = routes.map((r) => (r.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '') || 'root') + '.png');
  const imgs = files
    .map((f) => `<figure><img src="data:image/png;base64,${fs.readFileSync(path.join(out, f)).toString('base64')}"><figcaption>${f}</figcaption></figure>`)
    .join('');
  const cols = Math.min(4, files.length);
  const sheet = await browser.newPage({ viewport: { width: cols * 400, height: 900 }, deviceScaleFactor: 1 });
  await sheet.setContent(`<style>body{margin:0;display:grid;grid-template-columns:repeat(${cols},390px);gap:10px;background:#fff;font:12px sans-serif}figure{margin:0}img{width:390px;height:844px;display:block}</style>${imgs}`);
  await sheet.screenshot({ path: path.join(out, 'combo.png'), fullPage: true });
  console.log('combo -> combo.png');
}
await browser.close();
server.close();
