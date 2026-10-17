import { cloudConfigured, submitToCloud } from './firebase-client.js';

const STORE_KEY = 'night_ride_lab_local_feedback_v1';
const PARTICIPANT_KEY = 'night_ride_lab_participant_v1';
const RATING_NAMES = ['safety', 'pleasantness', 'arousal', 'control', 'clarity', 'realism', 'engagement'];
const MUST_RATE = ['safety', 'pleasantness', 'arousal', 'control'];
const $ = (id) => document.getElementById(id);
const form = $('feedbackForm');
let startedAt = Date.now();
const touched = new Set();

function uuidV4() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (n) => n.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
function newId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return 'P-' + Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

function getLocalRecords() {
  try {
    const result = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    return Array.isArray(result) ? result : [];
  } catch { return []; }
}
function safeSetItem(key, value) {
  try { localStorage.setItem(key, value); return true; }
  catch { return false; }
}
function selectedValues(groupName) {
  return Array.from(document.querySelectorAll(`input[name="${groupName}"]:checked`), (input) => input.value);
}
function inputText(id) { return $(id).value.trim(); }
function setMessage(content, kind) {
  const el = $('message');
  el.textContent = content;
  el.className = `message show ${kind}`;
  el.focus({preventScroll:true});
  el.scrollIntoView({behavior:'smooth',block:'center'});
}
function clearMessage() { $('message').className = 'message'; $('message').textContent = ''; }
function refreshLocalCount() {
  const count = getLocalRecords().length;
  $('localCount').textContent = `${count} test record${count === 1 ? '' : 's'} saved on this device`;
}
function setParticipantId(id) {
  $('participantId').value = id;
  safeSetItem(PARTICIPANT_KEY, id);
}
function updateCheckpointUI() {
  const checkpoint = $('checkpoint').value;
  const isEnd = checkpoint === 'end';
  $('influencesBox').hidden = isEnd;
  $('decisionSection').hidden = isEnd;
  $('revisionSection').hidden = checkpoint !== 'after_feedback';
  $('decisionRevised').required = checkpoint === 'after_feedback';
  $('experimentRatings').hidden = !isEnd;
  $('scenarioId').required = checkpoint === 'after_scenario' || checkpoint === 'after_feedback';
  $('scenarioId').placeholder = isEnd ? 'Optional' : 'e.g., S03 or Round 4';
}
function updateRating(input) {
  const name = input.dataset.rating;
  touched.add(name);
  const output = document.querySelector(`[data-output="${name}"]`);
  output.textContent = `${input.value} / 5`;
  output.classList.remove('unrated');
}
function resetRatings() {
  touched.clear();
  for (const name of RATING_NAMES) {
    const input = $(name), output = document.querySelector(`[data-output="${name}"]`);
    input.value = '3'; output.textContent = 'Not rated'; output.classList.add('unrated');
  }
}
function getRating(name) { return touched.has(name) ? Number($(name).value) : null; }
function makeRecord() {
  const ratings = Object.fromEntries(RATING_NAMES.map((name) => [name, getRating(name)]));
  const isEnd = $('checkpoint').value === 'end';
  return {
    schema_version: '1.0',
    response_id: uuidV4(),
    participant_id: inputText('participantId'),
    scenario_id: inputText('scenarioId'),
    checkpoint: $('checkpoint').value,
    submitted_at_utc: new Date().toISOString(),
    form_elapsed_seconds: Math.min(36000, Math.round((Date.now() - startedAt) / 1000)),
    ratings,
    influences: isEnd ? [] : selectedValues('influences'),
    adaptations: isEnd ? [] : selectedValues('adaptations'),
    decision_revised: $('checkpoint').value === 'after_feedback' ? $('decisionRevised').value : 'not_applicable',
    feeling_reason: inputText('feelingReason'),
    journey_suggestion: inputText('journeySuggestion'),
    experiment_suggestion: inputText('experimentSuggestion')
  };
}
function resetAfterSubmission() {
  const participant = inputText('participantId');
  const scenario = inputText('scenarioId');
  const checkpoint = $('checkpoint').value;
  form.reset();
  $('participantId').value = participant;
  $('scenarioId').value = scenario;
  $('checkpoint').value = checkpoint;
  resetRatings();
  updateCheckpointUI();
  document.querySelectorAll('textarea').forEach((el) => updateCounter(el));
  startedAt = Date.now();
}
function updateCounter(el) {
  const span = document.querySelector(`[data-count-for="${el.id}"]`);
  if (span) span.textContent = `${el.value.length} / ${el.maxLength}`;
}
function validateExtra() {
  if (!form.reportValidity()) return false;
  if ($('scenarioId').required && !inputText('scenarioId')) {
    $('scenarioId').focus(); setMessage('Please enter a scenario or round number for this checkpoint.', 'error'); return false;
  }
  for (const name of MUST_RATE) {
    if (!touched.has(name)) {
      $(name).focus();
      setMessage('Please move all four feeling sliders to record your answers. A middle rating (3) is fine; simply move the slider away and back.', 'error');
      return false;
    }
  }
  return true;
}
function csvCell(value) {
  let text = Array.isArray(value) ? value.join('; ') : value == null ? '' : String(value);
  // Prevent CSV injection if a free-text response is opened in spreadsheet software.
  if (/^[\s]*[=+\-@]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
function downloadFile(content, mime, name) {
  const link = document.createElement('a');
  const url = URL.createObjectURL(new Blob([content], {type: mime}));
  link.href = url; link.download = name;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportCsv() {
  const records = getLocalRecords();
  if (!records.length) return setMessage('There are no test records to export.', 'error');
  const columns = ['schema_version', 'response_id', 'participant_id', 'scenario_id', 'checkpoint', 'submitted_at_utc', 'form_elapsed_seconds',
    ...RATING_NAMES.map((name) => `rating_${name}`), 'influences', 'adaptations', 'decision_revised', 'feeling_reason', 'journey_suggestion', 'experiment_suggestion'];
  const lines = [columns.map(csvCell).join(',')];
  for (const record of records) {
    const flattened = {...record, ...Object.fromEntries(RATING_NAMES.map((name) => [`rating_${name}`, record.ratings?.[name]]))};
    lines.push(columns.map((key) => csvCell(flattened[key])).join(','));
  }
  downloadFile('\uFEFF' + lines.join('\r\n'), 'text/csv;charset=utf-8', 'night-ride-feedback-test.csv');
}
function setMode() {
  $('modeBadge').textContent = cloudConfigured ? '● Live collection' : '● Local test mode';
  $('modeBadge').classList.toggle('live', cloudConfigured);
  $('demoNotice').hidden = cloudConfigured;
  $('localTools').hidden = cloudConfigured;
  refreshLocalCount();
}
function init() {
  setMode();
  const query = new URLSearchParams(location.search);
  const pid = query.get('pid');
  const stored = (() => { try { return localStorage.getItem(PARTICIPANT_KEY); } catch { return ''; }})();
  const isSafePid = (v) => /^[A-Za-z0-9_-]{4,36}$/.test(v || '');
  setParticipantId(isSafePid(pid) ? pid : isSafePid(stored) ? stored : newId());
  const scenario = query.get('scenario') || '';
  if (scenario.length <= 40) $('scenarioId').value = scenario;
  const stage = query.get('stage');
  if (['before', 'after_scenario', 'after_feedback', 'end'].includes(stage)) $('checkpoint').value = stage;
  updateCheckpointUI();
  $('checkpoint').addEventListener('change', () => { updateCheckpointUI(); clearMessage(); });
  $('participantId').addEventListener('change', () => { if ($('participantId').checkValidity()) setParticipantId(inputText('participantId')); });
  $('newParticipant').addEventListener('click', () => {
    if (confirm('Start with a new anonymous participant code? Use the same code across rounds for one participant.')) setParticipantId(newId());
  });
  for (const slider of document.querySelectorAll('input[data-rating]')) slider.addEventListener('input', () => updateRating(slider));
  document.querySelectorAll('textarea').forEach((el) => el.addEventListener('input', () => updateCounter(el)));
  document.querySelectorAll('input[name="adaptations"]').forEach((input) => input.addEventListener('change', () => {
    if (!input.checked) return;
    if (input.value === 'continue') document.querySelectorAll('input[name="adaptations"]:not([value="continue"])').forEach((other) => other.checked = false);
    else document.querySelector('input[name="adaptations"][value="continue"]').checked = false;
  }));
  $('exportCsv').addEventListener('click', exportCsv);
  $('exportJson').addEventListener('click', () => {
    const records = getLocalRecords();
    if (!records.length) return setMessage('There are no test records to export.', 'error');
    downloadFile(JSON.stringify(records, null, 2), 'application/json', 'night-ride-feedback-test.json');
  });
  $('clearLocal').addEventListener('click', () => {
    if (confirm('Permanently erase all locally saved TEST responses on this device? Export them first if needed.')) {
      localStorage.removeItem(STORE_KEY); refreshLocalCount(); setMessage('Local test responses erased.', 'success');
    }
  });
}
form.addEventListener('submit', async (event) => {
  event.preventDefault(); clearMessage();
  if (!validateExtra()) return;
  const record = makeRecord();
  const submit = $('submitButton');
  submit.disabled = true; submit.textContent = cloudConfigured ? 'Sending securely…' : 'Saving test response…';
  try {
    if (cloudConfigured) {
      const receipt = await submitToCloud(record);
      resetAfterSubmission();
      setMessage(`Thank you — your feedback was submitted to the research database.\nReceipt ID: ${receipt}\nKeep this receipt if you need to identify the response to the research team.`, 'success');
    } else {
      const records = getLocalRecords(); records.push(record);
      if (!safeSetItem(STORE_KEY, JSON.stringify(records))) throw new Error('Browser storage is unavailable or full. Your answers were not saved.');
      resetAfterSubmission(); refreshLocalCount();
      setMessage(`Test response saved on THIS DEVICE ONLY (record ${record.response_id}). It was not sent to the researcher. Export the test records below before leaving or clearing your browser data.`, 'success');
    }
  } catch (err) {
    console.error('Feedback submission failed:', err);
    setMessage(`Submission failed: ${err.message || 'Please check your internet connection and try again.'}\nYour answers remain on screen so you can retry.`, 'error');
  } finally {
    submit.disabled = false; submit.innerHTML = 'Submit feedback <span aria-hidden="true">→</span>';
  }
});
init();
