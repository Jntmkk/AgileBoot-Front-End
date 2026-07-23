<script setup lang="ts">
import { ref } from "vue";
import { useAccountHook } from "./utils/hook";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Search from "@iconify-icons/ep/search";
import Refresh from "@iconify-icons/ep/refresh";
import AddFill from "@iconify-icons/ri/add-circle-line";
import Qrcode from "@iconify-icons/ri/qr-code-line";
import QrcodeDialog from "./qrcode-dialog.vue";

/** 组件 name 与菜单表 router_name 一致 */
defineOptions({
  name: "SocialAccount"
});

const tableRef = ref();
const searchFormRef = ref();

const qrVisible = ref(false);
const qrAccountId = ref("");
const qrAccountName = ref("");
const qrPlatform = ref("xhs");

function openQrcodeDialog(row) {
  qrAccountId.value = row.id;
  qrAccountName.value = row.accountName;
  qrPlatform.value = row.platform;
  qrVisible.value = true;
}

const {
  searchFormParams,
  pageLoading,
  columns,
  dataList,
  pagination,
  defaultSort,
  multipleSelection,
  statusLoading,
  onSearch,
  resetForm,
  openDialog,
  handleDelete,
  handleBulkDelete,
  getAccountList,
  refreshLoginStatus
} = useAccountHook(openQrcodeDialog);
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
      <el-form-item label="账号名：" prop="accountName">
        <el-input
          v-model="searchFormParams.accountName"
          placeholder="请输入账号备注名"
          clearable
          class="!w-[200px]"
        />
      </el-form-item>
      <el-form-item label="节点：" prop="nodeName">
        <el-input
          v-model="searchFormParams.nodeName"
          placeholder="请输入节点标识"
          clearable
          class="!w-[180px]"
        />
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
        <el-button
          :icon="useRenderIcon(Refresh)"
          @click="resetForm(searchFormRef, tableRef)"
        >
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <PureTableBar title="账号列表" :columns="columns" @refresh="onSearch">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="openDialog()"
        >
          添加账号
        </el-button>
        <el-button
          type="success"
          :loading="statusLoading"
          :icon="useRenderIcon(Refresh)"
          @click="refreshLoginStatus"
        >
          刷新登录状态
        </el-button>
        <el-button
          type="danger"
          :icon="useRenderIcon(Delete)"
          @click="handleBulkDelete(tableRef)"
        >
          批量删除
        </el-button>
      </template>
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          border
          ref="tableRef"
          align-whole="center"
          showOverflowTooltip
          table-layout="auto"
          :loading="pageLoading"
          :size="size"
          adaptive
          :data="dataList"
          :columns="dynamicColumns"
          :default-sort="defaultSort"
          :pagination="pagination"
          :paginationSmall="size === 'small' ? true : false"
          :header-cell-style="{
            background: 'var(--el-table-row-hover-bg-color)',
            color: 'var(--el-text-color-primary)'
          }"
          @page-size-change="getAccountList"
          @page-current-change="getAccountList"
          @sort-change="getAccountList"
          @selection-change="
            rows => (multipleSelection = rows.map(item => item.id))
          "
        >
          <template #operation="{ row }">
            <el-button
              class="reset-margin"
              link
              type="success"
              :size="size"
              :icon="useRenderIcon(Qrcode)"
              @click="openQrcodeDialog(row)"
            >
              扫码登录
            </el-button>
            <el-button
              class="reset-margin"
              link
              type="primary"
              :size="size"
              :icon="useRenderIcon(EditPen)"
              @click="openDialog('编辑', row)"
            >
              修改
            </el-button>
            <el-popconfirm
              :title="`是否确认删除账号${row.accountName}`"
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

    <QrcodeDialog
      v-model="qrVisible"
      :account-id="qrAccountId"
      :account-name="qrAccountName"
      :platform="qrPlatform"
      @logged-in="refreshLoginStatus"
    />
  </div>
</template>

<style scoped lang="scss">
.search-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}
</style>
