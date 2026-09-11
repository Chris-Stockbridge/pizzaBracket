/* =============================================================
   PIZZA TOURNAMENT — RENDERER
   -------------------------------------------------------------
   You normally don't need to edit this file. It reads the data
   in js/data.js, auto-advances winners, and draws the bracket.

   HOW THE DRAWING WORKS
   ---------------------
   Match boxes are absolutely positioned inside their round
   column. Round 0 stacks top to bottom; every later match is
   centred on the two matches that feed it, so the bracket keeps
   its shape no matter how tall a match's comment is. The
   connecting lines are then measured off the real boxes and
   drawn as an SVG overlay, so every fork meets its result line
   exactly.

   Two layouts are supported and toggled from the header:
     • "classic" — one left-to-right column per round.
     • "split"   — left half and right half feed inward to a
                   centered Final that takes one winner from each
                   side, with the Champion in the middle.
   ============================================================= */

(function () {
  "use strict";

  const TBD = "TBD";
  const LAYOUT_KEY = "pizzaBracketLayout";
  const SVG_NS = "http://www.w3.org/2000/svg";

  /* Geometry, in pixels. */
  const MATCH_GAP = 24; // vertical gap between stacked first-round matches
  const MIN_GAP = 14;   // smallest gap allowed when matches would overlap
  const FORK = 12;      // how far the fork line sits off a match's edge
  const CHAMP_GAP = 44; // gap between the Final and the Champion box

  /**
   * Return [topPizza, bottomPizza] for a given match.
   * Round 0 (Round of 16) uses the names you typed.
   * Later rounds derive their two pizzas from the winners of the
   * two feeding matches in the previous round.
   */
  function participantsFor(roundIndex, matchIndex) {
    const match = tournament.rounds[roundIndex].matches[matchIndex];

    if (roundIndex === 0) {
      return [match.p1 || TBD, match.p2 || TBD];
    }

    const top = winnerName(roundIndex - 1, matchIndex * 2);
    const bottom = winnerName(roundIndex - 1, matchIndex * 2 + 1);
    return [top || TBD, bottom || TBD];
  }

  /** Name of the winner of a match, or null if undecided. */
  function winnerName(roundIndex, matchIndex) {
    const match = tournament.rounds[roundIndex].matches[matchIndex];
    if (!match) return null;
    const [top, bottom] = participantsFor(roundIndex, matchIndex);
    if (match.winner === 1) return top;
    if (match.winner === 2) return bottom;
    return null;
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  /* ---------- Building the boxes ---------- */

  /** Build one team line inside a match. */
  function teamNode(name, position, match) {
    const isDecided = match.winner === position;
    const otherDecided = match.winner != null && match.winner !== position;
    let cls = "team";
    if (isDecided) cls += " winner";
    if (otherDecided) cls += " loser";

    const node = el("div", cls);
    node.appendChild(el("span", "team-name", name));
    if (isDecided) node.appendChild(el("span", "team-badge", "✓"));
    return node;
  }

  /**
   * Build the "Winner: X" label and optional comment shown below a
   * decided (or commented-on) match. Returns null when there is
   * nothing to show, so callers can skip appending it.
   */
  function matchInfoNode(match, top, bottom) {
    if (match.winner == null && !match.comment) return null;

    const node = el("div", "match-info");
    if (match.winner != null) {
      const winner = match.winner === 1 ? top : bottom;
      node.appendChild(el("div", "match-winner", "Winner: " + winner));
    }
    if (match.comment) {
      node.appendChild(el("div", "match-comment", match.comment));
    }
    return node;
  }

  /**
   * One match box: the two team cards with the date between them
   * (the "slot", which the connector lines attach to), plus the
   * optional winner/comment block underneath.
   */
  function matchNode(roundIndex, matchIndex) {
    const match = tournament.rounds[roundIndex].matches[matchIndex];
    const [top, bottom] = participantsFor(roundIndex, matchIndex);

    const node = el("div", "match");
    const slot = el("div", "match-slot");
    slot.appendChild(teamNode(top, 1, match));

    const mid = el("div", "match-mid");
    mid.appendChild(el("span", "match-date", match.date || TBD));
    slot.appendChild(mid);

    slot.appendChild(teamNode(bottom, 2, match));
    node.appendChild(slot);

    const info = matchInfoNode(match, top, bottom);
    if (info) node.appendChild(info);

    return { node: node, slot: slot };
  }

  /**
   * Build one round column containing the given match indices.
   * `matchIndices` defaults to every match in the round, which is
   * what the classic layout uses.
   */
  function roundColumn(roundIndex, matchIndices, side, entries) {
    const round = tournament.rounds[roundIndex];
    const indices = matchIndices || round.matches.map((_, i) => i);

    const col = el("div", "round round-" + roundIndex);
    col.appendChild(el("div", "round-header", round.name));

    const body = el("div", "round-body");
    indices.forEach((matchIndex) => {
      const built = matchNode(roundIndex, matchIndex);
      body.appendChild(built.node);
      entries.push({
        side: side,
        roundIndex: roundIndex,
        matchIndex: matchIndex,
        node: built.node,
        slot: built.slot,
      });
    });
    col.appendChild(body);

    return col;
  }

  /** Build the Champion box. */
  function championNode() {
    const lastRound = tournament.rounds.length - 1;
    const champ = winnerName(lastRound, 0);

    const box = el("div", "champion" + (champ ? " crowned" : ""));
    box.appendChild(el("div", "trophy", "🏆"));
    box.appendChild(el("div", "champion-name", champ || TBD));
    return box;
  }

  /* ---------- Classic layout: one column per round ---------- */
  function buildClassic(bracket, entries) {
    tournament.rounds.forEach((round, roundIndex) => {
      bracket.appendChild(roundColumn(roundIndex, null, "main", entries));
    });

    const col = el("div", "round champion-col");
    col.appendChild(el("div", "round-header", "Champion"));
    const body = el("div", "round-body");
    const box = championNode();
    body.appendChild(box);
    col.appendChild(body);
    bracket.appendChild(col);

    return box;
  }

  /* ---------- Split layout: halves feed inward to a centered Final ----------
     The last round (index N-1) is the Final. The round before it (the
     Semifinals) has two matches: match 0 owns the entire LEFT subtree,
     match 1 owns the entire RIGHT subtree. So every earlier round splits
     cleanly down the middle. */
  function buildSplit(bracket, entries) {
    const finalIndex = tournament.rounds.length - 1;
    const half = (roundIndex) =>
      Math.ceil(tournament.rounds[roundIndex].matches.length / 2);

    // Left side: outermost round first, moving inward toward the center.
    const left = el("div", "side side-left");
    for (let r = 0; r < finalIndex; r++) {
      const indices = [];
      for (let i = 0; i < half(r); i++) indices.push(i);
      left.appendChild(roundColumn(r, indices, "left", entries));
    }

    // Center: the Final match plus the Champion.
    const center = el("div", "side side-center");
    const col = el("div", "round round-final");
    col.appendChild(el("div", "round-header", tournament.rounds[finalIndex].name));
    const body = el("div", "round-body");

    const built = matchNode(finalIndex, 0);
    body.appendChild(built.node);
    entries.push({
      side: "center",
      roundIndex: finalIndex,
      matchIndex: 0,
      node: built.node,
      slot: built.slot,
    });

    const box = championNode();
    body.appendChild(box);
    col.appendChild(body);
    center.appendChild(col);

    // Right side: innermost round first so columns mirror the left.
    const right = el("div", "side side-right");
    for (let r = finalIndex - 1; r >= 0; r--) {
      const total = tournament.rounds[r].matches.length;
      const indices = [];
      for (let i = half(r); i < total; i++) indices.push(i);
      right.appendChild(roundColumn(r, indices, "right", entries));
    }

    bracket.appendChild(left);
    bracket.appendChild(center);
    bracket.appendChild(right);

    return box;
  }

  /* ---------- Positioning ----------
     Every match knows the vertical centre of its slot. A match in a
     later round sits exactly halfway between the two matches feeding
     it, which is what makes the forks line up. */

  let state = null;

  const byMatch = (a, b) => a.matchIndex - b.matchIndex;
  const slotCenter = (entry) => entry.top + entry.slotH / 2;

  /** Centre a match on the two matches that feed it. */
  function placeOnFeeders(entry, index) {
    const f0 = index.get(entry.roundIndex - 1 + ":" + entry.matchIndex * 2);
    const f1 = index.get(entry.roundIndex - 1 + ":" + (entry.matchIndex * 2 + 1));
    const centers = [f0, f1]
      .filter((f) => f && f.top != null)
      .map(slotCenter);
    const center = centers.length
      ? centers.reduce((a, b) => a + b, 0) / centers.length
      : entry.slotH / 2;
    entry.top = center - entry.slotH / 2;
  }

  /** Nudge matches down so a tall comment can never overlap its neighbour. */
  function resolveOverlap(list) {
    let prevBottom = -Infinity;
    list.forEach((entry) => {
      if (entry.top < prevBottom + MIN_GAP) entry.top = prevBottom + MIN_GAP;
      prevBottom = entry.top + entry.h;
    });
  }

  function bounds(list) {
    let min = Infinity;
    let max = -Infinity;
    list.forEach((entry) => {
      min = Math.min(min, entry.top);
      max = Math.max(max, entry.top + entry.h);
    });
    return { min: min, max: max };
  }

  function relayout() {
    if (!state) return;
    const entries = state.entries;
    const champBox = state.champBox;
    const finalIndex = tournament.rounds.length - 1;

    // Measure every box at its natural height.
    entries.forEach((entry) => {
      entry.h = entry.node.offsetHeight;
      entry.slotH = entry.slot.offsetHeight;
    });
    const champH = champBox.offsetHeight;

    const index = new Map();
    entries.forEach((e) => index.set(e.roundIndex + ":" + e.matchIndex, e));

    const sides = new Map();
    entries.forEach((e) => {
      if (!sides.has(e.side)) sides.set(e.side, []);
      sides.get(e.side).push(e);
    });

    // Round 0 stacks top to bottom, each side starting from zero.
    sides.forEach((list, side) => {
      if (side === "center") return;
      let cursor = 0;
      list
        .filter((e) => e.roundIndex === 0)
        .sort(byMatch)
        .forEach((entry) => {
          entry.top = cursor;
          cursor += entry.h + MATCH_GAP;
        });
    });

    // Later rounds hang off their feeders. The centred Final waits until
    // both halves have been positioned.
    for (let r = 1; r <= finalIndex; r++) {
      sides.forEach((list, side) => {
        if (side === "center") return;
        const current = list.filter((e) => e.roundIndex === r).sort(byMatch);
        if (!current.length) return;
        current.forEach((entry) => placeOnFeeders(entry, index));
        resolveOverlap(current);
      });
    }

    // Give both halves the same height so they read as one bracket.
    let contentH = 0;
    const spans = new Map();
    sides.forEach((list, side) => {
      if (side === "center") return;
      const span = bounds(list);
      spans.set(side, span);
      contentH = Math.max(contentH, span.max - span.min);
    });
    sides.forEach((list, side) => {
      if (side === "center") return;
      const span = spans.get(side);
      const shift = (contentH - (span.max - span.min)) / 2 - span.min;
      if (shift) list.forEach((entry) => (entry.top += shift));
    });

    const centerList = sides.get("center");
    if (centerList) {
      centerList.forEach((entry) => placeOnFeeders(entry, index));
    }

    // The Champion sits below the Final when split, beside it when classic.
    const finalEntry = index.get(finalIndex + ":0");
    const champTop =
      state.layout === "split"
        ? finalEntry.top + finalEntry.h + CHAMP_GAP
        : slotCenter(finalEntry) - champH / 2;

    entries.forEach((entry) => {
      contentH = Math.max(contentH, entry.top + entry.h);
    });
    contentH = Math.max(contentH, champTop + champH);

    // Commit.
    entries.forEach((entry) => {
      entry.node.style.top = Math.round(entry.top) + "px";
    });
    champBox.style.top = Math.round(champTop) + "px";
    state.bracket.querySelectorAll(".round-body").forEach((body) => {
      body.style.height = Math.ceil(contentH) + "px";
    });

    drawConnectors();
  }

  /* ---------- Connector lines ----------
     Drawn from the boxes' measured positions, so they join exactly
     regardless of how the content wrapped. */
  function drawConnectors() {
    const bracket = state.bracket;
    const svg = state.svg;
    const entries = state.entries;
    const finalIndex = tournament.rounds.length - 1;

    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const base = bracket.getBoundingClientRect();
    svg.setAttribute("width", Math.ceil(base.width));
    svg.setAttribute("height", Math.ceil(base.height));

    const px = Math.round;
    const rel = (node) => {
      const r = node.getBoundingClientRect();
      return {
        left: px(r.left - base.left),
        right: px(r.right - base.left),
        top: px(r.top - base.top),
        bottom: px(r.bottom - base.top),
        cx: px(r.left + r.width / 2 - base.left),
        cy: px(r.top + r.height / 2 - base.top),
      };
    };

    const line = (d) => {
      const p = document.createElementNS(SVG_NS, "path");
      p.setAttribute("d", d);
      p.setAttribute("class", "connector");
      svg.appendChild(p);
    };

    const index = new Map();
    entries.forEach((entry) => {
      const cards = entry.slot.querySelectorAll(".team");
      const top = rel(cards[0]);
      const bottom = rel(cards[1]);
      const slot = rel(entry.slot);
      entry.geo = {
        top: top.cy,
        bottom: bottom.cy,
        cy: px((top.cy + bottom.cy) / 2),
        left: slot.left,
        right: slot.right,
        cx: slot.cx,
        nodeBottom: rel(entry.node).bottom,
      };
      entry.dir = entry.side === "right" ? -1 : entry.side === "center" ? 0 : 1;
      index.set(entry.roundIndex + ":" + entry.matchIndex, entry);
    });

    // The fork that joins a match's two cards, pointing at the next round.
    entries.forEach((entry) => {
      const g = entry.geo;
      if (entry.dir === 0) {
        line("M " + g.left + " " + g.top + " H " + (g.left - FORK) +
             " V " + g.bottom + " H " + g.left);
        line("M " + g.right + " " + g.top + " H " + (g.right + FORK) +
             " V " + g.bottom + " H " + g.right);
      } else {
        const edge = entry.dir > 0 ? g.right : g.left;
        const fork = edge + entry.dir * FORK;
        line("M " + edge + " " + g.top + " H " + fork +
             " V " + g.bottom + " H " + edge);
      }
    });

    // The run from each fork into the match it feeds.
    entries.forEach((entry) => {
      if (entry.roundIndex >= finalIndex) return;
      const dest = index.get(
        entry.roundIndex + 1 + ":" + Math.floor(entry.matchIndex / 2)
      );
      if (!dest) return;

      const g = entry.geo;
      const dg = dest.geo;
      const apexX = (entry.dir > 0 ? g.right : g.left) + entry.dir * FORK;
      const destEdge =
        dest.dir === 0
          ? entry.dir > 0
            ? dg.left - FORK
            : dg.right + FORK
          : entry.dir > 0
          ? dg.left
          : dg.right;
      const midX = px((apexX + destEdge) / 2);

      line("M " + apexX + " " + g.cy + " H " + midX +
           " V " + dg.cy + " H " + destEdge);
    });

    // Final to Champion.
    const finalEntry = index.get(finalIndex + ":0");
    if (finalEntry && state.champBox) {
      const g = finalEntry.geo;
      const c = rel(state.champBox);
      if (finalEntry.dir === 0) {
        line("M " + g.cx + " " + (g.nodeBottom + 4) + " V " + c.top);
      } else {
        const apexX = g.right + FORK;
        const midX = px((apexX + c.left) / 2);
        line("M " + apexX + " " + g.cy + " H " + midX +
             " V " + c.cy + " H " + c.left);
      }
    }
  }

  /* ---------- Render ---------- */
  function currentLayout() {
    const fromUrl = new URLSearchParams(location.search).get("layout");
    if (fromUrl === "split" || fromUrl === "classic") return fromUrl;
    const saved = localStorage.getItem(LAYOUT_KEY);
    return saved === "classic" ? "classic" : "split";
  }

  function render() {
    const layout = currentLayout();
    const bracket = document.getElementById("bracket");
    bracket.innerHTML = "";
    bracket.className = "bracket layout-" + layout;

    // Header text from data.
    document.getElementById("tournament-title").textContent = tournament.title;
    document.getElementById("tournament-subtitle").textContent =
      tournament.subtitle;
    document.title = tournament.title;

    const entries = [];
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "bracket-lines");
    svg.setAttribute("aria-hidden", "true");
    bracket.appendChild(svg);

    const champBox =
      layout === "split"
        ? buildSplit(bracket, entries)
        : buildClassic(bracket, entries);

    state = {
      layout: layout,
      bracket: bracket,
      svg: svg,
      entries: entries,
      champBox: champBox,
    };
    relayout();
    syncToggle(layout);
  }

  let pending = null;
  function scheduleRelayout() {
    if (pending) cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => {
      pending = null;
      relayout();
    });
  }

  /* ---------- Layout toggle ---------- */
  function syncToggle(layout) {
    document.querySelectorAll(".layout-toggle [data-layout]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.layout === layout);
      btn.setAttribute("aria-pressed", btn.dataset.layout === layout);
    });
  }

  function wireToggle() {
    const toggle = document.querySelector(".layout-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-layout]");
      if (!btn) return;
      localStorage.setItem(LAYOUT_KEY, btn.dataset.layout);
      render();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    wireToggle();
    render();

    // Web fonts land after first paint and change every box height.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(scheduleRelayout);
    }
    window.addEventListener("resize", scheduleRelayout);
  });
})();
