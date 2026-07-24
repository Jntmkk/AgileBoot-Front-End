<template>
  <div>
    <PureTableBar title="节点管理" :columns="columns" @refresh="getList">
      <template #buttons>
        <el-button :icon="useRenderIcon('ep:refresh')" @click="getList">
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
          @page-size-change="getList"
          @page-current-change="getList"
        />
      </template>
    </PureTableBar>
  </div>
</template>

<script setup lang="ts">
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useJobNodeHook } from "./utils/hook";

defineOptions({ name: "JobNodeList" });

const { pageLoading, dataList, columns, pagination, getList } = useJobNodeHook();
</script>
