"""Clean per-line narration clips and register their lengths for the video timeline.

Usage: python prepare_vo.py build/script.json vo-raw/ <project>/
Writes <project>/public/vo/<id>.wav (48 kHz, gentle EQ/compression, trimmed silence, soft edges)
and <project>/src/vo.json ({id: seconds}). Scenes stretch automatically to fit each line.
"""
import json, os, subprocess, sys, tempfile, wave
import numpy as np

SR = 48000


def read(path):
    with wave.open(path) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(np.float32) / 32768
        return x.reshape(-1, w.getnchannels()).mean(1)


def main():
    cfg, raw, proj = json.load(open(sys.argv[1])), sys.argv[2], sys.argv[3]
    os.makedirs(os.path.join(proj, 'public/vo'), exist_ok=True)
    out, thr = {}, 10 ** (-40 / 20)
    for line in cfg['lines']:
        src = os.path.join(raw, f"{line['id']}.wav")
        if not os.path.exists(src):
            print(f"  skip {line['id']} (no clip)")
            continue
        tmp = tempfile.mktemp(suffix='.wav')
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', src, '-af',
                        'highpass=f=70,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2',
                        '-ar', str(SR), '-ac', '1', tmp], check=True)
        x = read(tmp)
        os.remove(tmp)
        loud = np.where(np.abs(x) > thr)[0]
        if len(loud) == 0:
            print(f"  ! {line['id']} is silent")
            continue
        x = x[max(0, loud[0] - int(0.12 * SR)):min(len(x), loud[-1] + int(0.30 * SR))].copy()
        f = int(0.012 * SR)
        x[:f] *= np.linspace(0, 1, f)
        x[-f:] *= np.linspace(1, 0, f)
        with wave.open(os.path.join(proj, 'public/vo', f"{line['id']}.wav"), 'wb') as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())
        out[line['id']] = round(len(x) / SR, 2)
        print(f"  ✓ {line['id']:22s} {out[line['id']]:5.2f}s")
    json.dump(out, open(os.path.join(proj, 'src/vo.json'), 'w'), indent=1)


if __name__ == '__main__':
    main()
