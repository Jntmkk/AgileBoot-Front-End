<script setup lang="tsx">
import { computed, onMounted, reactive, ref } from "vue";
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
  SocialFollowUpDTO,
  SocialFollowUpQuery,
  SocialFollowUpRequest,
  getSocialFollowUpListApi,
  addSocialFollowUpApi,
  updateSocialFollowUpApi,
  deleteSocialFollowUpApi
} from "@/api/social/follow";

/** 组件 name 与菜单表 router_name 一致 */
defineOptions({
  name: "SocialFollowUp"
});

const searchFormRef = ref();
const pagination: PaginationProps = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const searchFormParams = reactive<SocialFollowUpQuery>({});
const dataList = ref<SocialFollowUpDTO[]>([]);
const pageLoading = ref(true);

const dialogVisible = ref(false);
const dialogType = ref<"add" | "edit">("add");
const formData = reactive<SocialFollowUpRequest>({
  platform: "bili",
  upId: "",
  upName: "",
  upAvatar: "",
  status: 1,
  syncEnabled: 1,
  remark: ""
});
const formRef = ref();

const STATUS_TAG: Record<number, { text: string; type: string }> = {
  0: { text: "停用", type: "info" },
  1: { text: "启用", type: "success" }
};

const SYNC_TAG: Record<number, { text: string; type: string }> = {
  0: { text: "否", type: "info" },
  1: { text: "是", type: "success" }
};

const columns: TableColumnList = [
  { label: "ID", prop: "id", width: 70 },
  { label: "平台", prop: "platform", width: 80 },
  { label: "来源标识", prop: "upId", minWidth: 140 },
  { label: "名称", prop: "upName", minWidth: 160 },
  {
    label: "状态",
    prop: "status",
    width: 90,
    cellRenderer: ({ row, props }) => {
      const t = STATUS_TAG[row.status] || { text: "未知", type: "info" };
      return (
        <el-tag size={props.size} type={t.type as any} effect="plain">
          {t.text}
        </el-tag>
      );
    }
  },
  {
    label: "自动同步",
    prop: "syncEnabled",
    width: 100,
    cellRenderer: ({ row, props }) => {
      const t = SYNC_TAG[row.syncEnabled] || { text: "未知", type: "info" };
      return (
        <el-tag size={props.size} type={t.type as any} effect="plain">
          {t.text}
        </el-tag>
      );
    }
  },
  {
    label: "最近同步",
    prop: "lastSyncAt",
    minWidth: 160,
    formatter: ({ lastSyncAt }) =>
      lastSyncAt ? dayjs(lastSyncAt).format("YYYY-MM-DD HH:mm") : "-"
  },
  {
    label: "创建时间",
    prop: "createTime",
    minWidth: 160,
    formatter: ({ createTime }) =>
      createTime ? dayjs(createTime).format("YYYY-MM-DD HH:mm") : "-"
  },
  { label: "操作", fixed: "right", width: 180, slot: "operation" }
];

const isCloudDrive = computed(() => formData.platform === "aliyun");

const formRules = computed(() => {
  const base: any = {
    platform: [{ required: true, message: "请选择平台" }]
  };
  if (isCloudDrive.value) {
    base.upId = [{ required: true, message: "请输入账号名称" }];
    base.remark = [{ required: true, message: "请输入挂载路径" }];
    base.upAvatar = [{ required: true, message: "请输入 refresh_token" }];
  } else {
    base.upId = [{ required: true, message: "请输入UP主ID" }];
    base.upName = [{ required: true, message: "请输入UP主昵称" }];
  }
  return base;
});

async function getFollowList() {
  CommonUtils.fillPaginationParams(searchFormParams, pagination);
  pageLoading.value = true;
  const { data } = await getSocialFollowUpListApi(searchFormParams).finally(
    () => {
      pageLoading.value = false;
    }
  );
  dataList.value = data.rows;
  pagination.total = data.total;
}

function onSearch() {
  pagination.currentPage = 1;
  getFollowList();
}

function resetForm() {
  searchFormRef.value?.resetFields();
  onSearch();
}

function openDialog(type: "add" | "edit", row?: SocialFollowUpDTO) {
  dialogType.value = type;
  if (type === "edit" && row) {
    Object.assign(formData, {
      id: Number(row.id),
      platform: row.platform,
      upId: row.upId,
      upName: row.upName,
      upAvatar: row.upAvatar,
      status: row.status,
      syncEnabled: row.syncEnabled,
      remark: row.remark
    });
  } else {
    Object.assign(formData, {
      id: undefined,
      platform: "bili",
      upId: "",
      upName: "",
      upAvatar: "",
      status: 1,
      syncEnabled: 1,
      remark: ""
    });
    formRef.value?.resetFields();
  }
  dialogVisible.value = true;
}

