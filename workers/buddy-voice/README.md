# buddy-voice

One-file Cloudflare Worker (`worker.js`) that records a buddy's welcome line with a
custom name for the app's "Name your buddy" screen. Clips are cached in R2, so each
name is recorded by Gemini only once. A stopgap until the real backend ships.

## Set up (dashboard)

1. **R2** → create a bucket, e.g. `kids-buddy-voices`.
2. **Workers** → create a Worker, paste `worker.js`, deploy.
3. Worker → **Settings → Bindings**:
   - R2 bucket, variable name `VOICES` → the bucket above.
   - Rate limiting (optional, recommended), variable name `LIMITER`, e.g. 10 requests / 60 s.
4. Worker → **Settings → Variables and Secrets** (type *Secret*):
   - `GEMINI_API_KEY`: a **paid-tier** key (the free tier may use input to improve Google's products).
   - `APP_KEY`: any long random string.
5. Worker → **Settings → Observability**: keep logs off (names are children's data).

Then set the app's EAS env vars and ship a build or OTA update:
`EXPO_PUBLIC_VOICE_API_URL` = the Worker URL, `EXPO_PUBLIC_VOICE_APP_KEY` = the same `APP_KEY`.
Without them the app hides the rename option.

## Try it

```bash
curl -X POST "$URL/v1/welcome" -H "x-app-key: $APP_KEY" -H "x-install-id: test-install-1" \
  -H "content-type: application/json" -d '{"buddy":"mariam","lang":"en","name":"Noor"}' -o noor.wav -D -
```

The second call for the same name returns `x-cache: hit`.

## Before the release ships

Update the privacy policy and store forms: a grown-up may give the buddy a name, which is
sent to our voice service (Cloudflare, with Google Gemini as processor) to record a greeting.
The recording is kept to reuse for the same name, and nothing links it to the device or child.
