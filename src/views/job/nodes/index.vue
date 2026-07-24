<template>
  <div>
    <PureTableBar title="节点管理" :columns="columns" @refresh="getList">
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          border adaptive align-whole="center" table-layout="auto"
          :loading="pageLoading" :size="size" :data="dataList"
          :columns="dynamicColumns"
          :header-cell-style="{ background: 'var(--el-fill-color-light)', color: 'var(--el-text-color-primary)' }"
        />
      </template>
    </PureTableBar>
  </div>
</template>

<script setup lang="ts">
import { useJobNodeHook } from "./utils/hook";

defineOptions({ name: "JobNodeList" });

const { pageLoading, dataList, columns, getList } = useJobNodeHook();
</script>
