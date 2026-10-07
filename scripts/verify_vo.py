"""Check that every narration clip says its whole line – no dropped or garbled words.

Usage: python verify_vo.py build/script.json vo-raw/
Prints a table and exits 1 if any line needs regenerating (ids are listed on the last line as REGENERATE: ...).
Uses mlx-whisper on Apple Silicon, otherwise faster-whisper. Brand names and numbers may be spelled
differently by the recogniser; those are tolerated, real omissions are not.
"""
import difflib, json, os, re, sys

WORDS = {'0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine', '10': 'ten', '100': 'hundred'}


def norm(text):
    text = text.lower().replace('%', ' percent').replace('-', ' ')
    toks = [re.sub(r'[^a-z0-9]', '', t) for t in text.split()]
    return [WORDS.get(t, t) for t in toks if t]


def transcriber():
    try:
        import mlx_whisper
        return lambda p: mlx_whisper.transcribe(p, path_or_hf_repo=f"mlx-community/whisper-{os.environ.get('PROMOVIDEO_WHISPER', 'small.en')}-mlx")['text']
    except ImportError:
        pass
    try:
        from faster_whisper import WhisperModel
        m = WhisperModel(os.environ.get('PROMOVIDEO_WHISPER', 'small.en'), compute_type='int8')
        return lambda p: ' '.join(s.text for s in m.transcribe(p)[0])
    except ImportError:
        sys.exit('No transcriber installed (mlx-whisper or faster-whisper). Run scripts/setup_python.sh.')


def main():
    cfg = json.load(open(sys.argv[1]))
    folder = sys.argv[2]
    tx = transcriber()
    bad = []
    for line in cfg['lines']:
        path = os.path.join(folder, f"{line['id']}.wav")
        if not os.path.exists(path):
            print(f"  ✗ {line['id']}: missing file")
            bad.append(line['id'])
            continue
        heard = tx(path)
        want, got = norm(line['text']), norm(heard)
        sm = difflib.SequenceMatcher(None, want, got, autojunk=False)
        missing = [w for tag, a, b, _, _ in sm.get_opcodes() if tag in ('delete', 'replace') for w in want[a:b]]
        # Tolerate recogniser spelling of a single brand/number token; flag real gaps.
        ratio = sm.ratio()
        # Brand names often come back split or joined ("WP Subscription" vs "WPSubscription"):
        # compare the letters with spaces removed as a second opinion.
        chars = difflib.SequenceMatcher(None, ''.join(want), ''.join(got), autojunk=False).ratio()
        ok = (ratio >= 0.9 and len(missing) <= 1) or chars >= 0.97
        ratio = max(ratio, chars)
        print(f"  {'✓' if ok else '✗'} {line['id']:22s} {ratio:4.2f}  heard: {heard.strip()[:90]}")
        if not ok:
            print(f"      missing/changed: {' '.join(missing)}")
            bad.append(line['id'])
    print('REGENERATE: ' + ' '.join(bad) if bad else 'ALL LINES OK')
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
