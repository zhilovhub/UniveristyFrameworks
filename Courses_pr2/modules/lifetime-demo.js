class SingletonCounter {
  constructor(id) {
    this.id = id;
    this.count = 0;
    console.log(`[SingletonCounter] Создан экземпляр #${this.id}`);
  }

  increment() {
    this.count++;
    console.log(`[SingletonCounter #${this.id}] Увеличено до ${this.count}`);
    return this.count;
  }

  getValue() {
    return this.count;
  }
}

class TransientCounter {
  constructor(id) {
    this.id = id;
    this.count = 0;
    console.log(`[TransientCounter] Создан новый экземпляр #${this.id}`);
  }

  increment() {
    this.count++;
    console.log(`[TransientCounter #${this.id}] Увеличено до ${this.count}`);
    return this.count;
  }

  getValue() {
    return this.count;
  }
}

let singletonInstanceId = 0;
let transientInstanceId = 0;

export default {
  name: "LifetimeDemo",
  version: "1.0.0",
  contractVersion: "1.0.0",
  requires: ["Core"],

  register(container) {
    console.log("[LifetimeDemo] Регистрация сервисов с разными временами жизни...");

    container.addSingleton("counter.singleton", () => {
      return new SingletonCounter(++singletonInstanceId);
    });

    container.addTransient("counter.transient", () => {
      return new TransientCounter(++transientInstanceId);
    });

    container.addSingleton("action.lifetimedemo", (c) => {
      return {
        title: "Демонстрация времён жизни объектов",
        async execute() {
          console.log("\n=== Демонстрация времён жизни объектов ===\n");

          console.log("SINGLETON (один экземпляр):");
          const s1 = c.get("counter.singleton");
          const s2 = c.get("counter.singleton");

          console.log(`s1 === s2: ${s1 === s2 ? "true (один и тот же объект)" : "false"}`);
          s1.increment();
          console.log(`s1.getValue(): ${s1.getValue()}`);
          console.log(`s2.getValue(): ${s2.getValue()} (должно быть то же значение)\n`);

          console.log("TRANSIENT (новый экземпляр каждый раз):");
          const t1 = c.get("counter.transient");
          const t2 = c.get("counter.transient");

          console.log(`t1 === t2: ${t1 === t2 ? "true" : "false (разные объекты)"}`);
          t1.increment();
          console.log(`t1.getValue(): ${t1.getValue()}`);
          console.log(`t2.getValue(): ${t2.getValue()} (должно быть 0, т.к. это другой объект)\n`);

          console.log("=== Конец демонстрации ===\n");
        }
      };
    });
  },

  async init() {
    console.log("[LifetimeDemo] Модуль инициализирован");
  }
};
