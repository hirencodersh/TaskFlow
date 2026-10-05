import api from '../../lib/api';

export type TaskComment = {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
};

type GetCommentsResponse = {
  success: boolean;
  data: {
    comments: TaskComment[];
  };
};

type CreateCommentResponse = {
  success: boolean;
  message?: string;
  data: {
    comment: TaskComment;
  };
};

export async function getTaskComments(
  taskId: string,
) {
  const response =
    await api.get<GetCommentsResponse>(
      `/tasks/${taskId}/comments`,
    );

  return response.data;
}

export async function createTaskComment(
  taskId: string,
  content: string,
) {
  const response =
    await api.post<CreateCommentResponse>(
      `/tasks/${taskId}/comments`,
      {
        content,
      },
    );

  return response.data;
}

export async function updateTaskComment(
  commentId: string,
  content: string,
) {
  const response =
    await api.patch<{
      success: boolean;
      message?: string;
      data: {
        comment: TaskComment;
      };
    }>(`/comments/${commentId}`, {
      content,
    });

  return response.data;
}

export async function deleteTaskComment(
  commentId: string,
) {
  const response =
    await api.delete<{
      success: boolean;
      message?: string;
    }>(`/comments/${commentId}`);

  return response.data;
}