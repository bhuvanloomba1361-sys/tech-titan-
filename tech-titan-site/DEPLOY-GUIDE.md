# Tech Titan — Going Live

What changed: the site used to store all its content in each visitor's own
browser (`localStorage`), so admin edits never left your device. It now
reads/writes from a shared, free cloud database (Firebase Firestore), so
edits made in `admin.html` appear for every visitor, everywhere, within a
couple of seconds — and the site keeps working after you publish it publicly.

Three steps: (1) create the free database, (2) point the site at it,
(3) publish the files so anyone can reach them at a URL.

---

## Step 1 — Create your free Firebase project (~5 min)

1. Go to https://console.firebase.google.com and sign in with a Google account.
2. Click **Add project**, name it (e.g. `techtitan-cct`), finish the wizard
   (you can turn off Google Analytics).
3. In the left sidebar, open **Build → Firestore Database → Create database**.
   - Start in **production mode**.
   - Pick a location close to India (e.g. `asia-south1`).
4. Before writing rules, create your admin login first (do step 5 now,
   then come back): open **Build → Authentication → Get started**, enable
   the **Email/Password** sign-in method, go to the **Users** tab →
   **Add user** → enter the email/password you'll log into `admin.html`
   with. Click into that user afterward and copy their **User UID**
   (a long string like `aB3xQz...`) — you need it in the next step.

5. Click the **Rules** tab (still under Firestore Database) and replace
   the contents with, using the UID you just copied:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {

       function isSignedIn() { return request.auth != null; }
       function isMainAdmin() {
         return isSignedIn() && request.auth.uid == "Syxep12DJGVWQUiEli4Dg1yqEtP2";
       }
       function myPerms() {
         return get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.permissions;
       }
       function hasPerm(section) {
         return isMainAdmin() || (isSignedIn() && myPerms()[section] == true);
       }

       // Homepage content — one document per section (stats, leadership,
       // events, campus, moments). Public can read; write requires the
       // matching permission.
       match /siteContent/{section} {
         allow read: if true;
         allow write: if hasPerm(section);
       }

       // Departments & members page.
       match /departments/{docId} {
         allow read: if true;
         allow write: if hasPerm('departments');
       }

       // Registration form on the main site — anyone can submit
       // (allow create), but only admins with the "registrations"
       // permission can read the list or edit/delete entries.
       match /registrations/{docId} {
         allow create: if true;
         allow read, update, delete: if hasPerm('registrations');
       }

       // Admin accounts & their permissions. Any signed-in admin can read
       // (so the dashboard can check its own access) — only the main
       // admin can create/edit/delete admin records directly; sub-admins
       // with the "admins" permission manage others through the app,
       // which itself is still bound by this same write rule for anyone
       // other than the main admin, so an "admins"-permitted sub-admin
       // must also be granted write here to fully manage other accounts.
       match /admins/{uid} {
         allow read: if isSignedIn();
         allow write: if isMainAdmin() || hasPerm('admins');
       }
     }
   }
   ```
   `allow read: if true` on `siteContent` and `departments` means anyone can
   *view* site content (needed for the public website) and anyone can
   *submit* the registration form — but every write to real content is
   locked down per section to whichever admin accounts you've explicitly
   switched that section on for, via the "Manage admins" tab. Even if
   someone else got hold of a Firebase account, they couldn't write
   anywhere they haven't been granted. Click **Publish**.

6. Get your config: click the gear icon (top left) → **Project settings** →
   scroll to **Your apps** → click the `</>` (web) icon → register the app
   (any nickname) → you'll be shown a `firebaseConfig` object with your
   `apiKey`, `projectId`, etc.

## Step 2 — Paste your config into the site

Open **`firebase-config.js`** (in this folder) and replace the placeholder
values with the ones Firebase just showed you:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "techtitan-cct.firebaseapp.com",
  projectId: "techtitan-cct",
  storageBucket: "techtitan-cct.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};
```

That's the only file you ever need to touch for this. `index.html`,
`departments.html`, and `admin.html` all load it automatically.

