# BookingService

Учебная веб-служба бронирования переговорной комнаты с машиной состояний, идемпотентностью, компенсацией и наблюдаемостью (Node.js + Express).

## Запуск

```bash
npm install
npm start
```

По умолчанию порт 3000, переопределяется переменной `PORT`.

## Состояния и события

```
Новый ──ПринятьЗаявку──▶ ЗаявкаПринята ──Забронировать──▶ РесурсЗабронирован
   ──ВыдатьДоступ──▶ ДоступВыдан ──Завершить──▶ Завершён
                  └─(сбой)─▶ КомпенсацияВыполнена
```

## Точки доступа

| Метод | Путь                          | Назначение                                        |
|-------|-------------------------------|---------------------------------------------------|
| POST  | `/process-event`              | Подать событие в машину состояний                 |
| GET   | `/process-event/:processId`   | Состояние, контекст и история процесса            |
| GET   | `/metrics`                    | Текущие показатели                                |
| GET   | `/health/live`                | Проверка живости                                  |
| GET   | `/health/ready`               | Проверка готовности                               |
| POST  | `/admin/degrade`              | Включить критическую деградацию                   |
| POST  | `/admin/recover`              | Выключить деградацию                              |
| POST  | `/admin/fail/issue/on`        | Имитировать сбой на шаге `ВыдатьДоступ`           |
| POST  | `/admin/fail/issue/off`       | Отключить имитацию сбоя                           |
| GET   | `/admin/state`                | Административные флаги                            |
| GET   | `/admin/compensation-log`     | Журнал выполненных компенсаций                    |
| GET   | `/admin/processes`            | Все процессы в памяти                             |

## Пример успешного сценария

```bash
curl -X POST http://localhost:3000/admin/fail/issue/off

curl -X POST http://localhost:3000/process-event \
  -H 'Content-Type: application/json' \
  -d '{"processId":"room-001","event":"ПринятьЗаявку","idempotencyKey":"e1","correlationId":"t1"}'

curl -X POST http://localhost:3000/process-event \
  -H 'Content-Type: application/json' \
  -d '{"processId":"room-001","event":"Забронировать","idempotencyKey":"e2","correlationId":"t1"}'

curl -X POST http://localhost:3000/process-event \
  -H 'Content-Type: application/json' \
  -d '{"processId":"room-001","event":"ВыдатьДоступ","idempotencyKey":"e3","correlationId":"t1"}'

curl -X POST http://localhost:3000/process-event \
  -H 'Content-Type: application/json' \
  -d '{"processId":"room-001","event":"Завершить","idempotencyKey":"e4","correlationId":"t1"}'
```

## Сценарий со сбоем и компенсацией

```bash
curl -X POST http://localhost:3000/admin/fail/issue/on

curl -X POST http://localhost:3000/process-event \
  -H 'Content-Type: application/json' \
  -d '{"processId":"room-002","event":"ПринятьЗаявку","idempotencyKey":"f1","correlationId":"t2"}'

curl -X POST http://localhost:3000/process-event \
  -H 'Content-Type: application/json' \
  -d '{"processId":"room-002","event":"Забронировать","idempotencyKey":"f2","correlationId":"t2"}'

curl -X POST http://localhost:3000/process-event \
  -H 'Content-Type: application/json' \
  -d '{"processId":"room-002","event":"ВыдатьДоступ","idempotencyKey":"f3","correlationId":"t2"}'

curl http://localhost:3000/admin/compensation-log
```

## Поля запроса `POST /process-event`

| Поле             | Обязательное | Описание                                       |
|------------------|--------------|------------------------------------------------|
| `processId`      | да           | Ключ процесса                                  |
| `event`          | да           | Событие (`ПринятьЗаявку`, `Забронировать`, `ВыдатьДоступ`, `Завершить`) |
| `idempotencyKey` | да           | Ключ идемпотентности события                   |
| `correlationId`  | да           | Сквозной идентификатор корреляции для логов    |
| `payload`        | нет          | Произвольные данные, попадающие в контекст     |
