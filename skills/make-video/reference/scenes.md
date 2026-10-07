# Writing `src/video.ts`

The video is a list of scenes plus brand settings. Types live in `src/types.ts`; the sample in
`src/video.ts` renders as-is.

## Brand

```ts
brand: {
  name: 'WPSmartPay',
  logo: 'brand/logo-dark.png',   // black/dark logo; auto-inverted to white on dark slides. Omit to show the name as text.
  primary: '#1f2b66', primaryDeep: '#0f1638', accent: '#4f6bff', accentSoft: '#eef1ff', success: '#22c55e',
  badgeLabel: 'PRO',             // label for paid-tier highlights; omit if not needed
},
viewport: {w: 1512, h: 793},    // size of your admin screenshots (aspect ratio of the browser frame)
transition: 0.5,
```

Take colours from the product's CSS or logo.

## Scene types

| kind | use for | key fields |
|---|---|---|
| `intro` | title card | `words[]` (big title, one word per item), `accentWord` (index to colour), `subtitle`, `chips[]` |
| `overview` | "what's new" | `eyebrow`, `title`, `cards[]` (2–4: `icon`, `title`, `body`), optional `strip` (renamed menus: `from → to` + tab pills) |
| `chapter` | section divider (2 s) | `num` ('01'), `title`, `tagline` |
| `shot` | one screenshot with highlights | `src`, `w`, `h`, `url`, `chapter`, `title`, `subtitle`, `hl[]`, optional `badge`, `pan` |
| `steps` | multi-step flows (checkout, wizard) | `steps[]` of `{src,w,h,name,label,at}` – one large card at a time |
| `outro` | recap | `items[]` (6–8, `badge?`), `footer` |

Icons: `target form heart repeat users chart bolt shield layers globe`.

## Highlights (`hl`)

```ts
{box: [x, y, w, h], label: 'Live goal progress', at: 1.2, zoom: 1.3, badge: false}
```

- `box` is in **source-image pixels**. Read coordinates from the screenshot you viewed (the Read tool shows images at native size for
  1512-wide captures; for 2× public captures multiply displayed coordinates by the stated scale factor).
- `at` = seconds into the scene; leave ~1.8 s between highlights. They scale automatically when narration stretches the scene.
- The camera eases to each box, dims everything else, and shows a numbered label pill. The left panel lists the same labels.
- `zoom`: 1.15–1.3 for columns of a wide table, 1.3–1.5 for cards, 1.5–1.7 for small buttons/tabs.
- `pan: true` for tall screenshots (receipts, long forms): the camera scrolls top→bottom; time highlights to the scroll.

## Timing

Default scene lengths: intro 5.5 s, overview 8–9.5 s, chapter 2 s, shot 5.5–7.5 s, steps 9–10 s, outro 8–9 s.
With narration, each scene becomes `max(dur, line + ~1.55 s)`.

**Hard length limit (e.g. "30 s max"):** set base `dur` values low (shots 5–5.5 s, intro 4 s, outro 5 s) so narration decides
the length, keep every highlight `at` ≤ `dur − 2.2` (highlights fade and the camera zooms out in the last ~1.6 s), then check
`build/timeline.json` (`total / fps`) after `npm run timeline`. If still over, shorten the narration lines – never speed up audio.

## Checking your work

```bash
npx tsc --noEmit -p .
npm run timeline && python3 -c "import json;t=json.load(open('build/timeline.json'));[print(s['id'], s['start']) for s in t['scenes']]"
npx remotion still PromoVideo build/check.png --frame=<start + 45>
```

View the stills. Typical fixes: label pill covering the thing it explains (move/shrink the box), zoom cropping row names,
tiny unreadable text (crop the source image or use a `steps` card), screenshot with a visible cursor (re-capture).
