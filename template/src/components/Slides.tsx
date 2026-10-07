import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FRAME, font, hexA} from '../theme';
import type {Scene, StepsScene} from '../types';
import {Badge, Blobs, Check, Icon, Logo, ease, useSpring} from './ui';
import {SidePanel} from './Shot';

const darkBg = () => `radial-gradient(1200px 700px at 30% 20%, ${C.navy} 0%, ${C.navyDeep} 60%)`;

type Of<K extends Scene['kind']> = Extract<Scene, {kind: K}>;

export const Intro: React.FC<{s: Of<'intro'>}> = ({s}) => {
	const frame = useCurrentFrame();
	const logo = useSpring(4, 16);
	return (
		<AbsoluteFill style={{background: darkBg(), fontFamily: font, alignItems: 'center', justifyContent: 'center'}}>
			<Blobs dark />
			<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
				<div style={{transform: `scale(${0.85 + 0.15 * logo})`, opacity: logo}}>
					<Logo height={64} white />
				</div>
				<div style={{marginTop: 46, display: 'flex', gap: 26, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 1700}}>
					{s.words.map((w, i) => {
						const p = ease(frame, 22 + i * 7, 20);
						return (
							<span key={w + i} style={{fontSize: 108, fontWeight: 800, letterSpacing: -3, color: i === s.accentWord ? C.accentLight : '#fff', opacity: p, transform: `translateY(${(1 - p) * 40}px)`, display: 'inline-block'}}>{w}</span>
						);
					})}
				</div>
				<div style={{marginTop: 22, fontSize: 32, color: 'rgba(255,255,255,0.75)', opacity: ease(frame, 50, 20)}}>{s.subtitle}</div>
				<div style={{marginTop: 40, display: 'flex', gap: 14, opacity: ease(frame, 66, 20)}}>
					{s.chips.map((x) => (
						<span key={x} style={{fontSize: 20, color: '#fff', padding: '10px 20px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.06)'}}>{x}</span>
					))}
				</div>
			</div>
		</AbsoluteFill>
	);
};

