import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { message } from "@/utils/message";
import { addDialog } from "@/components/ReDialog";
import { h } from "vue";
import dayjs from "dayjs";
import type { TableColumnList } from "@pureadmin/table";
import type { PaginationProps } from "@pureadmin/table";
import {
  getJobInstanceListApi,
  createJobInstanceApi,
  type JobInstanceDTO,
  type JobInstanceQuery
} from "@/api/job";
import editForm from "../form.vue";

const STATUS_MAP: Record<string, string> = {
  PENDING: "待执行",
  RUNNING: "执行中",
  COMPLETED: "已完成",
  FAILED: "失败",
  DEAD: "死信",
  CANCELLED: "已取消",
  WAITING_HUMAN: "等待人工"
};

const STATUS_TYPE: Record<string, string> = {
  PENDING: "info",
  RUNNING: "warning",
  COMPLETED: "success",
  FAILED: "danger",
  DEAD: "danger",
  CANCELLED: "info",
  WAITING_HUMAN: ""
};

export function useJobInstanceHook() {
  const router = useRouter();
  const pageLoading = ref(false);
  const dataList = ref<JobInstanceDTO[]>([]);
  const formRef = ref();
  const searchFormParams = reactive<JobInstanceQuery>({
    bizKey: "",
    status: ""
  });

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const columns: TableColumnList = [
    { label: "ID", prop: "id", width: 70 },
    {
      label: "模板", prop: "templateName", minWidth: 140,
      cellRenderer: ({ row, props }) => (
        <el-tag size={props.size} effect="plain" type="">
          {row.templateName}
        </el-tag>
      )
    },
    { label: "业务键", prop: "bizKey", width: 130 },
    {
      label: "状态", prop: "status", width: 100,
      cellRenderer: ({ row, props }) => (
        <el-tag size={props.size} type={STATUS_TYPE[row.status] as any}>
          {STATUS_MAP[row.status] ?? row.status}
        </el-tag>
      )
    },
    { label: "当前步骤", prop: "currentStepCode", width: 120 },
    {
      label: "开始时间", prop: "startTime", width: 170,
      formatter: ({ startTime }) =>
        startTime ? dayjs(startTime).format("YYYY-MM-DD HH:mm:ss") : "-"
    },
    { label: "操作", fixed: "right", width: 140, slot: "operation" }
  ];

  async function getList() {
    pageLoading.value = true;
    try {
      const res = await getJobInstanceListApi({
        ...searchFormParams,
        pageNum: pagination.currentPage,
        pageSize: pagination.pageSize
      });
      dataList.value = res.data.rows;
      pagination.total = res.data.total;
    } finally {
      pageLoading.value = false;
    }
  }

  function onSearch() {
    pagination.currentPage = 1;
    getList();
  }

  function resetForm() {
    searchFormParams.bizKey = "";
    searchFormParams.status = "";
    onSearch();
  }

  function openCreateDialog() {
    const formInline = reactive({ templateCode: "bili_track_asr_summary", bizKey: "", paramsJson: "" });
    addDialog({
      title: "新建任务",
      props: { formInline },
      width: "40%",
      draggable: true,
      closeOnClickModal: false,
      contentRenderer: () => h(editForm, { ref: formRef }),
      beforeSure: async (done, { options }) => {
        const form = (formRef.value as any)?.getFormRuleRef();
        if (!form) { done(); return; }
        await form.validate(async (valid: boolean) => {
          if (!valid) { return done(); }
          const data = options.props.formInline;
          try {
            await createJobInstanceApi({
              templateCode: data.templateCode,
              bizKey: data.bizKey,
              paramsJson: data.paramsJson || undefined
            });
            message("创建成功", { type: "success" });
            getList();
          } catch { /* handled by interceptor */ }
          done();
        });
      }
    });
  }

  function viewDetail(row: JobInstanceDTO) {
    router.push(`/job/instances/${row.id}`);
  }

  onMounted(() => {
    getList();
  });

  return {
    pageLoading, dataList, searchFormParams, pagination,
    columns, formRef,
    getList, onSearch, resetForm,
    openCreateDialog, viewDetail,
    STATUS_MAP, STATUS_TYPE
  };
}
