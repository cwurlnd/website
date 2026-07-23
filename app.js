import { firebaseConfig, isConfigured } from "./firebase-config.js?v=3";

/* ================= Seed data ================= */
/* This is the starting lineup. Once Firebase is connected, this only
   matters the very first time the database is empty — after that,
   edit lineups from the "Manage Lineups" button on the site itself. */
const SEED = {
  roster: {
    nd: ["Grant", "Smoge", "Brad", "Jacob", "Luke", "Corey", "TBD"],
    toga: ["David", "Derrick", "Kyrek", "Sean", "Kieran", "TBD"],
  },
  matches: {
    match1: { teeTime: "9:30 AM", nd: ["Grant", "Smoge"], toga: ["David", "Derrick"], holes: {} },
    match2: { teeTime: "9:40 AM", nd: ["Brad", "Jacob"], toga: ["Kyrek", "Sean"], holes: {} },
    match3: { teeTime: "9:50 AM", nd: ["Luke", "Corey"], toga: ["Kieran", "TBD"], holes: {} },
  },
};

const ROMAN = { match1: "I", match2: "II", match3: "III" };

let state = deepClone(SEED);
let dbRef = null;
let dbSet = null;
let editing = false;

function deepClone(o) {
  return JSON.parse(JSON.stringify(o));
}

/* ================= Firebase (optional live sync) ================= */
async function initFirebase() {
  if (!isConfigured) {
    showBanner(
      "Live sync isn't connected yet — changes will only show up on this device. See README.md to connect Firebase (about 2 minutes)."
    );
    return;
  }
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
    const { getDatabase, ref, onValue, set, get } = await import(
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js"
    );

    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    const wurlRef = ref(db, "wurlCup");
    dbRef = wurlRef;
    dbSet = set;

    const snapshot = await get(wurlRef);
    if (!snapshot.exists()) {
      await set(wurlRef, SEED);
    }

    onValue(wurlRef, (snap) => {
      const val = snap.val();
      if (val) {
        state = val;
        render(state);
      }
    });
  } catch (err) {
    console.error("Firebase error:", err);
    showBanner("Couldn't connect to live sync — double check firebase-config.js. Working locally on this device for now.");
  }
}

function showBanner(msg) {
  const el = document.getElementById("sync-banner");
  el.textContent = msg;
  el.classList.remove("hidden");
}

/* ================= Writing data ================= */
async function persist(newState) {
  state = newState;
  render(state); // optimistic local update, syncs to everyone else once saved
  if (dbRef && dbSet) {
    try {
      await dbSet(dbRef, state);
    } catch (err) {
      console.error(err);
      showBanner("Couldn't save that update — check your connection and try again.");
    }
  }
}

function setHole(matchId, holeNum, result) {
  const next = deepClone(state);
  if (!next.matches[matchId].holes) {
    next.matches[matchId].holes = {};
  }
  const current = next.matches[matchId].holes[holeNum];
  next.matches[matchId].holes[holeNum] = current === result ? null : result;
  persist(next);
}

function resetMatch(matchId) {
  if (!confirm("Reset all holes for this match?")) return;
  const next = deepClone(state);
  if (next.matches && next.matches[matchId]) {
    next.matches[matchId].holes = {};
  }
  persist(next);
}

