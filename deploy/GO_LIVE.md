# Go-live checklist — the parts only you can do

Everything here needs a login to an account Claude has no credentials for.
Each step lists the exact values to paste and how to confirm it worked.

Instance: `i-04c3230836d5cc6cf` · Elastic IP: `13.234.60.18` · Region: `ap-south-1`

---

## 1. S3 offsite backups  ⚠️ highest priority

Backups run nightly at 02:00 IST and are **verified** — but they sit on the same
disk as the database. That survives a bad migration or a mistaken DELETE. It does
**not** survive losing the instance, which is the whole reason to have backups.
AWS CLI v2 is already installed on the box; only the bucket and role are missing.

**a. Create the bucket** — S3 → Create bucket
- Name: `gymsetu-backups` (if you pick another name, say so — it's referenced in
  the IAM policy and `/etc/cron.d/gymsetu-backup`)
- Region: **ap-south-1** (same region as the instance; cross-region egress costs money)
- **Block all public access: ON** (these are your customers' payment records)
- **Bucket Versioning: Enable** — this is what saves you if the box is compromised
  and something deletes the backups; versioning keeps the previous copies.
- Optional but sensible: Lifecycle rule → expire objects after 90 days, so this
  doesn't quietly grow forever. Each nightly backup is ~2 MB today.

**b. Create the policy** — IAM → Policies → Create → JSON
Paste `deploy/iam-backup-policy.json`. It grants `s3:PutObject` and nothing else:
the box can write backups but cannot read or delete them. If someone gets root on
that instance, they still can't wipe your offsite copies.
Name it `gymsetu-backup-write`.

**c. Create the role** — IAM → Roles → Create role
- Trusted entity: **AWS service** → **EC2**
- Attach `gymsetu-backup-write`
- Name: `gymsetu-ec2-backup`

**d. Attach it** — EC2 → Instances → select `i-04c3230836d5cc6cf` →
Actions → Security → **Modify IAM role** → pick `gymsetu-ec2-backup` → Update

**e. Tell Claude.** Remaining steps: uncomment `S3_DEST` in
`/etc/cron.d/gymsetu-backup`, run a real backup, and confirm the object lands in
the bucket. (Self-check: `aws sts get-caller-identity` on the box should stop
saying NoCredentials the moment the role is attached — no reboot needed.)

---

## 2. Save `supabase/docker/.env` to a password manager  ⚠️ do this today

The backups are useless without it. `JWT_SECRET` cannot be regenerated: a new one
invalidates every session AND changes the `ANON_KEY` that is **compiled into** the
shipped app bundle and the Caddyfile. Restoring a dump without it gives you a
database nobody can log into.

It is deliberately excluded from the backups — copying secrets offsite nightly
spreads them around for no benefit, since they never change.

Run this **in your own terminal** (not through Claude — it would put the secrets
in the session transcript), then paste the output into 1Password/Bitwarden as a
secure note called "GymSetu supabase .env":

```bash
ssh -i gynmsetu.pem ubuntu@13.234.60.18 'sudo cat supabase/docker/.env'
```

Then, so the nightly nag stops:
```bash
ssh -i gynmsetu.pem ubuntu@13.234.60.18 'sudo touch /var/backups/gymsetu/.env-was-saved-elsewhere'
```

---

## 3. Cloudflare DNS

Today everything runs on `nip.io`, a free community wildcard resolver. Fine for
launching in a day; not something to hand a paying customer. If it goes down or
rate-limits, the app stops resolving *and* Let's Encrypt can't renew the certs.

Cloudflare → gymsetu.it.com → DNS → Add record, **twice**:

| Type | Name  | IPv4 target     | Proxy status          |
|------|-------|-----------------|-----------------------|
| A    | `app` | `13.234.60.18`  | **DNS only** (grey)   |
| A    | `api` | `13.234.60.18`  | **DNS only** (grey)   |

Grey cloud, not orange: Caddy issues its own Let's Encrypt certs, and the ACME
challenge must reach the box directly. You can flip to orange (Proxied) *after*
the certs issue, with SSL mode **Full (strict)**.

Caddy is already configured for both names and is retrying issuance every 60s
(it retries for 30 days), so the certs appear on their own within ~2 minutes of
the records existing. Nothing to deploy.

**Then tell Claude** — moving the API to `api.gymsetu.it.com` needs `app/.env`
updated and the app bundle **rebuilt and redeployed**, because the Supabase URL
is baked in at build time. The Android APK needs rebuilding for the same reason.
Don't remove the nip.io Caddy blocks until the rebuilt app is live, or the
current bundle (pointing at nip.io) breaks.

Verify: `dig +short app.gymsetu.it.com` → `13.234.60.18`, then
`curl -sI https://app.gymsetu.it.com | head -1` → `HTTP/2 200`.

---

## 4. UptimeRobot

The box now publishes a real health verdict, refreshed every 5 minutes:
<https://app.13.234.60.18.nip.io/healthz> → `OK 2026-07-17T10:33:23Z disk=41%`

It goes `FAIL` with a reason if a container dies, Postgres stops answering, Kong
stops routing, **backups stop or go stale**, or the disk fills.

UptimeRobot → Add New Monitor:
- Monitor Type: **HTTP(s)**
- Friendly Name: `GymSetu health`
- URL: `https://app.13.234.60.18.nip.io/healthz`
  (change to `https://app.gymsetu.it.com/healthz` once step 3 is done)
- Monitoring Interval: **5 minutes**
- **Advanced → Keyword** → Keyword Type: **Not exists** → Keyword: `OK`

> ⚠️ The keyword setting is the whole point. The endpoint returns **HTTP 200 even
> when everything is broken** — by design, so the body carries the detail. A
> monitor watching only status codes will report green while the database is
> down. "Alert when keyword `OK` does not exist" is what makes this real.

Add your email/phone as the alert contact. Free tier covers this.

Verify: `sudo systemctl stop supabase-kong` on the box → within 5 min `/healthz`
should say `FAIL … kong-rest:http=000` and UptimeRobot should alert. Start it
again with `sudo systemctl start supabase-kong`. (Or just trust the failure-path
tests that are already recorded in the commit for `deploy/health.sh`.)

---

## 5. Still open, not blocking launch

- **No `/privacy`, `/terms`, or `/refund` pages on gymsetu.it.com.** Blocks a Play
  Store listing (needs a privacy policy URL) and is normally a PayU/Razorpay
  onboarding requirement. Needs your actual refund policy — it can't be invented.
- **Android is sideload-only.** The `preview` APK works but trips "unknown
  sources". Fine for a hand-held first customer; the PWA is the better answer for
  members.
- **No service worker** — the PWA installs but isn't offline-capable.
- **Biometric integration is untested on real hardware**, frozen until a client
  has a device. TCP 8090 is open and the endpoint answers.
- **The ₹1 live PayU test charge was never refunded.**
