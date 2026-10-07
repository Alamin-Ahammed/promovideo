import React from 'react';
import {Audio, Composition, Sequence, getStaticFiles, staticFile} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';
import {FPS, H, W} from './theme';
import {VIDEO} from './video';
import type {Scene} from './types';
import {Shot} from './components/Shot';
import {Chapter, Intro, Outro, Overview, Steps} from './components/Slides';
import VO from './vo.json';

const vo = VO as Record<string, number>; // scene id -> voiceover clip length in seconds
const T = Math.round(VIDEO.transition * FPS);
export const LEAD = 0.45; // voice starts this long after a scene begins
const TAIL = 0.6; // breathing room after the line ends

// Stretch scenes so every narration line fits; highlight/step timings scale with the scene.
const last = VIDEO.scenes.length - 1;
const timed: (Scene & {k: number})[] = VIDEO.scenes.map((s, i) => {
	// Non-chapter scenes also need room for the outgoing transition (except the last scene).
	const need = vo[s.id] ? vo[s.id] + LEAD + TAIL + (s.kind === 'chapter' || i === last ? 0 : VIDEO.transition) : 0;
	const dur = Math.max(s.dur, need);
	const k = dur / s.dur;
	if (s.kind === 'shot') return {...s, dur, k, hl: s.hl.map((h) => ({...h, at: h.at * k}))};
	return {...s, dur, k};
});

const frames = (s: {dur: number}) => Math.round(s.dur * FPS);
const starts = timed.reduce<number[]>((acc, s, i) => [...acc, i === 0 ? 0 : acc[i - 1] + frames(timed[i - 1]) - T], []);
export const TOTAL = starts[starts.length - 1] + frames(timed[timed.length - 1]);

// Consumed by scripts/mix.py so the final audio mix uses exactly these timings.
export const TIMELINE = timed.map((s, i) => ({
	id: s.id,
	kind: s.kind,
	start: starts[i],
	dur: s.dur,
	k: s.k,
	hl: s.kind === 'shot' ? s.hl.map((h) => h.at) : [],
	steps: s.kind === 'steps' ? s.steps.map((x) => x.at * s.k) : [],
}));

const render = (s: Scene & {k: number}) => {
	switch (s.kind) {
		case 'intro': return <Intro s={s} />;
		case 'overview': return <Overview s={s} />;
		case 'chapter': return <Chapter s={s} />;
		case 'steps': return <Steps s={s} k={s.k} />;
		case 'outro': return <Outro s={s} />;
		default: return <Shot s={s} />;
	}
};

const has = (p: string) => getStaticFiles().some((f) => f.name === p);

// Preview audio only (Studio). Final renders are muted and mixed by scripts/mix.py,
// because Remotion pads every clip to full length and can exhaust disk space.
const PreviewAudio: React.FC = () => (
	<>
		{has('audio/music.wav') && <Audio src={staticFile('audio/music.wav')} volume={0.12} />}
		{timed.map((s, i) =>
			vo[s.id] && has(`vo/${s.id}.wav`) ? (
				<Sequence key={s.id} from={Math.round(starts[i] + LEAD * FPS)} durationInFrames={Math.ceil((vo[s.id] + 0.5) * FPS)} layout="none">
					<Audio src={staticFile(`vo/${s.id}.wav`)} />
				</Sequence>
			) : null,
		)}
	</>
);

const Video: React.FC = () => (
	<>
		<TransitionSeries>
			{timed.map((s, i) => {
				const next = timed[i + 1];
				const useSlide = next && (next.kind === 'chapter' || s.kind === 'chapter');
				return (
					<React.Fragment key={s.id}>
						<TransitionSeries.Sequence durationInFrames={frames(s)}>{render(s)}</TransitionSeries.Sequence>
						{next && <TransitionSeries.Transition presentation={useSlide ? slide({direction: 'from-right'}) : fade()} timing={linearTiming({durationInFrames: T})} />}
					</React.Fragment>
				);
			})}
		</TransitionSeries>
		<PreviewAudio />
	</>
);

export const RemotionRoot: React.FC = () => (
	<Composition
		id="PromoVideo"
		component={Video}
		durationInFrames={TOTAL}
		fps={FPS}
		width={W}
		height={H}
		calculateMetadata={() => {
			console.log('TIMELINE' + JSON.stringify({total: TOTAL, fps: FPS, lead: LEAD, scenes: TIMELINE}));
			return {};
		}}
	/>
);
