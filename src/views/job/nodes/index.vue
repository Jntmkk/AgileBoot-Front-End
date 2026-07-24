<script setup lang="tsx">
import { onMounted, reactive, ref } from "vue";
import dayjs from "dayjs";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "@iconify-icons/ep/refresh";
import { type PaginationProps } from "@pureadmin/table";
import { CommonUtils } from "@/utils/common";
import { getJobNodesApi, type JobNodeDTO } from "@/api/job";

defineOptions({ name: "JobNodeList" });

const STATUS_TYPE: Record<string, string> = {
  ONLINE: "success",
  OFFLINE: "info",
  DISABLED: "danger",
  BUSY: "warning"
};
const STATUS_LABEL: Record<string, string> = {
  ONLINE: "在线",
  OFFLINE: "离线",
  DISABLED: "已禁用",
  BUSY: "繁忙"
};

const pagination: PaginationProps = {
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
};
const searchFormParams = reactive<BasePageQuery>({});
const dataList = ref<JobNodeDTO[]>([]);
const pageLoading = ref(true);

const columns: TableColumnList = [
  { label: "节点ID", prop: "nodeId", minWidth: 150 },
  { label: "名称", prop: "nodeName", minWidth: 120 },
  {
    label: "类型", prop: "nodeType", width: 100,
    cellRenderer: ({ row, props }) => (
      <el-tag size={props.size} effect="plain" type="">
        {row.nodeType}
      </el-tag>
    )
  },
  {
    label: "能力标签", prop: "capabilities", minWidth: 200,
    cellRenderer: ({ row, props }) => {
      let caps: string[] = [];
      try { caps = JSON.parse(row.capabilities); } catch { /* raw */ }
      if (!Array.isArray(caps)) caps = [row.capabilities];
      return (
        <span style="display:flex;gap:4px;flex-wrap:wrap">
          {caps.map((c: string) => (
            <el-tag size={props.size} effect="plain" type="info" key={c}>{c}</el-tag>
          ))}
        </span>
      );
    }
  },
  {
    label: "状态", prop: "status", width: 90,
    cellRenderer: ({ row, props }) => (
      <el-tag size={props.size} type={STATUS_TYPE[row.status] as any}>
        {STATUS_LABEL[row.status] ?? row.status}
      </el-tag>
    )
  },
  {
    label: "负载", prop: "currentLoad", width: 80,
    cellRenderer: ({ row }) => <span>{row.currentLoad}/{row.maxConcurrent}</span>
  },
  { label: "协议", prop: "protocol", width: 70 },
  {
    label: "最后心跳", prop: "lastHeartbeat", minWidth: 160,
    formatter: ({ lastHeartbeat }) =>
      lastHeartbeat ? dayjs(lastHeartbeat).format("YYYY-MM-DD HH:mm:ss") : "-"
  }
];

async function getList() {
  CommonUtils.fillPaginationParams(searchFormParams, pagination);
  pageLoading.value = true;
  const { data } = await getJobNodesApi().finally(() => { pageLoading.value = false; });
  dataList.value = data;
  pagination.total = dataList.value.length;
}

onMounted(getList);
</script>

<template>
  <div class="main">
    <PureTableBar title="节点管理" :columns="columns" @refresh="getList">
      <template #buttons>
        <el-button :icon="useRenderIcon(Refresh)" @click="getList">刷新</el-button>
      </template>
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          border
          align-whole="center"
          showOverflowTooltip
          table-layout="auto"
          :loading="pageLoading"
          :size="size"
          adaptive
          :data="dataList"
          :columns="dynamicColumns"
          :pagination="pagination"
          :paginationSmall="size === 'small' ? true : false"
          :header-cell-style="{
            background: 'var(--el-table-row-hover-bg-color)',
            color: 'var(--el-text-color-primary)'
          }"
          @page-size-change="getList"
          @page-current-change="getList"
        />
      </template>
    </PureTableBar>
  </div>
</template>
