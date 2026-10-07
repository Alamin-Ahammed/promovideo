"""Split ONE long narration recording into per-line clips, cutting only inside pauses.

Usage: python split_vo.py narration.wav build/script.json vo-raw/
Use this when the user records/generates the whole script as a single file.
Word timestamps only locate each sentence; cuts are placed in the middle of detected silences,
so no syllable is ever clipped. Every cut is verified to sit in silence.
"""
import difflib, json, os, re, subprocess, sys, wave
import numpy as np

SR = 48000
norm = lambda w: re.sub(r'[^a-z0-9]', '', w.lower())


def words_of(path):
    try:
        import mlx_whisper
        r = mlx_whisper.transcribe(path, path_or_hf_repo=f"mlx-community/whisper-{os.environ.get('PROMOVIDEO_WHISPER', 'small.en')}-mlx", word_timestamps=True)
        return [(w['word'].strip(), w['start'], w['end']) for s in r['segments'] for w in s['words']]
    except ImportError:
        from faster_whisper import WhisperModel
        segs, _ = WhisperModel(os.environ.get('PROMOVIDEO_WHISPER', 'small.en'), compute_type='int8').transcribe(path, word_timestamps=True)
        return [(w.word.strip(), w.start, w.end) for s in segs for w in s.words]


def silences(path):
    log = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'silencedetect=noise=-42dB:d=0.12', '-f', 'null', '-'], capture_output=True, text=True).stderr
    st = [float(m) for m in re.findall(r'silence_start: ([\d.]+)', log)]
    en = [float(m) for m in re.findall(r'silence_end: ([\d.]+)', log)]
    return list(zip(st, en))


def main():
    src, cfg, out = sys.argv[1], json.load(open(sys.argv[2])), sys.argv[3]
    lines = [(l['id'], l['text']) for l in cfg['lines']]
    words, gaps = words_of(src), silences(src)
    spoken = [norm(w[0]) for w in words]
    script, owner = [], []
    for li, (_, t) in enumerate(lines):
        for w in t.split():
            if norm(w):
                script.append(norm(w)); owner.append(li)
    s2w = {}
    for a, b, n in difflib.SequenceMatcher(None, script, spoken, autojunk=False).get_matching_blocks():
        for k in range(n):
            s2w[a + k] = b + k
    cuts = [0.0]
    for li in range(1, len(lines)):
        idx = [s2w[i] for i, o in enumerate(owner) if o == li and i in s2w]
        w0 = min(idx)
        start, prev_end = words[w0][1], words[w0 - 1][2]
        cand = [g for g in gaps if g[1] <= start + 0.25 and g[0] >= prev_end - 0.25] or [min(gaps, key=lambda g: abs(g[1] - start))]
        g = max(cand, key=lambda g: g[1] - g[0])
        cuts.append((g[0] + g[1]) / 2)
    tmp = os.path.join(out, '_master.wav')
    os.makedirs(out, exist_ok=True)
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', src, '-ar', str(SR), '-ac', '1', tmp], check=True)
    with wave.open(tmp) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2')
    os.remove(tmp)
    cuts.append(len(x) / SR)
    for c in cuts[1:-1]:
        assert any(g[0] - 0.01 <= c <= g[1] + 0.01 for g in gaps), f'cut at {c:.2f}s is not in a pause'
    for li, (lid, _) in enumerate(lines):
        seg = x[int(cuts[li] * SR):int(cuts[li + 1] * SR)]
        with wave.open(os.path.join(out, f'{lid}.wav'), 'wb') as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(seg.tobytes())
        heard = ' '.join(w[0] for w in words if cuts[li] <= (w[1] + w[2]) / 2 < cuts[li + 1])
        print(f'  {lid:22s} {cuts[li]:7.2f}-{cuts[li + 1]:7.2f} | {heard[:90]}')


if __name__ == '__main__':
    main()
