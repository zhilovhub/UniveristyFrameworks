import test from "node:test";
import assert from "node:assert/strict";
import { applyCors, createRateLimiter } from "../src/security.js";

test("Недоверенный источник не получает разрешающий заголовок", () => {
  const req = { headers: { origin: "http://evil.local" } };
  const headers = new Map();
  const res = { setHeader(k, v) { headers.set(k, v); } };

  applyCors(req, res, ["http://localhost:5173"]);
  assert.equal(headers.has("Access-Control-Allow-Origin"), false);
});

test("Доверенный источник получает правильные CORS заголовки", () => {
  const req = { headers: { origin: "http://localhost:5173" } };
  const headers = new Map();
  const res = { setHeader(k, v) { headers.set(k, v); } };

  applyCors(req, res, ["http://localhost:5173"]);
  assert.equal(headers.get("Access-Control-Allow-Origin"), "http://localhost:5173");
  assert.equal(headers.get("Access-Control-Allow-Methods"), "GET,POST,OPTIONS");
});

test("Ограничитель частоты блокирует лишние запросы на чтение", () => {
  const limiter = createRateLimiter({ readPerMinute: 2, writePerMinute: 1, mode: "учебный" });

  const req = { method: "GET", url: "/api/labs", socket: { remoteAddress: "1.2.3.4" }, headers: {} };

  assert.equal(limiter.allow(req).allowed, true);
  assert.equal(limiter.allow(req).allowed, true);
  assert.equal(limiter.allow(req).allowed, false);
});

test("Ограничитель частоты разделяет чтение и запись", () => {
  const limiter = createRateLimiter({ readPerMinute: 2, writePerMinute: 1, mode: "учебный" });
  const ip = "1.2.3.5";

  const readReq = { method: "GET", url: "/api/labs", socket: { remoteAddress: ip }, headers: {} };
  const writeReq = { method: "POST", url: "/api/labs", socket: { remoteAddress: ip }, headers: {} };

  assert.equal(limiter.allow(writeReq).allowed, true);
  assert.equal(limiter.allow(writeReq).allowed, false);

  assert.equal(limiter.allow(readReq).allowed, true);
  assert.equal(limiter.allow(readReq).allowed, true);
  assert.equal(limiter.allow(readReq).allowed, false);
});

test("Ограничитель возвращает корректную информацию об остатке", () => {
  const limiter = createRateLimiter({ readPerMinute: 3, writePerMinute: 2, mode: "учебный" });
  const req = { method: "GET", url: "/api/labs", socket: { remoteAddress: "1.2.3.6" }, headers: {} };

  const r1 = limiter.allow(req);
  assert.equal(r1.allowed, true);
  assert.equal(r1.remaining, 2);

  const r2 = limiter.allow(req);
  assert.equal(r2.allowed, true);
  assert.equal(r2.remaining, 1);

  const r3 = limiter.allow(req);
  assert.equal(r3.allowed, true);
  assert.equal(r3.remaining, 0);

  const r4 = limiter.allow(req);
  assert.equal(r4.allowed, false);
  assert.equal(r4.remaining, 0);
});
