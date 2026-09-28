// 개발용: 웹 빌드에서 버튼을 눌러가며 흐름을 시험한다.
// 사용: node scripts/flow.mjs <web 빌드> <출력 폴더> <steps.json>
// steps: [{"go": "/경로"}, {"click": "보이는 글자"}, {"shot": "이름"}, {"wait": ms}, {"fill": ["placeholder", "값"]}, {"eval": "js"}]
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
const [root, out, stepsPath] = process.argv.slice(2);
const steps = JSON.parse(fs.readFileSync(stepsPath, 'utf8'));
fs.mkdirSync(out, { recursive: true });
const types = { '.js': 'application/javascript', '.html': 'text/html', '.ttf': 'font/ttf', '.png': 'image/png', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  let file = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
  res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ko-KR', timezoneId: 'Asia/Seoul' })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('dialog', (d) => d.accept());
let n = 0;
for (const s of steps) {
  try {
    if (s.go) await page.goto(base + s.go);
    if (s.click) await page.getByText(s.click, { exact: true }).last().click({ timeout: 5000 });
    if (s.fill) await page.getByPlaceholder(s.fill[0]).fill(s.fill[1]);
    if (s.eval) await page.evaluate(s.eval);
    await page.waitForTimeout(s.wait ?? 900);
    if (s.shot) {
      n++;
      await page.screenshot({ path: path.join(out, `${String(n).padStart(2, '0')}-${s.shot}.png`) });
      console.log('shot', s.shot, page.url().replace(base, ''));
    }
  } catch (e) {
    console.log('FAIL', JSON.stringify(s), String(e).split('\n')[0]);
    await page.screenshot({ path: path.join(out, `fail-${n}.png`) });
    break;
  }
}
if (errors.length) console.log('ERRORS:\n' + [...new Set(errors)].join('\n'));
await browser.close();
server.close();
