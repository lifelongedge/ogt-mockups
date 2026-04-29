/* Edge S2 — Tech Lab proposal mock interactions
   - Idea 1: synthetic chart on user-typed symbol
   - Idea 2: Owl-says vs You-say quiz, persistent score
   - Idea 5: cohort vote, persistent tally (real interaction)
*/

const BUILD = 'proposal-2026-04-29a';
console.log('[techu-proposal] build ' + BUILD);
window.__edgeBuild = BUILD;

(function () {
  'use strict';

  // ---------- IDEA 1: synthetic chart on entered symbol ----------
  const i1Symbol = document.getElementById('i1Symbol');
  const i1Load = document.getElementById('i1Load');
  const i1Chart = document.getElementById('i1Chart');
  const i1ExcVal = document.getElementById('i1ExcVal');

  function hash(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h;
  }
  function rng(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }
  function regress(arr, n) {
    const out = new Array(arr.length).fill(null);
    for (let i = n - 1; i < arr.length; i++) {
      let sx = 0, sy = 0, sxy = 0, sxx = 0;
      for (let k = 0; k < n; k++) {
        const x = k, y = arr[i - n + 1 + k];
        sx += x; sy += y; sxy += x * y; sxx += x * x;
      }
      const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
      const intercept = (sy - slope * sx) / n;
      out[i] = intercept + slope * (n - 1);
    }
    return out;
  }
  function drawI1(symbol) {
    const sym = (symbol || 'TSLA').toUpperCase().trim() || 'TSLA';
    const r = rng(hash(sym) || 1);
    const N = 180;
    const arr = [];
    let p = 100 + r() * 80;
    for (let i = 0; i < N; i++) {
      const drift = Math.sin((i + hash(sym) % 50) / 18) * 0.4 + (r() - 0.5) * 1.4;
      p = Math.max(5, p + drift);
      arr.push(p);
    }
    const rl10 = regress(arr, 10);
    const rl270 = regress(arr, Math.min(60, N - 1)); // shortened proxy for mock

    const W = 480, H = 180;
    const pad = 8;
    const lo = Math.min(...arr), hi = Math.max(...arr);
    const sx = (i) => pad + (i / (N - 1)) * (W - 2 * pad);
    const sy = (v) => H - pad - ((v - lo) / (hi - lo + 1e-9)) * (H - 2 * pad);

    function path(series, color, width) {
      let d = '';
      for (let i = 0; i < series.length; i++) {
        if (series[i] == null) continue;
        d += (d ? ' L ' : 'M ') + sx(i).toFixed(1) + ' ' + sy(series[i]).toFixed(1);
      }
      return '<path d="' + d + '" stroke="' + color + '" stroke-width="' + width + '" fill="none" />';
    }

    let svg = '<rect width="' + W + '" height="' + H + '" fill="#03050f"/>';
    svg += path(arr, '#cdd5e0', 1.0);
    svg += path(rl10, '#4fcf94', 1.6);
    svg += path(rl270, '#5b8fb8', 1.6);
    svg += '<text x="10" y="14" fill="#8a93a8" font-size="10" font-family="Inter, sans-serif">' + sym + ' · synthetic 180d</text>';
    i1Chart.innerHTML = svg;

    // Excursion = (RL10_last - RL270_last) in σ of price
    const last10 = rl10[N - 1], last270 = rl270[N - 1];
    let mean = 0; for (const v of arr) mean += v; mean /= N;
    let varv = 0; for (const v of arr) varv += (v - mean) * (v - mean); varv /= N;
    const sd = Math.sqrt(varv) || 1;
    const exc = (last10 - last270) / sd;
    const sign = exc >= 0 ? '+' : '−';
    i1ExcVal.textContent = sign + Math.abs(exc).toFixed(2) + 'σ';
    const tag = document.querySelector('.prop-readout-tag');
    if (tag) {
      const a = Math.abs(exc);
      tag.textContent = a > 2 ? 'Edge of the World · max pain'
        : a > 1 ? 'stretched · floodplain'
        : a > 0.3 ? 'in the river' : 'flat · river center';
    }
  }
  if (i1Load && i1Symbol && i1Chart) {
    i1Load.addEventListener('click', () => drawI1(i1Symbol.value));
    i1Symbol.addEventListener('keydown', (e) => { if (e.key === 'Enter') drawI1(i1Symbol.value); });
    drawI1(i1Symbol.value);
  }

  // ---------- IDEA 2: Owl-says vs You-say ----------
  const QUIZ_KEY = 'edge.techu.proposal.quiz';
  const i2Mock = document.getElementById('i2Mock');
  const i2Result = document.getElementById('i2Result');
  const i2Stats = document.getElementById('i2Stats');

  // The "right" zone for SPY in this prompt — for the mock, lock to floodplain.
  const QUIZ_ANSWER = 'floodplain';
  const ZONE_LABEL = { river: 'River', floodplain: 'Floodplain', edge: 'Edge of the World' };

  function loadQuiz() {
    try { return JSON.parse(localStorage.getItem(QUIZ_KEY) || '{"asked":0,"correct":0,"last":null}'); }
    catch (e) { return { asked: 0, correct: 0, last: null }; }
  }
  function saveQuiz(s) {
    try { localStorage.setItem(QUIZ_KEY, JSON.stringify(s)); } catch (e) { /* ignore */ }
  }
  function paintQuizStats() {
    const s = loadQuiz();
    if (!i2Stats) return;
    i2Stats.textContent = 'Calibration so far · ' + s.correct + ' / ' + s.asked + ' correct';
  }
  if (i2Mock) {
    paintQuizStats();
    i2Mock.querySelectorAll('.prop-quiz-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        // Reset prior styling so trader can re-try
        i2Mock.querySelectorAll('.prop-quiz-btn').forEach((b) => b.classList.remove('correct', 'wrong'));
        const zone = btn.dataset.zone;
        const right = zone === QUIZ_ANSWER;
        btn.classList.add(right ? 'correct' : 'wrong');
        if (!right) {
          const correctBtn = i2Mock.querySelector('[data-zone="' + QUIZ_ANSWER + '"]');
          if (correctBtn) correctBtn.classList.add('correct');
        }
        const s = loadQuiz();
        // Only count the first answer per session/page-load
        if (s.last !== zone) {
          s.asked += 1;
          if (right) s.correct += 1;
          s.last = zone;
          saveQuiz(s);
        }
        const verdict = right
          ? 'Correct. SPY is at +1.6σ — floodplain. Trend is significant; reversion odds rising.'
          : 'Not quite. SPY is at +1.6σ — that is floodplain territory. ' + ZONE_LABEL[zone] + ' was off by one zone.';
        i2Result.textContent = verdict;
        paintQuizStats();
      });
    });
  }

  // ---------- IDEA 5: cohort vote (real, persistent) ----------
  const VOTE_KEY = 'edge.techu.proposal.votes.v1';
  const VOTED_KEY = 'edge.techu.proposal.voted.v1';

  const PANEL_LIST = ['logic-chain', 'frog-box', 'excursion', 'patterns', 'c3-pinch', 'risk-box'];

  function loadVotes() {
    try {
      const raw = JSON.parse(localStorage.getItem(VOTE_KEY) || '{}');
      const out = {};
      for (const id of PANEL_LIST) out[id] = Number(raw[id]) || 0;
      return out;
    } catch (e) {
      const out = {}; for (const id of PANEL_LIST) out[id] = 0; return out;
    }
  }
  function saveVotes(v) {
    try { localStorage.setItem(VOTE_KEY, JSON.stringify(v)); } catch (e) { /* ignore */ }
  }
  function loadVoted() {
    try { return JSON.parse(localStorage.getItem(VOTED_KEY) || '{}'); }
    catch (e) { return {}; }
  }
  function saveVoted(v) {
    try { localStorage.setItem(VOTED_KEY, JSON.stringify(v)); } catch (e) { /* ignore */ }
  }

  const voteGrid = document.getElementById('voteGrid');
  const voteSummary = document.getElementById('voteSummary');
  const voteReset = document.getElementById('voteReset');

  function paintVotes() {
    const votes = loadVotes();
    const voted = loadVoted();
    let total = 0;
    let max = 0;
    let leader = null;
    for (const id of PANEL_LIST) {
      total += votes[id];
      if (votes[id] > max) { max = votes[id]; leader = id; }
    }
    document.querySelectorAll('.prop-vote-card').forEach((card) => {
      const id = card.dataset.panel;
      const n = votes[id] || 0;
      const pct = max > 0 ? (n / max) * 100 : 0;
      const bar = card.querySelector('.prop-vote-bar');
      const cnt = card.querySelector('.prop-vote-count');
      if (bar) bar.style.setProperty('--bar', pct.toFixed(1) + '%');
      if (cnt) cnt.textContent = n;
      card.classList.toggle('voted', !!voted[id]);
      card.classList.toggle('lead', id === leader && max > 0);
    });
    if (voteSummary) {
      if (total === 0) {
        voteSummary.textContent = 'No votes yet — be the first.';
      } else {
        const titleEl = document.querySelector('[data-panel="' + leader + '"] .prop-vote-title');
        const leaderTitle = titleEl ? titleEl.textContent : leader;
        voteSummary.textContent = total + ' vote' + (total === 1 ? '' : 's') +
          ' · leading: ' + leaderTitle + ' (' + max + ')';
      }
    }
  }

  if (voteGrid) {
    voteGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.prop-vote-card');
      if (!card) return;
      const id = card.dataset.panel;
      if (!PANEL_LIST.includes(id)) return;
      const votes = loadVotes();
      const voted = loadVoted();
      if (voted[id]) {
        // Toggle off — un-vote
        votes[id] = Math.max(0, votes[id] - 1);
        delete voted[id];
      } else {
        votes[id] = (votes[id] || 0) + 1;
        voted[id] = Date.now();
      }
      saveVotes(votes);
      saveVoted(voted);
      paintVotes();
      // Future: POST /api/v1/techu/proposal/vote { panel: id, voted: !!voted[id] }
    });
    paintVotes();
  }
  if (voteReset) {
    voteReset.addEventListener('click', () => {
      try {
        localStorage.removeItem(VOTE_KEY);
        localStorage.removeItem(VOTED_KEY);
      } catch (e) { /* ignore */ }
      paintVotes();
    });
  }

  // Build tag in footer
  const tag = document.getElementById('propBuildTag');
  if (tag) tag.textContent = 'Edge S2 · Tech Lab · proposal mock · build ' + BUILD;
})();
