import { http } from "@/utils/http";

export interface SocialSyncPostQuery extends BasePageQuery {
  title?: string;
  nickname?: string;
  platform?: string;
  postType?: number;
  audioStatus?: number;
}

export type SocialSyncPostDTO = {
  id: string;
  platform: string;
  platformUserId: string;
  nickname: string;
  platformPostId: string;
  /** 1图文 2视频 */
  postType: number;
  title: string;
  content: string;
  videoUrl: string;
  coverUrl: string;
  images: string;
  platformPostUrl: string;
  publishedAt: Date;
  syncedAt: Date;
  createTime: Date;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  coinCount: number;
  /** 0新 1待转写 2取址失败 3已总结 4转写中 5待总结 6转写失败 */
  audioStatus: number;
  audioDownloadedAt: Date;
  audioSummarizedAt: Date;
  remark: string;
  audioUrl: string;
  audioTranscript: string;
  audioSentenceTimestamps: string;
  audioSummary: string;
};

/** 动态列表 */
export const getSocialPostListApi = (params?: SocialSyncPostQuery) => {
  return http.request<ResponseData<PageDTO<SocialSyncPostDTO>>>(
    "get",
    "/social/posts",
    { params }
  );
};

/** 动态详情（含转写与总结全文） */
export const getSocialPostInfoApi = (id: string) => {
  return http.request<ResponseData<SocialSyncPostDTO>>(
    "get",
    `/social/posts/${id}`
  );
};

/** 手动重触发转写（重置为待转写，本机 ASR worker 消费） */
export const retriggerTranscribeApi = (id: string) => {
  return http.request<ResponseData<void>>(
    "post",
    `/social/posts/${id}/retriggerTranscribe`
  );
};

/** 手动重触发总结（基于已有转写文本） */
export const retriggerSummaryApi = (id: string) => {
  return http.request<ResponseData<void>>(
    "post",
    `/social/posts/${id}/retriggerSummary`
  );
};
