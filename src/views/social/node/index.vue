<script setup lang="tsx">
import { onMounted, reactive, ref } from "vue";
import dayjs from "dayjs";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "@iconify-icons/ep/refresh";
import { type PaginationProps } from "@pureadmin/table";
import { message } from "@/utils/message";
import { CommonUtils } from "@/utils/common";
import {
  SocialNodeDTO,
  getSocialNodeListApi,
  updateSocialNodeApi
} from "@/api/social/node";

/** 组件 name 与菜单表 router_name 一致 */
defineOptions({
  name: "SocialNode"
});

const pagination: PaginationProps = {
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
};

const searchFormParams = reactive<BasePageQuery>({});
const dataList = ref<SocialNodeDTO[]>([]);
const pageLoading = ref(true);

const columns: TableColumnList = [
  { label: "ID", prop: "id", width: 70 },
  { label: "节点标识", prop: "nodeName", minWidth: 130 },
  { label: "出口IP", prop: "egressIp", minWidth: 130 },
  {
    label: "IP类型",
    prop: "ipType",
    width: 110,
    cellRenderer: ({ row, props }) => (
      <el-tag size={props.size} effect="plain">
        {row.ipType === "residential" ? "住宅IP" : row.ipType}
      </el-tag>
    )
  },
  {
    label: "在线状态",
    prop: "online",
    width: 100,
    cellRenderer: ({ row, props }) => (
      <el-tag
        size={props.size}
        type={row.online ? "success" : "danger"}
        effect="plain"
      >
        {row.online ? "在线" : "离线"}
      </el-tag>
    )
  },
  {
    label: "最后心跳",
    prop: "lastHeartbeat",
    minWidth: 160,
    formatter: ({ lastHeartbeat }) =>
      lastHeartbeat ? dayjs(lastHeartbeat).format("YYYY-MM-DD HH:mm:ss") : "-"
  },
  {
    label: "状态",
    prop: "status",
    width: 90,
    cellRenderer: ({ row }) => (
      <el-switch
        model-value={row.status === 1}
        onChange={(val: boolean) => toggleStatus(row, val)}
      />
    )
  },
  { label: "备注", prop: "remark", minWidth: 120 }
];

async function getNodeList() {
  CommonUtils.fillPaginationParams(searchFormParams, pagination);
  pageLoading.value = true;
  const { data } = await getSocialNodeListApi(searchFormParams).finally(() => {
    pageLoading.value = false;
  });
  dataList.value = data.rows;
  pagination.total = data.total;
}

async function toggleStatus(row: SocialNodeDTO, val: boolean) {
  await updateSocialNodeApi({ id: Number(row.id), status: val ? 1 : 0 }).then(
    () => {
      row.status = val ? 1 : 0;
      message(`节点 ${row.nodeName} 已${val ? "启用" : "停用"}`, {
        type: "success"
      });
    }
  );
}

onMounted(getNodeList);
</script>

<template>
  <div class="main">
    <PureTableBar title="节点列表" :columns="columns" @refresh="getNodeList">
      <template #buttons>
        <el-button :icon="useRenderIcon(Refresh)" @click="getNodeList">
          刷新
        </el-button>
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
          @page-size-change="getNodeList"
          @page-current-change="getNodeList"
        />
      </template>
    </PureTableBar>
  </div>
</template>
