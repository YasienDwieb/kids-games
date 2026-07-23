# iOS submission runbook — Kids Zone

Prereqs (all done): Apple team J98M86H34Z, bundle `dev.waybeyond.kidszone`
registered, ASC app 6793942277 created, ASC API key `AuthKey_FJS3Y8R9KM.p8`
present locally (gitignored).

## Before you publish — REPLACE placeholders

`store.config.json` has `https://REPLACE-ME-support-url.example.com` in
`supportUrl` and `marketingUrl` (both locales). Replace with a real support
page URL (an https page, not a mailto). Support email is `ahmedhdeawy@gmail.com`.

## 1. Build the IPA (interactive first run for signing)

    eas build -p ios --profile production

First run prompts an Apple login to create the distribution cert + provisioning
profile (EAS-managed). Wait for the build to finish.

## 2. Submit the build to App Store Connect (upload only)

    eas submit -p ios --profile production

Uses the ASC API key from eas.json — non-interactive. This uploads the build to
ASC; it does NOT submit for review.

## 3. Push listing text

    eas metadata:push --profile production

Uploads en-US + ar title/subtitle/description/keywords/URLs from store.config.json.

## 4. Finish in the App Store Connect UI

- Set **Category**: Education (primary).
- Set **Age Rating** (answer the questionnaire — no objectionable content → 4+).
- Complete the **App Privacy** section: "Data Not Collected".
- Confirm **Support URL** and **Privacy Policy URL** are set.
- Upload **screenshots** (6.9" iPhone + 13" iPad, landscape) — see
  `screenshots/README.md`.
- Select the uploaded build, then **Submit for Review**.

## Notes

- `track` / release: these lanes upload only; you press Submit manually.
- The .p8 key is downloadable once — keep a backup outside the repo.
- Expo SDK 54 auto-generates `PrivacyInfo.xcprivacy` at build time; `expo-av`
  and `expo-localization` need no manual required-reason API declarations.
