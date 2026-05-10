# Courses API

Мини-веб служба для каталога учебных курсов (Node.js + Express).

## Запуск

```bash
npm install
npm start
```

Сервер по умолчанию слушает порт 3000.

## Точки доступа

- `GET /api/items` — список всех курсов
- `GET /api/items/:id` — один курс по идентификатору
- `POST /api/items` — создание нового курса
- `DELETE /api/items/:id` — удаление курса

## Пример запросов

```bash
curl http://localhost:3000/api/items

curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"title":"Веб-программирование","lecturer":"Зайцева Е.К.","credits":4,"capacity":35}'

curl http://localhost:3000/api/items/<id>

curl -X DELETE http://localhost:3000/api/items/<id>
```
