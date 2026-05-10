const { v4: uuidv4 } = require('uuid');

class Course {
  constructor(title, lecturer, credits, capacity) {
    this.id = uuidv4();
    this.title = title;
    this.lecturer = lecturer;
    this.credits = credits;
    this.capacity = capacity;
    this.createdAt = new Date().toISOString();
  }

  static validate(courseData) {
    const errors = [];

    if (!courseData.title || courseData.title.trim() === '') {
      errors.push('Название курса не может быть пустым');
    }

    if (!courseData.lecturer || courseData.lecturer.trim() === '') {
      errors.push('Имя преподавателя не может быть пустым');
    }

    if (courseData.credits === undefined || courseData.credits === null) {
      errors.push('Количество кредитов обязательно для заполнения');
    } else if (isNaN(courseData.credits) || courseData.credits < 1) {
      errors.push('Количество кредитов должно быть положительным числом');
    }

    if (courseData.capacity === undefined || courseData.capacity === null) {
      errors.push('Вместимость обязательна для заполнения');
    } else if (isNaN(courseData.capacity) || courseData.capacity < 1) {
      errors.push('Вместимость должна быть положительным числом');
    }

    return errors;
  }

  static fromRequest(body) {
    return new Course(
      body.title,
      body.lecturer,
      parseInt(body.credits),
      parseInt(body.capacity)
    );
  }
}

module.exports = Course;
