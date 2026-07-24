# Sahityolsav Tech Events portal

A small SvelteKit and TypeScript hackathon portal deployed as one Cloudflare Worker, with Cloudflare D1 for accounts, sessions, event settings, ideas, and submissions.

## Set up and deploy

1. Install dependencies:

   ```sh
   npm install
   ```

2. Authenticate Wrangler:

   ```sh
   npx wrangler login
   npx wrangler whoami
   ```

3. Create the D1 database:

   ```sh
   npx wrangler d1 create sahityolsav-tech-events
   ```

4. Copy the returned `database_id` into the `DB` entry in `wrangler.jsonc`, replacing the existing database ID. The checked-in value is the database used by the current deployment.

5. Generate Cloudflare binding types:

   ```sh
   npm run types
   ```

6. Apply migrations locally:

   ```sh
   npm run db:migrate:local
   ```

7. Build and run the complete Worker locally:

   ```sh
   npm run build
   npm run preview
   ```

   The local site is normally `http://localhost:8787`. For SvelteKit's faster development server, use `npm run dev`.

8. Apply migrations to production:

   ```sh
   npm run db:migrate:remote
   ```

9. Deploy the single Worker:

   ```sh
   npm run deploy
   ```

10. Open the deployed `/register` route and register the first normal team account.

11. Promote that account to administrator (replace the email):

    ```sh
    npx wrangler d1 execute DB --remote --command "UPDATE users SET role='admin' WHERE email='admin@example.com';"
    ```

    Log out and log in again. The account will be sent to `/admin`.

12. View production logs:

    ```sh
    npx wrangler tail
    ```

## Event deadlines

The initial migration inserts editable example dates. After creating the administrator, edit the event name and all deadlines at `/admin/settings`. Inputs and visible dates use Indian Standard Time (`Asia/Kolkata`); D1 stores the corresponding ISO UTC timestamps.

For quick local phase testing, either use `/admin/settings` or run SQL against local D1. This example opens final submission for one hour while keeping the deadlines ordered:

```sh
npx wrangler d1 execute DB --local --command "UPDATE event_settings SET registration_deadline=strftime('%Y-%m-%dT%H:%M:%fZ','now','-4 hours'), idea_deadline=strftime('%Y-%m-%dT%H:%M:%fZ','now','-3 hours'), submission_deadline=strftime('%Y-%m-%dT%H:%M:%fZ','now','+1 hour') WHERE id=1;"
```

Restore real event deadlines in `/admin/settings` before deployment. All write deadlines are rechecked on the server.

## GitHub verification and archiving

Final submissions accept canonical public GitHub repository URLs. On every save, the server verifies that the repository is public and that the submitted commit exists. After the final deadline, the admin dashboard can create organization forks in `Sahityolsav-2026`, verify each submitted commit in its fork, and archive completed forks as read-only.

Create a short-lived fine-grained token owned by the organization with **Administration: read/write** and **Contents: read**, then store it without putting it in source control:

```sh
npx wrangler secret put GITHUB_TOKEN
```

The organization name is the non-secret `GITHUB_ORG` value in `wrangler.jsonc`. Fork creation is asynchronous, so run **Archive verified repositories** again after a few seconds to reconcile pending forks. The action processes up to eight submissions per request and can be retried safely.

## Initial AI reviews

Administrators configure an OpenAI-compatible API endpoint, model, API key, and enabled status at `/admin/ai`. The provider key is stored in D1 and is never returned to the browser. After the final submission deadline, open a submitted team from `/admin` and choose **Run AI review**.

The Pi-based reviewer reads a bounded selection of text files from the exact verified Git commit through GitHub's API, preferring the archived organization fork when it is ready. It cannot execute or change repository code, access team testing credentials, rank teams, or make a judging decision. Every concern must cite inspected source. Each saved report records its model, endpoint, repository, commit, timestamps, inspected files, source bytes, model turns, token usage, and duration.

## Verification

```sh
npm test
npm run check
npm run build
npx wrangler deploy --dry-run
```
