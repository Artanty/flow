// noy wake-and-callback deferral: when the safe api-version check fails inside the
// 10s Vercel budget, fire-and-forget a wake-and-call to the always-on noy host —
// noy wakes safe@render (render strategy, up to ~3 min) and then POSTs back to
// flow's /dispatch-callback to re-run the dispatch with safe awake. Kept free of
// local imports: webhook.ts requires this module, the callback handler requires
// webhook.ts — a cycle here would break the CommonJS requires at boot.
const DEFER_SEND_TIMEOUT_MS = 1_500;

export function deferDispatchToNoy(props: {
  repo_name: string;
  namespace: string;
  git_tag: string;
  commit_message: string;
}): boolean {
  const noyUrl = process.env.NOY_URL;
  // FLOW_URL is the full public https URL; Vercel's VERCEL_URL lacks the scheme
  const flowUrl = process.env.FLOW_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  const token = process.env.APP_TRIGGER_RUN_TOKEN;
  if (!noyUrl || !flowUrl || !token || !process.env.SAFE_URL) {
    console.log('deferDispatchToNoy skipped: NOY_URL / FLOW_URL(VERCEL_URL) / APP_TRIGGER_RUN_TOKEN / SAFE_URL not fully configured');
    return false;
  }

  // the token rides INSIDE the callback body — noy's query string must stay
  // secret-free (the Apache/VH access log records URLs)
  const callbackBody = JSON.stringify({ token, ...props });
  const params = new URLSearchParams({
    target: process.env.SAFE_URL,
    callback: `${flowUrl}/dispatch-callback`,
    body: callbackBody,
  });

  // NOT awaited and no read of the response: noy holds the connection for the
  // whole wake, flow only needs the request SENT. The AbortSignal drops the
  // client side after the send window — noy's handler keeps running regardless
  // of the disconnected caller.
  fetch(`${noyUrl}/wake-and-call?${params}`, { signal: AbortSignal.timeout(DEFER_SEND_TIMEOUT_MS) })
    .catch((e: unknown) => {
      const msg = (e as Error).name === 'TimeoutError'
        ? 'sent — noy holds the wake (client side dropped after the send window, expected)'
        : `FAILED to reach noy: ${(e as Error).message}`;
      console.log(`deferDispatchToNoy: ${msg}`);
    });
  return true;
}
