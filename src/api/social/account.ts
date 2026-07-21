import { http } from "@/utils/http";

export interface SocialAccountQuery extends BasePageQuery {
  platform?: string;
  accountName?: string;
  nodeName?: string;
}

export type SocialAccountDTO = {
  id: string;
  platform: string;
  accountName: string;
  xhsUserId: string;
  nodeName: string;
  proxyUrl: string;
  status: number;
  remark: string;
  createTime: Date;
  /** 账号容器端口（= 18060 + id） */
  port: number;
};

export type SocialAccountRequest = {
  id?: number;
  platform: string;
  accountName: string;
  nodeName?: string;
  proxyUrl?: string;
  status?: number;
  remark?: string;
};

export type XhsLoginStatus = {
  isLoggedIn: boolean;
  username: string;
};

export type XhsQrcode = {
  /** base64 图片（可能带 data:image 前缀） */
  img: string;
  /** 二维码有效期（秒） */
  timeout: number;
  isLoggedIn: boolean;
};

/** 获取社交账号列表 */
export const getSocialAccountListApi = (params?: SocialAccountQuery) => {
  return http.request<ResponseData<PageDTO<SocialAccountDTO>>>(
    "get",
    "/social/accounts",
    { params }
  );
};

/** 添加社交账号 */
export const addSocialAccountApi = (data: SocialAccountRequest) => {
  return http.request<ResponseData<void>>("post", "/social/accounts", {
    data
  });
};

/** 修改社交账号 */
export const updateSocialAccountApi = (data: SocialAccountRequest) => {
  return http.request<ResponseData<void>>(
    "put",
    `/social/accounts/${data.id}`,
    { data }
  );
};

/** 删除社交账号 */
export const deleteSocialAccountApi = (data: Array<number>) => {
  return http.request<ResponseData<void>>("delete", "/social/accounts", {
    params: {
      // 需要将数组转换为字符串 否则 Axios 序列化后端接收失败
      ids: data.toString()
    }
  });
};

/** 查询账号实时登录状态（容器需启动浏览器导航，耗时 4~60 秒，覆盖默认 10s 超时） */
export const getSocialAccountLoginStatusApi = (id: string) => {
  return http.request<ResponseData<XhsLoginStatus>>(
    "get",
    `/social/accounts/${id}/loginStatus`,
    {},
    { timeout: 90000 }
  );
};

/** 获取扫码登录二维码（同上，覆盖默认 10s 超时） */
export const getSocialAccountQrcodeApi = (id: string) => {
  return http.request<ResponseData<XhsQrcode>>(
    "get",
    `/social/accounts/${id}/qrcode`,
    {},
    { timeout: 90000 }
  );
};

/** 搜索笔记 */
export const searchSocialAccountFeedsApi = (id: string, keyword: string) => {
  return http.request<ResponseData<any>>(
    "get",
    `/social/accounts/${id}/feeds/search`,
    { params: { keyword } }
  );
};
