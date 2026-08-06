<script setup lang="tsx">
import { onMounted, reactive, ref } from "vue";
import dayjs from "dayjs";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Search from "@iconify-icons/ep/search";
import Refresh from "@iconify-icons/ep/refresh";
import Plus from "@iconify-icons/ep/plus";
import EditPen from "@iconify-icons/ep/edit-pen";
import Delete from "@iconify-icons/ep/delete";
import { type PaginationProps } from "@pureadmin/table";
import { message } from "@/utils/message";
import { CommonUtils } from "@/utils/common";
import {
  PromptDTO,
  PromptQuery,
  PromptRequest,
  getPromptListApi,
  addPromptApi,
  updatePromptApi,
  deletePromptApi
} from "@/api/social/prompt";
import {
  getSocialFollowUpListApi,
  type SocialFollowUpDTO
} from "@/api/social/follow";

/** 组件 name 与菜单表 router_name 一致 */
defineOptions({
  name: "SocialSummaryPrompt"
});

const searchFormRef = ref();
const pagination: PaginationProps = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const searchFormParams = reactive<PromptQuery>({});
const dataList = ref<PromptDTO[]>([]);
const pageLoading = ref(true);
const followUpList = ref<SocialFollowUpDTO[]>([]);

const dialogVisible = ref(false);
const dialogType = ref<"add" | "edit">("add");
const formData = reactive<PromptRequest>({
  upId: "",
  keyword: "",
  systemPrompt: "",
  sortOrder: 0,
  status: 1
});

const columns: TableColumnList = [
  { label: "ID", prop: "id", width: 60 },
  { label: "UP ID", prop: "upId", minWidth: 120 },
  { label: "关键词", prop: "keyword", minWidth: 120 },
  {
    label: "提示词",
    prop: "systemPrompt",
    minWidth: 200,
    cellRenderer: ({ row }) => {
      const text = row.systemPrompt || "";
      const preview = text.length > 40 ? text.slice(0, 40) + "..." : text;
      return (
        <el-tooltip
          content={text}
          placement="top"
          show-after={500}
          effect="dark"
        >
          <span class="prompt-preview">{preview}</span>
        </el-tooltip>
      );
    }
  },
  { label: "排序", prop: "sortOrder", width: 70 },
  {
    label: "状态",
    prop: "status",
    width: 70,
    cellRenderer: ({ row }) => (
      <el-tag
        size="small"
        type={row.status === 1 ? "success" : "info"}
        effect="plain"
      >
        {row.status === 1 ? "启用" : "停用"}
      </el-tag>
    )
  },
  {
    label: "创建时间",
    prop: "createTime",
    width: 140,
    formatter: ({ createTime }) =>
      createTime ? dayjs(createTime).format("YYYY-MM-DD HH:mm") : "-"
  },
  { label: "操作", fixed: "right", width: 120, slot: "operation" }
];

async function getPromptList() {
  CommonUtils.fillPaginationParams(searchFormParams, pagination);
  pageLoading.value = true;
  const { data } = await getPromptListApi(searchFormParams).finally(() => {
    pageLoading.value = false;
  });
  dataList.value = data.rows;
  pagination.total = data.total;
}

function onSearch() {
  pagination.currentPage = 1;
  getPromptList();
}

function resetForm() {
  searchFormRef.value?.resetFields();
  onSearch();
}

function openDialog(type: "add" | "edit", row?: PromptDTO) {
  dialogType.value = type;
  if (type === "add") {
    formData.id = undefined;
    formData.upId = "";
    formData.keyword = "";
    formData.systemPrompt = "";
    formData.sortOrder = 0;
    formData.status = 1;
  } else if (row) {
    formData.id = Number(row.id);
    formData.upId = row.upId;
    formData.keyword = row.keyword;
    formData.systemPrompt = row.systemPrompt;
    formData.sortOrder = row.sortOrder;
    formData.status = row.status;
  }
  dialogVisible.value = true;
}

