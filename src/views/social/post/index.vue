<script setup lang="tsx">
import { onMounted, reactive, ref } from "vue";
import dayjs from "dayjs";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "@iconify-icons/ep/refresh";
import Search from "@iconify-icons/ep/search";
import View from "@iconify-icons/ep/view";
import VideoPlay from "@iconify-icons/ep/video-play";
import Document from "@iconify-icons/ep/document";
import Link from "@iconify-icons/ep/link";
import Download from "@iconify-icons/ep/download";
import { type PaginationProps } from "@pureadmin/table";
import { message } from "@/utils/message";
import { CommonUtils } from "@/utils/common";
import {
  SocialSyncPostDTO,
  SocialSyncPostQuery,
  getSocialPostListApi,
  retriggerTranscribeApi,
  retriggerSummaryApi
} from "@/api/social/post";
import {
  syncByLinkApi,
  backfillApi,
  getSocialFollowUpListApi,
  type SyncByLinkCommand,
  type BackfillCommand,
  type SocialFollowUpDTO
} from "@/api/social/follow";
import PostDetail from "./detail.vue";

/** 组件 name 与菜单表 router_name 一致 */
defineOptions({
  name: "SocialSyncPost"
});

const searchFormRef = ref();
const pagination: PaginationProps = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const searchFormParams = reactive<SocialSyncPostQuery>({});
const dataList = ref<SocialSyncPostDTO[]>([]);
const pageLoading = ref(true);
const followUpList = ref<SocialFollowUpDTO[]>([]);

const detailVisible = ref(false);
const currentId = ref("");

const linkDialogVisible = ref(false);
const linkForm = reactive<SyncByLinkCommand>({
  platform: "bili",
  url: ""
});

const backfillDialogVisible = ref(false);
const backfillForm = reactive<BackfillCommand>({
  platform: "bili",
  startTime: "",
  endTime: ""
});

/** 音频状态文案 + 标签类型 */
const AUDIO_STATUS_MAP: Record<number, { text: string; type: string }> = {
  0: { text: "未处理", type: "info" },
  1: { text: "待转写", type: "warning" },
  2: { text: "取址失败", type: "danger" },
  3: { text: "已总结", type: "success" },
  4: { text: "转写中", type: "warning" },
  5: { text: "待总结", type: "primary" },
  6: { text: "转写失败", type: "danger" }
};

const DISPLAY_TITLE_MAX = 30;

function getDisplayTitle(row: SocialSyncPostDTO) {
  const text = (row.title || row.content || "").trim().replace(/\s+/g, " ");
  if (!text) return "-";
  return text.length > DISPLAY_TITLE_MAX
    ? `${text.slice(0, DISPLAY_TITLE_MAX)}...`
    : text;
}

const columns: TableColumnList = [
  { label: "ID", prop: "id", width: 60 },
  {
    label: "类型",
    prop: "postType",
    width: 60,
    cellRenderer: ({ row, props }) => (
      <el-tag
        size={props.size}
        effect="plain"
        type={row.postType === 2 ? "danger" : "info"}
      >
        {row.postType === 2 ? "视频" : "图文"}
      </el-tag>
    )
  },
  {
    label: "标题",
    prop: "title",
    minWidth: 180,
    cellRenderer: ({ row }) => {
      const title = getDisplayTitle(row);
      return <span title={title === "-" ? "" : title}>{title}</span>;
    }
  },
  { label: "作者", prop: "nickname", minWidth: 90 },
  {
    label: "音频状态",
    prop: "audioStatus",
    width: 80,
    cellRenderer: ({ row, props }) => {
      const s = AUDIO_STATUS_MAP[row.audioStatus] || {
        text: "未知",
        type: "info"
      };
      const tag = (
        <el-tag size={props.size} type={s.type as any} effect="plain">
          {s.text}
        </el-tag>
      );
      if (row.audioStatus === 6 && row.remark) {
        return (
          <el-tooltip content={row.remark} placement="top" show-after={300}>
            {tag}
          </el-tooltip>
        );
      }
      return tag;
    }
  },
  {
    label: "点赞",
    prop: "likeCount",
    width: 60,
    formatter: ({ likeCount }) => likeCount ?? "-"
  },
  {
    label: "发布时间",
    prop: "publishedAt",
    width: 130,
    formatter: ({ publishedAt }) =>
      publishedAt ? dayjs(publishedAt).format("YYYY-MM-DD HH:mm") : "-"
  },
  {
    label: "创建时间",
    prop: "createTime",
    width: 130,
    sortable: "custom",
    formatter: ({ createTime }) =>
      createTime ? dayjs(createTime).format("YYYY-MM-DD HH:mm") : "-"
  },
  { label: "操作", fixed: "right", width: 100, slot: "operation" }
];

