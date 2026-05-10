const States = {
  NEW: 'Новый',
  APPLY_RECEIVED: 'ЗаявкаПринята',
  BOOKED: 'РесурсЗабронирован',
  ACCESS_ISSUED: 'ДоступВыдан',
  COMPLETED: 'Завершён',
  ERROR: 'Ошибка',
  COMPENSATED: 'КомпенсацияВыполнена'
};

const Events = {
  ACCEPT: 'ПринятьЗаявку',
  BOOK: 'Забронировать',
  ISSUE: 'ВыдатьДоступ',
  COMPLETE: 'Завершить',
  COMPENSATE: 'Компенсировать'
};

module.exports = { States, Events };
