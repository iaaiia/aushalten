const HF_SDK_URL = "https://esm.sh/@huggingface/inference@4";
let InferenceClient = null;

const TOKEN_KEY = 'eg_hf_token';
const TXT2IMG_MODEL = 'black-forest-labs/FLUX.1-schnell';
const IMG2IMG_MODEL = 'black-forest-labs/FLUX.1-Kontext-dev';

const state = {
  geoFile: null,
  history: [], // { url, prompt } — in-memory for this session only
};

// ── Settings sheet / token ──────────────────────────────────────────────
function openSettings() {
  document.getElementById('token-input').value = localStorage.getItem(TOKEN_KEY) || '';
  document.getElementById('settings-sheet').classList.add('open');
  document.getElementById('overlay-bg').classList.add('open');
}
function closeSettings() {
  document.getElementById('settings-sheet').classList.remove('open');
  document.getElementById('overlay-bg').classList.remove('open');
}
function saveToken() {
  const val = document.getElementById('token-input').value.trim();
  if (val) localStorage.setItem(TOKEN_KEY, val);
  else localStorage.removeItem(TOKEN_KEY);
  closeSettings();
}
window.openSettings = openSettings;
window.closeSettings = closeSettings;
window.saveToken = saveToken;

// ── Bildgeometrie upload ────────────────────────────────────────────────
const geoInput = document.getElementById('geo-input');
geoInput.addEventListener('change', () => {
  const file = geoInput.files[0];
  if (!file) return;
  state.geoFile = file;
  const preview = document.getElementById('geo-preview');
  preview.src = URL.createObjectURL(file);
  preview.classList.remove('hidden');
  document.getElementById('geo-hint').classList.add('hidden');
});

// ── Helpers ──────────────────────────────────────────────────────────────
function roundTo64(n) {
  return Math.max(256, Math.round(n / 64) * 64);
}

function getDimensions() {
  const [w, h] = document.getElementById('ratio-select').value.split('x').map(Number);
  const scale = parseFloat(document.getElementById('size-select').value);
  return { width: roundTo64(w * scale), height: roundTo64(h * scale) };
}

function setResult(html) {
  document.getElementById('result-box').innerHTML = html;
}

function showSpinner() {
  setResult(`<div class="spinner"></div><div class="result-status">wird generiert…</div>`);
}

function showError(msg) {
  setResult(`<div class="error-text">${msg}</div>`);
}

function showImage(url) {
  setResult(`
    <img class="result-image" src="${url}" alt="">
    <div class="result-actions">
      <a class="result-download" href="${url}" download="entwerfen.png">herunterladen</a>
    </div>
  `);
}

function addToHistory(url, prompt) {
  state.history.unshift({ url, prompt });
  state.history = state.history.slice(0, 8);
  renderHistory();
}

function renderHistory() {
  const strip = document.getElementById('history-strip');
  strip.innerHTML = state.history.map(h =>
    `<img class="history-thumb" src="${h.url}" title="${h.prompt.replace(/"/g, '&quot;')}">`
  ).join('');
  strip.querySelectorAll('.history-thumb').forEach((el, i) => {
    el.addEventListener('click', () => showImage(state.history[i].url));
  });
}

// ── Generate ─────────────────────────────────────────────────────────────
async function generate() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    openSettings();
    return;
  }

  const userPrompt = document.getElementById('prompt-input').value.trim();
  if (!userPrompt) {
    showError('Bitte einen Prompt eingeben.');
    return;
  }

  const categoryPrefix = document.getElementById('category-select').value;
  const fullPrompt = `${categoryPrefix}, ${userPrompt}`;
  const { width, height } = getDimensions();

  const btn = document.getElementById('generate-btn');
  btn.disabled = true;
  showSpinner();

  try {
    if (!InferenceClient) {
      try {
        ({ InferenceClient } = await import(HF_SDK_URL));
      } catch {
        throw new Error('Konnte die Hugging-Face-Bibliothek nicht laden. Internetverbindung prüfen und erneut versuchen.');
      }
    }
    const client = new InferenceClient(token);
    let blob;
    try {
      if (state.geoFile) {
        blob = await client.imageToImage({
          model: IMG2IMG_MODEL,
          inputs: state.geoFile,
          parameters: { prompt: fullPrompt },
        });
      } else {
        blob = await client.textToImage({
          model: TXT2IMG_MODEL,
          inputs: fullPrompt,
          parameters: { width, height },
        });
      }
    } catch (err) {
      throw new Error((err?.message || 'Generierung fehlgeschlagen.') +
        ' Falls das Modell noch lädt: kurz warten und erneut versuchen.');
    }
    const url = URL.createObjectURL(blob);
    showImage(url);
    addToHistory(url, userPrompt);
  } catch (err) {
    console.error(err);
    showError(err?.message || 'Generierung fehlgeschlagen.');
  } finally {
    btn.disabled = false;
  }
}
window.generate = generate;

document.getElementById('prompt-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    generate();
  }
});
