/* =============================================================
   PIZZA TOURNAMENT — RENDERER
   -------------------------------------------------------------
   You normally don't need to edit this file. It reads the data
   in js/data.js, auto-advances winners, and draws the bracket.
   ============================================================= */

(function () {
  "use strict";

  const TBD = "TBD";

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

  function render() {
    const bracket = document.getElementById("bracket");
    bracket.innerHTML = "";

    // Header text from data.
    document.getElementById("tournament-title").textContent = tournament.title;
    document.getElementById("tournament-subtitle").textContent =
      tournament.subtitle;
    document.title = tournament.title;

    tournament.rounds.forEach((round, roundIndex) => {
      const col = el("ul", "round round-" + roundIndex);

      const header = el("li", "round-header", round.name);
      col.appendChild(header);

      col.appendChild(el("li", "spacer"));

      round.matches.forEach((match, matchIndex) => {
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

      bracket.appendChild(col);
    });

    // Champion column.
    const lastRound = tournament.rounds.length - 1;
    const champ = winnerName(lastRound, 0);

    const champCol = el("ul", "round champion-col");
    champCol.appendChild(el("li", "round-header", "Champion"));
    champCol.appendChild(el("li", "spacer"));

    const champBox = el("li", "champion" + (champ ? " crowned" : ""));
    champBox.appendChild(el("div", "trophy", "🏆"));
    champBox.appendChild(el("div", "champion-name", champ || TBD));
    champCol.appendChild(champBox);

    champCol.appendChild(el("li", "spacer"));
    bracket.appendChild(champCol);
  }

  document.addEventListener("DOMContentLoaded", render);
})();
