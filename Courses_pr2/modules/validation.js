export default {
  name: "Validation",
  version: "1.0.0",
  contractVersion: "1.0.0",
  requires: ["Core"],
  register(container) {
    container.addSingleton("action.validation", () => {
      const storage = container.get("storage");
      return {
        title: "Проверка и добавление оценок студентов",
        async execute() {
          const samples = [
            { student: "Иванов И.И.", subject: "Математика", grade: 5 },
            { student: "Петрова А.С.", subject: "Физика", grade: 4 },
            { student: "Сидоров К.В.", subject: "Информатика", grade: 5 },
            { student: "Кузнецова Е.П.", subject: "История", grade: 3 }
          ];
          for (const r of samples) {
            if (!r.student || r.student.length < 3) {
              throw new Error("Имя студента слишком короткое");
            }
            if (!r.subject || r.subject.length < 2) {
              throw new Error("Название предмета слишком короткое");
            }
            if (!Number.isInteger(r.grade) || r.grade < 2 || r.grade > 5) {
              throw new Error("Оценка должна быть целым числом от 2 до 5");
            }
            storage.add(r);
          }
          console.log(`Добавлено записей оценок: ${samples.length}`);
        }
      };
    });
  },
  async init() {}
};
