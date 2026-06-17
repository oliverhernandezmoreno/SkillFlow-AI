import { useQueries } from '@tanstack/react-query';

import { listAttendance } from '@/features/attendance/services';
import { listCertificates } from '@/features/certificates/services';
import { listCourses } from '@/features/courses/services';
import { listEmployees } from '@/features/employees/services';
import { listEnrollments } from '@/features/enrollments/services';
import { listEvaluations } from '@/features/evaluations/services';
import { listSenceDeclarations } from '@/features/sence/services';
import { listTrainingSessions } from '@/features/sessions/services';
import { queryKeys } from '@/lib/constants/query-keys';

const defaultFilters = { page: 1, pageSize: 100 };

export function useDashboardData() {
  const results = useQueries({
    queries: [
      {
        queryKey: queryKeys.employees.list(defaultFilters),
        queryFn: () => listEmployees(defaultFilters),
      },
      {
        queryKey: queryKeys.courses.list(defaultFilters),
        queryFn: () => listCourses(defaultFilters),
      },
      {
        queryKey: queryKeys.trainingSessions.list(defaultFilters),
        queryFn: () => listTrainingSessions(defaultFilters),
      },
      {
        queryKey: queryKeys.enrollments.list(defaultFilters),
        queryFn: () => listEnrollments(defaultFilters),
      },
      {
        queryKey: queryKeys.attendance.list(defaultFilters),
        queryFn: () => listAttendance(defaultFilters),
      },
      {
        queryKey: queryKeys.certificates.list(defaultFilters),
        queryFn: () => listCertificates(defaultFilters),
      },
      {
        queryKey: queryKeys.evaluations.list(defaultFilters),
        queryFn: () => listEvaluations(defaultFilters),
      },
      {
        queryKey: queryKeys.sence.declarations(defaultFilters),
        queryFn: () => listSenceDeclarations(defaultFilters),
      },
    ],
  });

  const [employees, courses, trainingSessions, enrollments, attendance, certificates, evaluations, senceDeclarations] =
    results;

  return {
    employees,
    courses,
    trainingSessions,
    enrollments,
    attendance,
    certificates,
    evaluations,
    senceDeclarations,
    isLoading: results.some((result) => result.isLoading),
    isError: results.some((result) => result.isError),
  };
}
