<script setup lang="ts">
import { ref } from "vue";
import { formRules } from "./utils/rule";
import { FormProps } from "./utils/types";

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    platform: "xhs",
    accountName: "",
    nodeName: "",
    proxyUrl: "",
    status: 1,
    remark: ""
  })
});

const accountData = ref(props.formInline);

const formRuleRef = ref();

function getFormRuleRef() {
  return formRuleRef.value;
}

defineExpose({ getFormRuleRef });
</script>

<template>
  <el-form
    ref="formRuleRef"
    :model="accountData"
    :rules="formRules"
    label-width="90px"
  >
    <el-form-item label="平台" prop="platform">
      <el-select
        v-model="accountData.platform"
        placeholder="请选择平台"
        class="!w-[180px]"
      >
        <el-option label="小红书" value="xhs" />
        <el-option label="B站" value="bili" />
        <!-- 预留：抖音 -->
      </el-select>
    </el-form-item>

    <el-form-item label="账号备注名" prop="accountName">
      <el-input
        v-model="accountData.accountName"
        clearable
        placeholder="运营内部使用的名字，如：主号-美妆"
      />
    </el-form-item>

    <el-form-item
      v-if="accountData.platform === 'xhs'"
      label="所在节点"
      prop="nodeName"
    >
      <el-input
        v-model="accountData.nodeName"
        clearable
        placeholder="住宅节点标识，如：mac-home（运维参考）"
      />
    </el-form-item>

    <el-form-item label="代理地址" prop="proxyUrl">
      <el-input
        v-model="accountData.proxyUrl"
        clearable
        placeholder="IP池预留，住宅IP阶段留空"
      />
    </el-form-item>

    <el-form-item label="状态" prop="status">
      <el-radio-group v-model="accountData.status">
        <el-radio :label="1">启用</el-radio>
        <el-radio :label="0">停用</el-radio>
      </el-radio-group>
    </el-form-item>

    <el-form-item label="备注" prop="remark">
      <el-input v-model="accountData.remark" clearable placeholder="备注" />
    </el-form-item>
  </el-form>
</template>
