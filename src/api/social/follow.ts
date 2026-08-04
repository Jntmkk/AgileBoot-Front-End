import { http } from "@/utils/http";

export interface SocialFollowUpQuery extends BasePageQuery {
  platform?: string;
  upId?: string;
  upName?: string;
  status?: number;
  syncEnabled?: number;
}

export type SocialFollowUpDTO = {
  id: string;
  platform: string;
  upId: string;
  upName: string;
  upAvatar: string;
  status: number;
  syncEnabled: number;
  lastSyncAt: Date;
  remark: string;
  createTime: Date;
};

export type SocialFollowUpRequest = {
  id?: number;
  platform: string;
  upId: string;
  upName: string;
  upAvatar?: string;
  status?: number;
  syncEnabled?: number;
  remark?: string;
};

export type SyncByLinkCommand = {
  platform: string;
  url: string;
};

export type BackfillCommand = {
  startTime: string;
  endTime: string;
  platform?: string;
};

/** 关注UP列表 */
export const getSocialFollowUpListApi = (params?: SocialFollowUpQuery) => {
  return http.request<ResponseData<PageDTO<SocialFollowUpDTO>>>(
    "get",
    "/social/follows",
    { params }
  );
};

/** 关注UP详情 */
export const getSocialFollowUpInfoApi = (id: string) => {
  return http.request<ResponseData<SocialFollowUpDTO>>(
    "get",
    `/social/follows/${id}`
  );
};

/** 新增关注UP */
export const addSocialFollowUpApi = (data: SocialFollowUpRequest) => {
  return http.request<ResponseData<void>>("post", "/social/follows", { data });
};

/** 修改关注UP */
export const updateSocialFollowUpApi = (data: SocialFollowUpRequest) => {
  return http.request<ResponseData<void>>("put", `/social/follows/${data.id}`, {
    data
  });
};

/** 删除关注UP（ids 数组） */
export const deleteSocialFollowUpApi = (ids: Array<number>) => {
  return http.request<ResponseData<void>>("delete", "/social/follows", {
    params: {
      ids: ids.toString()
    }
  });
};

/** 同步指定链接（B站动态/视频链接） */
export const syncByLinkApi = (data: SyncByLinkCommand) => {
  return http.request<ResponseData<void>>(
    "post",
    "/social/follows/syncByLink",
    { data }
  );
};

/** 按时间范围补数据 */
export const backfillApi = (data: BackfillCommand) => {
  return http.request<ResponseData<void>>("post", "/social/follows/backfill", {
    data
  });
};
