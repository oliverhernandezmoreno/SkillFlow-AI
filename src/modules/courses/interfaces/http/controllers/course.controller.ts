import type { Request, Response } from 'express';

import { asyncHandler } from '../../../../../shared/interfaces/http/async-handler.js';
import {
  getOptionalQueryNumber,
  getOptionalQueryString,
  getRequiredParam,
} from '../../../../../shared/interfaces/http/request-values.js';
import type { CourseModality, CourseStatus } from '../../../domain/entities/course.entity.js';
import type { CreateCourseDto, UpdateCourseDto } from '../../../application/dto/course.dto.js';
import type { ArchiveCourseUseCase } from '../../../application/use-cases/archive-course.use-case.js';
import type { CreateCourseUseCase } from '../../../application/use-cases/create-course.use-case.js';
import type { GetCourseUseCase } from '../../../application/use-cases/get-course.use-case.js';
import type { ListCoursesUseCase } from '../../../application/use-cases/list-courses.use-case.js';
import type { UpdateCourseUseCase } from '../../../application/use-cases/update-course.use-case.js';

export class CourseController {
  constructor(
    private readonly listCoursesUseCase: ListCoursesUseCase,
    private readonly createCourseUseCase: CreateCourseUseCase,
    private readonly getCourseUseCase: GetCourseUseCase,
    private readonly updateCourseUseCase: UpdateCourseUseCase,
    private readonly archiveCourseUseCase: ArchiveCourseUseCase,
  ) {}

  list = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const result = await this.listCoursesUseCase.execute({
      organizationId: getOptionalQueryString(request, 'organizationId') ?? '',
      page: getOptionalQueryNumber(request, 'page'),
      pageSize: getOptionalQueryNumber(request, 'pageSize'),
      search: getOptionalQueryString(request, 'search'),
      modality: getOptionalQueryString(request, 'modality') as CourseModality | undefined,
      status: getOptionalQueryString(request, 'status') as CourseStatus | undefined,
    });
    response.status(200).json(result);
  });

  create = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const result = await this.createCourseUseCase.execute(request.body as CreateCourseDto);
    response.status(201).json(result);
  });

  get = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const result = await this.getCourseUseCase.execute(getRequiredParam(request, 'courseId'));
    response.status(200).json(result);
  });

  update = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const result = await this.updateCourseUseCase.execute(
      getRequiredParam(request, 'courseId'),
      request.body as UpdateCourseDto,
    );
    response.status(200).json(result);
  });

  archive = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    await this.archiveCourseUseCase.execute(getRequiredParam(request, 'courseId'));
    response.status(204).send();
  });
}