/* ================= Match-play scoring ================= */
function computeMatch(holes = {}) {
  let nd = 0,
    toga = 0,
    lastHole = 0;
  const safeHoles = holes || {};
  for (let h = 1; h <= 9; h++) {
    const r = safeHoles[h];
    if (!r) continue;
    lastHole = h;
    if (r === "ND") nd++;
    else if (r === "Toga") toga++;
  }
  const diff = nd - toga;
  const remaining = 9 - lastHole;
  let status,
    finished = false,
    points = { nd: 0, toga: 0 };

  if (lastHole === 0) {
    status = "Not yet underway";
  } else if (remaining > 0 && Math.abs(diff) > remaining) {
    finished = true;
    const winner = diff > 0 ? "ND" : "Toga";
    status = `${winner === "ND" ? "Notre Dame" : "Saratoga"} wins ${Math.abs(diff)}&${remaining}`;
    points[winner === "ND" ? "nd" : "toga"] = 1;
  } else if (lastHole === 9) {
    finished = true;
    if (diff === 0) {
      status = "Match Halved";
      points.nd = 0.5;
      points.toga = 0.5;
    } else {
      const winner = diff > 0 ? "ND" : "Toga";
      status = `${winner === "ND" ? "Notre Dame" : "Saratoga"} wins 1 up`;
      points[winner === "ND" ? "nd" : "toga"] = 1;
    }
  } else {
    if (diff === 0) status = `All Square thru ${lastHole}`;
    else {
      const leader = diff > 0 ? "Notre Dame" : "Saratoga";
      status = `${leader} ${Math.abs(diff)} UP thru ${lastHole}`;
    }
  }
  return { status, finished, points };
}

/* ================= Rendering ================= */
function render(data) {
  renderScoreboard(data);
  renderMatches(data);
  renderRoster(data);
}

function renderScoreboard(data) {
  let ndTotal = 0,
    togaTotal = 0,
    finishedCount = 0,
    anyPlayed = false;

  Object.values(data.matches).forEach((m) => {
    const holes = m.holes || {};
    if (Object.values(holes).some(Boolean)) anyPlayed = true;
    const { points, finished } = computeMatch(holes);
    ndTotal += points.nd;
    togaTotal += points.toga;
    if (finished) finishedCount++;
  });

  document.getElementById("score-nd").textContent = formatPoints(ndTotal);
  document.getElementById("score-toga").textContent = formatPoints(togaTotal);

  const statusEl = document.getElementById("cup-status");
  const jacketEl = document.getElementById("jacket-line");

  if (!anyPlayed) {
    statusEl.textContent = "Matches not yet underway";
    jacketEl.textContent = "";
  } else if (finishedCount < 3) {
    statusEl.textContent =
      ndTotal === togaTotal ? "All Square" : ndTotal > togaTotal ? "Notre Dame leads" : "Saratoga leads";
    jacketEl.textContent = "";
  } else if (ndTotal === togaTotal) {
    statusEl.textContent = "The Cup is Shared";
    jacketEl.textContent = "1½ apiece — the Cup is shared, and Kieran buys the next round.";
  } else {
    const winner = ndTotal > togaTotal ? "Notre Dame" : "Saratoga";
    statusEl.textContent = `${winner} Wins the Cup`;
    jacketEl.textContent = `🏆 ${winner} claims the green jacket.`;
  }
}

function formatPoints(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function renderMatches(data) {
  const container = document.getElementById("matches-list");
  container.innerHTML = "";

  Object.entries(data.matches).forEach(([matchId, m]) => {
    const { status, finished } = computeMatch(m.holes || {});

    const card = document.createElement("div");
    card.className = "match-card";
    card.innerHTML = `
      <div class="match-head">
        <span class="match-num">Match ${ROMAN[matchId]}</span>
        <span class="match-time">${escapeHtml(m.teeTime)}</span>
      </div>
      <div class="match-players">
        <div class="player-pair">
          <span class="team-tag nd">Notre Dame</span>
          <p class="player-names">${m.nd.map(escapeHtml).join(" &amp; ")}</p>
        </div>
        <span class="match-vs">vs</span>
        <div class="player-pair right">
          <span class="team-tag toga">Saratoga</span>
          <p class="player-names">${m.toga.map(escapeHtml).join(" &amp; ")}</p>
        </div>
      </div>
      <p class="match-status ${finished ? "finished" : ""}">${status}</p>
      <div class="holes-grid" data-match="${matchId}"></div>
      <button class="match-reset" data-match="${matchId}">Reset holes</button>
    `;

    const grid = card.querySelector(".holes-grid");
    for (let h = 1; h <= 9; h++) {
      const result = (m.holes || {})[h];
      const cell = document.createElement("div");
      cell.className = "hole-cell";
      cell.innerHTML = `
        <span class="hole-num">${h}</span>
        <div class="hole-toggle">
          <button class="hole-btn nd ${result === "ND" ? "active" : ""}" data-hole="${h}" data-result="ND" title="Notre Dame wins hole ${h}">ND</button>
          <button class="hole-btn half ${result === "Halved" ? "active" : ""}" data-hole="${h}" data-result="Halved" title="Hole ${h} halved">½</button>
          <button class="hole-btn toga ${result === "Toga" ? "active" : ""}" data-hole="${h}" data-result="Toga" title="Saratoga wins hole ${h}">TG</button>
        </div>
      `;
      grid.appendChild(cell);
    }
    container.appendChild(card);
  });

  container.querySelectorAll(".hole-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const matchId = btn.closest(".holes-grid").dataset.match;
      setHole(matchId, btn.dataset.hole, btn.dataset.result);
    });
  });
  container.querySelectorAll(".match-reset").forEach((btn) => {
    btn.addEventListener("click", () => resetMatch(btn.dataset.match));
  });
}

