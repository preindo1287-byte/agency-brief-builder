export type Role = "owner" | "editor" | "viewer";

export type BriefSections = {
  background: string;
  objective: string;
  task: string;
  target: string;
  considerations: string;
  deliverables: string;
};

export type Workspace = {
  id: string;
  name: string;
  created_by: string | null;
};

export type Room = {
  id: string;
  workspace_id: string;
  title: string;
  share_slug: string;
  created_by: string | null;
  updated_at: string;
};

export type Brief = {
  id: string;
  room_id: string;
  content: BriefSections;
  updated_by: string | null;
  updated_at: string;
};

export type ApiError = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
