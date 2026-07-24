<script setup lang="tsx">
import { h, onMounted, reactive, ref } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { addDialog } from "@/components/ReDialog";
import { message } from "@/utils/message";
import { CommonUtils } from "@/utils/common";
import type { PaginationProps, TableColumnList } from "@pureadmin/table";
import {
  getJobTemplatesApi,
  createJobTemplateApi,
  type JobTemplateDTO
} from "@/api/job";

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

// 新建模板弹窗
const formRef = ref();
function openCreateDialog() {
  const formInline = reactive({ templateCode: "", templateName: "", bizType: "BILI_TRACK", description: "" });
  addDialog({
    title: "新建模板", props: { formInline }, width: "40%", draggable: true, closeOnClickModal: false,
    contentRenderer: () =>
      h(
        <el-form ref={formRef} model={formInline} label-width="100px">
          <el-form-item label="模板编码" required>
            <el-input v-model={formInline.templateCode} placeholder="如 bili_track_asr_summary" />
          </el-form-item>
          <el-form-item label="模板名称" required>
            <el-input v-model={formInline.templateName} placeholder="如 B站UP主跟踪" />
          </el-form-item>
          <el-form-item label="业务类型" required>
            <el-select v-model={formInline.bizType} style="width:100%">
              <el-option label="B站跟踪" value="BILI_TRACK" />
              <el-option label="小红书" value="SOCIAL_XHS" />
              <el-option label="ASR转写" value="ASR_SUMMARY" />
            </el-select>
          </el-form-item>
          <el-form-item label="描述">
            <el-input v-model={formInline.description} placeholder="模板用途说明" />
          </el-form-item>
        </el-form>
      ),
    beforeSure: async (done, { options }) => {
      const d = options.props.formInline;
      if (!d.templateCode || !d.templateName || !d.bizType) {
        message("模板编码、名称、业务类型不能为空", { type: "warning" });
        return;
      }
      await createJobTemplateApi({
        templateCode: d.templateCode, templateName: d.templateName,
        bizType: d.bizType, description: d.description || undefined
      });
      message("创建成功", { type: "success" });
      getList();
      done();
    }
  });
}

onMounted(getList);
</script>

<template>
  <div class="main">
    <PureTableBar title="模板管理" :columns="columns" @refresh="getList">
      <template #buttons>
        <el-button type="primary" :icon="useRenderIcon('ep:plus')" @click="openCreateDialog">
          新建模板
        </el-button>
      </template>
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          border align-whole="center" showOverflowTooltip table-layout="auto"
          :loading="pageLoading" :size="size" adaptive
          :data="dataList" :columns="dynamicColumns"
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
