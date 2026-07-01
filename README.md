# 🍕 Mama Pizza! Mama Pizza!

A static website that tracks a 16-pizza single-elimination tournament bracket.
No build tools, no frameworks — just HTML, CSS, and a little JavaScript.

## Files

| File | What it's for |
|------|----------------|
| `index.html` | The page shell. You rarely touch this. |
| `css/style.css` | Styling / theme. |
| `js/bracket.js` | Draws the bracket and auto-advances winners. Don't edit. |
| **`js/data.js`** | **The only file you edit to update the tournament.** |

## Updating the bracket

Open `js/data.js`. Everything lives in the `tournament` object.

### 1. Name the pizzas (once)

In the **Round of 16**, replace `pizza1`, `pizza2`, … with the real names:

```js
{ p1: "Pepperoni", p2: "Margherita", date: "Jul 5, 2026", winner: null },
```

You only name pizzas here. Later rounds fill in automatically.

### 2. Set the date for a match

`date` is free text — put anything you like, or `""` to show `TBD`:

```js
date: "Jul 5, 2026"
date: "Saturday 7pm"
date: ""            // shows "TBD"
```

### 3. Record a winner

Set `winner` on the match:

| `winner` value | Meaning |
|----------------|---------|
| `null` | Not played yet |
| `1` | The **top** pizza won |
| `2` | The **bottom** pizza won |

Example — Pepperoni (top slot) beats Margherita:

```js
{ p1: "Pepperoni", p2: "Margherita", date: "Jul 5, 2026", winner: 1 },
```

The winner **automatically advances** to the next round. You never retype
pizza names in the Quarterfinals, Semifinals, or Final — just set that
round's `date` and `winner` (1 = top slot, 2 = bottom slot).

The bracket champion appears in the trophy box once the Final has a winner.

### Change the title

Edit `title` and `subtitle` at the top of `js/data.js`.

## Previewing locally

Just open `index.html` in your browser. (Because it uses plain `<script>`
files, no local server is required.)

## Hosting on GitHub Pages

1. Create a repo on GitHub and push these files (keep this folder structure).
2. In the repo: **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to *Deploy from a branch*.
4. Choose branch `main` and folder `/ (root)`, then **Save**.
5. After a minute your site is live at
   `https://<your-username>.github.io/<repo-name>/`.

Every time you edit `js/data.js` and push, the live site updates.

### Quick start with git

```bash
cd pizzaBracket
git init
git add .
git commit -m "Initial pizza bracket"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

Then enable Pages as described above.
