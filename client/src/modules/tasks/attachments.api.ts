import api from '../../lib/api';

export type TaskAttachment = {
  id: string;
  taskId: string;
  uploaderId: string;
  url: string;
  publicId: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
};

type GetAttachmentsResponse = {
  success: boolean;
  data: {
    attachments: TaskAttachment[];
  };
};

type UploadAttachmentResponse = {
  success: boolean;
  message?: string;
  data: {
    attachment: TaskAttachment;
  };
};

export async function getTaskAttachments(
  taskId: string,
) {
  const response =
    await api.get<GetAttachmentsResponse>(
      `/tasks/${taskId}/attachments`,
    );

  return response.data;
}

export async function uploadTaskAttachment(
  taskId: string,
  file: File,
) {
  const formData = new FormData();

  formData.append('file', file);

  const response =
    await api.post<UploadAttachmentResponse>(
      `/tasks/${taskId}/attachments`,
      formData,
    );

  return response.data;
}

export async function deleteTaskAttachment(
  attachmentId: string,
) {
  const response =
    await api.delete<{
      success: boolean;
      message?: string;
    }>(`/attachments/${attachmentId}`);

  return response.data;
}