async function handleSave() {
  try {
    await formRef.value.validate();
  } catch {
    return;
  }
  if (dialogType.value === "add") {
    await addSocialFollowUpApi(formData);
    message("新增成功", { type: "success" });
  } else {
    await updateSocialFollowUpApi(formData);
    message("修改成功", { type: "success" });
  }
  dialogVisible.value = false;
  getFollowList();
}

async function handleDelete(row: SocialFollowUpDTO) {
  await deleteSocialFollowUpApi([Number(row.id)]);
  message("删除成功", { type: "success" });
  getFollowList();
}

onMounted(getFollowList);
</script>

<template>
  <div class="main">
    <!-- 搜索栏 -->
    <el-form
      ref="searchFormRef"
      :inline="true"
      :model="searchFormParams"
      class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px]"
    >
      <el-form-item label="平台：" prop="platform">
        <el-select
          v-model="searchFormParams.platform"
          placeholder="全部"
          clearable
          class="!w-[120px]"
        >
          <el-option label="B站" value="bili" />
          <el-option label="小红书" value="xhs" />
          <el-option label="抖音" value="douyin" />
          <el-option label="阿里云盘" value="aliyun" />
        </el-select>
      </el-form-item>
      <el-form-item label="来源标识：" prop="upId">
        <el-input
          v-model="searchFormParams.upId"
          placeholder="模糊搜索"
          clearable
          class="!w-[160px]"
        />
      </el-form-item>
      <el-form-item label="名称：" prop="upName">
        <el-input
          v-model="searchFormParams.upName"
          placeholder="模糊搜索"
          clearable
          class="!w-[160px]"
        />
      </el-form-item>
      <el-form-item label="状态：" prop="status">
        <el-select
          v-model="searchFormParams.status"
          placeholder="全部"
          clearable
          class="!w-[120px]"
        >
          <el-option label="启用" :value="1" />
          <el-option label="停用" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item label="自动同步：" prop="syncEnabled">
        <el-select
          v-model="searchFormParams.syncEnabled"
          placeholder="全部"
          clearable
          class="!w-[120px]"
        >
          <el-option label="是" :value="1" />
          <el-option label="否" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          :icon="useRenderIcon(Search)"
          :loading="pageLoading"
          @click="onSearch"
        >
          搜索
        </el-button>
        <el-button :icon="useRenderIcon(Refresh)" @click="resetForm">
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <PureTableBar
      title="数据来源列表"
      :columns="columns"
      @refresh="getFollowList"
    >
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(Plus)"
          @click="openDialog('add')"
        >
          新增数据来源
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
          @page-size-change="getFollowList"
          @page-current-change="getFollowList"
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
            <el-popconfirm
              title="确定删除该数据来源？"
              @confirm="handleDelete(row)"
            >
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

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增数据来源' : '编辑数据来源'"
      width="520px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="平台" prop="platform">
          <el-select v-model="formData.platform" class="!w-[200px]">
            <el-option label="B站" value="bili" />
            <el-option label="小红书" value="xhs" />
            <el-option label="抖音" value="douyin" />
            <el-option label="阿里云盘" value="aliyun" />
          </el-select>
        </el-form-item>
        <el-form-item :label="isCloudDrive ? '账号名称' : 'UP ID'" prop="upId">
          <el-input
            v-model="formData.upId"
            :placeholder="
              isCloudDrive ? '阿里云盘账号名称' : 'B站mid/小红书号/抖音号'
            "
          />
        </el-form-item>
        <el-form-item v-if="!isCloudDrive" label="UP昵称" prop="upName">
          <el-input v-model="formData.upName" placeholder="展示用昵称" />
        </el-form-item>
        <el-form-item v-if="!isCloudDrive" label="头像">
          <el-input
            v-model="formData.upAvatar"
            placeholder="头像链接（可选）"
          />
        </el-form-item>
        <el-form-item v-if="isCloudDrive" label="挂载路径" prop="remark">
          <el-input
            v-model="formData.remark"
            placeholder="alist 挂载路径，如 /ali_yun_pan"
          />
        </el-form-item>
        <el-form-item v-if="isCloudDrive" label="RefreshToken" prop="upAvatar">
          <el-input
            v-model="formData.upAvatar"
            placeholder="阿里云盘 refresh_token"
          />
          <span class="token-help">
            <a
              href="https://alistgo.com/zh/tool/aliyundrive/request?cachebust=20260809"
              target="_blank"
              rel="noopener"
            >
              如何获取 Token？
            </a>
          </span>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="自动同步">
          <el-radio-group v-model="formData.syncEnabled">
            <el-radio :label="1">是</el-radio>
            <el-radio :label="0">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="!isCloudDrive" label="备注">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="2"
            placeholder="备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.search-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}

.token-help {
  display: block;
  margin-top: 4px;
  font-size: 12px;

  a {
    color: var(--el-color-primary);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