function assignedNames(data) {
  const nd = new Set();
  const toga = new Set();
  Object.values(data.matches).forEach((m) => {
    m.nd.forEach((n) => nd.add(n));
    m.toga.forEach((n) => toga.add(n));
  });
  return { nd, toga };
}

function renderRoster(data) {
  if (editing) return; // don't clobber an open edit form
  const assigned = assignedNames(data);
  const view = document.getElementById("lineups-view");

  const col = (label, cls, names, assignedSet) => `
    <div class="lineup-col ${cls}">
      <h3>${label}</h3>
      <ul>
        ${names
          .map(
            (n) =>
              `<li><span>${escapeHtml(n)}</span>${assignedSet.has(n) ? "" : '<span class="alt-tag">Alt</span>'}</li>`
          )
          .join("")}
      </ul>
    </div>
  `;

  view.innerHTML =
    col("Notre Dame", "nd", data.roster.nd, assigned.nd) + col("Saratoga", "toga", data.roster.toga, assigned.toga);
}

/* ================= Countdown ================= */
function startCountdown() {
  const target = new Date("2026-08-15T09:30:00-04:00").getTime();
  const els = {
    d: document.getElementById("cd-days"),
    h: document.getElementById("cd-hours"),
    m: document.getElementById("cd-mins"),
    s: document.getElementById("cd-secs"),
  };
  const caption = document.getElementById("countdown-caption");

  function tick() {
    const diff = target - Date.now();
    if (diff <= 0) {
      els.d.textContent = els.h.textContent = els.m.textContent = els.s.textContent = "0";
      caption.textContent = "it's tee time";
      return;
    }
    els.d.textContent = Math.floor(diff / 86400000);
    els.h.textContent = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, "0");
    els.m.textContent = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
    els.s.textContent = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
  }
  tick();
  setInterval(tick, 1000);
}

/* ================= Lineup editing ================= */
function buildEditPanel(data) {
  const panel = document.getElementById("lineups-edit");
  panel.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "edit-panel";

  wrap.appendChild(buildRosterEditBlock("Notre Dame roster", "nd", data.roster.nd));
  wrap.appendChild(buildRosterEditBlock("Saratoga roster", "toga", data.roster.toga));
  ["match1", "match2", "match3"].forEach((mid) => wrap.appendChild(buildMatchEditBlock(mid, data)));

  const actions = document.createElement("div");
  actions.className = "edit-actions";
  actions.innerHTML = `<button class="save-btn" id="save-lineups">Save Changes</button>
    <button class="cancel-btn" id="cancel-lineups">Cancel</button>`;
  wrap.appendChild(actions);
  panel.appendChild(wrap);

  panel.querySelector("#save-lineups").addEventListener("click", saveLineupEdits);
  panel.querySelector("#cancel-lineups").addEventListener("click", closeEditor);
}