const Card: React.FC<{c: Of<'overview'>['cards'][number]; delay: number; width: number}> = ({c, delay, width}) => {
	const p = useSpring(delay, 16);
	return (
		<div style={{width, padding: 30, borderRadius: 22, background: '#fff', boxShadow: '0 20px 50px rgba(15,23,42,0.08)', border: `1px solid ${C.line}`, opacity: p, transform: `translateY(${(1 - p) * 40}px)`, boxSizing: 'border-box'}}>
			<div style={{width: 64, height: 64, borderRadius: 16, background: C.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
				<Icon name={c.icon} size={36} />
			</div>
			<div style={{fontSize: 28, fontWeight: 700, color: C.ink, marginTop: 22}}>{c.title}</div>
			<div style={{fontSize: 19, color: C.muted, marginTop: 10, lineHeight: 1.5}}>{c.body}</div>
		</div>
	);
};

export const Overview: React.FC<{s: Of<'overview'>}> = ({s}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const n = s.cards.length;
	const width = (1680 - 30 * (n - 1)) / n;
	const stripAt = Math.round(fps * 4);
	return (
		<AbsoluteFill style={{background: C.bg, fontFamily: font}}>
			<Blobs />
			<div style={{position: 'absolute', left: 120, top: 92, right: 120}}>
				<div style={{fontSize: 18, fontWeight: 700, letterSpacing: 2, color: C.accent, opacity: ease(frame, 2)}}>{s.eyebrow}</div>
				<div style={{fontSize: 60, fontWeight: 800, letterSpacing: -1.5, color: C.ink, marginTop: 8, opacity: ease(frame, 6)}}>{s.title}</div>
			</div>
			<div style={{position: 'absolute', left: 120, top: 270, display: 'flex', gap: 30}}>
				{s.cards.map((c, i) => <Card key={c.title} c={c} delay={14 + i * 8} width={width} />)}
			</div>
			{s.strip && (
				<div style={{position: 'absolute', left: 120, top: 640, right: 120, padding: '34px 40px', borderRadius: 22, background: '#fff', border: `1px solid ${C.line}`, opacity: ease(frame, stripAt, 16)}}>
					<div style={{fontSize: 17, fontWeight: 700, letterSpacing: 2, color: C.muted, marginBottom: 22}}>{s.strip.label}</div>
					<div style={{display: 'flex', flexDirection: 'column', gap: 18}}>
						{s.strip.rows.map((r, i) => {
							const p = ease(frame, stripAt + 12 + i * 12, 16);
							return (
								<div key={r.to + i} style={{display: 'flex', alignItems: 'center', gap: 14, opacity: p, transform: `translateX(${(1 - p) * -20}px)`}}>
									<span style={{fontSize: 21, color: C.muted, textDecoration: r.from === r.to ? 'none' : 'line-through', minWidth: 140, textAlign: 'right'}}>{r.from}</span>
									<span style={{fontSize: 22, color: C.accent}}>→</span>
									<span style={{fontSize: 23, fontWeight: 700, color: C.ink, minWidth: 160}}>{r.to}</span>
									<div style={{display: 'flex', gap: 8}}>
										{r.tabs.map((t, j) => (
											<span key={t} style={{fontSize: 17, fontWeight: 600, padding: '6px 14px', borderRadius: 999, background: j === r.tabs.length - 1 ? C.navy : '#eef1f6', color: j === r.tabs.length - 1 ? '#fff' : C.ink}}>{t}</span>
										))}
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</AbsoluteFill>
	);
};

export const Chapter: React.FC<{s: Of<'chapter'>}> = ({s}) => {
	const frame = useCurrentFrame();
	const p = useSpring(0, 20);
	const line = ease(frame, 6, 24);
	return (
		<AbsoluteFill style={{background: darkBg(), fontFamily: font, justifyContent: 'center', paddingLeft: 180}}>
			<Blobs dark />
			<div style={{fontSize: 220, fontWeight: 800, color: 'transparent', WebkitTextStroke: `2px ${hexA(C.accentLight, 0.55)}`, position: 'absolute', right: 160, top: 300, opacity: p, transform: `translateX(${(1 - p) * 60}px)`}}>{s.num}</div>
			<div style={{width: 120 * line, height: 5, borderRadius: 3, background: C.green}} />
			<div style={{fontSize: 96, fontWeight: 800, color: '#fff', letterSpacing: -2.5, marginTop: 26, opacity: p, transform: `translateY(${(1 - p) * 30}px)`}}>{s.title}</div>
			<div style={{fontSize: 32, color: 'rgba(255,255,255,0.72)', marginTop: 14, opacity: ease(frame, 10)}}>{s.tagline}</div>
		</AbsoluteFill>
	);
};

// One large step at a time with a 1 → 2 → 3 progress header.
export const Steps: React.FC<{s: StepsScene; k?: number}> = ({s, k = 1}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps / k;
	const cur = s.steps.reduce((acc, st, i) => (t >= st.at ? i : acc), 0);
	return (
		<AbsoluteFill style={{background: C.bg, fontFamily: font}}>
			<Blobs />
			<SidePanel eyebrow={s.eyebrow} title={s.title} subtitle={s.subtitle} items={s.steps.map((x) => ({label: x.label, at: x.at * k}))} />
			<div style={{position: 'absolute', left: FRAME.x, top: FRAME.y - 20, width: FRAME.w, display: 'flex', alignItems: 'center', gap: 16, opacity: ease(frame, 0, 14)}}>
				{s.steps.map((st, i) => {
					const done = i < cur;
					const on = i === cur;
					return (
						<React.Fragment key={st.src}>
							<div style={{display: 'flex', alignItems: 'center', gap: 12}}>
								<span style={{width: 40, height: 40, borderRadius: 20, background: on || done ? C.navy : '#dfe4f2', color: on || done ? '#fff' : C.navy, fontWeight: 700, fontSize: 19, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: on ? `0 0 0 6px ${hexA(C.accent, 0.18)}` : 'none'}}>{done ? '✓' : i + 1}</span>
								<span style={{fontSize: 22, fontWeight: 700, color: on ? C.ink : C.muted}}>{st.name}</span>
							</div>
							{i < s.steps.length - 1 && <div style={{flex: 1, height: 3, borderRadius: 2, background: done ? C.navy : '#dfe4f2'}} />}
						</React.Fragment>
					);
				})}
			</div>
			{s.steps.map((st, i) => {
				const inP = ease(frame, st.at * k * fps, 16);
				const next = s.steps[i + 1];
				const outP = next ? ease(frame, next.at * k * fps - 4, 14) : 0;
				const o = inP * (1 - outP);
				if (o <= 0.001) return null;
				const w = Math.min(1100, (770 * st.w) / st.h);
				const h = (st.h / st.w) * w;
				return (
					<div key={st.src} style={{position: 'absolute', left: FRAME.x + (FRAME.w - w - 40) / 2 + (1 - inP) * 80 - outP * 80, top: FRAME.y + 50, width: w + 40, opacity: o}}>
						<div style={{padding: 20, borderRadius: 22, background: '#fff', boxShadow: '0 40px 90px rgba(31,43,102,0.18), 0 0 0 1px rgba(15,23,42,0.06)'}}>
							<Img src={staticFile(st.src)} style={{width: w, height: h, display: 'block'}} />
						</div>
					</div>
				);
			})}
		</AbsoluteFill>
	);
};

export const Outro: React.FC<{s: Of<'outro'>}> = ({s}) => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	const out = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});
	return (
		<AbsoluteFill style={{background: darkBg(), fontFamily: font, opacity: out}}>
			<Blobs dark />
			<div style={{position: 'absolute', left: 140, top: 110}}>
				<div style={{fontSize: 18, fontWeight: 700, letterSpacing: 2, color: C.accentLight, opacity: ease(frame, 2)}}>{s.eyebrow}</div>
				<div style={{fontSize: 64, fontWeight: 800, color: '#fff', letterSpacing: -1.5, marginTop: 10, opacity: ease(frame, 6)}}>{s.title}</div>
			</div>
			<div style={{position: 'absolute', left: 140, top: 300, width: 1640, display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 60, rowGap: 26}}>
				{s.items.map((it, i) => {
					const p = ease(frame, 14 + i * 6, 14);
					return (
						<div key={it.text} style={{display: 'flex', alignItems: 'center', gap: 16, opacity: p, transform: `translateY(${(1 - p) * 16}px)`}}>
							<Check size={34} color="#4ade80" />
							<span style={{fontSize: 27, color: '#fff', fontWeight: 500}}>{it.text}</span>
							{it.badge && <Badge size={14} dark />}
						</div>
					);
				})}
			</div>
			<div style={{position: 'absolute', left: 140, right: 140, bottom: 110, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: ease(frame, 80, 20)}}>
				<Logo height={52} white />
				<div style={{fontSize: 26, color: 'rgba(255,255,255,0.8)'}}>{s.footer}</div>
			</div>
		</AbsoluteFill>
	);
};
