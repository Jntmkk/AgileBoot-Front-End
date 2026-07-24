<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
    <el-form-item label="模板编码" prop="templateCode">
      <el-select v-model="form.templateCode" placeholder="选择任务模板" style="width:100%">
        <el-option label="B站UP主跟踪" value="bili_track_asr_summary" />
      </el-select>
    </el-form-item>
    <el-form-item label="业务键" prop="bizKey">
      <el-input v-model="form.bizKey" placeholder="UP主mid，如 546195" />
    </el-form-item>
    <el-form-item label="参数(JSON)" prop="paramsJson">
      <el-input
        v-model="form.paramsJson"
        type="textarea"
        :rows="4"
        placeholder='{"mid": 546195}'
      />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import type { FormInstance, FormRules } from "element-plus";

const props = defineProps<{
  formInline: { templateCode: string; bizKey: string; paramsJson: string };
}>();

const formRef = ref<FormInstance>();
// 直接引用 props 对象（不拷贝），保证 dialog beforeSure 能读到最新值
const form = ref(props.formInline);

const rules = reactive<FormRules>({
  templateCode: [
    { required: true, message: "请选择模板", trigger: "blur" }
  ],
  bizKey: [
    { required: true, message: "请输入业务键", trigger: "blur" }
  ]
});

defineExpose({
  getFormRuleRef: () => formRef.value
});
</script>