async function getPostList() {
  CommonUtils.fillPaginationParams(searchFormParams, pagination);
  pageLoading.value = true;
  const { data } = await getSocialPostListApi(searchFormParams).finally(() => {
    pageLoading.value = false;
  });
  dataList.value = data.rows;
  pagination.total = data.total;
}

function onSearch() {
  pagination.currentPage = 1;
  getPostList();
}

function onSortChange(sort: any) {
  CommonUtils.fillSortParams(searchFormParams, sort);
  getPostList();
}

function resetForm() {
  searchFormRef.value?.resetFields();
  searchFormParams.orderColumn = undefined;
  searchFormParams.orderDirection = undefined;
  onSearch();
}

function openDetail(row: SocialSyncPostDTO) {
  currentId.value = row.id;
  detailVisible.value = true;
}

async function onRetranscribe(row: SocialSyncPostDTO) {
  await retriggerTranscribeApi(row.id).then(() => {
    message(`已重置「${row.title || row.platformPostId}」为待转写`, {
      type: "success"
    });
    getPostList();
  });
}

async function onResummarize(row: SocialSyncPostDTO) {
  await retriggerSummaryApi(row.id).then(() => {
    message(`已重置「${row.title || row.platformPostId}」为待总结`, {
      type: "success"
    });
    getPostList();
  });
}

function openLinkDialog() {
  linkForm.platform = "bili";
  linkForm.url = "";
  linkDialogVisible.value = true;
}

async function handleSyncByLink() {
  if (!linkForm.url.trim()) {
    message("请输入链接", { type: "warning" });
    return;
  }
  await syncByLinkApi(linkForm).then(() => {
    message("已发送同步链接任务", { type: "success" });
    linkDialogVisible.value = false;
  });
}

function openBackfillDialog() {
  backfillForm.platform = "bili";
  backfillForm.startTime = "";
  backfillForm.endTime = "";
  backfillForm.upId = "";
  backfillDialogVisible.value = true;
}

async function handleBackfill() {
  if (!backfillForm.startTime || !backfillForm.endTime) {
    message("请选择时间范围", { type: "warning" });
    return;
  }
  await backfillApi(backfillForm).then(() => {
    message("已发送补数据任务", { type: "success" });
    backfillDialogVisible.value = false;
  });
}

async function getFollowUpList() {
  const { data } = await getSocialFollowUpListApi({
    platform: "bili",
    status: 1,
    syncEnabled: 1,
    pageSize: 100
  });
  followUpList.value = data.rows || [];
}

onMounted(() => {
  getPostList();
  getFollowUpList();
});
</script>

