import type {VideoConfig} from './types';

// The whole video is described here. /promovideo:make-video rewrites this file for each project.
// This sample renders out of the box so you can preview the style with `npm run studio`.
export const VIDEO: VideoConfig = {
	brand: {
		name: 'Acme',
		logo: undefined,
		primary: '#1f2b66',
		primaryDeep: '#0f1638',
		accent: '#4f6bff',
		accentSoft: '#eef1ff',
		success: '#22c55e',
		badgeLabel: 'PRO',
	},
	viewport: {w: 1512, h: 793},
	transition: 0.5,
	scenes: [
		{kind: 'intro', id: 'intro', dur: 5.5, words: ['Introducing', 'Smart', 'Reports'], accentWord: 1, subtitle: 'Insights, built right into Acme.', chips: ['Dashboards', 'Exports', 'Alerts']},
		{
			kind: 'overview', id: 'overview', dur: 8, eyebrow: 'WHAT’S NEW', title: 'Everything you need to understand your data',
			cards: [
				{icon: 'chart', title: 'Dashboards', body: 'Live charts for every metric that matters.'},
				{icon: 'bolt', title: 'Alerts', body: 'Get notified the moment numbers move.'},
				{icon: 'layers', title: 'Exports', body: 'CSV and PDF in one click.'},
				{icon: 'shield', title: 'Permissions', body: 'Share safely with your whole team.'},
			],
		},
		{kind: 'chapter', id: 'ch1', num: '01', title: 'Dashboards', tagline: 'See everything at a glance', dur: 2},
		{
			kind: 'shot', id: 'sample-shot', src: 'shots/sample.jpg', w: 1512, h: 793, url: 'example.org/app/dashboard',
			chapter: 'Dashboards', title: 'A dashboard for every team', subtitle: 'Pick metrics, set the period, done.', dur: 6.5,
			hl: [
				{box: [80, 120, 1352, 150], label: 'Key numbers', at: 1.0, zoom: 1.3},
				{box: [80, 300, 860, 430], label: 'Trend chart', at: 3.2, zoom: 1.25, badge: true},
			],
		},
		{kind: 'outro', id: 'outro', dur: 7, eyebrow: 'RECAP', title: 'Smart Reports', items: [{text: 'Live dashboards'}, {text: 'Instant alerts', badge: true}, {text: 'One-click exports'}, {text: 'Team permissions'}], footer: 'acme.example'},
	],
};
