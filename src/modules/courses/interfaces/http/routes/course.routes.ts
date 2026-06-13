import { Router } from 'express';

import { validateBody } from '../../../../../shared/interfaces/http/validate-request.js';
import { ArchiveCourseUseCase } from '../../../application/use-cases/archive-course.use-case.js';
import { CreateCourseUseCase } from '../../../application/use-cases/create-course.use-case.js';
import { GetCourseUseCase } from '../../../application/use-cases/get-course.use-case.js';
import { ListCoursesUseCase } from '../../../application/use-cases/list-courses.use-case.js';
import { UpdateCourseUseCase } from '../../../application/use-cases/update-course.use-case.js';
import { PrismaCourseRepository } from '../../../infrastructure/prisma/prisma-course.repository.js';
import { CourseController } from '../controllers/course.controller.js';
import { createCourseSchema, updateCourseSchema } from '../validators/course.validators.js';

export function createCourseRouter(): Router {
  const router = Router();
  const repository = new PrismaCourseRepository();
  const controller = new CourseController(
    new ListCoursesUseCase(repository),
    new CreateCourseUseCase(repository),
    new GetCourseUseCase(repository),
    new UpdateCourseUseCase(repository),
    new ArchiveCourseUseCase(repository),
  );

  router.get('/courses', controller.list);
  router.post('/courses', validateBody(createCourseSchema), controller.create);
  router.get('/courses/:courseId', controller.get);
  router.patch('/courses/:courseId', validateBody(updateCourseSchema), controller.update);
  router.delete('/courses/:courseId', controller.archive);

  return router;
}