<template>
  <div class="main">
    <!-- 搜索栏 -->
    <el-form
      ref="searchFormRef"
      :inline="true"
      :model="searchFormParams"
      class="search-form bg-bg_color w-[99/100] pl-4 pt-2 pb-1"
      @keyup.enter="onSearch"
    >
      <el-form-item label="标题：" prop="title">
        <el-input
          v-model="searchFormParams.title"
          placeholder="按标题模糊搜索"
          clearable
          size="small"
          class="!w-[160px]"
        />
      </el-form-item>
      <el-form-item label="作者：" prop="nickname">
        <el-input
          v-model="searchFormParams.nickname"
          placeholder="按作者昵称搜索"
          clearable
          size="small"
          class="!w-[120px]"
        />
      </el-form-item>
      <el-form-item label="平台：" prop="platform">
        <el-select
          v-model="searchFormParams.platform"
          placeholder="全部"
          clearable
          size="small"
          class="!w-[100px]"
        >
          <el-option label="B站" value="bili" />
          <el-option label="阿里云盘" value="aliyun" />
        </el-select>
      </el-form-item>
      <el-form-item label="类型：" prop="postType">
        <el-select
          v-model="searchFormParams.postType"
          placeholder="全部"
          clearable
          size="small"
          class="!w-[100px]"
        >
          <el-option label="图文" :value="1" />
          <el-option label="视频" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="音频状态：" prop="audioStatus">
        <el-select
          v-model="searchFormParams.audioStatus"
          placeholder="全部"
          clearable
          size="small"
          class="!w-[110px]"
        >
          <el-option
            v-for="(v, k) in AUDIO_STATUS_MAP"
            :key="k"
            :label="v.text"
            :value="Number(k)"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          size="small"
          :icon="useRenderIcon(Search)"
          :loading="pageLoading"
          @click="onSearch"
        >
          搜索
        </el-button>
        <el-button
          size="small"
          :icon="useRenderIcon(Refresh)"
          @click="resetForm"
        >
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <PureTableBar title="动态列表" :columns="columns" @refresh="getPostList">
      <template #buttons>
        <el-button
          size="small"
          :icon="useRenderIcon(Refresh)"
          @click="getPostList"
        >
          刷新
        </el-button>
        <el-button
          size="small"
          type="primary"
          :icon="useRenderIcon(Link)"
          @click="openLinkDialog"
        >
          同步指定链接
        </el-button>
        <el-button
          size="small"
          type="warning"
          :icon="useRenderIcon(Download)"
          @click="openBackfillDialog"
        >
          补数据
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
            color: 'var(--el-text-color-primary)',
            padding: '4px 0'
          }"
          :cell-style="{ padding: '4px 0' }"
          @page-size-change="getPostList"
          @page-current-change="getPostList"
          @sort-change="onSortChange"
        >
          <template #operation="{ row }">
            <el-button
              class="reset-margin"
              link
              type="primary"
              title="详情"
              :size="size"
              :icon="useRenderIcon(View)"
              @click="openDetail(row)"
            />
            <el-button
              v-if="row.postType === 2"
              class="reset-margin"
              link
              type="warning"
              title="重转写"
              :size="size"
              :icon="useRenderIcon(VideoPlay)"
              @click="onRetranscribe(row)"
            />
            <el-button
              v-if="row.audioTranscript"
              class="reset-margin"
              link
              type="success"
              title="重总结"
              :size="size"
              :icon="useRenderIcon(Document)"
              @click="onResummarize(row)"
            />
          </template>
        </pure-table>
      </template>
    </PureTableBar>

    <PostDetail v-model="detailVisible" :post-id="currentId" />

    <!-- 同步指定链接 -->
    <el-dialog
      v-model="linkDialogVisible"
      title="同步指定链接"
      width="520px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <el-form :model="linkForm" label-width="80px">
        <el-form-item label="平台">
          <el-select v-model="linkForm.platform" class="!w-[200px]">
            <el-option label="B站" value="bili" />
            <el-option label="阿里云盘" value="aliyun" />
          </el-select>
        </el-form-item>
        <el-form-item label="链接">
          <el-input
            v-model="linkForm.url"
            type="textarea"
            :rows="3"
            placeholder="粘贴 B站动态/视频链接"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="linkDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSyncByLink">确定</el-button>
      </template>
    </el-dialog>

    <!-- 按时间范围补数据 -->
    <el-dialog
      v-model="backfillDialogVisible"
      title="按时间范围补数据"
      width="560px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <el-form :model="backfillForm" label-width="80px">
        <el-form-item label="平台">
          <el-select v-model="backfillForm.platform" class="!w-[200px]">
            <el-option label="B站" value="bili" />
            <el-option label="阿里云盘" value="aliyun" />
          </el-select>
        </el-form-item>
        <el-form-item label="UP主">
          <el-select
            v-model="backfillForm.upId"
            clearable
            filterable
            placeholder="选择UP主（留空表示全部）"
            class="!w-[360px]"
          >
            <el-option
              v-for="item in followUpList"
              :key="item.upId"
              :label="item.upName"
              :value="item.upId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="backfillForm.startTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="开始时间"
            class="!w-[180px]"
          />
          <span class="mx-2">~</span>
          <el-date-picker
            v-model="backfillForm.endTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="结束时间"
            class="!w-[180px]"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="backfillDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleBackfill">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.search-form {
  :deep(.el-form-item) {
    margin-right: 12px;
    margin-bottom: 6px;
  }
}
</style>
