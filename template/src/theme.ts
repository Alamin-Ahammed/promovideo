import {loadFont} from '@remotion/google-fonts/Inter';
import {VIDEO} from './video';

const {fontFamily} = loadFont('normal', {weights: ['400', '500', '600', '700', '800'], subsets: ['latin']});

export const FPS = 30;
export const W = 1920;
export const H = 1080;
export const font = fontFamily;

// '#ff4d00' + alpha -> 'rgba(255,77,0,a)'
export const hexA = (hex: string, a: number) => {
	const h = hex.replace('#', '');
	const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
	return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

const b = VIDEO.brand;
export const C = {
	navy: b.primary,
	navyDeep: b.primaryDeep,
	ink: '#0f172a',
	muted: '#64748b',
	line: '#e2e8f0',
	bg: '#f5f7fb',
	green: b.success,
	accent: b.accent,
	accentSoft: b.accentSoft,
	accentLight: b.accentLight ?? '#8ea2ff', // accent readable on dark slides
	white: '#ffffff',
};

// Screen layout: text panel on the left, browser frame on the right.
export const FRAME = {x: 560, y: 150, w: 1300, chrome: 44};
// Screenshots are shown through a viewport with the capture's aspect ratio (default 1512x793).
export const VIEW = {w: FRAME.w, h: Math.round(FRAME.w * (VIDEO.viewport.h / VIDEO.viewport.w))};
