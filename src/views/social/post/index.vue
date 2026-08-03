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

const detailVisible = ref(false);
const currentId = ref("");

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

const columns: TableColumnList = [
  { label: "ID", prop: "id", width: 70 },
  {
    label: "类型",
    prop: "postType",
    width: 80,
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
  { label: "标题", prop: "title", minWidth: 220, showOverflowTooltip: true },
  { label: "作者", prop: "nickname", minWidth: 110 },
  {
    label: "音频状态",
    prop: "audioStatus",
    width: 100,
    cellRenderer: ({ row, props }) => {
      const s = AUDIO_STATUS_MAP[row.audioStatus] || {
        text: "未知",
        type: "info"
      };
      return (
        <el-tag size={props.size} type={s.type as any} effect="plain">
          {s.text}
        </el-tag>
      );
    }
  },
  {
    label: "点赞",
    prop: "likeCount",
    width: 80,
    formatter: ({ likeCount }) => likeCount ?? "-"
  },
  {
    label: "发布时间",
    prop: "publishedAt",
    minWidth: 160,
    formatter: ({ publishedAt }) =>
      publishedAt ? dayjs(publishedAt).format("YYYY-MM-DD HH:mm") : "-"
  },
  { label: "操作", fixed: "right", width: 200, slot: "operation" }
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

function resetForm() {
  searchFormRef.value?.resetFields();
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

onMounted(getPostList);
</script>

<template>
  <div class="main">
    <!-- 搜索栏 -->
    <el-form
      ref="searchFormRef"
      :inline="true"
      :model="searchFormParams"
      class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px]"
    >
      <el-form-item label="标题：" prop="title">
        <el-input
          v-model="searchFormParams.title"
          placeholder="按标题模糊搜索"
          clearable
          class="!w-[200px]"
        />
      </el-form-item>
      <el-form-item label="作者：" prop="nickname">
        <el-input
          v-model="searchFormParams.nickname"
          placeholder="按作者昵称搜索"
          clearable
          class="!w-[160px]"
        />
      </el-form-item>
      <el-form-item label="类型：" prop="postType">
        <el-select
          v-model="searchFormParams.postType"
          placeholder="全部"
          clearable
          class="!w-[120px]"
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
          class="!w-[130px]"
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
          :icon="useRenderIcon(Search)"
          :loading="pageLoading"
          @click="onSearch"
        >
          搜索
        </el-button>
        <el-button :icon="useRenderIcon(Refresh)" @click="resetForm">
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <PureTableBar title="动态列表" :columns="columns" @refresh="getPostList">
      <template #buttons>
        <el-button :icon="useRenderIcon(Refresh)" @click="getPostList">
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
          @page-size-change="getPostList"
          @page-current-change="getPostList"
        >
          <template #operation="{ row }">
            <el-button
              class="reset-margin"
              link
              type="primary"
              :size="size"
              :icon="useRenderIcon(View)"
              @click="openDetail(row)"
            >
              详情
            </el-button>
            <el-button
              v-if="row.postType === 2"
              class="reset-margin"
              link
              type="warning"
              :size="size"
              :icon="useRenderIcon(VideoPlay)"
              @click="onRetranscribe(row)"
            >
              重转写
            </el-button>
            <el-button
              v-if="row.audioTranscript"
              class="reset-margin"
              link
              type="success"
              :size="size"
              :icon="useRenderIcon(Document)"
              @click="onResummarize(row)"
            >
              重总结
            </el-button>
          </template>
        </pure-table>
      </template>
    </PureTableBar>

    <PostDetail v-model="detailVisible" :post-id="currentId" />
  </div>
</template>

<style scoped lang="scss">
.search-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}
</style>
