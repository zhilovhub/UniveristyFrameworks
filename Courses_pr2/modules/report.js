export default {
  name: "Report",
  version: "1.0.0",
  contractVersion: "1.0.0",
  requires: ["Core", "Export"],
  register(container) {
    container.addSingleton("action.report", () => {
      const clock = container.get("clock");
      const storage = container.get("storage");
      return {
        title: "Формирование сводки по успеваемости",
        async execute() {
          const records = storage.all();
          const count = records.length;
          const avg = count === 0 ? 0 : records.reduce((s, r) => s + r.grade, 0) / count;
          console.log(`Сводка успеваемости сформирована, время ${clock.now()}, записей ${count}, средний балл ${avg.toFixed(2)}`);
        }
      };
    });
  },
  async init() {}
};