**Don't skip this step** — the copy of `firebase-config.js` you download
still has the `PASTE_YOUR_...` placeholder values in it. If you upload it
to Netlify as-is, Firebase will fail to initialize and the site will fall
back to blank/default content for everyone. Your API key being visible in
this file afterward is normal and expected for a Firebase web app — it's
not a secret; the Firestore rules above are what actually protect your
data, not hiding this key.

## Step 3 — Publish the files so any browser can reach them

Right now these files only exist on your computer. "Live" means putting
them on a public web host with its own address. The easiest free option
for a static site like this is **Netlify**:

1. Go to https://app.netlify.com and sign up (free).
2. Click **Add new site → Deploy manually**.
3. Drag this whole folder (all the `.html` files, `firebase-config.js`,
   the `.jpg`/`.png` images) into the upload box.
4. Netlify gives you a live URL immediately, e.g.
   `https://techtitan-cct.netlify.app` — that link works from **any
   browser, any device, anywhere**, right away.
5. Optional: in **Site settings → Domain management** you can change the
   free subdomain to something like `techtitan.netlify.app`, or connect a
   real custom domain (e.g. `techtitancct.com`) if you buy one.

(Alternatives that work the same way: **Vercel**, **GitHub Pages**, or
CGC's own web hosting if the college offers you space — any of them can
host plain HTML files like these.)

Log in at `https://your-site-url/admin.html`. Since the database starts
empty, you'll see a banner at the top: **"Initialize content with starter
data"** — click it once to save the starting stats/leadership/events/etc.
(The public homepage can't do this itself anymore now that writes are
locked down by permission — that's intentional.) After that, edit
something, save it, then open the main site in a *different* browser or
your phone's data connection — the change should show up there too.

## Sub-admin accounts (selective access)

You (the account whose UID is hardcoded as the main admin) always have
full access to every tab. From the **Manage admins** tab you can create
extra login accounts for teammates and choose exactly which tabs each one
can see and edit — e.g. someone who only manages Events and Registrations,
with no access to Departments or Manage admins itself.

- Creating a sub-admin needs an email + password (min. 6 characters); it
  doesn't sign you out while doing so.
- A sub-admin who isn't granted the "Manage admins" permission can't see
  that tab, can't create more admins, and can't change anyone's access —
  this is enforced both in the dashboard UI and in the Firestore rules
  above, so it can't be bypassed from the browser console either.
- "Remove dashboard access" deletes their permissions record (they lose
  every tab immediately) but doesn't delete their Firebase login — do that
  from **Firebase Console → Authentication → Users** if you also want to
  block them from signing in at all.

## Change password

Any admin — main or sub — can change their own password from the "Change
password" button in the top bar of the dashboard. It asks for the current
password first (Firebase requires this before allowing a password change).

## Event registrations

The registration form on the homepage now saves every submission to a
`registrations` collection instead of just showing a local confirmation.
Any admin with the "Event registrations" permission can see the full list
under the **Registrations** tab, filterable by event.

## About showing up in Google search

Being reachable by URL (done above) is different from showing up when
someone *searches* for "Tech Titan CGC Landran" on Google — that's called
search indexing, and it's separate and slower:

- Once the site is live, submit the URL in **Google Search Console**
  (https://search.google.com/search-console) — it's free — so Google
  knows to crawl it. Indexing usually takes anywhere from a few days to a
  few weeks.
- Share the real link from your Instagram bio, college site, etc. — links
  from other sites help Google find and trust it faster.
- The `admin.html` page has `<meta name="robots" content="noindex">` in
  it already, so it stays out of search results while the public pages
  can still be indexed normally.

## Note on the old admin panel

The admin files you originally tried to attach uploaded as empty (0 KB),
so I couldn't inspect or reuse that code — `admin.html` was a fresh
dashboard built to match the data this site actually needs (stats,
leadership, events, campus photos, moments, departments/members), and has
since been extended with sub-admin accounts with selective tab access,
a change-password option, and a live registrations viewer. If you need
anything else added, just ask.
