import { http } from "@/utils/http";

// ==================== Query ====================

export interface JobInstanceQuery extends BasePageQuery {
  bizKey?: string;
  status?: string;
}

// ==================== DTO ====================

export type JobInstanceDTO = {
  id: number;
  jobTemplateId: number;
  templateCode: string;
  templateName: string;
  bizType: string;
  bizKey: string;
  bizSubKey?: string;
  paramsJson?: string;
  status: string;
  currentStepCode?: string;
  contextJson?: string;
  startTime?: string;
  endTime?: string;
  errorMsg?: string;
  triggerSource: string;
  createTime: string;
  steps?: JobStepInstanceDTO[];
};

export type JobStepInstanceDTO = {
  id: number;
  jobInstanceId: number;
  stepCode: string;
  stepName: string;
  stepType: string;
  status: string;
  assignedNodeId?: string;
  inputJson?: string;
  outputJson?: string;
  inputArtifactIds?: string;
  outputArtifactIds?: string;
  startedAt?: string;
  endedAt?: string;
  retryCount: number;
  errorMsg?: string;
  previousStepId?: number;
};

export type JobNodeDTO = {
  id: number;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  capabilities: string;
  status: string;
  protocol: string;
  currentLoad: number;
  maxConcurrent: number;
  lastHeartbeat?: string;
  ipAddress?: string;
  version?: string;
};

// ==================== Command ====================

export type CreateJobCommand = {
  templateCode: string;
  bizKey: string;
  paramsJson?: string;
  bizSubKey?: string;
};

// ==================== APIs ====================

export const getJobInstanceListApi = (params?: JobInstanceQuery) => {
  return http.request<ResponseData<PageDTO<JobInstanceDTO>>>(
    "get",
    "/job/instances",
    { params }
  );
};

export const getJobInstanceDetailApi = (id: number) => {
  return http.request<ResponseData<JobInstanceDTO>>(
    "get",
    `/job/instances/${id}`
  );
};

export const createJobInstanceApi = (data: CreateJobCommand) => {
  return http.request<ResponseData<JobInstanceDTO>>(
    "post",
    "/job/instances",
    { data }
  );
};

export const getJobNodesApi = () => {
  return http.request<ResponseData<JobNodeDTO[]>>(
    "get",
    "/job/nodes"
  );
};

export type JobTemplateDTO = {
  id: number;
  templateCode: string;
  templateName: string;
  bizType: string;
  description?: string;
  status: number;
  version: number;
};

export const getJobTemplatesApi = () => {
  return http.request<ResponseData<JobTemplateDTO[]>>(
    "get",
    "/job/templates"
  );
};

export type CreateTemplateCommand = {
  templateCode: string;
  templateName: string;
  bizType: string;
  description?: string;
};

export const createJobTemplateApi = (data: CreateTemplateCommand) => {
  return http.request<ResponseData<void>>(
    "post",
    "/job/templates",
    { data }
  );
};
