class GradeProcessor {
  constructor(storage, clock) {
    this.storage = storage;
    this.clock = clock;
    console.log(`[DI Demo] GradeProcessor создан через DI с зависимостями storage и clock`);
  }

  process(record) {
    this.storage.add(record);
    console.log(`[DI Demo] Оценка обработана в ${this.clock.now()}`);
    return { processed: true, timestamp: this.clock.now() };
  }
}

class GradeReportBuilder {
  constructor(processor, logger) {
    this.processor = processor;
    this.logger = logger;
    console.log(`[DI Demo] GradeReportBuilder создан через DI с зависимостями processor и logger`);
  }

  async build() {
    this.logger.log("Начинаем построение сводки оценок...");
    const result = this.processor.process({ student: "Тестов Т.Т.", subject: "Демо", grade: 5 });
    this.logger.log(`Сводка построена: ${JSON.stringify(result)}`);
    return result;
  }
}

class SimpleLogger {
  log(message) {
    console.log(`[SimpleLogger] ${message}`);
  }
}

export default {
  name: "DIDemo",
  version: "1.0.0",
  contractVersion: "1.0.0",
  requires: ["Core"],

  register(container) {
    console.log("[DIDemo] Регистрация сервисов с демонстрацией DI...");

    container.addSingleton("demo.logger", () => new SimpleLogger());

    container.addSingleton("demo.processor", (c) => {
      const storage = c.get("storage");
      const clock = c.get("clock");
      return new GradeProcessor(storage, clock);
    });

    container.addSingleton("demo.builder", (c) => {
      const processor = c.get("demo.processor");
      const logger = c.get("demo.logger");
      return new GradeReportBuilder(processor, logger);
    });

    container.addSingleton("action.didemo", (c) => {
      const builder = c.get("demo.builder");
      return {
        title: "Демонстрация внедрения зависимостей",
        async execute() {
          console.log("\n=== Демонстрация DI через конструкторы ===");
          const result = await builder.build();
          console.log("Результат:", result);
          console.log("=== Конец демонстрации DI ===\n");
        }
      };
    });
  },

  async init() {
    console.log("[DIDemo] Модуль инициализирован");
  }
};
