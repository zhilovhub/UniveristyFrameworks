import fs from "node:fs/promises";
import path from "node:path";

export default {
  name: "Export",
  version: "1.0.0",
  contractVersion: "1.0.0",
  requires: ["Core", "Validation"],
  register(container) {
    container.addSingleton("action.export", () => {
      const storage = container.get("storage");
      return {
        title: "Экспорт оценок в файл",
        async execute() {
          const lines = storage.all().map(r => `${r.student};${r.subject};${r.grade}`);
          const out = path.resolve(process.cwd(), "grades.txt");
          await fs.writeFile(out, lines.join("\n"), "utf8");
        }
      };
    });
  },
  async init() {}
};
