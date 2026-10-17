# Night Ride Lab — Participant Experience Tool

**A mobile-friendly research feedback website for nighttime e-scooter scenarios.** The app collects perceived safety, affective states, scenario choices, decision revisions and free-text suggestions at repeated experiment checkpoints.

Designed for **GitHub Pages**. No installation, build step, paid host, or custom server is required to publish the website. Centralized data collection requires your **own Firebase project**, which is configured separately from GitHub. Until Firebase is configured, the app clearly operates in *local test mode* (responses are saved only in that browser).

## 1. Publish on GitHub Pages

1. Create a new GitHub repository, e.g. `night-ride-feedback`.
2. Upload **all files in this folder into the root of the repository** (do **not** upload the ZIP as a single file). Commit them to `main`.
3. Open the repository's **Settings → Pages**.
4. Set **Source** to **Deploy from a branch**, branch **main**, folder **/(root)**. Click **Save**.
5. Open `https://YOUR-USERNAME.github.io/night-ride-feedback/` once Pages has published.

You will immediately see the website in **Local test mode**; this is for interface testing only, not a real multi-participant study. In local test mode the user can export CSV/JSON from their own browser. **The research team will not receive participant data until Firebase is configured.**

To test locally with a web server (needed for ES modules):

```bash
cd night-ride-feedback
python -m http.server 8000
# Visit http://localhost:8000
```

## 2. Enable central collection using Firebase (required for participant recruitment)

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a Firebase project under your institution's approved data-management arrangement.
2. Register a **Web app** from the project settings. Copy its **firebaseConfig** object.
3. Open `firebase-config.js` and paste the `apiKey`, `authDomain`, `projectId`, and `appId` values into the existing fields. You may include other standard Firebase configuration fields if supplied. **Do not put service account private keys in this file.** A Firebase web app config is designed to be public; security depends on Authentication, App Check and Firestore Security Rules.
4. Firebase Console → **Authentication → Sign-in method**: enable **Anonymous** sign-in. Respondents will not need a Firebase or Google account.
5. Firebase Console → **Firestore Database**: create a database in an institutionally acceptable location (consider an EU region, subject to your data-protection review). Do not use open/test security rules for production.
6. Firebase Console → **Firestore Database → Rules**: replace the rules with the contents of the included `firestore.rules` file and click **Publish**. These rules allow authenticated participants to **create** validated feedback entries but **not read, update, or delete** any feedback. The research team can access records through its authorized Firebase Console or Admin SDK.
7. Commit the edited `firebase-config.js` to GitHub, wait for your Pages site to republish, and refresh it. The badge should now say **Live collection**.
8. Test a submission using a fake participant code. In Firebase Console → Firestore Database → Data, confirm that the `study_feedback` collection contains the test record. Verify that non-researchers cannot browse records from the website. Remove test responses through the console before recruitment.

**If submission fails**, the form retains the participant's input and displays an error. Check the browser console, Firebase Auth anonymous provider, Firestore rules, and project settings. It never falsely claims that a failed cloud submission was saved.

