# The Wurl Cup

A live scoring site for Kieran's bachelor weekend Ryder Cup — Notre Dame vs. Saratoga, Saratoga Spa Par 29, August 15.

**What's in here:**
- `index.html` — the page itself
- `style.css` — all the styling
- `app.js` — countdown, scoring logic, live sync, and the lineup editor
- `firebase-config.js` — the one file you need to edit to turn on live syncing

The site works with **zero setup** — you can open `index.html` right now and everything (countdown, hole tracking, lineups) works. It just won't sync between phones until you connect Firebase, below.

---

## 1. Connect live syncing (about 2 minutes)

This lets everyone update scores from their own phone and see everyone else's updates instantly.

1. Go to **[console.firebase.google.com](https://console.firebase.google.com)** and create a free project (no credit card needed).
2. In the left sidebar: **Build → Realtime Database → Create Database**. Pick any location, and start in **test mode**.
3. Click the gear icon (top left) → **Project settings** → scroll to **"Your apps"** → click the web icon `</>` → register the app (any nickname, skip Firebase Hosting).
4. Firebase shows you a `firebaseConfig` object. Open `firebase-config.js` in this folder and paste those values in, replacing every `REPLACE_ME`.
5. Back in the Firebase console, go to **Realtime Database → Rules** and set:
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```
   This keeps it open (no login) so anyone with the site link can post a score from the course — appropriate for a private link shared only with your group.
6. Save. That's it — no other file needs to change.

If you skip this step, the site still works great for previewing and testing, but score updates will only show up on whichever device made them.

## 2. Put it on GitHub Pages

1. In your `website` repo, add these five files. If the repo already has other content on it, you can either replace it or drop these into a subfolder (e.g. `/ryder-cup/`) — just adjust the Pages settings in the next step to match.
2. Commit and push.
3. In the repo: **Settings → Pages** → under "Build and deployment," set **Source: Deploy from a branch**, choose your branch (usually `main`) and the folder these files live in (`/root` or `/ryder-cup`, etc.).
4. GitHub gives you a URL like `https://cwurlnd.github.io/website/` — that's the link to text to the group.

## 3. Before the round

- Open the site once yourself and check the **Lineups** section — hit **Manage Lineups** to fix any names, tee times, or foursome pairings before Saturday. Whatever's there now is a starting guess based on the roster you gave me.
- Heads up: I count 7 names on the Notre Dame side (including TBD) and 6 on Saratoga (including TBD) — one more than the 12 needed for three foursomes. I left the extra Notre Dame slot ("TBD") unassigned and tagged **Alt** in the lineup — swap it in for whoever it should be, or remove it, in the editor.
- Share the site link with the group beforehand so everyone can bookmark it.

## 4. During the round

Each foursome opens the site, scrolls to their match, and taps **ND**, **½**, or **TG** under each hole as it's finished. The match status and the top-of-page standings update live for everyone. Tap the same result again to undo a mistake, or use **Reset holes** to clear a whole match.

## Customizing later

- **Colors/fonts:** all in `style.css` under the `:root` block at the top — change the hex values there and everything updates.
- **Course info / copy:** edit the text directly in `index.html`.
- **Countdown target:** the tee time is set in `app.js` inside `startCountdown()` — look for `2026-08-15T09:30:00-04:00`.
