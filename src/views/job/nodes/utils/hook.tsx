import { ref, onMounted } from "vue";
import dayjs from "dayjs";
import type { TableColumnList } from "@pureadmin/table";
import { getJobNodesApi, type JobNodeDTO } from "@/api/job";

const STATUS_TYPE: Record<string, string> = {
  ONLINE: "success",
  OFFLINE: "info",
  DISABLED: "danger",
  BUSY: "warning"
};

const STATUS_LABEL: Record<string, string> = {
  ONLINE: "在线",
  OFFLINE: "离线",
  DISABLED: "已禁用",
  BUSY: "繁忙"
};

export function useJobNodeHook() {
  const pageLoading = ref(false);
  const dataList = ref<JobNodeDTO[]>([]);

  const columns: TableColumnList = [
    { label: "节点ID", prop: "nodeId", minWidth: 150 },
    { label: "名称", prop: "nodeName", minWidth: 120 },
    {
      label: "类型", prop: "nodeType", width: 100,
      cellRenderer: ({ row, props }) => (
        <el-tag size={props.size} effect="plain" type="">
          {row.nodeType}
        </el-tag>
      )
    },
    {
      label: "能力标签", prop: "capabilities", minWidth: 200,
      cellRenderer: ({ row, props }) => {
        let caps: string[] = [];
        try { caps = JSON.parse(row.capabilities); } catch { /* raw string */ }
        if (!Array.isArray(caps)) caps = [row.capabilities];
        return (
          <span style="display:flex;gap:4px;flex-wrap:wrap">
            {caps.map((c: string) => (
              <el-tag size={props.size} effect="plain" type="info" key={c}>{c}</el-tag>
            ))}
          </span>
        );
      }
    },
    {
      label: "状态", prop: "status", width: 90,
      cellRenderer: ({ row, props }) => (
        <el-tag size={props.size} type={STATUS_TYPE[row.status] as any}>
          {STATUS_LABEL[row.status] ?? row.status}
        </el-tag>
      )
    },
    {
      label: "负载", prop: "currentLoad", width: 80,
      cellRenderer: ({ row }) => <span>{row.currentLoad}/{row.maxConcurrent}</span>
    },
    { label: "协议", prop: "protocol", width: 70 },
    {
      label: "最后心跳", prop: "lastHeartbeat", width: 170,
      formatter: ({ lastHeartbeat }) =>
        lastHeartbeat ? dayjs(lastHeartbeat).format("YYYY-MM-DD HH:mm:ss") : "-"
    }
  ];

  async function getList() {
    pageLoading.value = true;
    try {
      const res = await getJobNodesApi();
      dataList.value = res.data || [];
    } finally {
      pageLoading.value = false;
    }
  }

  onMounted(() => getList());

  return { pageLoading, dataList, columns, getList };
}
