# buddy-voice

Cloudflare Worker that records a buddy's welcome line with a custom name, for the
grown-up "Name your buddy" screen in the app (`src/components/pop/BuddyNameSheet.tsx`).
A stopgap until the real backend ships.

```
POST /v1/welcome
headers: x-app-key: <APP_KEY>, x-install-id: <random per install>
body:    { "buddy": "mariam" | "anas", "lang": "en" | "ar", "name": "Noor", "take": 1 }
→ 200 audio/wav  (x-cache: hit | miss)
→ 400 { error: "name:empty|long|chars|blocked" | "buddy" | "lang" | "take" | "body" | "install_id" }
→ 401 app_key · 429 rate_limited · 502 tts_*
```

- **Voice:** Gemini TTS (`gemini-3.8-flash-tts`), the same voices and style prompts as the
  bundled clips (Leda for Mariam, Zephyr for Anas), in `src/lib.ts`.
- **Cache:** R2, key `welcome/<sha256(version|buddy|lang|name|take)>.wav`. A name any
  child already chose is served without calling Gemini. Bump `VOICE_VERSION` when a voice,
  style or line changes.
- **Abuse:** a shared app key (not a secret on a phone, but it stops casual use), rate
  limits of 10/min per install and 30/min per IP, names of 1–20 letters (Latin or Arabic),
  and a whole-word blocklist (extend `BLOCKED` in `src/lib.ts`).
- **Privacy:** names are children's data. The worker never logs them, request logs are off
  (`observability.enabled = false`), and R2 keys are hashes. The audio itself contains
  the name. Use Gemini's **paid tier**, where Google doesn't use the input to improve
  its products.

## Deploy

```bash
cd workers/buddy-voice
npm install
npx wrangler r2 bucket create kids-buddy-voices
npx wrangler secret put GEMINI_API_KEY   # paid-tier key
npx wrangler secret put APP_KEY          # any long random string
npm run deploy
```

Then set the app's EAS env vars (all environments) and ship a build or an OTA update:

- `EXPO_PUBLIC_VOICE_API_URL` = the worker URL (e.g. `https://buddy-voice.<account>.workers.dev`)
- `EXPO_PUBLIC_VOICE_APP_KEY` = the same `APP_KEY`

Without them the app hides the rename option and keeps the built-in names.

## Test

```bash
npm test        # node --test, no install needed
```

## Before the release ships

- **Privacy policy:** a grown-up may give the buddy a name; it is sent to our voice service
  (Cloudflare, with Google Gemini as processor) to record a greeting, and the recording is
  kept to reuse for the same name. No account and no link to the device or child.
- **Play Data safety:** Personal info → Name: collected, shared with a processor (Google)
  for app functionality, optional, not linked to identity. Check the Families policy.
- **App Store App Privacy:** Contact Info → Name, app functionality, not linked to the user,
  not used for tracking. Kids category: no third-party advertising/analytics involved.
