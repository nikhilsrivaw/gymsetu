-- ============================================================================
-- GST — phase 2
-- ============================================================================
-- The website sells "GST-compliant invoices" and app/src/lib/invoice.ts already
-- renders a full tax invoice (CGST/SGST split, SAC 999723, inclusive-of-tax
-- back-calculation) whenever gym.gstin is present -- it just had nowhere to
-- read one from, so every document fell back to a plain RECEIPT.
--
-- Registered gyms enter their GSTIN in Settings and their documents become tax
-- invoices. Unregistered gyms (below the turnover threshold) leave it blank and
-- keep issuing receipts, which is correct for them.
-- ============================================================================

alter table gyms add column if not exists gstin    text;
alter table gyms add column if not exists gst_rate numeric default 18;

-- Format check: 2-digit state code, 10-char PAN, entity digit, 'Z', checksum.
-- Left permissive on case and allows NULL/'' for unregistered gyms.
alter table gyms drop constraint if exists gyms_gstin_format;
alter table gyms add constraint gyms_gstin_format check (
  gstin is null or gstin = '' or
  upper(gstin) ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
);

comment on column gyms.gstin is
  'GST identification number. When set, invoice.ts renders a Tax Invoice instead of a Receipt.';

-- DOWN:
-- alter table gyms drop constraint if exists gyms_gstin_format;
-- alter table gyms drop column if exists gstin;
-- alter table gyms drop column if exists gst_rate;
