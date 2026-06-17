import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { type CourseFilters, createCourse, listCourses, updateCourse } from '@/features/courses/services';
import { queryKeys } from '@/lib/constants/query-keys';
import type { CourseInput } from '@/types/resources';

export function useCourses(filters: CourseFilters = {}) {
  return useQuery({
    queryKey: queryKeys.courses.list(filters),
    queryFn: () => listCourses(filters),
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCourse,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.courses.lists() }),
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, input }: { courseId: string; input: Partial<CourseInput> }) =>
      updateCourse(courseId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.courses.lists() }),
  });
}
