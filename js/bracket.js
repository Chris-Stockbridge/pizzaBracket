/* =============================================================
   PIZZA TOURNAMENT — RENDERER
   -------------------------------------------------------------
   You normally don't need to edit this file. It reads the data
   in js/data.js, auto-advances winners, and draws the bracket.

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
   * Build one round column (a <ul>) containing the given match indices.
   * Shared by both layouts. `matchIndices` defaults to every match in
   * the round, which is what the classic layout uses.
   */
  function roundColumn(roundIndex, matchIndices) {
    const round = tournament.rounds[roundIndex];
    const indices = matchIndices || round.matches.map((_, i) => i);

    const col = el("ul", "round round-" + roundIndex);
    col.appendChild(el("li", "round-header", round.name));
    col.appendChild(el("li", "spacer"));

    indices.forEach((matchIndex) => {
      const match = round.matches[matchIndex];
      const [top, bottom] = participantsFor(roundIndex, matchIndex);

      const gameTop = el("li", "game game-top");
      gameTop.appendChild(teamNode(top, 1, match));

      const gameSpacer = el("li", "game game-spacer");
      gameSpacer.appendChild(el("span", "match-date", match.date || TBD));

      const gameBottom = el("li", "game game-bottom");
      gameBottom.appendChild(teamNode(bottom, 2, match));

      col.appendChild(gameTop);
      col.appendChild(gameSpacer);
      col.appendChild(gameBottom);
      col.appendChild(el("li", "spacer"));
    });

    return col;
  }

  /** Build the Champion box. */
  function championBox() {
    const lastRound = tournament.rounds.length - 1;
    const champ = winnerName(lastRound, 0);

    const box = el("li", "champion" + (champ ? " crowned" : ""));
    box.appendChild(el("div", "trophy", "🏆"));
    box.appendChild(el("div", "champion-name", champ || TBD));
    return box;
  }

  /* ---------- Classic layout: one column per round ---------- */
  function renderClassic(bracket) {
    tournament.rounds.forEach((round, roundIndex) => {
      bracket.appendChild(roundColumn(roundIndex));
    });

    const champCol = el("ul", "round champion-col");
    champCol.appendChild(el("li", "round-header", "Champion"));
    champCol.appendChild(el("li", "spacer"));
    champCol.appendChild(championBox());
    champCol.appendChild(el("li", "spacer"));
    bracket.appendChild(champCol);
  }

  /* ---------- Split layout: halves feed inward to a centered Final ----------
     The last round (index N-1) is the Final. The round before it (the
     Semifinals) has two matches: match 0 owns the entire LEFT subtree,
     match 1 owns the entire RIGHT subtree. So every earlier round splits
     cleanly down the middle. */
  function renderSplit(bracket) {
    const finalIndex = tournament.rounds.length - 1;
    const feederRounds = []; // rounds that get split, outermost -> innermost
    for (let r = 0; r < finalIndex; r++) feederRounds.push(r);

    const half = (roundIndex) =>
      Math.ceil(tournament.rounds[roundIndex].matches.length / 2);

    // Left side: outermost round first, moving inward toward the center.
    const left = el("div", "side side-left");
    feederRounds.forEach((roundIndex) => {
      const n = half(roundIndex);
      const indices = [];
      for (let i = 0; i < n; i++) indices.push(i);
      left.appendChild(roundColumn(roundIndex, indices));
    });

    // Center: the Final match plus the Champion.
    const center = el("div", "side side-center");
    const finalCol = el("ul", "round round-final");
    finalCol.appendChild(el("li", "round-header", tournament.rounds[finalIndex].name));
    finalCol.appendChild(el("li", "spacer"));

    const finalMatch = tournament.rounds[finalIndex].matches[0];
    const [fTop, fBottom] = participantsFor(finalIndex, 0);
    const fTopGame = el("li", "game game-top");
    fTopGame.appendChild(teamNode(fTop, 1, finalMatch));
    const fSpacer = el("li", "game game-spacer no-line");
    fSpacer.appendChild(el("span", "match-date", finalMatch.date || TBD));
    const fBottomGame = el("li", "game game-bottom");
    fBottomGame.appendChild(teamNode(fBottom, 2, finalMatch));
    finalCol.appendChild(fTopGame);
    finalCol.appendChild(fSpacer);
    finalCol.appendChild(fBottomGame);
    finalCol.appendChild(el("li", "spacer"));
    finalCol.appendChild(championBox());
    finalCol.appendChild(el("li", "spacer"));
    center.appendChild(finalCol);

    // Right side: innermost round first so columns mirror the left.
    const right = el("div", "side side-right");
    feederRounds
      .slice()
      .reverse()
      .forEach((roundIndex) => {
        const total = tournament.rounds[roundIndex].matches.length;
        const n = half(roundIndex);
        const indices = [];
        for (let i = n; i < total; i++) indices.push(i);
        right.appendChild(roundColumn(roundIndex, indices));
      });

    bracket.appendChild(left);
    bracket.appendChild(center);
    bracket.appendChild(right);
  }

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

    if (layout === "split") {
      renderSplit(bracket);
    } else {
      renderClassic(bracket);
    }

    syncToggle(layout);
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
  });
})();
