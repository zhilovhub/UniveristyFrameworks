export default {
  name: "Logging",
  version: "1.0.0",
  contractVersion: "1.0.0",
  requires: ["Core"],
  register(container) {
    container.addSingleton("action.logging", () => ({
      title: "Запись события в журнал",
      async execute() {
        const clock = container.get("clock");
        console.log(`Журнал оценок открыт, время ${clock.now()}`);
      }
    }));
  },
  async init() {}
};