**Production security note:** Anonymous Authentication is not a spam-prevention measure. Consider enabling [Firebase App Check](https://firebase.google.com/docs/app-check), quotas, budget alerts, and institutional monitoring before sharing publicly. Deploy and test restrictions in a staging project first. The example rules prevent participant reads but do not prevent deliberate flooding by new anonymous users.

## 3. How participants use it

- Enter or keep the pseudonymous **Participant code**, consistent across rounds.
- Select a **checkpoint**: `before`, `after_scenario`, `after_feedback`, `end`.
- Enter the scenario/round identifier for scenario checkpoints.
- Record four 5-point ratings: **perceived safety, pleasantness, activation/arousal, control**.
- Optionally identify contextual influences; select behavioural adaptations; explain feelings; and suggest changes to both journey design and the experiment.
- At `after_feedback`, record whether the feedback changed the decision.
- At `end`, optionally rate **clarity, realism, engagement**.
- Tick the study information/consent confirmation and submit.

The form accepts URL prefill parameters, convenient for linking it from a Serious Game/stated-adaptation platform:

```
https://YOUR-USERNAME.github.io/night-ride-feedback/?pid=P-ABCD1234&scenario=S04&stage=after_scenario
https://YOUR-USERNAME.github.io/night-ride-feedback/?pid=P-ABCD1234&scenario=S04&stage=after_feedback
https://YOUR-USERNAME.github.io/night-ride-feedback/?pid=P-ABCD1234&stage=end
```

`pid` is restricted to 4–36 letters, digits, `_` or `-`; `scenario` to 40 characters; and `stage` to one of the four codes. A code is generated on a user's first visit and retained on that device unless they choose **New code**. Participants using a shared device should be assigned unique codes by the research team and should use the `pid` link for each session.

## 4. Export analysis-ready data

### For local testing (no Firebase)

Use **Export test CSV** or **Export JSON** at the bottom of the page. These files exist only on the device on which the answers were entered. Browser data can be deleted by the user or browser; therefore **local mode is unsuitable for centrally collecting real responses**.

### For live Firebase collection

Research administrators can inspect and delete records in the Firebase Console. The repository also includes a small *researcher-side* Python exporter:

```bash
pip install firebase-admin
# Set GOOGLE_APPLICATION_CREDENTIALS to an authorized service-account key
# stored OUTSIDE the GitHub repository and outside any publicly served folder.
export GOOGLE_APPLICATION_CREDENTIALS=/secure/private/location/service-account.json
python export_firestore.py --project YOUR_FIREBASE_PROJECT_ID
```

The exporter creates timestamped CSV and JSON files in `exports/` and leaves out Firebase Authentication UIDs. Only run it on the researcher's trusted computer. The `.gitignore` prevents `*.csv`, `*.json` and `exports/` from being committed by default, but you must still **never copy any keys or real research responses into your public GitHub Pages folder**.

CSV columns are documented in [DATA_DICTIONARY.md](DATA_DICTIONARY.md). One submitted form is one row; repeated entries are linked by `participant_id`, `scenario_id` and `checkpoint`.

## 5. Change the questions and experiment wording

- **`index.html`** — wording, options, layout and colors. Search for the question labels.
- **`app.js`** — form logic, validation, exports and data structure.
- **`firebase-client.js`** — online submission.
- **`firebase-config.js`** — Firebase web app configuration only.
- **`firestore.rules`** — cloud permissions and accepted fields. **If you add/rename stored fields, update these security rules and the exporter.**

This tool is a **feedback and decision checkpoint**, not a replacement for the underlying Serious Game or SA experiment. It records the elapsed time since this page was opened/reset; this is **not** validated time-to-first-decision, adaptation order, route travel time, or in-game timestamp. Those measures should be instrumented separately within the SG/SA engine if needed in your study.

## 6. Before running a real human-participant study

**Important: The default consent text is a placeholder, not ethics-approved consent.** Replace it with approved study information, a suitable privacy notice and appropriate consent/withdrawal procedure. Consider accessibility, pilot testing, institution-specific approvals, EU GDPR obligations, data retention, cross-border processing, and DPA/data-processing agreements for GitHub/Firebase. Pseudonymous participant IDs and responses may still be personal data under GDPR. Participants should not disclose real names, email addresses, home/work addresses or exact routes in free text. GitHub Pages is a **publicly accessible website**, even for private repositories on plans that support Pages.

The implemented Firestore rules prevent ordinary client-side participant reads, but no website alone establishes research ethics approval or full GDPR compliance. Have the institutional data steward and ethics committee review the design and hosting before deployment.

## Technology & official guidance

Uses vanilla HTML/CSS/JavaScript and Firebase's modular browser SDK. No tracking/analytics libraries are included.

- [GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Firebase JavaScript setup](https://firebase.google.com/docs/web/setup)
- [Firebase anonymous authentication](https://firebase.google.com/docs/auth/web/anonymous-auth)
- [Cloud Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
