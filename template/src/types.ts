export type Box = [number, number, number, number]; // x, y, w, h in source-image pixels

export type Highlight = {
	box: Box;
	label: string;
	at: number; // seconds into the scene (scaled automatically if the voiceover stretches the scene)
	zoom?: number; // camera scale while focused (1 = none). Keep 1.15–1.4 for wide tables, up to 1.7 for small buttons
	badge?: boolean; // show the brand badge (e.g. PRO) next to the label
};

export type IconName = 'target' | 'form' | 'heart' | 'repeat' | 'users' | 'chart' | 'bolt' | 'shield' | 'layers' | 'globe';

export type ShotScene = {
	kind: 'shot';
	id: string;
	src: string; // path under public/
	w: number;
	h: number;
	url: string; // shown in the fake browser bar – use a neutral domain like example.org
	chapter: string;
	title: string;
	subtitle: string;
	dur: number;
	hl: Highlight[];
	badge?: boolean;
	pan?: boolean; // tall image: scroll top -> bottom instead of zooming
};

export type StepsScene = {
	kind: 'steps';
	id: string;
	dur: number;
	eyebrow: string;
	title: string;
	subtitle: string;
	steps: {src: string; w: number; h: number; name: string; label: string; at: number}[];
};

export type Scene =
	| ShotScene
	| StepsScene
	| {kind: 'intro'; id: string; dur: number; words: string[]; accentWord?: number; subtitle: string; chips: string[]}
	| {
			kind: 'overview';
			id: string;
			dur: number;
			eyebrow: string;
			title: string;
			cards: {icon: IconName; title: string; body: string}[];
			strip?: {label: string; rows: {from: string; to: string; tabs: string[]}[]};
	  }
	| {kind: 'chapter'; id: string; num: string; title: string; tagline: string; dur: number}
	| {kind: 'outro'; id: string; dur: number; eyebrow: string; title: string; items: {text: string; badge?: boolean}[]; footer: string};

export type VideoConfig = {
	brand: {
		name: string;
		logo?: string; // public/ path; a dark/black logo is auto-inverted on dark slides
		primary: string;
		primaryDeep: string;
		accent: string;
		accentSoft: string;
		accentLight?: string; // lighter accent for dark slides
		success: string;
		badgeLabel?: string; // e.g. "PRO"
	};
	viewport: {w: number; h: number}; // capture size of admin screenshots
	transition: number; // seconds of overlap between scenes
	scenes: Scene[];
};
