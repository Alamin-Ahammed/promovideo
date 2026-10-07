// Crisp 2x captures of public (logged-out) pages, including scripted multi-step flows.
// Usage (from the video project dir, which has puppeteer-core installed):
//   node "$CLAUDE_PLUGIN_ROOT/scripts/capture_public.mjs" build/captures.json
//
// captures.json:
// { "viewport": {"w": 1440, "h": 810, "dsf": 2},
//   "shots": [
//     {"name": "hero", "url": "https://site/page", "scrollTo": 60},
//     {"name": "wall", "url": "https://site/page", "scrollTo": ".donor-wall", "offset": -40},
//     {"name": "step1", "url": "https://site/page", "clip": ".checkout-form", "pad": 32,
//      "actions": [{"set": "input.amount", "value": "40"}, {"select": "select.period", "value": "Monthly"}]},
//     {"name": "step2", "sameAsPrevious": true, "clip": ".checkout-form",
//      "actions": [{"click": "button.next"}, {"wait": 700}, {"set": "input[name=email]", "value": "jane@example.com"}]}
//   ]}
// Values are set directly on inputs (not typed), so focus jumps during step animations can't misroute text.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';

// Resolve puppeteer-core from the video project (cwd), not from the plugin folder.
const require = createRequire(path.join(process.cwd(), 'package.json'));
const puppeteer = require('puppeteer-core');

const cfg = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = process.argv[3] || 'public/shots/';
const chrome = process.env.CHROME_PATH || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => fs.existsSync(p));
const vp = cfg.viewport || {w: 1440, h: 810, dsf: 2};
const browser = await puppeteer.launch({executablePath: chrome, headless: 'new'});
const page = await browser.newPage();
await page.setViewport({width: vp.w, height: vp.h, deviceScaleFactor: vp.dsf ?? 2});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

for (const s of cfg.shots) {
	if (!s.sameAsPrevious) await page.goto(s.url, {waitUntil: 'networkidle2'});
	for (const a of s.actions || []) {
		if (a.wait) await sleep(a.wait);
		if (a.set) await page.$eval(a.set, (e, v) => { e.value = v; e.dispatchEvent(new Event('input', {bubbles: true})); e.dispatchEvent(new Event('change', {bubbles: true})); e.blur(); }, a.value);
		if (a.select) await page.select(a.select, a.value);
		if (a.check) await page.$eval(a.check, (e) => { e.checked = true; e.dispatchEvent(new Event('change', {bubbles: true})); });
		if (a.open) await page.$eval(a.open, (e) => { e.open = true; });
		if (a.click) {
			const els = await page.$$(a.click);
			for (const el of els) if (await el.isVisible()) { await el.click(); break; }
		}
		if (a.submit) await Promise.all([page.waitForNavigation({waitUntil: 'networkidle2', timeout: 30000}).catch(() => {}), page.click(a.submit)]);
	}
	await sleep(s.wait ?? 500);
	const file = `${out}${s.name}.jpg`;
	if (s.clip) {
		const pad = s.pad ?? 32;
		const r = await page.$eval(s.clip, (e) => { const b = e.getBoundingClientRect(); return {x: b.left + scrollX, y: b.top + scrollY, w: b.width, h: b.height}; });
		await page.screenshot({path: file, type: 'jpeg', quality: 92, captureBeyondViewport: true, clip: {x: Math.max(0, r.x - pad), y: Math.max(0, r.y - pad), width: r.w + pad * 2, height: r.h + pad * 2}});
	} else {
		const y = typeof s.scrollTo === 'string' ? await page.$eval(s.scrollTo, (e) => e.getBoundingClientRect().top + scrollY) + (s.offset ?? 0) : s.scrollTo ?? 0;
		await page.evaluate((y) => scrollTo(0, y), y);
		await sleep(400);
		await page.screenshot({path: file, type: 'jpeg', quality: 92});
	}
	console.log('captured', file, 'url:', page.url());
}
await browser.close();
