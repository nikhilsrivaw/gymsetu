# GymSetu — WhatsApp Message Templates (for Meta approval)

Submit these 6 templates in **Meta WhatsApp Manager → Message Templates → Create template**.
They must match the `send-whatsapp` edge function EXACTLY, or messages fail.

## ⚠️ CRITICAL rules — read before creating
1. **Template name** must be copied EXACTLY (lowercase, underscores). The function
   calls these names verbatim.
2. **Language = English** (code `en`). **Do NOT pick "English (US)" / en_US** — the
   function sends `language: "en"`, and a mismatch fails with error *"template does
   not exist in en"*.
3. Use **positional variables** `{{1}} {{2}}` … (the default). Keep the exact number
   of variables shown — the function sends parameters in that order.
4. Only a **BODY** is used — no header, no buttons, no footer needed (footer optional).
5. At submission Meta asks for a **sample value** for each `{{n}}` — samples given below.
6. Pick the **Category** shown for each (wrong category is the #1 rejection reason).

---

## 1. gymsetu_welcome_member
- **Name:** `gymsetu_welcome_member`
- **Category:** `UTILITY`
- **Language:** English (en)
- **Header:** None · **Variables:** {{1}} member name · {{2}} gym name
- ⚠️ **Do NOT include login ID / password here** — Meta REJECTS templates that
  share credentials (this was rejected once for exactly that). The gym owner
  shares the member's login directly (it's shown to them in the app after adding
  the member). The function now sends only 2 variables to match this.

**Body:**
```
Hi {{1}}, welcome to {{2}}! Your membership is now active. Your gym will share your GymSetu app login so you can track your workouts, diet plan and attendance. We are excited to have you on board — see you at the gym!
```
**Samples:** {{1}} Rahul · {{2}} Iron Fitness

---

## 2. gymsetu_payment_confirmation
- **Name:** `gymsetu_payment_confirmation`
- **Category:** `UTILITY`
- **Language:** English (en)
- **Variables:** {{1}} member name · {{2}} amount · {{3}} plan name · {{4}} gym name · {{5}} expiry date

**Body:**
```
Hi {{1}}, we have received your payment of ₹{{2}}. ✅

Plan: {{3}}
Gym: {{4}}
Valid until: {{5}}

Thank you for your membership. Keep pushing your goals! 💪
```
**Samples:** {{1}} Rahul · {{2}} 1000 · {{3}} Monthly · {{4}} Iron Fitness · {{5}} 10 Aug 2026

---

## 3. gymsetu_expiry_reminder
- **Name:** `gymsetu_expiry_reminder`
- **Category:** `UTILITY`
- **Language:** English (en)
- **Variables:** {{1}} member name · {{2}} gym name · {{3}} days left · {{4}} expiry date

**Body:**
```
Hi {{1}}, a quick reminder from {{2}}. ⏳

Your membership expires in {{3}} days, on {{4}}.

Renew now to keep your access active and avoid any break in your fitness journey. 💪
```
**Samples:** {{1}} Rahul · {{2}} Iron Fitness · {{3}} 3 · {{4}} 10 Aug 2026

---

## 4. gymsetu_membership_expired
- **Name:** `gymsetu_membership_expired`
- **Category:** `UTILITY`
- **Language:** English (en)
- **Variables:** {{1}} member name · {{2}} gym name · {{3}} expiry date

**Body:**
```
Hi {{1}}, your membership at {{2}} expired on {{3}}. ⚠️

We would love to have you back! Renew today to continue your workouts and pick up right where you left off. 💪
```
**Samples:** {{1}} Rahul · {{2}} Iron Fitness · {{3}} 05 Jul 2026

---

## 5. gymsetu_inactive_nudge
- **Name:** `gymsetu_inactive_nudge`
- **Category:** `MARKETING`
- **Language:** English (en)
- **Variables:** {{1}} member name · {{2}} gym name · {{3}} days inactive

**Body:**
```
Hi {{1}}, we have missed you at {{2}}! 👋

It has been {{3}} days since your last visit. Your goals are waiting — come back this week and get back on track. We are here to help you every step of the way. 💪
```
**Samples:** {{1}} Rahul · {{2}} Iron Fitness · {{3}} 7

---

## 6. gymsetu_announcement
- **Name:** `gymsetu_announcement`
- **Category:** `MARKETING`
- **Language:** English (en)
- **Variables:** {{1}} member name · {{2}} gym name · {{3}} message

**Body:**
```
Hi {{1}}, an update from {{2}}: 📢

{{3}}

Thank you for being part of our community! 💪
```
**Samples:** {{1}} Rahul · {{2}} Iron Fitness · {{3}} We are open on all public holidays this month from 6 AM to 10 PM.

---

## After approval
1. Templates usually approve in minutes to a few hours.
2. No code change needed — the function already uses these exact names.
3. Set the function secrets on the server, then messages will send:
   `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WEBHOOK_SECRET`.
4. Test with the `welcome` type first (fires when an owner adds a member).

## If a message fails, check (in order)
- Template **Status = Approved** in Meta.
- Language is **en** (not en_US).
- The recipient's number is a valid Indian mobile (function formats to `91XXXXXXXXXX`).
- For the first message to a user, WhatsApp requires an approved **template** (not
  free-text) — which is exactly what these are, so you're covered.
