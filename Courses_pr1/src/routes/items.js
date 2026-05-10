const express = require('express');
const router = express.Router();
const Course = require('../models/Course');

let courses = [
  new Course('Алгоритмы и структуры данных', 'Иванов И.И.', 5, 30),
  new Course('Базы данных', 'Петрова О.С.', 4, 25),
  new Course('Технологии разработки приложений', 'Макиевский С.Е.', 6, 40),
  new Course('Машинное обучение', 'Сидоров А.В.', 5, 20)
];

router.get('/', (req, res) => {
  res.json({
    success: true,
    count: courses.length,
    data: courses
  });
});

router.get('/:id', (req, res, next) => {
  const course = courses.find(c => c.id === req.params.id);

  if (!course) {
    const error = new Error(`Курс с ID ${req.params.id} не найден`);
    error.statusCode = 404;
    error.code = 'NotFoundError';
    return next(error);
  }

  res.json({
    success: true,
    data: course
  });
});

router.post('/', (req, res, next) => {
  const errors = Course.validate(req.body);

  if (errors.length > 0) {
    const error = new Error(errors.join('; '));
    error.statusCode = 400;
    error.code = 'ValidationError';
    return next(error);
  }

  const newCourse = Course.fromRequest(req.body);
  courses.push(newCourse);

  res.status(201).json({
    success: true,
    message: 'Курс успешно создан',
    data: newCourse
  });
});

router.delete('/:id', (req, res, next) => {
  const index = courses.findIndex(c => c.id === req.params.id);

  if (index === -1) {
    const error = new Error(`Курс с ID ${req.params.id} не найден`);
    error.statusCode = 404;
    error.code = 'NotFoundError';
    return next(error);
  }

  const deletedCourse = courses[index];
  courses.splice(index, 1);

  res.json({
    success: true,
    message: 'Курс успешно удалён',
    data: deletedCourse
  });
});

module.exports = router;
