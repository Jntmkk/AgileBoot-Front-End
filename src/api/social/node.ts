import { http } from "@/utils/http";

export type SocialNodeDTO = {
  id: string;
  nodeName: string;
  egressIp: string;
  ipType: string;
  lastHeartbeat: Date;
  status: number;
  remark: string;
  /** 是否在线（10 分钟内有心跳） */
  online: boolean;
};

export type SocialNodeRequest = {
  id: number;
  status?: number;
  remark?: string;
};

/** 获取住宅节点列表 */
export const getSocialNodeListApi = (params?: BasePageQuery) => {
  return http.request<ResponseData<PageDTO<SocialNodeDTO>>>(
    "get",
    "/social/nodes",
    { params }
  );
};

/** 修改节点（状态/备注） */
export const updateSocialNodeApi = (data: SocialNodeRequest) => {
  return http.request<ResponseData<void>>("put", "/social/nodes", { data });
};
