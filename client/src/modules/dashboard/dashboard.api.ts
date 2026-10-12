import api from '../../lib/api';

export type AnalyticsData = {
  role: string;
  stats?: {
    totalUsers?: number;
    usersByRole?: Array<{
      role: string;
      _count: { id: number };
    }>;
    totalProjects?: number;
    projectsByStatus?: Array<{
      status: string;
      _count: { id: number };
    }>;
    totalTasks?: number;
    tasksByStatus?: Array<{
      status: string;
      _count: { id: number };
    }>;
    tasksByPriority?: Array<{
      priority: string;
      _count: { id: number };
    }>;
    totalAssigned?: number;
  };
  ownedProjects?: Array<{
    id: string;
    name: string;
    status: string;
    _count: { tasks: number };
    members: Array<{
      user: {
        id: string;
        name: string;
        role: string;
      };
    }>;
  }>;
  overdueTasks?: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
    project: { id: string; name: string };
    assignees?: Array<{
      user: { id: string; name: string };
    }>;
  }>;
  upcomingDeadlines?: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
    project: { id: string; name: string };
  }>;
  teamWorkload?: Array<{
    id: string;
    name: string;
    role: string;
    activeTasksCount?: number;
    _count?: { assignedTasks: number };
  }>;
  assignedTasks?: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
    project: { id: string; name: string };
  }>;
  recentActivity?: Array<{
    id: string;
    action: string;
    createdAt: string;
    actor: {
      id: string;
      name: string;
      role: string;
    };
    project: {
      id: string;
      name: string;
    } | null;
  }>;
};

type AnalyticsResponse = {
  success: boolean;
  data: AnalyticsData;
};

export async function getDashboardAnalytics(params?: {
  projectId?: string;
  status?: string;
  priority?: string;
}) {
  const response =
    await api.get<AnalyticsResponse>(
      '/analytics',
      {
        params,
      },
    );

  return response.data;
}
