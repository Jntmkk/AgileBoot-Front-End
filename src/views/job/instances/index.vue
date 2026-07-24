<script setup lang="tsx">
import { h, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import dayjs from "dayjs";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { addDialog } from "@/components/ReDialog";
import { message } from "@/utils/message";
import { CommonUtils } from "@/utils/common";
import type { PaginationProps, TableColumnList } from "@pureadmin/table";
import {
  getJobInstanceListApi,
  createJobInstanceApi,
  type JobInstanceDTO,
  type JobInstanceQuery
} from "@/api/job";
import editForm from "./form.vue";

defineOptions({ name: "JobInstanceList" });

const router = useRouter();

const STATUS_MAP: Record<string, string> = {
  PENDING: "待执行", RUNNING: "执行中", COMPLETED: "已完成",
  FAILED: "失败", DEAD: "死信", CANCELLED: "已取消", WAITING_HUMAN: "等待人工"
};
const STATUS_TYPE: Record<string, string> = {
  PENDING: "info", RUNNING: "warning", COMPLETED: "success",
  FAILED: "danger", DEAD: "danger", CANCELLED: "info", WAITING_HUMAN: ""
};

const pagination: PaginationProps = {
  total: 0, pageSize: 10, currentPage: 1, background: true
};
const searchFormParams = reactive<JobInstanceQuery>({ bizKey: "", status: "" });
const dataList = ref<JobInstanceDTO[]>([]);
const pageLoading = ref(true);

const columns: TableColumnList = [
  { label: "ID", prop: "id", width: 70 },
  {
    label: "模板", prop: "templateName", minWidth: 140,
    cellRenderer: ({ row, props }) => (
      <el-tag size={props.size} effect="plain" type="">
        {row.templateName}
      </el-tag>
    )
  },
  { label: "业务键", prop: "bizKey", width: 130 },
  {
    label: "状态", prop: "status", width: 100,
    cellRenderer: ({ row, props }) => (
      <el-tag size={props.size} type={STATUS_TYPE[row.status] as any}>
        {STATUS_MAP[row.status] ?? row.status}
      </el-tag>
    )
  },
  { label: "当前步骤", prop: "currentStepCode", width: 120 },
  {
    label: "开始时间", prop: "startTime", minWidth: 170,
    formatter: ({ startTime }) =>
      startTime ? dayjs(startTime).format("YYYY-MM-DD HH:mm:ss") : "-"
  },
  { label: "操作", fixed: "right", width: 80, slot: "operation" }
];

async function getList() {
  CommonUtils.fillPaginationParams(searchFormParams, pagination);
  pageLoading.value = true;
  const { data } = await getJobInstanceListApi(searchFormParams).finally(() => { pageLoading.value = false; });
  dataList.value = data.rows;
  pagination.total = data.total;
}

function onSearch() { pagination.currentPage = 1; getList(); }
function resetForm() { searchFormParams.bizKey = ""; searchFormParams.status = ""; onSearch(); }

function viewDetail(row: JobInstanceDTO) { router.push(`/job/instances/${row.id}`); }

const formRef = ref();
function openCreateDialog() {
  const formInline = reactive({ templateCode: "bili_track_asr_summary", bizKey: "", paramsJson: "" });
  addDialog({
    title: "新建任务", props: { formInline }, width: "40%", draggable: true, closeOnClickModal: false,
    contentRenderer: () => h(editForm, { ref: formRef }),
    beforeSure: async (done, { options }) => {
      const form = (formRef.value as any)?.getFormRuleRef();
      if (!form) { done(); return; }
      await form.validate(async (valid: boolean) => {
        if (!valid) { return done(); }
        const d = options.props.formInline;
        await createJobInstanceApi({ templateCode: d.templateCode, bizKey: d.bizKey, paramsJson: d.paramsJson || undefined });
        message("创建成功", { type: "success" });
        getList();
        done();
      });
    }
  });
}

onMounted(getList);
</script>

<template>
  <div class="main">
    <el-form :inline="true" :model="searchFormParams" class="search-form">
      <el-form-item label="业务键">
        <el-input v-model="searchFormParams.bizKey" placeholder="UP主mid" clearable />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="searchFormParams.status" placeholder="全部" clearable style="width:130px">
          <el-option v-for="(label, key) in STATUS_MAP" :key="key" :label="label" :value="key" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="useRenderIcon('ep:search')" @click="onSearch">搜索</el-button>
        <el-button :icon="useRenderIcon('ep:refresh')" @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>

    <PureTableBar title="任务列表" :columns="columns" @refresh="onSearch">
      <template #buttons>
        <el-button type="primary" :icon="useRenderIcon('ep:plus')" @click="openCreateDialog">
          新建任务
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
          @page-size-change="getList"
          @page-current-change="getList"
        >
          <template #operation="{ row }">
            <el-button link type="primary" size="small" @click="viewDetail(row)">详情</el-button>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>

<style scoped>
.search-form {
  background: var(--el-bg-color);
  padding: 16px 16px 0;
  border-radius: 4px;
  margin-bottom: 12px;
}
</style>
