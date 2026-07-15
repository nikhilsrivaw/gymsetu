import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// ── Types ──────────────────────────────────────────────────────
export interface InvoiceData {
  gym: {
    name: string;
    address?: string | null;
    phone?: string | null;
    gstin?: string | null;     // present ⇒ full GST tax invoice, else plain receipt
    logoUrl?: string | null;
  };
  member: {
    name: string;
    phone?: string | null;
    memberId?: string | null;
  };
  payment: {
    receiptNumber: string;
    date: string;              // ISO or 'YYYY-MM-DD'
    method: string;            // cash | upi | card | bank_transfer | other
    amount: number;            // total collected (₹)
    description?: string | null;
    period?: string | null;    // e.g. "16 Jul – 15 Aug 2026"
    collectedBy?: string | null;
  };
  // GST: rate (%) split evenly into CGST + SGST. Amount is treated as
  // tax-INCLUSIVE (the collected amount already contains GST).
  gstRate?: number;            // default 18 when a gstin is present
}

// ── Helpers ────────────────────────────────────────────────────
const METHOD_LABEL: Record<string, string> = {
  cash: 'Cash', upi: 'UPI', card: 'Card', bank_transfer: 'Bank transfer', other: 'Other',
};

const inr = (n: number) =>
  '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function fmtDate(d: string): string {
  const dt = new Date(d.length <= 10 ? d + 'T00:00:00' : d);
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || 'G';
}

