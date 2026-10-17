# Active Design Feedback Collection Tool

**A browser-based research tool for collecting participants' opinions, feelings, behavioural responses, and suggestions during active design experiments.**

The tool supports repeated feedback collection at different experimental checkpoints. It can be used to explore how participants perceive an environment or scenario, how their experience changes, and whether new information leads them to reconsider their decisions.

The website is responsive and can be hosted on **GitHub Pages** without a build step. It works in **local test mode** immediately. To receive responses from multiple participants in a central database, researchers must configure their own **Firebase** project.

> **Research use:** This is a configurable feedback component, not a complete experimental platform or a substitute for an ethics-approved participant information and consent process. The current question set includes mobility and environmental-condition examples; adapt the wording and response options to your specific active design study before deployment.

## What the tool collects

| Feedback category | Recorded information |
| --- | --- |
| Participant and experimental context | Pseudonymous participant code, scenario or round, feedback checkpoint |
| Perception and feelings | Five-point ratings of perceived safety, pleasantness, arousal/activation, and perceived control |
| Environmental influences | Participants' selections of conditions that affect their experiences |
| Behavioural responses | Selected adaptations or decisions in response to a scenario |
| Decision reconsideration | Whether feedback changed the participant's decision |
| Qualitative feedback | Explanations of feelings and suggestions for improving the environment, activity, or experiment |
| End-of-experiment evaluation | Optional ratings of clarity, realism, and engagement |

Supported checkpoints are `before`, `after_scenario`, `after_feedback`, and `end`. A separate record is generated for every submission, so a participant's responses can be compared across multiple rounds.

## Repository contents

| File | Purpose |
| --- | --- |
| `index.html` | User interface, instructions, question wording, styling, and form elements |
| `app.js` | Data validation, form behaviour, local test storage, and export functions |
| `firebase-client.js` | Firebase connection and submission logic |
| `firebase-config.js` | Public Firebase web application configuration (to be completed by the researcher) |
| `firestore.rules` | Firestore security rules for submitted feedback |
| `export_firestore.py` | Researcher-side utility to export stored responses to CSV and JSON |
| `DATA_DICTIONARY.md` | Descriptions of the collected variables and response fields |
| `README.md` | Project documentation and setup instructions |

## 1. Publish the website using GitHub Pages

1. Create a GitHub repository or open an existing one.
2. Upload the project files to the repository root (next to `README.md`), rather than uploading the ZIP file itself.
3. Commit the files to the `main` branch.
4. In the repository, go to **Settings → Pages**.
5. Choose **Deploy from a branch** and select **`main` → `/(root)`**, then click **Save**.
6. Once the site is published, visit:

   ```text
   https://YOUR-USERNAME.github.io/YOUR-REPOSITORY-NAME/
   ```

If Firebase has not been configured, the website displays **Local test mode**. Submissions are stored **only in the participant's browser**, not sent to the research team. This is appropriate for previewing or testing the interface, **not for centrally collecting real study responses**.

For local development, serve the project folder over HTTP (the JavaScript uses browser modules):

```bash
python -m http.server 8000
# Open http://localhost:8000 in your browser
```

## 2. Configure central response collection with Firebase

GitHub Pages hosts the interface but does not provide a database. Firebase is optional for interface testing and **required for the project's built-in online response-collection workflow**.