function buildRosterEditBlock(title, key, names) {
  const block = document.createElement("div");
  block.className = "edit-block";
  block.dataset.roster = key;
  block.innerHTML = `<h4>${title}</h4>`;
  names.forEach((n) => block.appendChild(buildRosterRow(n)));
  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "add-btn";
  addBtn.textContent = "+ Add player";
  addBtn.addEventListener("click", () => block.insertBefore(buildRosterRow(""), addBtn));
  block.appendChild(addBtn);
  return block;
}

function buildRosterRow(name) {
  const row = document.createElement("div");
  row.className = "edit-row";
  row.innerHTML = `<input type="text" value="${escapeAttr(name)}" placeholder="Player name">
    <button type="button" class="remove-btn" title="Remove">×</button>`;
  row.querySelector(".remove-btn").addEventListener("click", () => row.remove());
  return row;
}

function buildMatchEditBlock(matchId, data) {
  const m = data.matches[matchId];
  const block = document.createElement("div");
  block.className = "edit-block";
  block.dataset.match = matchId;
  block.innerHTML = `
    <h4>Match ${ROMAN[matchId]}</h4>
    <div class="match-edit-grid">
      <div class="tee-input">
        <span class="field-label">Tee time</span>
        <input type="text" class="tee-time" value="${escapeAttr(m.teeTime)}">
      </div>
      <div><span class="field-label">Notre Dame</span><select class="nd1"></select></div>
      <div><span class="field-label">&nbsp;</span><select class="nd2"></select></div>
      <div><span class="field-label">Saratoga</span><select class="toga1"></select></div>
      <div><span class="field-label">&nbsp;</span><select class="toga2"></select></div>
    </div>
  `;
  fillSelect(block.querySelector(".nd1"), data.roster.nd, m.nd[0]);
  fillSelect(block.querySelector(".nd2"), data.roster.nd, m.nd[1]);
  fillSelect(block.querySelector(".toga1"), data.roster.toga, m.toga[0]);
  fillSelect(block.querySelector(".toga2"), data.roster.toga, m.toga[1]);
  return block;
}

function fillSelect(select, names, selected) {
  select.innerHTML = names
    .map((n) => `<option value="${escapeAttr(n)}" ${n === selected ? "selected" : ""}>${escapeHtml(n)}</option>`)
    .join("");
}

function saveLineupEdits() {
  const panel = document.getElementById("lineups-edit");
  const next = deepClone(state);

  ["nd", "toga"].forEach((key) => {
    const block = panel.querySelector(`[data-roster="${key}"]`);
    const names = [...block.querySelectorAll("input[type=text]")].map((i) => i.value.trim()).filter(Boolean);
    next.roster[key] = names;
  });

  ["match1", "match2", "match3"].forEach((mid) => {
    const block = panel.querySelector(`[data-match="${mid}"]`);
    next.matches[mid].teeTime = block.querySelector(".tee-time").value.trim();
    next.matches[mid].nd = [block.querySelector(".nd1").value, block.querySelector(".nd2").value];
    next.matches[mid].toga = [block.querySelector(".toga1").value, block.querySelector(".toga2").value];
  });

  closeEditor();
  persist(next);
}

function closeEditor() {
  editing = false;
  document.getElementById("lineups-edit").classList.add("hidden");
  document.getElementById("lineups-view").classList.remove("hidden");
  document.getElementById("manage-toggle").textContent = "Manage Lineups";
  render(state);
}

function openEditor() {
  editing = true;
  buildEditPanel(state);
  document.getElementById("lineups-edit").classList.remove("hidden");
  document.getElementById("lineups-view").classList.add("hidden");
  document.getElementById("manage-toggle").textContent = "Close Editor";
}

/* ================= Utilities ================= */
function escapeHtml(str) {
  return String(str).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}
function escapeAttr(str) {
  return escapeHtml(str);
}

/* ================= Init ================= */
document.getElementById("manage-toggle").addEventListener("click", () => (editing ? closeEditor() : openEditor()));

render(state);
startCountdown();
initFirebase();
