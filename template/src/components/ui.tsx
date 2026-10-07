import React from 'react';
import {Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, font, hexA} from '../theme';
import {VIDEO} from '../video';
import type {IconName} from '../types';

export const ease = (f: number, start: number, len = 18) =>
	interpolate(f, [start, start + len], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: (t) => 1 - Math.pow(1 - t, 3)});

export const useSpring = (delayFrames = 0, damping = 18) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return spring({frame: frame - delayFrames, fps, config: {damping, mass: 0.8}});
};

export const Badge: React.FC<{size?: number; dark?: boolean}> = ({size = 14, dark}) =>
	VIDEO.brand.badgeLabel ? (
		<span
			style={{
				fontFamily: font,
				fontSize: size,
				fontWeight: 700,
				letterSpacing: 0.6,
				padding: `${size * 0.18}px ${size * 0.55}px`,
				borderRadius: 999,
				background: dark ? 'rgba(245,158,11,0.18)' : '#fff7e6',
				color: dark ? '#fbbf24' : '#b45309',
				border: `1px solid ${dark ? 'rgba(251,191,36,0.45)' : '#fcd9a5'}`,
				lineHeight: 1,
				display: 'inline-block',
				verticalAlign: 'middle',
			}}
		>
			{VIDEO.brand.badgeLabel}
		</span>
	) : null;

export const Logo: React.FC<{height: number; white?: boolean}> = ({height, white}) =>
	VIDEO.brand.logo ? (
		<Img src={staticFile(VIDEO.brand.logo)} style={{height, filter: white ? 'brightness(0) invert(1)' : undefined}} />
	) : (
		<span style={{fontFamily: font, fontWeight: 800, fontSize: height * 0.7, color: white ? '#fff' : C.ink, letterSpacing: -1}}>{VIDEO.brand.name}</span>
	);

export const Check: React.FC<{size?: number; color?: string}> = ({size = 22, color = C.green}) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
		<circle cx="12" cy="12" r="11" fill={color} opacity={0.16} />
		<path d="M7 12.5l3.2 3.2L17 9" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

export const Blobs: React.FC<{dark?: boolean}> = ({dark}) => {
	const f = useCurrentFrame();
	const a = Math.sin(f / 90) * 40;
	const b = Math.cos(f / 110) * 50;
	const c1 = hexA(C.accent, dark ? 0.35 : 0.1);
	const c2 = hexA(C.green, dark ? 0.22 : 0.08);
	return (
		<>
			<div style={{position: 'absolute', width: 900, height: 900, borderRadius: '50%', left: -250 + a, top: -350 + b, background: c1, filter: 'blur(120px)'}} />
			<div style={{position: 'absolute', width: 800, height: 800, borderRadius: '50%', right: -250 - b, bottom: -350 + a, background: c2, filter: 'blur(120px)'}} />
		</>
	);
};

export const Icon: React.FC<{name: IconName; size?: number; color?: string}> = ({name, size = 40, color = C.navy}) => {
	const p = {stroke: color, strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
	return (
		<svg width={size} height={size} viewBox="0 0 24 24">
			{name === 'target' && (<><circle cx="12" cy="12" r="9" {...p} /><circle cx="12" cy="12" r="5" {...p} /><circle cx="12" cy="12" r="1.5" fill={color} /></>)}
			{name === 'form' && (<><rect x="4" y="3" width="16" height="18" rx="2.5" {...p} /><path d="M8 8h8M8 12h8M8 16h5" {...p} /></>)}
			{name === 'heart' && <path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" {...p} />}
			{name === 'repeat' && (<><path d="M4 12a8 8 0 0113.7-5.7L20 8" {...p} /><path d="M20 4v4h-4" {...p} /><path d="M20 12a8 8 0 01-13.7 5.7L4 16" {...p} /><path d="M4 20v-4h4" {...p} /></>)}
			{name === 'users' && (<><circle cx="9" cy="8" r="3.5" {...p} /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" {...p} /><circle cx="17" cy="9" r="2.5" {...p} /><path d="M16 14.2c2.8.3 5 2.6 5 5.8" {...p} /></>)}
			{name === 'chart' && (<><path d="M4 20V4" {...p} /><path d="M4 20h16" {...p} /><rect x="7" y="11" width="3" height="6" rx="1" {...p} /><rect x="12" y="7" width="3" height="10" rx="1" {...p} /><rect x="17" y="13" width="3" height="4" rx="1" {...p} /></>)}
			{name === 'bolt' && <path d="M13 3L5 14h6l-1 7 8-11h-6l1-7z" {...p} />}
			{name === 'shield' && (<><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" {...p} /><path d="M9 12l2 2 4-4" {...p} /></>)}
			{name === 'layers' && (<><path d="M12 3l9 5-9 5-9-5 9-5z" {...p} /><path d="M3 13l9 5 9-5" {...p} /></>)}
			{name === 'globe' && (<><circle cx="12" cy="12" r="9" {...p} /><path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" {...p} /></>)}
		</svg>
	);
};