1. In the [Firebase Console](https://console.firebase.google.com/), create a project under an institutionally approved research-data arrangement.
2. Register a **Web app** and obtain its Firebase web configuration.
3. Enter its `apiKey`, `authDomain`, `projectId`, and `appId` values in `firebase-config.js`.
4. Under **Authentication → Sign-in method**, enable **Anonymous** authentication. Participants do not need to sign in with a personal account.
5. Under **Firestore Database**, create a database in a region approved for your project. **Do not use unrestricted test-mode rules for real data collection.**
6. In **Firestore Database → Rules**, deploy the contents of the included `firestore.rules` file.
7. Commit the updated `firebase-config.js` to GitHub and refresh the deployed website. It should display **Live collection**.
8. Submit a test response using a dummy participant code. Check that the record appears in Firestore's `study_feedback` collection, and confirm that participants cannot read existing responses. Remove test responses before recruitment.

The supplied Firestore rules are intended to permit validated new submissions while denying client-side reads, updates, and deletions of collected responses. Researchers access the data through authorised administration tools.

**Security considerations:** Never place service-account credentials, private keys, or actual participant data in the GitHub repository. Firebase's public web configuration is not a private credential. However, anonymous authentication alone does not prevent spam or automated submissions. Review Firebase App Check, usage limits, security rules, and institutional data-security requirements before public recruitment.

## 3. Participant workflow

1. Open the experiment feedback website.
2. Enter or retain a **pseudonymous participant code**; use the same code for the same participant across checkpoints.
3. Select an experiment checkpoint and, where appropriate, provide a scenario or round identifier.
4. Rate perceived safety, pleasantness, arousal, and control on the five-point scales.
5. Select relevant environmental influences and behavioural responses, where applicable.
6. Explain the experience and provide improvement suggestions in the optional text fields.
7. After feedback is shown, indicate whether the participant reconsidered their decision; at the end of the experiment, optionally evaluate the study experience.
8. Confirm the approved study-information/consent statement and submit.

To prefill participant and scenario details from another experimental interface, use URL parameters:

```text
https://YOUR-USERNAME.github.io/YOUR-REPOSITORY-NAME/?pid=P-ABCD1234&scenario=S04&stage=after_scenario
https://YOUR-USERNAME.github.io/YOUR-REPOSITORY-NAME/?pid=P-ABCD1234&scenario=S04&stage=after_feedback
https://YOUR-USERNAME.github.io/YOUR-REPOSITORY-NAME/?pid=P-ABCD1234&stage=end
```

Accepted `stage` values are `before`, `after_scenario`, `after_feedback`, and `end`. The participant code may contain 4–36 letters, digits, hyphens, or underscores. The scenario identifier can contain up to 40 characters.

## 4. Export collected feedback

### Local test mode

Use **Export test CSV** or **Export JSON** in the website interface. These files contain only responses saved in the current browser. They are not accessible to researchers on another device unless transferred separately.

### Online collection mode

Authorised researchers can inspect records in Firebase and use the supplied `export_firestore.py` script from a trusted computer.

```bash
pip install firebase-admin

# Store your authorised service-account key securely OUTSIDE the repository.
export GOOGLE_APPLICATION_CREDENTIALS=/secure/private/location/service-account.json

python export_firestore.py --project YOUR_FIREBASE_PROJECT_ID
```

On Windows, configure the equivalent `GOOGLE_APPLICATION_CREDENTIALS` environment variable for your shell. The script writes timestamped **CSV** and **JSON** files into an `exports/` folder. Consult [DATA_DICTIONARY.md](DATA_DICTIONARY.md) for field definitions. Responses can be linked by `participant_id`, `scenario_id`, and `checkpoint`.

The `.gitignore` file helps keep generated exports out of version control. **Never upload real participant responses or private service-account credentials to a public repository.**

## 5. Adapt the tool for other active design experiments

You can customise the website for participatory design, built-environment assessment, active mobility, public-space evaluation, or other scenario-based studies.

- Update `index.html` to change titles, terminology, question wording, scale descriptions, and selectable response options.
- Update `app.js` when changing how responses are processed, validated, or exported.
- Update `firestore.rules` when adding, removing, or renaming stored response fields; otherwise valid submissions may be rejected.
- Update `export_firestore.py` and `DATA_DICTIONARY.md` to keep your exports and research documentation consistent with any schema changes.
- Pilot the full workflow on mobile and desktop before using it with participants.

**Measurement note:** `form_elapsed_seconds` is the time elapsed in the feedback form. It is **not** a validated time-to-first-decision measure, a log of behavioural adaptation order, or a record of in-game interactions. Collect those measures separately in the experiment platform if required.

## 6. Ethics, accessibility, and data protection

Before involving research participants:

- Replace the example consent text with **institutionally approved participant information, consent wording, and withdrawal procedures**.
- Complete the appropriate ethics review and research data-management assessment.
- Assess privacy, retention, hosting location, international data transfers, and any applicable GDPR responsibilities. Pseudonymous responses can still be personal data.
- Ask participants **not** to enter names, contact details, exact addresses, or other directly identifying information into free-text fields.
- Check accessibility, comprehension of rating scales, mobile usability, and response burden in a pilot.

This repository provides a technical starting point; it does **not** itself establish legal compliance or research ethics approval.

## Technology and documentation

Built with standard **HTML, CSS, and JavaScript**, with **Firebase Authentication** and **Cloud Firestore** available for centralised storage. No build framework or dedicated application server is needed to host the interface.

- [GitHub Pages setup](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Firebase web setup](https://firebase.google.com/docs/web/setup)
- [Anonymous authentication](https://firebase.google.com/docs/auth/web/anonymous-auth)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

---

*Active Design Feedback Collection Tool — a configurable research instrument for evaluating participants' experiences and responses during experiments.*
