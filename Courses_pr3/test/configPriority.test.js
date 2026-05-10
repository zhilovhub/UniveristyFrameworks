import test from "node:test";
import assert from "node:assert/strict";
import { buildConfig, validateConfig } from "../src/config.js";

test("Приоритет источников настроек работает как заявлено (аргументы важнее окружения)", () => {
  const fileCfg = { app: { rateLimits: { readPerMinute: 10 } } };
  const env = { APP_READ_PER_MINUTE: "20" };
  const args = { readPerMinute: "30" };

  const cfg = buildConfig({ fileCfg, env, args });
  assert.equal(cfg.app.rateLimits.readPerMinute, 30);
});

test("Переменные окружения переопределяют файл", () => {
  const fileCfg = { app: { mode: "учебный", port: 3000 } };
  const env = { APP_MODE: "боевой", APP_PORT: "4000" };
  const args = {};

  const cfg = buildConfig({ fileCfg, env, args });
  assert.equal(cfg.app.mode, "боевой");
  assert.equal(cfg.app.port, 4000);
});

test("Аргументы командной строки имеют высший приоритет", () => {
  const fileCfg = { app: { mode: "учебный" } };
  const env = { APP_MODE: "боевой" };
  const args = { mode: "учебный" };

  const cfg = buildConfig({ fileCfg, env, args });
  assert.equal(cfg.app.mode, "учебный");
});

test("Некорректные настройки дают ошибки проверки", () => {
  const cfg = {
    app: {
      mode: "x",
      port: 0,
      trustedOrigins: [],
      rateLimits: { readPerMinute: 0, writePerMinute: 0 }
    }
  };
  const errors = validateConfig(cfg);
  assert.ok(errors.length >= 4);
});

test("Валидация обнаруживает дубликаты в доверенных источниках", () => {
  const cfg = {
    app: {
      mode: "учебный",
      port: 3000,
      trustedOrigins: ["http://a.com", "http://a.com", "http://b.com"],
      rateLimits: { readPerMinute: 60, writePerMinute: 20 }
    }
  };
  const errors = validateConfig(cfg);
  assert.ok(errors.some(e => e.includes("дубликаты")));
});

test("Валидация требует порт для localhost", () => {
  const cfg = {
    app: {
      mode: "учебный",
      port: 3000,
      trustedOrigins: ["http://localhost"],
      rateLimits: { readPerMinute: 60, writePerMinute: 20 }
    }
  };
  const errors = validateConfig(cfg);
  assert.ok(errors.some(e => e.includes("порт")));
});
