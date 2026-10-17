# Data dictionary (schema 1.0)

Each submission is an independent entry in the private Firestore collection `study_feedback` or, in local test mode, in the submitting browser's storage. Multiple entries per person/round can be linked using `participant_id`, `scenario_id` and `checkpoint`.

| Field (CSV) | Type / values | Meaning |
| --- | --- | --- |
| `schema_version` | `1.0` | Instrument version. |
| `response_id` | UUID | Pseudorandom response receipt code. |
| `participant_id` | 4–36 characters | Pseudonymous study code, **not a name**. |
| `scenario_id` | Short text | Experiment round/scenario (blank for end checkpoint is allowed). |
| `checkpoint` | `before`, `after_scenario`, `after_feedback`, `end` | Time relative to scenario / feedback. |
| `submitted_at_utc` | UTC ISO 8601 | Device time at form submission. Do not use as a verified experiment timestamp. |
| `form_elapsed_seconds` | 0–36,000 integer | Time since form load or preceding successful submission. **Not time to first decision.** |
| `rating_safety` | 1–5 | 1 unsafe → 5 safe. |
| `rating_pleasantness` | 1–5 | 1 unpleasant → 5 pleasant (PAD pleasure). |
| `rating_arousal` | 1–5 | 1 calm → 5 highly activated (PAD arousal, not necessarily negative). |
| `rating_control` | 1–5 | 1 little control → 5 high control (PAD dominance/control). |
| `rating_clarity` | blank or 1–5 | Optional wrap-up rating: clarity of experiment. |
| `rating_realism` | blank or 1–5 | Optional wrap-up rating: experiment realism. |
| `rating_engagement` | blank or 1–5 | Optional wrap-up rating: participant engagement. |
| `influences` | semicolon-separated multi-select | Lighting, road surface, traffic, weather, people, route or time pressure. |
| `adaptations` | semicolon-separated multi-select | Continue, slow down, route/time/destination/mode change, dismount, cancel. |
| `decision_revised` | `yes`, `no`, `unsure`, `not_applicable` | Only the after-feedback checkpoint asks about revisions. |
| `feeling_reason` | Free text, up to 700 characters | Explanation of perceived experience. |
| `journey_suggestion` | Free text, up to 700 characters | Ideas to improve the journey. |
| `experiment_suggestion` | Free text, up to 700 characters | Suggestions to improve the experimental interface/design. |

**Cloud-only fields (not included in CSV/JSON export):** `auth_uid` is a random Firebase Anonymous Auth UID used for write validation, and `created_at` is a server-generated Firestore timestamp. The browser does not request names, addresses, phone numbers, GPS coordinates, user-agent strings or IP addresses, although infrastructure providers may process connection metadata under their own policies.

**Recommended analysis structure:** group by participant, scenario and checkpoint; compare the four ratings before/after scenario and post-feedback; analyse revision outcome and multi-domain adaptation selections; qualitatively code `feeling_reason` and `experiment_suggestion`. Participation should be aligned with your approved consent protocol. This prototype does not instrument real-time adaptation sequence or first-decision latency inside the scenario itself.
