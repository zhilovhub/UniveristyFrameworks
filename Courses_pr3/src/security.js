export function applySecurityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
}

export function applyCors(req, res, trustedOrigins) {
  const origin = req.headers.origin;
  if (!origin) return;

  if (trustedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,X-Request-Id");
  }
}

export function createRateLimiter({ readPerMinute, writePerMinute, mode }) {
  const store = new Map();

  function keyFromReq(req) {
    const ip = req.socket.remoteAddress ?? "unknown";
    return ip.replace(/^::ffff:/, '');
  }

  function bucket(k) {
    const now = Date.now();
    const win = 60_000;
    const item = store.get(k) ?? { resetAt: now + win, read: 0, write: 0 };
    if (now > item.resetAt) {
      item.resetAt = now + win;
      item.read = 0;
      item.write = 0;
    }
    store.set(k, item);
    return item;
  }

  return {
    allow(req) {
      const k = keyFromReq(req);
      const b = bucket(k);

      const method = req.method ?? "GET";
      const url = req.url ?? "/";

      const isWrite = method === "POST" && url.startsWith("/api/labs");
      const isRead = method === "GET" && url.startsWith("/api/");

      if (isWrite) {
        const remaining = writePerMinute - b.write;
        const allowed = remaining > 0;
        if (allowed) b.write += 1;
        return {
          allowed,
          remaining: Math.max(0, remaining - (allowed ? 1 : 0)),
          limit: writePerMinute,
          action: "создания"
        };
      }

      if (isRead) {
        const remaining = readPerMinute - b.read;
        const allowed = remaining > 0;
        if (allowed) b.read += 1;
        return {
          allowed,
          remaining: Math.max(0, remaining - (allowed ? 1 : 0)),
          limit: readPerMinute,
          action: "чтения"
        };
      }

      return { allowed: true, remaining: Infinity, limit: Infinity, action: null };
    }
  };
}
