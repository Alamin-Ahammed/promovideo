import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FRAME, VIEW, font, hexA} from '../theme';
import type {Box, ShotScene} from '../types';
import {Blobs, Badge, ease} from './ui';

type Cam = {cx: number; cy: number; z: number};

// Camera in source-image pixels. z is relative to the fit-to-width scale.
const useCamera = (s: ShotScene): Cam & {s0: number} => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const s0 = VIEW.w / s.w;
	const halfH0 = VIEW.h / 2 / s0;
	const tall = s.h * s0 > VIEW.h + 1;

	const clamp = (c: Cam): Cam => {
		const hw = VIEW.w / (2 * s0 * c.z);
		const hh = VIEW.h / (2 * s0 * c.z);
		return {
			z: c.z,
			cx: Math.min(Math.max(c.cx, hw), s.w - hw),
			cy: s.h <= 2 * hh ? s.h / 2 : Math.min(Math.max(c.cy, hh), s.h - hh),
		};
	};

	const overview = (time: number): Cam => {
		if (!tall) return clamp({cx: s.w / 2, cy: s.h / 2, z: 1});
		const top = halfH0;
		const bottom = s.h - halfH0;
		const p = s.pan ? interpolate(time, [0.3, s.dur - 0.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)}) : 0;
		return clamp({cx: s.w / 2, cy: top + (bottom - top) * p, z: 1});
	};
	const focus = (b: Box, z: number): Cam => clamp({cx: b[0] + b[2] / 2, cy: b[1] + b[3] / 2, z});

	// Keyframes: overview -> each highlight -> overview near the end.
	type K = {at: number; cam: (time: number) => Cam};
	const keys: K[] = [{at: 0, cam: overview}];
	if (!s.pan) {
		s.hl.forEach((h) => {
			const c = focus(h.box, h.zoom ?? 1.3);
			keys.push({at: h.at - 0.25, cam: () => c});
		});
		keys.push({at: s.dur - 1.4, cam: overview});
	}

	let i = 0;
	while (i + 1 < keys.length && t >= keys[i + 1].at) i++;
	const cur = keys[i].cam(t);
	const prev = i > 0 ? keys[i - 1].cam(t) : cur;
	const p = interpolate(t, [keys[i].at, keys[i].at + 0.9], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
	const drift = 1 + 0.015 * Math.sin(t / 2);
	return {cx: prev.cx + (cur.cx - prev.cx) * p, cy: prev.cy + (cur.cy - prev.cy) * p, z: (prev.z + (cur.z - prev.z) * p) * drift, s0};
};