const esc = (s?: string | null) =>
  (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Amount → Indian-English words (rupees & paise).
function rupeesInWords(amount: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const two = (n: number): string =>
    n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  const three = (n: number): string =>
    (n >= 100 ? ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' : '') : '') + (n % 100 ? two(n % 100) : '');
  const toWords = (n: number): string => {
    if (n === 0) return 'Zero';
    let w = '';
    const cr = Math.floor(n / 10000000); n %= 10000000;
    const la = Math.floor(n / 100000);  n %= 100000;
    const th = Math.floor(n / 1000);    n %= 1000;
    if (cr) w += three(cr) + ' Crore ';
    if (la) w += three(la) + ' Lakh ';
    if (th) w += three(th) + ' Thousand ';
    if (n)  w += three(n);
    return w.trim();
  };
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let out = toWords(rupees) + ' Rupee' + (rupees === 1 ? '' : 's');
  if (paise) out += ' and ' + toWords(paise) + ' Paise';
  return out + ' Only';
}

// ── Template ───────────────────────────────────────────────────
export function buildInvoiceHTML(data: InvoiceData): string {
  const { gym, member, payment } = data;
  const hasGST = !!gym.gstin;
  const rate = data.gstRate ?? 18;
  const total = payment.amount;

  // Inclusive GST split.
  const base = hasGST ? total / (1 + rate / 100) : total;
  const taxTotal = total - base;
  const half = taxTotal / 2;
  const halfRate = (rate / 2).toString();

  const docKind = hasGST ? 'Tax Invoice' : 'Receipt';
  const docTitle = hasGST ? 'INVOICE' : 'RECEIPT';
  const methodLabel = METHOD_LABEL[payment.method] ?? payment.method;
  const desc = payment.description?.trim() || 'Membership fee';
  const logo = gym.logoUrl
    ? `<img src="${esc(gym.logoUrl)}" style="width:54px;height:54px;border-radius:14px;object-fit:cover;" />`
    : `<div class="logo">${initials(gym.name)}</div>`;

  const taxRows = hasGST ? `
        <div class="totrow"><span>Taxable value</span><span class="v">${inr(base)}</span></div>
        <div class="totrow"><span>CGST @ ${halfRate}%</span><span class="v">${inr(half)}</span></div>
        <div class="totrow"><span>SGST @ ${halfRate}%</span><span class="v">${inr(half)}</span></div>` : '';

  const gstinLine = hasGST ? `<div class="gstin">GSTIN ${esc(gym.gstin)}</div>` : '';
  const sac = hasGST ? ' · SAC 999723' : '';
  const grandLabel = hasGST ? 'Total paid' : 'Amount paid';

  return `<!doctype html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap');
:root{--ink:#16130F;--sub:#6B6259;--faint:#A79E93;--line:#E7E1D6;--paper:#FBF9F4;--flame:#FF4D00;--flame-ink:#C23B00;--green:#1F7A44;}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased;background:var(--paper);}
.sheet{width:100%;max-width:794px;min-height:1040px;margin:0 auto;background:var(--paper);padding:56px 52px 48px;position:relative;}
.sheet::before{content:"";position:absolute;top:0;left:0;right:0;height:5px;background:linear-gradient(90deg,var(--flame),#FF8A3D);}
.mono{font-family:'Space Mono',monospace;}
.head{display:flex;justify-content:space-between;align-items:flex-start;}
.brand{display:flex;gap:15px;align-items:center;}
.logo{width:54px;height:54px;border-radius:14px;background:var(--ink);color:var(--paper);display:grid;place-items:center;font-family:'Fraunces',serif;font-weight:600;font-size:26px;}
.gymname{font-family:'Fraunces',serif;font-weight:600;font-size:24px;letter-spacing:-.01em;line-height:1;}
.gymmeta{font-size:11px;color:var(--sub);margin-top:5px;line-height:1.5;max-width:240px;}
.gstin{font-family:'Space Mono',monospace;font-size:10.5px;color:var(--sub);margin-top:4px;letter-spacing:.02em;}
.doc{text-align:right;}
.doc h1{font-family:'Fraunces',serif;font-weight:600;font-size:33px;letter-spacing:.02em;line-height:.9;}
.doc .kind{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.3em;color:var(--flame-ink);text-transform:uppercase;margin-bottom:8px;}
.doc .rcp{font-family:'Space Mono',monospace;font-size:12px;margin-top:12px;color:var(--ink);}
.doc .rcp span{color:var(--faint);}
.doc .date{font-size:11px;color:var(--sub);margin-top:3px;}
.parties{display:flex;gap:48px;margin-top:40px;padding-top:24px;border-top:1px solid var(--line);}
.party{flex:1;}
.eyebrow{font-family:'Space Mono',monospace;font-size:9.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--faint);margin-bottom:9px;}
.party .name{font-size:15px;font-weight:600;letter-spacing:-.01em;}
.party .l{font-size:11.5px;color:var(--sub);margin-top:3px;line-height:1.55;}
table{width:100%;border-collapse:collapse;margin-top:36px;}
thead th{font-family:'Space Mono',monospace;font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--faint);font-weight:700;text-align:left;padding:0 0 12px;border-bottom:1.5px solid var(--ink);}
thead th.r{text-align:right;}
tbody td{padding:17px 0;border-bottom:1px solid var(--line);vertical-align:top;font-size:13.5px;}
tbody td.r{text-align:right;font-family:'Space Mono',monospace;font-size:13px;font-variant-numeric:tabular-nums;}
.item-name{font-weight:600;font-size:14px;}
.item-sub{font-size:11.5px;color:var(--sub);margin-top:3px;}
.totals{display:flex;justify-content:flex-end;margin-top:22px;}
.totbox{width:300px;}
.totrow{display:flex;justify-content:space-between;padding:7px 0;font-size:12.5px;color:var(--sub);}
.totrow .v{font-family:'Space Mono',monospace;color:var(--ink);font-variant-numeric:tabular-nums;}
.grand{display:flex;justify-content:space-between;align-items:baseline;margin-top:10px;padding-top:16px;border-top:2px solid var(--ink);}
.grand .lab{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:var(--sub);}
.grand .amt{font-family:'Fraunces',serif;font-weight:600;font-size:33px;letter-spacing:-.01em;}
.grand .amt small{font-size:18px;font-weight:500;}
.payrow{display:flex;justify-content:space-between;align-items:center;margin-top:36px;padding-top:22px;border-top:1px solid var(--line);gap:24px;}
.method{font-size:12px;color:var(--sub);}
.method b{color:var(--ink);font-weight:600;}
.paid{display:inline-flex;align-items:center;gap:8px;border:1.5px solid var(--green);color:var(--green);border-radius:999px;padding:7px 16px;font-family:'Space Mono',monospace;font-weight:700;font-size:11px;letter-spacing:.2em;text-transform:uppercase;white-space:nowrap;}
.paid .dot{width:7px;height:7px;border-radius:50%;background:var(--green);}
.foot{margin-top:56px;}
.thanks{font-family:'Fraunces',serif;font-style:italic;font-size:16px;color:var(--ink);}
.terms{font-size:10.5px;color:var(--faint);margin-top:10px;line-height:1.6;padding-top:14px;border-top:1px solid var(--line);display:flex;justify-content:space-between;gap:24px;}
.terms .sig{font-family:'Space Mono',monospace;letter-spacing:.02em;white-space:nowrap;}
</style></head>
<body><div class="sheet">
  <div class="head">
    <div class="brand">${logo}
      <div>
        <div class="gymname">${esc(gym.name)}</div>
        ${gym.address || gym.phone ? `<div class="gymmeta">${esc(gym.address)}${gym.address && gym.phone ? ' · ' : ''}${esc(gym.phone)}</div>` : ''}
        ${gstinLine}
      </div>
    </div>
    <div class="doc">
      <div class="kind">${docKind}</div>
      <h1>${docTitle}</h1>
      <div class="rcp"><span>No.</span> ${esc(payment.receiptNumber)}</div>
      <div class="date">Issued ${fmtDate(payment.date)}</div>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <div class="eyebrow">Billed to</div>
      <div class="name">${esc(member.name)}</div>
      ${member.phone ? `<div class="l">${esc(member.phone)}</div>` : ''}
      ${member.memberId ? `<div class="l">Member ID · ${esc(member.memberId)}</div>` : ''}
    </div>
    <div class="party">
      <div class="eyebrow">Payment</div>
      <div class="name">${esc(methodLabel)}</div>
      <div class="l">Received ${fmtDate(payment.date)}</div>
      ${payment.collectedBy ? `<div class="l">Collected by · ${esc(payment.collectedBy)}</div>` : ''}
    </div>
  </div>

  <table>
    <thead><tr><th>Description</th><th>Period</th><th class="r">Amount</th></tr></thead>
    <tbody><tr>
      <td><div class="item-name">${esc(desc)}</div><div class="item-sub">Full gym access${sac}</div></td>
      <td style="font-size:11.5px;color:var(--sub);padding-top:19px;">${esc(payment.period) || '—'}</td>
      <td class="r" style="padding-top:19px;">${inr(base)}</td>
    </tr></tbody>
  </table>

  <div class="totals"><div class="totbox">
    ${taxRows}
    <div class="grand"><span class="lab">${grandLabel}</span><span class="amt"><small>₹</small>${total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
  </div></div>

  <div class="payrow">
    <div class="method">Amount in words: <b>${rupeesInWords(total)}</b></div>
    <div class="paid"><span class="dot"></span> Paid</div>
  </div>

  <div class="foot">
    <div class="thanks">Thank you for training with us.</div>
    <div class="terms">
      <span>This is a computer-generated ${hasGST ? 'invoice' : 'receipt'} and does not require a signature. Fees are non-refundable once the billing period begins.</span>
      <span class="sig">${esc(gym.name)}</span>
    </div>
  </div>
</div></body></html>`;
}

// ── Generate + share ───────────────────────────────────────────
export async function shareInvoice(data: InvoiceData): Promise<void> {
  const html = buildInvoiceHTML(data);

  // Web (PWA): open the system print dialog → user saves/prints the PDF.
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }

  // Native: render to a PDF file, then open the share sheet (WhatsApp, etc.).
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share receipt',
      UTI: 'com.adobe.pdf',
    });
  }
}
