<script setup lang="tsx">
import { onMounted, reactive, ref } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "@iconify-icons/ep/refresh";
import { type PaginationProps } from "@pureadmin/table";
import { CommonUtils } from "@/utils/common";
import { getJobTemplatesApi, type JobTemplateDTO } from "@/api/job";

defineOptions({ name: "JobTemplateList" });

const pagination: PaginationProps = {
  total: 0, pageSize: 10, currentPage: 1, background: true
};
const searchFormParams = reactive<BasePageQuery>({});
const dataList = ref<JobTemplateDTO[]>([]);
const pageLoading = ref(true);

const columns: TableColumnList = [
  { label: "ID", prop: "id", width: 70 },
  { label: "模板编码", prop: "templateCode", minWidth: 180 },
  { label: "模板名称", prop: "templateName", minWidth: 150 },
  {
    label: "业务类型", prop: "bizType", width: 110,
    cellRenderer: ({ row, props }) => (
      <el-tag size={props.size} effect="plain">{row.bizType}</el-tag>
    )
  },
  {
    label: "状态", prop: "status", width: 80,
    cellRenderer: ({ row, props }) => (
      <el-tag size={props.size} type={row.status === 1 ? "success" : "info"}>
        {row.status === 1 ? "启用" : "停用"}
      </el-tag>
    )
  },
  { label: "版本", prop: "version", width: 70 },
  { label: "描述", prop: "description", minWidth: 200 }
];

async function getList() {
  CommonUtils.fillPaginationParams(searchFormParams, pagination);
  pageLoading.value = true;
  const { data } = await getJobTemplatesApi().finally(() => { pageLoading.value = false; });
  dataList.value = data;
  pagination.total = data.length;
}

onMounted(getList);
</script>

<template>
  <div class="main">
    <PureTableBar title="模板管理" :columns="columns" @refresh="getList">
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
