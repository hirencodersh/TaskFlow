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

export type TaskLabel = {
  taskId: string;
  labelId: string;
  label: Label;
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
    labels: TaskLabel[];
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

export type Label = {
  id: string;
  projectId: string;
  name: string;
  color: string;
  createdAt: string;
};

export type CreateLabelInput = {
  projectId: string;
  name: string;
  color: string;
};

type LabelResponse = {
  success: boolean;
  message?: string;
  data: {
    label: Label;
  };
};

type LabelsResponse = {
  success: boolean;
  message?: string;
  data: {
    labels: Label[];
  };
};

export async function createLabel(
  input: CreateLabelInput,
) {
  const response =
    await api.post<LabelResponse>(
      '/labels',
      input,
    );

  return response.data;
}

export async function getProjectLabels(
    projectId: string,
) {
    const response =
        await api.get<LabelsResponse>(
            `/labels/projects/${projectId}`,
        );

    return response.data;
}

export type UpdateLabelInput = {
  name: string;
  color: string;
};

export async function updateLabel(
  labelId: string,
  input: UpdateLabelInput,
) {
  const response =
    await api.patch<LabelResponse>(
      `/labels/${labelId}`,
      input,
    );

  return response.data;
}

export async function deleteLabel(
  labelId: string,
) {
  const response =
    await api.delete<{
      success: boolean;
      message?: string;
    }>(`/labels/${labelId}`);

  return response.data;
}

export async function assignLabelToTask(
  taskId: string,
  labelId: string,
) {
  const response = await api.post<{
    success: boolean;
    message?: string;
    data: {
      taskLabel: TaskLabel;
    };
  }>(`/labels/tasks/${taskId}/labels`, {
    labelId,
  });

  return response.data;
}

export async function removeLabelFromTask(
  taskId: string,
  labelId: string,
) {
  const response = await api.delete<{
    success: boolean;
    message?: string;
  }>(`/labels/tasks/${taskId}/labels`, {
    data: {
      labelId,
    },
  });

  return response.data;
}