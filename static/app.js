/* AcquireFlow – Frontend */
let currentSearchId = null;
let pollInterval    = null;
let currentResults  = [];
let currentParams   = {};
let sortCol = "score", sortAsc = false;

// Range labels
document.getElementById("radius_miles").oninput = e =>
  document.getElementById("radius_val").textContent = e.target.value + " mi";
document.getElementById("min_director_age").oninput = e =>
  document.getElementById("dir_age_val").textContent = e.target.value;
document.getElementById("min_company_age").oninput = e =>
  document.getElementById("co_age_val").textContent = e.target.value + " yrs";

function sortBy(col) {
  if (sortCol === col) sortAsc = !sortAsc;
  else { sortCol = col; sortAsc = false; }
  renderTable(currentResults);
}

async function startSearch() {
  const sic = document.getElementById("sic_code").value.trim();
  const pc  = document.getElementById("postcode").value.trim();
  if (!sic || !pc) { alert("Please enter a SIC code and postcode."); return; }

  const payload = {
    sic_code:         sic,
    postcode:         pc,
    radius_miles:     parseFloat(document.getElementById("radius_miles").value),
    min_director_age: parseInt(document.getElementById("min_director_age").value),
    min_company_age:  parseInt(document.getElementById("min_company_age").value),
    max_results:      parseInt(document.getElementById("max_results").value),
  };

  const btn = document.getElementById("searchBtn");
  btn.disabled = true; btn.textContent = "Searching…";

  try {
    const res  = await fetch("/api/search", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Search failed");
    currentSearchId = data.search_id;
    showProgress();
    clearInterval(pollInterval);
    pollInterval = setInterval(pollStatus, 1500);
  } catch(err) {
    alert("Error: " + err.message);
    resetBtn();
  }
}

async function pollStatus() {
  if (!currentSearchId) return;
  try {
    const res  = await fetch(`/api/search/${currentSearchId}/status`);
    const data = await res.json();
    document.getElementById("progressBar").style.width = data.progress + "%";
    document.getElementById("progressMsg").textContent = data.message;
    document.getElementById("statFound").textContent     = data.total_found;
    document.getElementById("statProcessed").textContent = data.processed;
    document.getElementById("statMet").textContent       = data.criteria_met_count;
    if (data.status === "complete") {
      clearInterval(pollInterval);
      await loadResults(currentSearchId);
      await loadHistory();
      resetBtn();
    } else if (data.status === "error") {
      clearInterval(pollInterval);
      alert("Search failed: " + data.message);
      showEmptyState(); resetBtn();
    }
  } catch(e) { console.error("Poll error", e); }
}

async function loadResults(sid) {
  const res  = await fetch(`/api/search/${sid}/results`);
  const data = await res.json();
  currentResults = data.results || [];
  currentParams  = data.search_params || {};
  currentSearchId = sid;

  document.getElementById("resultsTitle").textContent = `Results — SIC ${currentParams.sic_code || ""}`;
  document.getElementById("badgeTotal").textContent   = `${data.total_results} companies`;
  document.getElementById("badgeCriteria").textContent = `${data.criteria_met} meet criteria`;

  const pb = document.getElementById("searchParamsBadges");
  pb.innerHTML = [
    ["Postcode", currentParams.postcode],
    ["Radius",   currentParams.radius_miles + " mi"],
    ["Min Dir. Age", currentParams.min_director_age],
    ["Min Co. Age",  currentParams.min_company_age + " yrs"],
  ].map(([k,v]) => `<span class="param-badge"><strong>${k}:</strong> ${v}</span>`).join("");

  showResults();
  renderTable(currentResults);
}

function renderTable(results) {
  const criteriaOnly = document.getElementById("criteriaOnlyToggle").checked;
  let rows = criteriaOnly ? results.filter(r => r.meets_all_criteria) : results;

  rows = [...rows].sort((a, b) => {
    let va = a[sortCol] ?? (sortAsc ? Infinity : -Infinity);
    let vb = b[sortCol] ?? (sortAsc ? Infinity : -Infinity);
    if (typeof va === "string") va = va.toLowerCase();
    if (typeof vb === "string") vb = vb.toLowerCase();
    return sortAsc ? (va < vb ? -1 : va > vb ? 1 : 0) : (va > vb ? -1 : va < vb ? 1 : 0);
  });

  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="no-res">No results match the current filter.</td></tr>`;
    return;
  }

  rows.forEach(r => {
    const s     = r.score || 0;
    const sCls  = s >= 7 ? "s-hi" : s >= 4 ? "s-md" : "s-lo";
    const dist  = r.distance_miles != null ? r.distance_miles.toFixed(1) + " mi" : "—";
    const age   = r.company_age_years != null ? r.company_age_years.toFixed(1) + " yrs" : "—";
    const dirs  = r.qualifying_director_count > 0
      ? `<span style="color:var(--green)">✓ ${r.qualifying_director_count}/${r.active_director_count}</span>`
      : `${r.active_director_count}`;
    const crit  = r.meets_all_criteria
      ? `<span class="crit-badge crit-yes">✓ Met</span>`
      : `<span class="crit-badge crit-no">—</span>`;
    const key   = JSON.stringify(r).replace(/'/g,"&#39;").replace(/"/g,"&quot;");
    const tr    = document.createElement("tr");
    if (r.meets_all_criteria) tr.className = "qualifying";
    tr.innerHTML = `
      <td><span class="score-pill ${sCls}">${s.toFixed(1)}</span></td>
      <td class="cn-cell">${esc(r.company_name)}<div class="cn-num">${r.company_number}</div></td>
      <td>${dist}</td>
      <td>${age}</td>
      <td>${dirs}</td>
      <td>${crit}</td>
      <td class="addr-cell" title="${esc(r.registered_address)}">${esc(r.registered_address)}</td>
      <td><button class="btn-det" onclick='openModal(${JSON.stringify(JSON.stringify(r))})'>Details</button></td>`;
    tbody.appendChild(tr);
  });
}

function openModal(jsonStr) {
  const r = JSON.parse(jsonStr);
  document.getElementById("modalCompanyName").textContent = r.company_name;
  document.getElementById("modalCompanyNum").textContent  =
    `${r.company_number} · Inc: ${r.incorporation_date || "Unknown"} · SIC: ${(r.sic_codes||[]).join(", ")||"—"}`;

  const active = (r.directors||[]).filter(d => d.is_active);
  let html = !active.length
    ? `<p style="color:var(--muted);font-size:13px">No active directors on record.</p>`
    : active.map(d => `
      <div class="dir-card ${d.meets_age_criteria ? "qual" : ""}">
        <div>
          <div class="dir-name">${esc(d.name)}</div>
          <div class="dir-meta">${esc(d.role)}${d.birth_month&&d.birth_year ? ` · DOB: ${d.birth_month}/${d.birth_year}` : ""}${d.appointed_on ? ` · Appointed: ${d.appointed_on}` : ""}</div>
        </div>
        ${d.estimated_age != null
          ? `<div class="dir-age ${d.meets_age_criteria ? "qual-age" : ""}">${d.estimated_age}</div>`
          : `<div class="dir-age no-age">N/A</div>`}
      </div>`).join("");

  if (r.score_breakdown) {
    const sb = r.score_breakdown;
    html += `
      <div style="margin-top:16px;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:14px">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-bottom:10px">Buy Score Breakdown</div>
        <div style="display:flex;gap:12px;margin-bottom:10px">
          ${[["Co. Age", sb.company_age_score, false],
             ["Directors", sb.director_score, false],
             ["Proximity", sb.proximity_score, false],
             ["Total", sb.total, true]].map(([label, val, isTotal]) => `
            <div style="flex:1;background:${isTotal ? "var(--green-bg)" : "var(--surface2)"};border-radius:6px;padding:8px;text-align:center">
              <div style="font-size:18px;font-weight:700;color:${isTotal ? "var(--green)" : "var(--accent)"}">${(val||0).toFixed(1)}</div>
              <div style="font-size:10px;color:${isTotal ? "var(--green)" : "var(--muted)"}">${label}</div>
            </div>`).join("")}
        </div>
        ${(sb.notes||[]).map(n => `<div style="font-size:11px;color:var(--muted);margin-bottom:3px">• ${esc(n)}</div>`).join("")}
      </div>`;
  }

  document.getElementById("modalContent").innerHTML = html;
  document.getElementById("directorModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("directorModal").classList.add("hidden");
}

function exportData(fmt) {
  if (!currentSearchId) return;
  const crit = document.getElementById("criteriaOnlyToggle").checked;
  window.location.href = `/api/export/${currentSearchId}?format=${fmt}&criteria_only=${crit}`;
}

async function loadHistory() {
  try {
    const rows = await (await fetch("/api/searches")).json();
    const el   = document.getElementById("historyList");
    if (!rows.length) {
      el.innerHTML = `<p style="font-size:12px;color:var(--muted)">No searches yet.</p>`; return;
    }
    el.innerHTML = rows.map(s => {
      const ts = s.created_at ? new Date(s.created_at+"Z").toLocaleString() : "";
      return `<div class="history-item" onclick="loadFromHistory('${s.search_id}','${s.status}')">
        <div class="hi-title">SIC ${s.sic_code||"?"} · ${s.postcode||"?"}</div>
        <div class="hi-meta"><span>${s.radius_miles||"?"} mi</span><span>${s.criteria_met_count||0} met</span><span>${ts}</span></div>
        <div class="hi-status ${s.status}">${s.status}</div>
      </div>`;
    }).join("");
  } catch(e) { console.error(e); }
}

async function loadFromHistory(sid, status) {
  if (status === "complete") { currentSearchId = sid; await loadResults(sid); }
  else if (status === "running") {
    currentSearchId = sid; showProgress();
    clearInterval(pollInterval);
    pollInterval = setInterval(pollStatus, 1500);
  }
}

async function clearCache() {
  const d = await (await fetch("/api/cache", {method:"DELETE"})).json();
  alert(d.message);
}

// ── API Key Management ──────────────────────────────────────────────────────

async function saveApiKey() {
  const input = document.getElementById("apiKeyInput");
  const key   = input.value.trim();
  if (!key) { alert("Please paste your API key."); return; }
  await _saveKey(key);
  input.value = "";
}

async function saveApiKeyFromSetup() {
  const input = document.getElementById("setupKeyInput");
  const key   = input.value.trim();
  if (!key) { alert("Please paste your API key."); return; }
  const ok = await _saveKey(key);
  if (ok) {
    hide("setupBanner");
    show("emptyState");
  }
}

async function _saveKey(key) {
  const btn = document.getElementById("saveKeyBtn");
  const setupBtn = document.getElementById("setupSaveBtn");
  [btn, setupBtn].forEach(b => { if(b) { b.disabled = true; b.textContent = "Saving…"; }});

  try {
    const res  = await fetch("/api/settings/apikey", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({api_key: key})
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to save");
    updateApiStatus(true);
    return true;
  } catch(err) {
    alert("Error saving API key: " + err.message);
    return false;
  } finally {
    [btn, setupBtn].forEach(b => { if(b) { b.disabled = false; }});
    if(btn) btn.textContent = "Save";
    if(setupBtn) setupBtn.textContent = "Activate";
  }
}

function updateApiStatus(configured) {
  const el = document.getElementById("apiStatus");
  if (configured) {
    el.textContent = "✓ Connected";
    el.className   = "api-status ok";
  } else {
    el.textContent = "⚠ No key";
    el.className   = "api-status err";
  }
}

// ── View helpers ────────────────────────────────────────────────────────────

function showProgress() {
  show("progressSection"); hide("emptyState"); hide("resultsSection"); hide("setupBanner");
  document.getElementById("progressBar").style.width = "0%";
  document.getElementById("progressMsg").textContent = "Initialising…";
  ["statFound","statProcessed","statMet"].forEach(id => document.getElementById(id).textContent = "0");
}
function showResults()   { show("resultsSection"); hide("emptyState"); hide("progressSection"); hide("setupBanner"); }
function showEmptyState(){ show("emptyState"); hide("progressSection"); hide("resultsSection"); hide("setupBanner"); }
function show(id){ document.getElementById(id).classList.remove("hidden"); }
function hide(id){ document.getElementById(id).classList.add("hidden"); }
function resetBtn(){
  const b = document.getElementById("searchBtn");
  b.disabled = false;
  b.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16"><circle cx="6.5" cy="6.5" r="5" stroke="white" stroke-width="1.5" fill="none"/><path d="M11 11 L15 15" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg> Search`;
}
function esc(s){ return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

// Init
(async () => {
  try {
    const d = await (await fetch("/api/health")).json();
    updateApiStatus(d.api_key_configured);
    if (!d.api_key_configured) {
      // First-time setup: show the setup banner, hide empty state
      show("setupBanner");
      hide("emptyState");
    }
  } catch(e){}
  await loadHistory();
})();

