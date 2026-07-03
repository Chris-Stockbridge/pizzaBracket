/* =============================================================
   PIZZA TOURNAMENT — DATA FILE
   =============================================================
   This is the ONLY file you need to edit to update the bracket.

   HOW IT WORKS
   ------------
   - You name all 16 pizzas ONCE, in the "Round of 16" below.
   - For every match, set:
       date   : any text you want, e.g. "Jul 5, 2026" (or "" for TBD)
       winner : null  -> not played yet
                1     -> the TOP pizza won
                2     -> the BOTTOM pizza won
   - Winners AUTOMATICALLY advance to the next round.
     You do NOT retype pizza names in later rounds — just set the
     date and the winner (1 = top slot, 2 = bottom slot).

   EXAMPLE
   -------
   { p1: "Pepperoni", p2: "Margherita", date: "Jul 5, 2026", winner: 1 }
   ...means Pepperoni beat Margherita and advances.
   ============================================================= */

const tournament = {
  title: "🍕 Mama Pizza! Mama Pizza!",
  subtitle: "16-Pizza Single-Elimination Bracket",

  rounds: [
    {
      name: "Round of 16",
      matches: [
        { p1: "Hot Hawaiian Honey",  p2: "Mango Chutney",  date: "", winner: null },
        { p1: "Chutney Potato",  p2: "Cheese",  date: "", winner: null },
        { p1: "Pickle Pizza",  p2: "Orange Cream",  date: "", winner: null },
        { p1: "Veggie",  p2: "Pepperoni",  date: "", winner: null },
        { p1: "Samosa",  p2: "PBJ", date: "", winner: null },
        { p1: "Strawberry Cream", p2: "Bombay", date: "", winner: null },
        { p1: "Paneer Tika Masala", p2: "Halwa", date: "", winner: null },
        { p1: "Tuna Melt", p2: "Papa Fiesta", date: "", winner: null },
      ],
    },
    {
      name: "Quarterfinals",
      // Participants fill in automatically from the Round of 16 winners.
      matches: [
        { date: "", winner: null },
        { date: "", winner: null },
        { date: "", winner: null },
        { date: "", winner: null },
      ],
    },
    {
      name: "Semifinals",
      matches: [
        { date: "", winner: null },
        { date: "", winner: null },
      ],
    },
    {
      name: "Final",
      matches: [
        { date: "", winner: null },
      ],
    },
  ],
};
