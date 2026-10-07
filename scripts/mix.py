"""Final audio mix on the exact Remotion timeline: narration on top, music ducked underneath, subtle SFX.

Usage: python mix.py <project>/   ->  <project>/build/mix-raw.wav  (render.sh loudness-normalises it)
Mixing outside Remotion avoids its per-clip full-length padding, which can fill the disk.
"""
import json, os, sys, wave
import numpy as np

SR = 48000
P = sys.argv[1]
tl = json.load(open(os.path.join(P, 'build/timeline.json')))
vo = json.load(open(os.path.join(P, 'src/vo.json')))
FPS, LEAD = tl['fps'], tl['lead']
N = int(tl['total'] / FPS * SR) + SR


def load(path):
    with wave.open(path) as w:
        sr, ch, n = w.getframerate(), w.getnchannels(), w.getnframes()
        x = np.frombuffer(w.readframes(n), dtype='<i2').astype(np.float32).reshape(-1, ch) / 32768
    if ch == 1:
        x = np.repeat(x, 2, 1)
    if sr != SR:
        idx = np.arange(0, len(x) - 1, sr / SR)
        x = np.stack([np.interp(idx, np.arange(len(x)), x[:, c]) for c in range(2)], 1)
    return x


def place(bus, clip, at, gain):
    i = int(at * SR)
    if 0 <= i < len(bus):
        e = min(len(bus), i + len(clip))
        bus[i:e] += clip[:e - i] * gain


voice, fx = np.zeros((N, 2), np.float32), np.zeros((N, 2), np.float32)
A = lambda n: os.path.join(P, 'public/audio', n)
sfx = {k: load(A(f'{k}.wav')) for k in ('whoosh', 'pop', 'click', 'chime') if os.path.exists(A(f'{k}.wav'))}
s = lambda k: sfx.get(k, np.zeros((1, 2), np.float32))
spans = []
for sc in tl['scenes']:
    st = sc['start'] / FPS
    if sc['id'] in vo:
        place(voice, load(os.path.join(P, 'public/vo', f"{sc['id']}.wav")), st + LEAD, 1.0)
        spans.append((st + LEAD, st + LEAD + vo[sc['id']]))
    k = sc['kind']
    if k == 'chapter': place(fx, s('whoosh'), st - 0.2, 0.16)
    elif k == 'intro': place(fx, s('chime'), 0.13, 0.14)
    elif k == 'outro': place(fx, s('whoosh'), st + 0.07, 0.12)
    elif k == 'steps':
        for t in sc['steps']: place(fx, s('click'), st + t, 0.10)
    elif k == 'shot':
        for t in sc['hl']: place(fx, s('pop'), st + t, 0.05)

music = load(A('music.wav'))[:N]
music = np.pad(music, ((0, N - len(music)), (0, 0)))
t = np.arange(N) / SR
env = np.full(N, 0.17 if spans else 0.35, np.float32)  # no narration -> music carries the video
for a, b in spans:
    env[max(0, int((a - 0.33) * SR)):int((b + 0.4) * SR)] = 0.075
win = int(0.55 * SR)
env = np.convolve(env, np.ones(win) / win, mode='same')
env *= np.clip(t / 1.0, 0, 1) * np.clip((tl['total'] / FPS - t) / 2.5, 0, 1)
mix = (voice + music * env[:, None] + fx)[:int(tl['total'] / FPS * SR)]
pk = np.abs(mix).max()
if pk > 0.98:
    mix *= 0.98 / pk
with wave.open(os.path.join(P, 'build/mix-raw.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype('<i2').tobytes())
print(f'mixed {len(mix) / SR:.1f}s, {len(spans)} narration lines')
