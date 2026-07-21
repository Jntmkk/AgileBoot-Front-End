import dayjs from "dayjs";
import editForm from "../form.vue";
import { message } from "@/utils/message";
import { addDialog } from "@/components/ReDialog";
import { ElMessageBox, Sort } from "element-plus";
import { type PaginationProps } from "@pureadmin/table";
import { reactive, ref, onMounted, h, toRaw } from "vue";
import { CommonUtils } from "@/utils/common";
import {
  SocialAccountQuery,
  SocialAccountRequest,
  getSocialAccountListApi,
  addSocialAccountApi,
  updateSocialAccountApi,
  deleteSocialAccountApi,
  getSocialAccountLoginStatusApi
} from "@/api/social/account";
import { SocialAccountForm } from "./types";

/** 登录状态：true 已登录 / false 未登录 / "error" 节点离线或容器异常 */
type LoginState = boolean | "error" | undefined;

export function useAccountHook(openQrcodeDialog: (row) => void) {
  const defaultSort: Sort = {
    prop: "createTime",
    order: "descending"
  };

  const pagination: PaginationProps = {
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  };

  const searchFormParams = reactive<SocialAccountQuery>({
    accountName: undefined,
    platform: undefined,
    nodeName: undefined,
    orderColumn: defaultSort.prop,
    orderDirection: defaultSort.order
  });

  const formRef = ref();
  const dataList = ref([]);
  const pageLoading = ref(true);
  const multipleSelection = ref([]);
  /** 账号ID -> 登录状态 */
  const loginStateMap = ref<Record<string, LoginState>>({});
  const statusLoading = ref(false);

  const columns: TableColumnList = [
    {
      type: "selection",
      align: "left"
    },
    {
      label: "ID",
      prop: "id",
      width: 70
    },
    {
      label: "平台",
      prop: "platform",
      width: 90,
      cellRenderer: ({ row, props }) => (
        <el-tag size={props.size} effect="plain">
          {row.platform === "xhs" ? "小红书" : row.platform}
        </el-tag>
      )
    },
    {
      label: "账号备注名",
      prop: "accountName",
      minWidth: 130
    },
    {
      label: "端口",
      prop: "port",
      width: 80
    },
    {
      label: "所在节点",
      prop: "nodeName",
      minWidth: 110
    },
    {
      label: "登录状态",
      prop: "loginState",
      width: 110,
      cellRenderer: ({ row, props }) => {
        const state = loginStateMap.value[row.id];
        if (state === "error") {
          return (
            <el-tag size={props.size} type="danger" effect="plain">
              节点离线
            </el-tag>
          );
        }
        if (state === true) {
          return (
            <el-tag size={props.size} type="success" effect="plain">
              已登录
            </el-tag>
          );
        }
        if (state === false) {
          return (
            <el-tag size={props.size} type="info" effect="plain">
              未登录
            </el-tag>
          );
        }
        return (
          <el-tag size={props.size} type="warning" effect="plain">
            未查询
          </el-tag>
        );
      }
    },
    {
      label: "状态",
      prop: "status",
      width: 80,
      cellRenderer: ({ row, props }) => (
        <el-tag
          size={props.size}
          type={row.status === 1 ? "success" : "info"}
          effect="plain"
        >
          {row.status === 1 ? "启用" : "停用"}
        </el-tag>
      )
    },
    {
      label: "创建时间",
      minWidth: 160,
      prop: "createTime",
      sortable: "custom",
      formatter: ({ createTime }) =>
        dayjs(createTime).format("YYYY-MM-DD HH:mm:ss")
    },
    {
      label: "操作",
      fixed: "right",
      width: 260,
      slot: "operation"
    }
  ];

  function onSearch() {
    pagination.currentPage = 1;
    getAccountList();
  }

  function resetForm(formEl, tableRef) {
    if (!formEl) return;
    formEl.resetFields();
    searchFormParams.orderColumn = undefined;
    searchFormParams.orderDirection = undefined;
    tableRef.getTableRef().clearSort();
    onSearch();
  }

  async function getAccountList(sort: Sort = defaultSort) {
    if (sort != null) {
      CommonUtils.fillSortParams(searchFormParams, sort);
    }
    CommonUtils.fillPaginationParams(searchFormParams, pagination);

    pageLoading.value = true;
    const { data } = await getSocialAccountListApi(
      toRaw(searchFormParams)
    ).finally(() => {
      pageLoading.value = false;
    });

    dataList.value = data.rows;
    pagination.total = data.total;
  }

  /** 逐个查询账号实时登录状态（容器调用较重，串行避免打爆节点） */
  async function refreshLoginStatus() {
    statusLoading.value = true;
    let failCount = 0;
    for (const row of dataList.value) {
      try {
        const { data } = await getSocialAccountLoginStatusApi(row.id);
        loginStateMap.value[row.id] = data.isLoggedIn;
      } catch {
        loginStateMap.value[row.id] = "error";
        failCount++;
      }
    }
    statusLoading.value = false;
    if (failCount === 0) {
      message("登录状态已刷新", { type: "success" });
    } else {
      message(`${failCount} 个账号状态查询失败（节点离线或容器异常）`, {
        type: "warning"
      });
    }
  }

  async function handleDelete(row) {
    await deleteSocialAccountApi([row.id]).then(() => {
      message(`您删除了账号 ${row.accountName}`, { type: "success" });
      getAccountList();
    });
  }

  async function handleBulkDelete(tableRef) {
    if (multipleSelection.value.length === 0) {
      message("请选择需要删除的数据", { type: "warning" });
      return;
    }

    ElMessageBox.confirm(
      `确认要<strong>删除</strong>编号为<strong style='color:var(--el-color-primary)'>[ ${multipleSelection.value} ]</strong>的账号吗?`,
      "系统提示",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
        dangerouslyUseHTMLString: true,
        draggable: true
      }
    )
      .then(async () => {
        await deleteSocialAccountApi(multipleSelection.value).then(() => {
          message(`您删除了账号编号为[ ${multipleSelection.value} ]的数据`, {
            type: "success"
          });
          getAccountList();
        });
      })
      .catch(() => {
        message("取消删除", { type: "info" });
        tableRef.getTableRef().clearSelection();
      });
  }

  async function handleAdd(row, done) {
    await addSocialAccountApi(row as SocialAccountRequest).then(() => {
      message(
        `新增账号 ${row.accountName} 成功，请到节点执行 add-account.sh xhs <账号ID> 后扫码登录`,
        { type: "success", duration: 6000 }
      );
      done();
      getAccountList();
    });
  }

  async function handleUpdate(row, done) {
    await updateSocialAccountApi(row as SocialAccountRequest).then(() => {
      message(`修改账号 ${row.accountName} 成功`, { type: "success" });
      done();
      getAccountList();
    });
  }

  function openDialog(title = "新增", row?: SocialAccountForm) {
    addDialog({
      title: `${title}账号`,
      props: {
        formInline: {
          id: row?.id,
          platform: row?.platform ?? "xhs",
          accountName: row?.accountName ?? "",
          nodeName: row?.nodeName ?? "",
          proxyUrl: row?.proxyUrl ?? "",
          status: row?.status ?? 1,
          remark: row?.remark ?? ""
        }
      },
      width: "40%",
      draggable: true,
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(editForm, { ref: formRef }),
      beforeSure: (done, { options }) => {
        const FormRef = formRef.value.getFormRuleRef();
        const curData = options.props.formInline as SocialAccountForm;
        FormRef.validate(valid => {
          if (valid) {
            if (title === "新增") {
              handleAdd(curData, done);
            } else {
              handleUpdate(curData, done);
            }
          }
        });
      }
    });
  }

  onMounted(getAccountList);

  return {
    searchFormParams,
    pageLoading,
    columns,
    dataList,
    pagination,
    defaultSort,
    multipleSelection,
    loginStateMap,
    statusLoading,
    onSearch,
    resetForm,
    openDialog,
    handleDelete,
    handleBulkDelete,
    getAccountList,
    refreshLoginStatus,
    openQrcodeDialog
  };
}
