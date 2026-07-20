import { reactive } from "vue";
import type { FormRules } from "element-plus";

/** 自定义表单规则校验 */
export const formRules = reactive(<FormRules>{
  platform: [{ required: true, message: "平台为必填项", trigger: "blur" }],
  accountName: [
    { required: true, message: "账号备注名为必填项", trigger: "blur" }
  ]
});