export const BrowserChrome: React.FC<{url: string; width: number}> = ({url, width}) => (
	<div style={{height: FRAME.chrome, width, background: '#eef1f6', borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8, boxSizing: 'border-box'}}>
		{['#ff5f57', '#febc2e', '#28c840'].map((c) => (
			<div key={c} style={{width: 12, height: 12, borderRadius: 6, background: c}} />
		))}
		<div style={{marginLeft: 18, flex: 1, maxWidth: 640, height: 28, borderRadius: 8, background: '#fff', border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', fontFamily: font, fontSize: 14, color: C.muted}}>
			<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="10" rx="2" stroke={C.muted} strokeWidth="2" /><path d="M8 11V8a4 4 0 018 0v3" stroke={C.muted} strokeWidth="2" /></svg>
			<span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{url}</span>
		</div>
	</div>
);

export const SidePanel: React.FC<{eyebrow: string; title: string; subtitle: string; badge?: boolean; items: {label: string; at: number; badge?: boolean}[]}> = ({eyebrow, title, subtitle, badge, items}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const active = items.reduce((acc, it, idx) => (t >= it.at ? idx : acc), -1);
	const a = ease(frame, 4);
	const b = ease(frame, 10);
	return (
		<div style={{position: 'absolute', left: 80, top: FRAME.y + 8, width: 420, fontFamily: font}}>
			<div style={{opacity: a, transform: `translateY(${(1 - a) * 14}px)`, display: 'flex', alignItems: 'center', gap: 10}}>
				<span style={{fontSize: 16, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: C.accent}}>{eyebrow}</span>
				{badge && <Badge />}
			</div>
			<div style={{opacity: b, transform: `translateY(${(1 - b) * 18}px)`, fontSize: 46, lineHeight: 1.1, fontWeight: 800, color: C.ink, marginTop: 14, letterSpacing: -1}}>{title}</div>
			<div style={{opacity: ease(frame, 16), fontSize: 21, lineHeight: 1.5, color: C.muted, marginTop: 18}}>{subtitle}</div>
			<div style={{marginTop: 34, display: 'flex', flexDirection: 'column', gap: 12}}>
				{items.map((it, idx) => {
					const s = ease(frame, it.at * fps - 6, 14);
					const on = idx === active;
					return (
						<div key={it.label} style={{opacity: s * (on ? 1 : 0.62), transform: `translateX(${(1 - s) * -20}px)`, display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 14, background: on ? C.white : 'transparent', boxShadow: on ? '0 10px 30px rgba(15,23,42,0.08)' : 'none', border: `1px solid ${on ? C.line : 'transparent'}`}}>
							<div style={{width: 30, height: 30, borderRadius: 15, flexShrink: 0, background: on ? C.navy : '#dfe4f2', color: on ? '#fff' : C.navy, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{idx + 1}</div>
							<div style={{fontSize: 20, fontWeight: 600, color: C.ink, lineHeight: 1.3}}>{it.label}</div>
							{it.badge && <Badge size={12} />}
						</div>
					);
				})}
			</div>
		</div>
	);
};

export const Shot: React.FC<{s: ShotScene}> = ({s}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const cam = useCamera(s);
	const scale = cam.s0 * cam.z;
	const tx = VIEW.w / 2 - cam.cx * scale;
	const ty = VIEW.h / 2 - cam.cy * scale;
	const enter = ease(frame, 0, 22);
	const active = s.hl.reduce((acc, h, idx) => (t >= h.at ? idx : acc), -1);
	const endFade = interpolate(t, [s.dur - 1.6, s.dur - 1.0], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

	return (
		<AbsoluteFill style={{background: C.bg}}>
			<Blobs />
			<SidePanel eyebrow={s.chapter} title={s.title} subtitle={s.subtitle} badge={s.badge} items={s.hl} />
			<div style={{position: 'absolute', left: FRAME.x, top: FRAME.y, width: VIEW.w, borderRadius: 16, overflow: 'hidden', background: '#fff', boxShadow: '0 40px 90px rgba(15,23,42,0.18), 0 0 0 1px rgba(15,23,42,0.06)', opacity: enter, transform: `translateY(${(1 - enter) * 30}px) scale(${0.97 + 0.03 * enter})`}}>
				<BrowserChrome url={s.url} width={VIEW.w} />
				<div style={{position: 'relative', width: VIEW.w, height: VIEW.h, overflow: 'hidden', background: '#fff'}}>
					<div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${scale})`, width: s.w, height: s.h}}>
						<Img src={staticFile(s.src)} style={{width: s.w, height: s.h, display: 'block'}} />
						{s.hl.map((h, idx) => {
							const on = idx === active;
							const appear = ease(frame, h.at * fps, 12);
							const o = on ? appear * endFade : 0;
							const bw = 3 / scale;
							const pad = 6 / scale;
							return (
								<div key={idx} style={{position: 'absolute', left: h.box[0] - pad, top: h.box[1] - pad, width: h.box[2] + pad * 2, height: h.box[3] + pad * 2, borderRadius: 10 / scale, border: `${bw}px solid ${C.accent}`, boxShadow: `0 0 0 ${4000}px rgba(15,22,56,${0.28 * o}), 0 0 ${24 / scale}px ${hexA(C.accent, 0.6)}`, opacity: o, transform: `scale(${1.04 - 0.04 * appear})`}} />
							);
						})}
					</div>
					{s.hl.map((h, idx) => {
						if (idx !== active) return null;
						const appear = ease(frame, h.at * fps + 4, 12);
						// Pill position in screen space, above the box (or below when near the top).
						const sx = tx + h.box[0] * scale;
						const syTop = ty + h.box[1] * scale;
						const syBot = ty + (h.box[1] + h.box[3]) * scale;
						const above = syTop > 70;
						const left = Math.min(Math.max(sx - 6, 16), VIEW.w - 420);
						const top = above ? syTop - 58 : Math.min(syBot + 14, VIEW.h - 56);
						return (
							<div key={'p' + idx} style={{position: 'absolute', left, top, opacity: appear * endFade, transform: `translateY(${(1 - appear) * 8}px)`, display: 'flex', alignItems: 'center', gap: 10, background: C.navy, color: '#fff', fontFamily: font, fontSize: 19, fontWeight: 600, padding: '10px 16px', borderRadius: 12, boxShadow: '0 12px 30px rgba(15,22,56,0.35)', whiteSpace: 'nowrap'}}>
								<span style={{width: 24, height: 24, borderRadius: 12, background: 'rgba(255,255,255,0.18)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13}}>{idx + 1}</span>
								{h.label}
								{h.badge && <Badge size={11} dark />}
							</div>
						);
					})}
				</div>
			</div>
		</AbsoluteFill>
	);
};
