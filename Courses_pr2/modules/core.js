export default {
  name: "Core",
  version: "1.0.0",
  contractVersion: "1.0.0",
  requires: [],
  register(container) {
    container.addSingleton("clock", () => ({ now: () => new Date().toISOString() }));
    container.addSingleton("storage", () => {
      const records = [];
      return {
        add(record) { records.push(record); },
        all() { return records.slice(); },
        size() { return records.length; }
      };
    });
  },
  async init() {}
};
