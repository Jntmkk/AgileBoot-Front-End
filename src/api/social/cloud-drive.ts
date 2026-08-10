import { http } from "@/utils/http";

export type AlistFileInfo = {
  name: string;
  path: string;
  size: number;
  isDir: boolean;
  modified: string;
  type: number;
  thumb: string;
  rawUrl: string;
};

export type AlistListResult = {
  files: AlistFileInfo[];
  total: number;
  hasMore: boolean;
};

/** 浏览云盘目录 */
export const listCloudDriveFilesApi = (
  path: string,
  page?: number,
  perPage?: number
) => {
  return http.request<ResponseData<AlistListResult>>(
    "get",
    "/social/cloud-drive/files",
    {
      params: { path, page: page || 1, perPage: perPage || 50 }
    }
  );
};

/** 同步云盘目录视频 */
export const syncCloudDriveApi = (path: string, syncToken?: string) => {
  const headers: Record<string, string> = {};
  if (syncToken) {
    headers["X-Sync-Token"] = syncToken;
  }
  return http.request<ResponseData<number>>(
    "post",
    "/social/cloud-drive/sync",
    {},
    {
      params: { path },
      headers
    }
  );
};
