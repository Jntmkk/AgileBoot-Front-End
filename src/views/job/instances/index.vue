<template>
  <div>
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
          border adaptive align-whole="center" table-layout="auto"
          :loading="pageLoading" :size="size" :data="dataList"
          :columns="dynamicColumns" :pagination="pagination"
          :header-cell-style="{ background: 'var(--el-fill-color-light)', color: 'var(--el-text-color-primary)' }"
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

<script setup lang="ts">
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useJobInstanceHook } from "./utils/hook";

defineOptions({ name: "JobInstanceList" });

const {
  pageLoading, dataList, searchFormParams, pagination,
  columns, getList, onSearch, resetForm,
  openCreateDialog, viewDetail, STATUS_MAP
} = useJobInstanceHook();
</script>

<style scoped>
.search-form {
  background: var(--el-bg-color);
  padding: 16px 16px 0;
  border-radius: 4px;
  margin-bottom: 12px;
}
</style>
