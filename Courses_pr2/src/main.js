import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import { Container } from "./container.js";
import { loadModulesFromConfig, buildOrder } from "./moduleLoader.js";
import { Logger } from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.resolve(__dirname, "..", "config", "modules.json");
const modulesDir = path.resolve(__dirname, "..", "modules");

async function main() {
  try {
    Logger.separator();
    Logger.info("Запуск модульного приложения «Электронный журнал оценок»");
    Logger.separator();
    console.log();

    Logger.info("Загрузка модулей из конфигурации...");
    const all = await loadModulesFromConfig(configPath, modulesDir);

    Logger.success(`Загружено модулей: ${all.size}`);
    for (const [, module] of all) {
      const deps = module.requires?.length ? ` (зависит от: ${module.requires.join(", ")})` : "";
      Logger.module(module.name, `Загружен${deps}`);
    }
    console.log();

    const raw = await fs.readFile(configPath, "utf8");
    const cfg = JSON.parse(raw);
    const enabledNames = cfg.modules.map(file => {
      const moduleName = path.basename(file, '.js');
      const nameMap = {
        'core': 'Core',
        'logging': 'Logging',
        'validation': 'Validation',
        'export': 'Export',
        'report': 'Report',
        'di-demo': 'DIDemo',
        'lifetime-demo': 'LifetimeDemo',
        'circular-a': 'CircularA',
        'circular-b': 'CircularB'
      };
      return nameMap[moduleName] || moduleName;
    });

    Logger.info("Проверка зависимостей модулей...");
    const ordered = buildOrder(all, enabledNames);

    Logger.success("Порядок запуска модулей:");
    ordered.forEach((m, i) => {
      const deps = m.requires?.length ? ` (зависит от: ${m.requires.join(", ")})` : "";
      Logger.module(m.name, `${i + 1}.${deps}`);
    });
    console.log();

    Logger.info("Регистрация сервисов модулей...");
    const container = new Container();

    for (const m of ordered) {
      if (typeof m.register === "function") {
        Logger.module(m.name, "Регистрация сервисов...");
        m.register(container);
      }
    }
    Logger.success("Все сервисы зарегистрированы");
    console.log();

    Logger.info("Инициализация модулей...");
    for (const m of ordered) {
      if (typeof m.init === "function") {
        Logger.module(m.name, "Инициализация...");
        await m.init(container);
      }
    }
    Logger.success("Все модули инициализированы");
    console.log();

    Logger.info("Запуск действий модулей...");
    Logger.separator();

    const actions = container.getMany("action.");

    for (const act of actions) {
      console.log();
      Logger.info(`Выполнение: ${act.title}`);
      await act.execute();
    }

    Logger.separator();
    console.log();

    Logger.info("Проверка результатов выполнения...");

    const exportPath = path.resolve(process.cwd(), "grades.txt");
    try {
      await fs.access(exportPath);
      const stats = await fs.stat(exportPath);
      Logger.success(`Файл экспорта создан (размер: ${stats.size} байт): ${exportPath}`);
    } catch {
      Logger.warning("Файл экспорта не найден");
    }

    console.log();
    Logger.separator();
    Logger.success("Приложение завершило работу успешно");
    Logger.separator();

  } catch (error) {
    Logger.separator();
    Logger.error(`Ошибка: ${error.message}`);
    if (error.stack) {
      console.log(error.stack);
    }
    Logger.separator();
    process.exit(1);
  }
}

main();
