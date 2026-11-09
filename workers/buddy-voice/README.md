# buddy-voice

One-file Cloudflare Worker (`worker.js`) that records a buddy's welcome line with a
custom name ("Hi! I'm Noor…") for the app's "Name your buddy" screen. Each recording
is saved in R2, so a name is recorded by Gemini only once and then reused for anyone
who picks it. A stopgap until the real backend ships.

You need: a Cloudflare account, a Gemini API key on the **paid tier** (the free tier
may use input to improve Google's products, which is not OK for children's names), and
the EAS CLI for the app.

---

## Step 1: Create the storage bucket

1. Cloudflare dashboard → **R2 Object Storage** (enable R2 if asked).
2. **Create bucket** → name it `kids-buddy-voices` → **Create bucket**.

## Step 2: Create the Worker and paste the code

1. Dashboard → **Workers & Pages** → **Create** → **Create Worker** (start from "Hello World").
2. Name it `buddy-voice` → **Deploy**.
3. Click **Edit code**, delete everything in `worker.js`, paste the contents of this
   folder's `worker.js`, then **Deploy**.

## Step 3: Connect the bucket

Worker → **Settings** → **Bindings** → **Add binding** → **R2 bucket**:

- Variable name: `VOICES` (exactly this)
- Bucket: `kids-buddy-voices`

## Step 4: Add a rate limit (recommended)

Worker → **Settings** → **Bindings** → **Add binding** → **Rate limiting**:

- Variable name: `LIMITER` (exactly this)
- Limit: `10` requests per `60` seconds

This caps each phone at 10 recordings a minute. Without it the Worker still works,
but anyone with the app key could call it nonstop.

## Step 5: Add the two secrets

Worker → **Settings** → **Variables and Secrets** → **Add**, type **Secret**:

| Name | Value |
|------|-------|
| `GEMINI_API_KEY` | your paid-tier Gemini key |
| `APP_KEY` | a long random string; make one with `openssl rand -hex 32` and keep it for step 8 |

Save, then **Deploy** again so the Worker picks them up.

## Step 6: Keep logs off

Worker → **Settings** → **Observability**: leave **Workers Logs** disabled. Names are
children's data, and the Worker never writes them to logs itself.

## Step 7: Test it

Copy the Worker's URL from its overview page (like `https://buddy-voice.<you>.workers.dev`), then:

```bash
URL="https://buddy-voice.<you>.workers.dev"
APP_KEY="<the value from step 5>"

curl -X POST "$URL/v1/welcome" \
  -H "x-app-key: $APP_KEY" -H "x-install-id: test-install-1" \
  -H "content-type: application/json" \
  -d '{"buddy":"mariam","lang":"en","name":"Noor"}' \
  -o noor.wav -D - && afplay noor.wav
```

- You should hear Mariam say "Hi! I'm Noor…". The response headers show `x-cache: miss`.
- Run it again: now `x-cache: hit` (served from R2, no Gemini call).
- Arabic: `-d '{"buddy":"anas","lang":"ar","name":"عُمَر"}'`.
- In R2 you'll see files under `welcome/` with hashed names, never the name itself.

If it fails, the body is a JSON error:

| Error | Meaning |
|-------|---------|
| `401 app_key` | `x-app-key` doesn't match the `APP_KEY` secret |
| `400 name:invalid` / `name:blocked` | not letters only (max 20), or a blocked word |
| `429 rate_limited` | over the step 4 limit; wait a minute |
| `502 tts_403` (or another code) | Gemini refused: check `GEMINI_API_KEY` and its billing |

## Step 8: Point the app at the Worker

From the repo root, set the two app variables for every EAS environment:

```bash
for env in development preview production; do
  eas env:create --name EXPO_PUBLIC_VOICE_API_URL --value "$URL" --environment $env --visibility plaintext
  eas env:create --name EXPO_PUBLIC_VOICE_APP_KEY --value "$APP_KEY" --environment $env --visibility plaintext
done
```

For local development, add the same two lines to `.env.local`:

```
EXPO_PUBLIC_VOICE_API_URL=https://buddy-voice.<you>.workers.dev
EXPO_PUBLIC_VOICE_APP_KEY=<APP_KEY>
```

`EXPO_PUBLIC_*` values are built into the app, so the app key isn't truly secret. It
stops casual use, and the rate limit covers the rest.

## Step 9: Ship it

No native code changed, so an OTA update is enough:

```bash
eas update --channel production --environment production -m "Buddy names"
```

Then open the app: after picking a buddy, a "Grown-ups: rename" button appears, and
Settings → General has a **Buddy name** row. Without the variables from step 8 both stay hidden.

## Step 10: Before release, update the privacy disclosures

- **Privacy policy:** a grown-up may give the buddy a name. It is sent to our voice service
  (Cloudflare, with Google Gemini as processor) to record a greeting. The recording is kept
  so the same name can be reused, and nothing links it to the device or the child.
- **Google Play → Data safety:** Personal info → Name: collected, shared with a processor
  for app functionality, optional, not linked to identity. Check it against the Families policy.
- **App Store → App Privacy:** Contact Info → Name: app functionality, not linked to the
  user, not used for tracking.

---

## Changing the voice later

Edit `VOICES` or `LINES` in `worker.js`, bump `VERSION` (e.g. `'v2'`) so old recordings
aren't reused, paste and deploy again. Old files in R2 can be deleted from the bucket page.
