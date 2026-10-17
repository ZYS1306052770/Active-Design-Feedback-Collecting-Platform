#!/usr/bin/env python3
"""Private researcher export: Firestore 'study_feedback' -> CSV + JSON.

Never upload your Firebase service-account key or participant exports to GitHub.
Requires: pip install firebase-admin
Usage: python export_firestore.py --project YOUR_FIREBASE_PROJECT_ID
Authentication: set GOOGLE_APPLICATION_CREDENTIALS to an administrator service-account JSON key
stored OUTSIDE this repository (or configure Application Default Credentials).
"""
from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime, timezone
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, firestore

RATINGS = ('safety', 'pleasantness', 'arousal', 'control', 'clarity', 'realism', 'engagement')
FIELDS = [
    'schema_version', 'response_id', 'participant_id', 'scenario_id', 'checkpoint',
    'submitted_at_utc', 'form_elapsed_seconds',
    *(f'rating_{name}' for name in RATINGS),
    'influences', 'adaptations', 'decision_revised',
    'feeling_reason', 'journey_suggestion', 'experiment_suggestion',
]


def protect_spreadsheet(text: str) -> str:
    """Avoid spreadsheet formulas from untrusted written feedback."""
    if text.lstrip().startswith(('=', '+', '-', '@')):
        return "'" + text
    return text


def flatten(record: dict) -> dict:
    out = {field: '' for field in FIELDS}
    for field in FIELDS:
        if field.startswith('rating_'):
            value = record.get('ratings', {}).get(field[7:])
        else:
            value = record.get(field, '')
        if isinstance(value, list):
            value = '; '.join(map(str, value))
        if value is None:
            value = ''
        out[field] = protect_spreadsheet(str(value)) if isinstance(value, str) else value
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description='Export anonymous research feedback from Firestore')
    parser.add_argument('--project', required=True, help='Firebase project ID')
    parser.add_argument('--output', default='exports', help='Local output directory (do not publish)')
    args = parser.parse_args()

    firebase_admin.initialize_app(credentials.ApplicationDefault(), {'projectId': args.project})
    db = firestore.client()
    documents = list(db.collection('study_feedback').stream())
    records = [doc.to_dict() for doc in documents]

    directory = Path(args.output).resolve()
    directory.mkdir(parents=True, exist_ok=True)
    suffix = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    csv_path = directory / f'feedback_{suffix}.csv'
    json_path = directory / f'feedback_{suffix}.json'

    # Exclude Firebase Auth UID and Firestore server-side created_at from outputs.
    # response_id and submitted_at_utc are retained for identifying responses.
    clean_records = [{key: item.get(key) for key in [
        'schema_version', 'response_id', 'participant_id', 'scenario_id',
        'checkpoint', 'submitted_at_utc', 'form_elapsed_seconds',
        'ratings', 'influences', 'adaptations', 'decision_revised',
        'feeling_reason', 'journey_suggestion', 'experiment_suggestion'
    ]} for item in records]
    with csv_path.open('w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(flatten(record) for record in clean_records)
    with json_path.open('w', encoding='utf-8') as f:
        json.dump(clean_records, f, ensure_ascii=False, indent=2)

    print(f'Exported {len(records)} responses. Files saved locally:')
    print('  ', csv_path)
    print('  ', json_path)
    print('Do NOT commit participant exports to GitHub.')


if __name__ == '__main__':
    main()
