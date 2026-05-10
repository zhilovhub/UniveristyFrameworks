import http from "http";

async function loadTest(url, requests, concurrency, description = "") {
  console.log(`\n${description || "Нагрузочный тест"}`);
  console.log(`   URL: ${url}`);
  console.log(`   Запросов: ${requests}, Одновременно: ${concurrency}`);

  let completed = 0;
  let success = 0;
  let rateLimited = 0;
  let errors = 0;
  const start = Date.now();

  const promises = [];

  for (let i = 0; i < requests; i++) {
    const p = new Promise((resolve) => {
      const req = http.request(url, (res) => {
        let data = "";
        res.on("data", () => {});
        res.on("end", () => {
          if (res.statusCode === 200) success++;
          else if (res.statusCode === 429) rateLimited++;
          else errors++;
          completed++;
          resolve();
        });
      });
      req.on("error", () => {
        errors++;
        completed++;
        resolve();
      });
      req.end();
    });
    promises.push(p);

    if (promises.length >= concurrency) {
      await Promise.all(promises);
      promises.length = 0;
    }
  }

  await Promise.all(promises);
  const duration = (Date.now() - start) / 1000;

  console.log(`\nРезультаты:`);
  console.log(`   Успешно (200): ${success}`);
  console.log(`   Rate limited (429): ${rateLimited}`);
  console.log(`   Ошибки: ${errors}`);
  console.log(`   Время: ${duration.toFixed(2)}с`);
  console.log(`   RPS: ${(requests / duration).toFixed(2)}`);

  return { success, rateLimited, errors, duration, rps: requests / duration };
}

async function runLoadTests() {
  console.log("===============================================");
  console.log("     НАГРУЗОЧНОЕ ТЕСТИРОВАНИЕ");
  console.log("===============================================\n");

  console.log("Убедитесь, что сервер запущен (npm start)");
  console.log("Тест будет выполнен через 2 секунды...\n");

  await new Promise(resolve => setTimeout(resolve, 2000));

  await loadTest("http://localhost:3000/api/labs", 30, 5, "Тест 1: Чтение, низкая нагрузка");

  await loadTest("http://localhost:3000/api/labs", 100, 20, "Тест 2: Чтение, высокая нагрузка");

  await loadTest("http://localhost:3000/api/labs", 50, 10, "Тест 3: Запись (POST), средняя нагрузка");

  console.log("\n===============================================");
  console.log("     ТЕСТ ЗАВЕРШЁН");
  console.log("===============================================\n");

  console.log("Интерпретация результатов:");
  console.log("   - Если rateLimited > 0, rate limiting работает");
  console.log("   - Если ошибок много, проверьте, запущен ли сервер");
  console.log("   - RPS показывает пропускную способность");
}

runLoadTests().catch(console.error);
