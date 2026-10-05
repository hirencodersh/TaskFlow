import api from '../../lib/api';

export type TaskStatus =
  | 'TODO'
  | 'IN_PROGRESS'
  | 'IN_REVIEW'
  | 'DONE';

export type TaskPriority =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL';

export type TaskUser = {
  id: string;
  name: string;
  email: string;
};

export type TaskProject = {
  id: string;
  name: string;
  status: string;
};

export type Task = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  dueDate: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  project: TaskProject;
  assignee: TaskUser | null;
  createdBy: TaskUser;
};

export type TaskPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type GetTasksParams = {
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  page?: number;
  limit?: number;
  sortBy?:
    | 'createdAt'
    | 'dueDate'
    | 'priority'
    | 'title';
  sortOrder?: 'asc' | 'desc';
};

type GetTasksResponse = {
  success: boolean;
  data: {
    tasks: Task[];
    pagination: TaskPagination;
  };
};

export async function getTasks(
  params?: GetTasksParams,
) {
  const response =
    await api.get<GetTasksResponse>(
      '/tasks',
      {
        params,
      },
    );

  return response.data;
}

export type CreateTaskInput = {
  projectId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
};

type CreateTaskResponse = {
  success: boolean;
  message?: string;
  data: {
    task: Task;
  };
};

export async function createTask(
  input: CreateTaskInput,
) {
  const response =
    await api.post<CreateTaskResponse>(
      '/tasks',
      input,
    );

  return response.data;
}

export async function getTaskById(
  taskId: string,
) {
  const response =
    await api.get<{
      success: boolean;
      data: {
        task: Task;
      };
    }>(`/tasks/${taskId}`);

  return response.data;
}

export type UpdateTaskInput = {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
};

type UpdateTaskResponse = {
  success: boolean;
  message?: string;
  data: {
    task: Task;
  };
};

export async function updateTask(
  taskId: string,
  input: UpdateTaskInput,
) {
  const response =
    await api.patch<UpdateTaskResponse>(
      `/tasks/${taskId}`,
      input,
    );

  return response.data;
}

export async function deleteTask(
  taskId: string,
) {
  const response =
    await api.delete<{
      success: boolean;
      message?: string;
    }>(`/tasks/${taskId}`);

  return response.data;
}