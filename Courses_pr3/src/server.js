import http from "node:http";
import { resolveConfigFromThreeSources, defaultConfigPath, validateConfig, getMode, getPort, getTrustedOrigins, getRateLimits } from "./config.js";
import { applySecurityHeaders, applyCors, createRateLimiter } from "./security.js";
import { createLabsRepo } from "./labs.js";

const cfg = resolveConfigFromThreeSources({
  configPath: defaultConfigPath(),
  env: process.env,
  argv: process.argv.slice(2)
});

const errors = validateConfig(cfg);
if (errors.length > 0) {
  console.error("Запуск остановлен из-за некорректных настроек:");
  for (const e of errors) console.error("   - " + e);
  process.exit(1);
}

const mode = getMode(cfg);
const port = getPort(cfg);
const trustedOrigins = getTrustedOrigins(cfg);
const limits = getRateLimits(cfg);
const limiter = createRateLimiter({
  readPerMinute: limits.readPerMinute,
  writePerMinute: limits.writePerMinute,
  mode
});

const repo = createLabsRepo();

repo.create("Введение в алгоритмы", 100);
repo.create("Структуры данных", 80);

const server = http.createServer(async (req, res) => {
  applySecurityHeaders(res);
  applyCors(req, res, trustedOrigins);

  const origin = req.headers.origin;
  if (origin && !trustedOrigins.includes(origin)) {
    res.statusCode = 403;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    const msg = mode === "учебный"
      ? `Доступ запрещён: источник "${origin}" не в списке доверенных`
      : "Forbidden";
    res.end(msg);
    return;
  }

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const rateResult = limiter.allow(req);
  if (!rateResult.allowed) {
    res.statusCode = 429;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Retry-After", "60");

    if (mode === "учебный") {
      res.end(`Лимит запросов превышен. Доступно ${rateResult.limit} запросов в минуту для ${rateResult.action}. Попробуйте позже.`);
    } else {
      res.end("Too Many Requests");
    }
    return;
  }

  try {
    const url = new URL(req.url ?? "/", "http://localhost");

    if (req.method === "GET" && url.pathname === "/api/labs") {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify(repo.list()));
      return;
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/labs/by-id/")) {
      const id = url.pathname.split("/").pop();
      const lab = repo.get(id);
      if (!lab) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        const msg = mode === "учебный" ? `Лабораторная работа с ID "${id}" не найдена` : "Not Found";
        res.end(msg);
        return;
      }
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify(lab));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/labs") {
      const body = await readJson(req);
      const title = String(body.title ?? "").trim();
      const maxScore = Number(body.maxScore);

      if (!title) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        const msg = mode === "учебный" ? "Поле title не должно быть пустым" : "Bad Request";
        res.end(msg);
        return;
      }

      if (!Number.isFinite(maxScore) || maxScore <= 0 || maxScore > 100) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        const msg = mode === "учебный" ? "Поле maxScore должно быть числом от 1 до 100" : "Bad Request";
        res.end(msg);
        return;
      }

      const created = repo.create(title, maxScore);
      res.statusCode = 201;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Location", `/api/labs/by-id/${created.id}`);
      res.end(JSON.stringify(created));
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/mode") {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ mode, readLimit: limits.readPerMinute, writeLimit: limits.writePerMinute }));
      return;
    }

    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    const msg = mode === "учебный" ? `Маршрут ${req.method} ${req.url} не найден` : "Not Found";
    res.end(msg);

  } catch (e) {
    const isNotFound = e?.message?.includes("не найден");
    const status = isNotFound ? 404 : 400;
    res.statusCode = status;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");

    if (mode === "учебный") {
      const msg = e?.message ?? "Ошибка обработки запроса";
      res.end(msg);
    } else {
      const defaultMsg = status === 404 ? "Not Found" : "Bad Request";
      res.end(defaultMsg);
    }
  }
});

server.listen(port, () => {
  console.log(`Служба запущена на порту ${port}`);
  console.log(`Режим: ${mode === "учебный" ? "УЧЕБНЫЙ (подробные ошибки)" : "БОЕВОЙ (минимальные сообщения)"}`);
  console.log(`Доверенные источники: ${trustedOrigins.join(", ") || "не заданы"}`);
  console.log(`Лимиты: чтение ${limits.readPerMinute}/мин, запись ${limits.writePerMinute}/мин`);
});

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.setEncoding("utf8");
    req.on("data", chunk => data += chunk);
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(new Error("Тело запроса не является корректным JSON"));
      }
    });
    req.on("error", reject);
  });
}
