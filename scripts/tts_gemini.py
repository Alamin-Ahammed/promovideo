"""Generate one narration clip per script line with Gemini text-to-speech.

Usage:
  python tts_gemini.py build/script.json vo-raw/            # all missing lines
  python tts_gemini.py build/script.json vo-raw/ --only intro reports --force

script.json:
  {"voice": "Charon", "style": "Read in a warm, confident, friendly product-presenter voice at a moderate pace",
   "lines": [{"id": "intro", "text": "Introducing ..."}, ...]}

The API key is read from the GEMINI_API_KEY environment variable and is never printed.
Every line uses the same voice and the same style instruction so the narration stays consistent.
"""
import base64, json, os, re, sys, time, urllib.error, urllib.request, wave

MODEL = os.environ.get('GEMINI_TTS_MODEL', 'gemini-2.5-flash-preview-tts')
URL = f'https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent'


def synth(text, voice, style, key):
    body = {
        'contents': [{'parts': [{'text': f'{style}:\n{text}'}]}],
        'generationConfig': {
            'responseModalities': ['AUDIO'],
            'speechConfig': {'voiceConfig': {'prebuiltVoiceConfig': {'voiceName': voice}}},
        },
    }
    req = urllib.request.Request(URL, data=json.dumps(body).encode(), headers={'Content-Type': 'application/json', 'x-goog-api-key': key})
    for attempt in range(6):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                data = json.load(r)
            part = data['candidates'][0]['content']['parts'][0]['inlineData']
            rate = int(re.search(r'rate=(\d+)', part.get('mimeType', '')).group(1)) if 'rate=' in part.get('mimeType', '') else 24000
            return base64.b64decode(part['data']), rate
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors='ignore')[:300]
            if e.code in (429, 500, 503) and attempt < 5:
                wait = 2 ** attempt * 5
                print(f'    API {e.code}, retrying in {wait}s')
                time.sleep(wait)
                continue
            sys.exit(f'Gemini TTS error {e.code}: {msg}')
        except (KeyError, IndexError) as e:
            if attempt < 5:
                time.sleep(3)
                continue
            sys.exit(f'Unexpected Gemini response ({e}).')


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    key = os.environ.get('GEMINI_API_KEY')
    if not key:
        sys.exit('GEMINI_API_KEY is not set. Create a key at https://aistudio.google.com/apikey and export it in your shell profile.')
    cfg = json.load(open(sys.argv[1]))
    out = sys.argv[2]
    only = sys.argv[sys.argv.index('--only') + 1:] if '--only' in sys.argv else None
    if only:
        only = [x for x in only if not x.startswith('--')]
    force = '--force' in sys.argv
    os.makedirs(out, exist_ok=True)
    voice = cfg.get('voice', 'Charon')
    style = cfg.get('style', 'Read in a warm, confident, friendly product-presenter voice at a moderate pace')
    for line in cfg['lines']:
        lid, text = line['id'], line.get('say', line['text'])
        if only and lid not in only:
            continue
        path = os.path.join(out, f'{lid}.wav')
        if os.path.exists(path) and not force:
            continue
        print(f'  ♪ {lid}: {text[:70]}')
        pcm, rate = synth(text, voice, style, key)
        with wave.open(path, 'wb') as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(rate)
            w.writeframes(pcm)
        time.sleep(1.2)  # stay gentle with free-tier rate limits
    print('done')


if __name__ == '__main__':
    main()