function handleSave() {
  if (!formData.upId.trim()) {
    message("请选择UP", { type: "warning" });
    return;
  }
  if (!formData.keyword.trim()) {
    message("请输入关键词", { type: "warning" });
    return;
  }
  if (!formData.systemPrompt.trim()) {
    message("请输入提示词", { type: "warning" });
    return;
  }
  const api =
    dialogType.value === "add"
      ? addPromptApi(formData)
      : updatePromptApi(formData);
  api.then(() => {
    message(dialogType.value === "add" ? "新增成功" : "修改成功", {
      type: "success"
    });
    dialogVisible.value = false;
    getPromptList();
  });
}

function handleDelete(row: PromptDTO) {
  deletePromptApi([Number(row.id)]).then(() => {
    message("删除成功", { type: "success" });
    getPromptList();
  });
}

async function getFollowUpList() {
  const { data } = await getSocialFollowUpListApi({
    platform: "bili",
    status: 1,
    pageSize: 200
  });
  followUpList.value = data.rows || [];
}

onMounted(() => {
  getPromptList();
  getFollowUpList();
});
</script>

<template>
  <div class="main">
    <el-form
      ref="searchFormRef"
      :inline="true"
      :model="searchFormParams"
      class="search-form bg-bg_color w-[99/100] pl-4 pt-2 pb-1"
    >
      <el-form-item label="UP ID：" prop="upId">
        <el-select
          v-model="searchFormParams.upId"
          placeholder="全部"
          clearable
          filterable
          size="small"
          class="!w-[200px]"
        >
          <el-option label="* (兜底默认)" value="*" />
          <el-option
            v-for="item in followUpList"
            :key="item.upId"
            :label="`${item.upName} (${item.upId})`"
            :value="item.upId"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="关键词：" prop="keyword">
        <el-input
          v-model="searchFormParams.keyword"
          placeholder="按关键词搜索"
          clearable
          size="small"
          class="!w-[160px]"
        />
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          size="small"
          :icon="useRenderIcon(Search)"
          :loading="pageLoading"
          @click="onSearch"
        >
          搜索
        </el-button>
        <el-button
          size="small"
          :icon="useRenderIcon(Refresh)"
          @click="resetForm"
        >
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <PureTableBar
      title="总结提示词"
      :columns="columns"
      @refresh="getPromptList"
    >
      <template #buttons>
        <el-button
          type="primary"
          size="small"
          :icon="useRenderIcon(Plus)"
          @click="openDialog('add')"
        >
          新增提示词
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
            color: 'var(--el-text-color-primary)',
            padding: '4px 0'
          }"
          :cell-style="{ padding: '4px 0' }"
          @page-size-change="getPromptList"
          @page-current-change="getPromptList"
        >
          <template #operation="{ row }">
            <el-button
              class="reset-margin"
              link
              type="primary"
              :size="size"
              :icon="useRenderIcon(EditPen)"
              @click="openDialog('edit', row)"
            >
              编辑
            </el-button>
            <el-popconfirm title="确认删除？" @confirm="handleDelete(row)">
              <template #reference>
                <el-button
                  class="reset-margin"
                  link
                  type="danger"
                  :size="size"
                  :icon="useRenderIcon(Delete)"
                >
                  删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </pure-table>
      </template>
    </PureTableBar>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增提示词' : '修改提示词'"
      width="620px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <el-form :model="formData" label-width="80px">
        <el-form-item label="UP" required>
          <el-select
            v-model="formData.upId"
            filterable
            placeholder="选择UP（* 表示兜底默认）"
            class="!w-[400px]"
          >
            <el-option label="* (兜底默认)" value="*" />
            <el-option
              v-for="item in followUpList"
              :key="item.upId"
              :label="`${item.upName} (${item.upId})`"
              :value="item.upId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词" required>
          <el-input
            v-model="formData.keyword"
            placeholder="标题 contains 此关键词时匹配"
            class="!w-[400px]"
          />
        </el-form-item>
        <el-form-item label="提示词" required>
          <el-input
            v-model="formData.systemPrompt"
            type="textarea"
            :rows="4"
            placeholder="系统提示词内容"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number
            v-model="formData.sortOrder"
            :min="0"
            :max="999"
            placeholder="越小越优先"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.search-form {
  :deep(.el-form-item) {
    margin-right: 12px;
    margin-bottom: 6px;
  }
}

.prompt-preview {
  color: var(--el-text-color-primary);
  cursor: default;
}
</style>
