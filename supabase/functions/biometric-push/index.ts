// ============================================================================
// biometric-push — ZKTeco / eSSL "ADMS" (iClock) push endpoint
// ============================================================================
// Devices are configured with our server address and then POST every finger
// scan to us in real time. This speaks their protocol.
//
// Protocol notes that matter (they are not obvious and break things silently):
//   * The body is TAB-SEPARATED plain text, not JSON.
//   * The device expects a bare "OK" body. Anything else and it retries the
//     same records forever. Never return JSON here.
//   * It polls /iclock/getrequest every ~30s as a heartbeat, so this endpoint
//     is chatty by design. Keep it cheap.
//   * Auth is the serial number in the query string, in cleartext. That is the
//     entire security model of the protocol. We only accept SNs the owner has
//     registered, and a punch can only land on a PIN mapped inside that SN's
//     own gym.
//
// Device menu: Comm. > Ethernet / Cloud Server: set server IP + port, "Enable
// Domain Name" off, then reboot. Path is fixed at /iclock/ by the firmware.
// ============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// The device wants a plain-text body, and treats anything unexpected as a
// failure to be retried.
const ok = (body = 'OK') =>
  new Response(body, { status: 200, headers: { 'Content-Type': 'text/plain' } });

/**
 * Config handed back when the device first calls in. These key=value lines are
 * the device's marching orders.
 *   Realtime=1      -> push each scan as it happens rather than batching
 *   TransFlag       -> which tables to transmit (attlog, oplog, etc.)
 *   Delay/ErrorDelay-> retry pacing in seconds
 *   TimeZone=5.5    -> IST; the device stamps punches in its own local time
 */
function deviceConfig(sn: string): string {
  return [
    `GET OPTION FROM: ${sn}`,
    'Stamp=9999',
    'OpStamp=9999',
    'ErrorDelay=30',
    'Delay=30',
    'TransTimes=00:00;14:05',
    'TransInterval=1',
    'TransFlag=1111000000',
    'TimeZone=5.5',
    'Realtime=1',
    'Encrypt=0',
  ].join('\n');
}

/**
 * ATTLOG rows look like:
 *   PIN \t YYYY-MM-DD HH:MM:SS \t status \t verify \t workcode \t reserved
 * Trailing columns vary by firmware, so read positionally and tolerate extras.
 */
function parseAttlog(body: string): { pin: string; ts: string }[] {
  const rows: { pin: string; ts: string }[] = [];
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const cols = line.split('\t');
    if (cols.length < 2) continue;
    const pin = cols[0]?.trim();
    const ts  = cols[1]?.trim();
    if (!pin || !ts) continue;
    rows.push({ pin, ts });
  }
  return rows;
}

/**
 * The device sends wall-clock local time with no offset ("2026-07-17 09:12:33").
 * Parsing that as UTC would shift every punch by 5.5h and silently file
 * early-morning scans on the previous day. Pin it to IST explicitly.
 */
function istToInstant(local: string): string | null {
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m;
  return `${y}-${mo}-${d}T${h}:${mi}:${s}+05:30`;
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  // Caddy forwards the original /iclock/... path; tolerate the function prefix
  // too so this can be called directly for testing.
  const path = url.pathname.replace(/^\/functions\/v1\/biometric-push/, '');
  const sn   = url.searchParams.get('SN') ?? '';
  const ip   = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;

  if (!sn) return ok('OK');   // never leak structure to an unidentified caller

  // Liveness for every call, so "device last seen" is real. Fire-and-forget:
  // a heartbeat must never block or fail a punch.
  supabase.rpc('touch_biometric_device', { p_serial: sn, p_ip: ip }).then(
    () => {}, () => {},
  );

  // ── Handshake: device asks for its config ────────────────────────────────
  if (req.method === 'GET' && path.endsWith('/cdata')) {
    return ok(deviceConfig(sn));
  }

  // ── Heartbeat / command poll. No command queue yet: "OK" means "nothing
  //    for you". This fires every ~30s per device.
  if (req.method === 'GET' && (path.endsWith('/getrequest') || path.endsWith('/ping'))) {
    return ok('OK');
  }

  // ── Command acknowledgements ─────────────────────────────────────────────
  if (req.method === 'POST' && path.endsWith('/devicecmd')) {
    return ok('OK');
  }

  // ── Punches ──────────────────────────────────────────────────────────────
  if (req.method === 'POST' && path.endsWith('/cdata')) {
    const table = (url.searchParams.get('table') ?? '').toUpperCase();
    const body  = await req.text();

    // OPERLOG (enrolments, admin menu actions) and friends: acknowledge so the
    // device stops resending, but we only care about ATTLOG.
    if (table && table !== 'ATTLOG') return ok('OK');

    const rows = parseAttlog(body);
    let saved = 0;
    for (const { pin, ts } of rows) {
      const instant = istToInstant(ts);
      if (!instant) continue;
      const { data, error } = await supabase.rpc('record_biometric_punch', {
        p_serial: sn, p_pin: pin, p_ts: instant,
      });
      if (error) {
        console.error('[biometric] punch failed', sn, pin, error.message);
        continue;
      }
      saved += Number(data ?? 0);
    }

    console.log(`[biometric] SN=${sn} received=${rows.length} recorded=${saved}`);
    // Acknowledge everything we were sent. Reporting fewer than received would
    // make the device resend rows we deliberately dropped (unmapped PINs,
    // duplicate scans) on a loop forever.
    return ok(`OK: ${rows.length}`);
  }

  // Unknown iClock verbs still need a 200 "OK", or the device retries.
  return ok('OK');
});
