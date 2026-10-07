"""Original, procedurally generated music + SFX for the presentation (no samples, royalty-free)."""
import sys, wave, numpy as np
SR = 44100
OUT = sys.argv[1]
DUR = float(sys.argv[2]) if len(sys.argv) > 2 and OUT != 'sfx' else 170.0
rng = np.random.default_rng(7)

def write(path, x):
    x = np.clip(x, -1, 1)
    if x.ndim == 1: x = np.stack([x, x], 1)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype('<i2').tobytes())

def hz(m): return 440 * 2 ** ((m - 69) / 12)
def comb_reverb(x, mix=0.25):
    wet = np.zeros(len(x))
    for d, g in [(0.0297, .80), (0.0371, .78), (0.0411, .76), (0.0437, .74)]:
        n = int(d * SR); y = x.copy()
        for st in range(n, len(y), n):
            y[st:st+n] += g * y[st-n:st][:len(y[st:st+n])]
        wet += y / 4
    return x * (1 - mix) + wet * mix

def music(dur):
    n = int(dur * SR); t = np.arange(n) / SR
    L = np.zeros(n); R = np.zeros(n)
    bpm = 96; beat = 60 / bpm; bar = beat * 4; seg = bar * 2
    prog = [(60, [60, 64, 67, 72]), (55, [59, 62, 67, 71]), (57, [60, 64, 69, 72]), (53, [57, 60, 65, 69])]
    nseg = int(np.ceil(dur / seg)) + 1
    end_t = dur - 5.0  # final chord region
    for k in range(nseg):
        st = k * seg
        if st >= dur: break
        root, notes = prog[k % 4]
        if st >= end_t: root, notes = prog[0]
        ln = min(seg + 1.5, dur - st) if st < end_t else dur - st
        i0 = int(st * SR); m = int(ln * SR); tt = np.arange(m) / SR
        env = np.minimum(1, tt / 1.2) * np.minimum(1, (ln - tt) / 1.5).clip(0, 1)
        pad = np.zeros(m)
        for nt in notes:
            for det in (-0.08, 0, 0.08):
                f = hz(nt + det)
                pad += (np.sin(2*np.pi*f*tt) + 0.3*np.sin(4*np.pi*f*tt) + 0.12*np.sin(6*np.pi*f*tt))
        pad *= env * 0.018
        L[i0:i0+m] += pad[:len(L)-i0]; R[i0:i0+m] += pad[:len(R)-i0]
        # bass on beats 1 and 3 of each bar
        if st > 3:
            for b in range(4):
                bt = st + b * beat * 2
                if bt >= min(dur - 4, end_t): break
                bi = int(bt * SR); bm = int(beat * 2 * SR); bb = np.arange(bm) / SR
                be = np.minimum(1, bb / 0.02) * np.exp(-bb * 1.6)
                f = hz(root - 24)
                bs = (np.sin(2*np.pi*f*bb) + 0.25*np.sin(4*np.pi*f*bb)) * be * 0.11
                e = min(bi + bm, n); L[bi:e] += bs[:e-bi]; R[bi:e] += bs[:e-bi]
    # arpeggio + drums
    arpL = np.zeros(n); arpR = np.zeros(n)
    eighth = beat / 2; step = 0; tcur = 4.0
    pattern = [0, 1, 2, 3, 2, 1, 2, 3]
    while tcur < end_t:
        k = int(tcur // seg); root, notes = prog[k % 4]
        nt = notes[pattern[step % 8]] + 12
        i0 = int(tcur * SR); m = int(0.9 * SR); tt = np.arange(m) / SR
        f = hz(nt)
        v = (np.sin(2*np.pi*f*tt) + 0.35*np.sin(4*np.pi*f*tt)*np.exp(-tt*8)) * np.exp(-tt * 5.5) * np.minimum(1, tt/0.004)
        amp = 0.05 * (1.0 if step % 2 == 0 else 0.75) * min(1, (tcur - 4) / 4)
        pan = 0.35 + 0.3 * ((step % 4) / 3)
        e = min(i0 + m, n)
        arpL[i0:e] += v[:e-i0] * amp * (1 - pan) * 2; arpR[i0:e] += v[:e-i0] * amp * pan * 2
        # kick on beats (from 8s), hats on offbeats
        if tcur >= 8 and step % 2 == 0:
            km = int(0.35 * SR); kt = np.arange(km) / SR
            kf = 50 + 70 * np.exp(-kt * 30)
            kick = np.sin(2*np.pi*np.cumsum(kf)/SR) * np.exp(-kt * 9) * 0.16
            e2 = min(i0 + km, n); L[i0:e2] += kick[:e2-i0]; R[i0:e2] += kick[:e2-i0]
        if tcur >= 12 and step % 2 == 1:
            hm = int(0.06 * SR); ht = np.arange(hm) / SR
            hn = rng.standard_normal(hm); hn = np.diff(np.concatenate([[0], hn]))
            hat = hn * np.exp(-ht * 70) * 0.011
            e2 = min(i0 + hm, n); L[i0:e2] += hat[:e2-i0] * 0.8; R[i0:e2] += hat[:e2-i0]
        tcur += eighth; step += 1
    arpL = comb_reverb(arpL, 0.3); arpR = comb_reverb(arpR, 0.3)
    L += arpL; R += arpR
    # sparkle bell at each cycle start
    for c in np.arange(4.0, end_t, seg * 4):
        add_bell(L, R, c, [84, 88, 91], 0.05)
    add_bell(L, R, dur - 4.8, [72, 76, 79, 84], 0.07)
    x = np.stack([L, R], 1)
    fade_in = np.minimum(1, t / 1.5); fade_out = np.clip((dur - t) / 3.0, 0, 1)
    x *= (fade_in * fade_out)[:, None]
    x /= np.abs(x).max() / 0.7
    return x

def add_bell(L, R, at, notes, amp):
    i0 = int(at * SR); m = int(3 * SR); tt = np.arange(m) / SR
    s = np.zeros(m)
    for nt in notes:
        f = hz(nt); s += (np.sin(2*np.pi*f*tt) + 0.4*np.sin(2*np.pi*f*2.76*tt)*np.exp(-tt*4)) * np.exp(-tt * 1.8)
    s *= amp * np.minimum(1, tt / 0.003)
    e = min(i0 + m, len(L)); L[i0:e] += s[:e-i0]; R[i0:e] += s[:e-i0]

def sfx(path_dir):
    # whoosh
    m = int(0.7 * SR); tt = np.arange(m) / SR
    nz = rng.standard_normal(m)
    out = np.zeros(m); s = 0.0
    for i in range(m):
        fc = 300 + 5000 * (tt[i] / 0.7) ** 1.5
        a = 1 - np.exp(-2 * np.pi * fc / SR); s += a * (nz[i] - s); out[i] = s
    env = np.sin(np.pi * tt / 0.7) ** 2
    w = out * env; w /= np.abs(w).max() / 0.35
    pan = np.linspace(0.2, 0.8, m)
    write(f'{path_dir}/whoosh.wav', np.stack([w * (1 - pan) * 1.6, w * pan * 1.6], 1))
    # click
    m = int(0.06 * SR); tt = np.arange(m) / SR
    c = (np.sin(2*np.pi*2400*tt) * np.exp(-tt * 120) + rng.standard_normal(m) * np.exp(-tt * 900) * 0.4) * 0.35
    write(f'{path_dir}/click.wav', c)
    # pop
    m = int(0.18 * SR); tt = np.arange(m) / SR
    f = 700 + 600 * (1 - np.exp(-tt * 40))
    p = np.sin(2*np.pi*np.cumsum(f)/SR) * np.exp(-tt * 22) * 0.35
    write(f'{path_dir}/pop.wav', p)
    # chime
    L = np.zeros(int(2.5 * SR)); R = np.zeros_like(L)
    add_bell(L, R, 0.0, [84, 88], 0.12); add_bell(L, R, 0.12, [91, 96], 0.1)
    write(f'{path_dir}/chime.wav', np.stack([L, R], 1))

if OUT == 'sfx':
    sfx(sys.argv[2])
else:
    write(OUT, music(DUR))
    print('ok', DUR)
