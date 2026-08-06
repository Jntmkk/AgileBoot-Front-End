import { http } from "@/utils/http";

export interface PromptQuery extends BasePageQuery {
  upId?: string;
  keyword?: string;
}

export type PromptDTO = {
  id: string;
  upId: string;
  keyword: string;
  systemPrompt: string;
  sortOrder: number;
  status: number;
  createTime: Date;
  updateTime: Date;
};

export type PromptRequest = {
  id?: number;
  upId: string;
  keyword: string;
  systemPrompt: string;
  sortOrder?: number;
  status?: number;
};

/** 提示词列表 */
export const getPromptListApi = (params?: PromptQuery) => {
  return http.request<ResponseData<PageDTO<PromptDTO>>>(
    "get",
    "/social/prompts",
    {
      params
    }
  );
};

/** 提示词详情 */
export const getPromptInfoApi = (id: string) => {
  return http.request<ResponseData<PromptDTO>>("get", `/social/prompts/${id}`);
};

/** 新增提示词 */
export const addPromptApi = (data: PromptRequest) => {
  return http.request<ResponseData<void>>("post", "/social/prompts", { data });
};

/** 修改提示词 */
export const updatePromptApi = (data: PromptRequest) => {
  return http.request<ResponseData<void>>("put", `/social/prompts/${data.id}`, {
    data
  });
};

/** 删除提示词 */
export const deletePromptApi = (ids: Array<number>) => {
  return http.request<ResponseData<void>>("delete", "/social/prompts", {
    params: { ids: ids.toString() }
  });
};

/** 匹配提示词（n8n用） */
export const matchPromptApi = (upId: string, title: string) => {
  return http.request<ResponseData<{ systemPrompt: string; matched: string }>>(
    "get",
    "/social/prompts/match",
    { params: { upId, title } }
  );
};
