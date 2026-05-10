export function createLabsRepo() {
  const map = new Map();

  return {
    list() {
      return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title, "ru"));
    },
    get(id) {
      return map.get(id) ?? null;
    },
    create(title, maxScore) {
      const id = randomId();
      const lab = { id, title, maxScore };
      map.set(id, lab);
      return lab;
    }
  };
}

function randomId() {
  return Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
}
