import api from '../../lib/api';

export type ActivityLog = {
  id: string;
  projectId: string;
  taskId: string | null;
  actorId: string;
  action: string;
  metadata: unknown;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    email: string;
  };
  task: {
    id: string;
    title: string;
  } | null;
};

export type ActivityLogPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type ActivityLogsResponse = {
  success: boolean;
  data: {
    logs: ActivityLog[];
    pagination: ActivityLogPagination;
  };
};

export async function getProjectActivityLogs(
  projectId: string,
  page = 1,
  limit = 20,
) {
  const response =
    await api.get<ActivityLogsResponse>(
      '/activity-logs',
      {
        params: {
          projectId,
          page,
          limit,
        },
      },
    );

  return response.data;
}