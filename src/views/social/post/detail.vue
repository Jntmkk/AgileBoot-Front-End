<script setup lang="ts">
import { ref, watch, computed, onUnmounted } from "vue";
import dayjs from "dayjs";
import MarkdownIt from "markdown-it";
import { getSocialPostInfoApi, SocialSyncPostDTO } from "@/api/social/post";

const md = new MarkdownIt({ html: false, breaks: true, linkify: true });
const props = defineProps<{
  modelValue: boolean;
  postId: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
}>();

const visible = ref(false);
const loading = ref(false);
const detail = ref<SocialSyncPostDTO | null>(null);
const activeTab = ref("summary");
const videoStartTime = ref(0);

// Drawer 宽度拖拽
const drawerSize = ref(640);
const isResizing = ref(false);

function onResizeStart(e: MouseEvent) {
  isResizing.value = true;
  document.addEventListener("mousemove", onResizeMove);
  document.addEventListener("mouseup", onResizeEnd);
  document.body.style.userSelect = "none";
  document.body.style.cursor = "ew-resize";
  e.preventDefault();
}

function onResizeMove(e: MouseEvent) {
  if (!isResizing.value) return;
  const w = window.innerWidth - e.clientX;
  drawerSize.value = Math.max(360, Math.min(1200, w));
}

function onResizeEnd() {
  isResizing.value = false;
  document.removeEventListener("mousemove", onResizeMove);
  document.removeEventListener("mouseup", onResizeEnd);
  document.body.style.userSelect = "";
  document.body.style.cursor = "";
}

onUnmounted(() => {
  document.removeEventListener("mousemove", onResizeMove);
  document.removeEventListener("mouseup", onResizeEnd);
});

const bvid = computed(() => {
  if (!detail.value || detail.value.postType !== 2) return null;
  const url = detail.value.videoUrl || detail.value.platformPostUrl || "";
  const match = url.match(/BV[0-9A-Za-z]{10}/);
  return match ? match[0] : null;
});

const playerSrc = computed(() => {
  if (!bvid.value) return null;
  const t = Math.floor(videoStartTime.value);
  return `https://player.bilibili.com/player.html?bvid=${bvid.value}&page=1&high_quality=1&danmaku=0&autoplay=1&t=${t}`;
});

const renderedSummary = computed(() =>
  detail.value?.audioSummary ? md.render(detail.value.audioSummary) : ""
);

watch(
  () => props.modelValue,
  async v => {
    visible.value = v;
    if (v && props.postId) {
      loading.value = true;
      detail.value = null;
      videoStartTime.value = 0;
      activeTab.value = "summary";
      try {
        const { data } = await getSocialPostInfoApi(props.postId);
        detail.value = data;
      } finally {
        loading.value = false;
      }
    }
  }
);

function close() {
  emit("update:modelValue", false);
}

function fmt(d?: Date) {
  return d ? dayjs(d).format("YYYY-MM-DD HH:mm:ss") : "-";
}

/** images 字段是 JSON 数组字符串 */
function parseImages(images?: string): string[] {
  if (!images) return [];
  try {
    const arr = JSON.parse(images);
    return Array.isArray(arr) ? arr.filter(Boolean) : [];
  } catch {
    return [];
  }
}

interface SentenceSegment {
  start: number;
  end: number;
  text: string;
}

function parseSentences(raw?: string): SentenceSegment[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

const sentenceTimestamps = computed(() =>
  parseSentences(detail.value?.audioSentenceTimestamps)
);

function formatTs(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
</script>

<template>
  <el-drawer
    v-model="visible"
    :size="drawerSize"
    :title="detail?.title || '动态详情'"
    destroy-on-close
    @close="close"
  >
    <!-- 拖拽手柄 -->
    <div class="drawer-resize-handle" @mousedown="onResizeStart" />
    <div v-loading="loading" class="post-detail">
      <template v-if="detail">
        <!-- 元信息 -->
        <el-descriptions :column="2" border size="small" class="mb-4">
          <el-descriptions-item label="作者">
            {{ detail.nickname || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="类型">
            <el-tag
              size="small"
              :type="detail.postType === 2 ? 'danger' : 'info'"
              effect="plain"
            >
              {{ detail.postType === 2 ? "视频" : "图文" }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发布时间">
            {{ fmt(detail.publishedAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="同步时间">
            {{ fmt(detail.syncedAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="点赞">{{
            detail.likeCount ?? "-"
          }}</el-descriptions-item>
          <el-descriptions-item label="评论">{{
            detail.commentCount ?? "-"
          }}</el-descriptions-item>
          <el-descriptions-item
            v-if="detail.audioStatus != null"
            label="音频状态"
          >
            <el-tag
              size="small"
              :type="
                detail.audioStatus === 6 || detail.audioStatus === 2
                  ? 'danger'
                  : detail.audioStatus === 3
                  ? 'success'
                  : detail.audioStatus === 5
                  ? 'primary'
                  : 'warning'
              "
              effect="plain"
            >
              {{
                {
                  0: "未处理",
                  1: "待转写",
                  2: "取址失败",
                  3: "已总结",
                  4: "转写中",
                  5: "待总结",
                  6: "转写失败"
                }[detail.audioStatus] || "未知"
              }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="detail.remark" label="备注" :span="2">
            <span class="remark-text">{{ detail.remark }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="原文链接" :span="2">
            <el-link
              v-if="detail.platformPostUrl"
              :href="detail.platformPostUrl"
              target="_blank"
              type="primary"
            >
              {{ detail.platformPostUrl }}
            </el-link>
            <span v-else>-</span>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 封面/图片 -->
        <div
          v-if="detail.coverUrl || parseImages(detail.images).length || bvid"
          class="covers mb-4"
        >
          <div v-if="bvid" class="video-player">
            <iframe
              v-if="playerSrc"
              :key="playerSrc"
              :src="playerSrc"
              width="100%"
              height="100%"
              frameborder="0"
              allowfullscreen
              scrolling="no"
            />
          </div>
          <el-image
            v-if="detail.coverUrl"
            :src="detail.coverUrl"
            fit="cover"
            class="cover-img"
            referrerpolicy="no-referrer"
            :preview-src-list="[detail.coverUrl]"
            preview-teleported
          />
          <el-image
            v-for="(img, i) in parseImages(detail.images)"
            :key="i"
            :src="img"
            fit="cover"
            class="cover-img"
            referrerpolicy="no-referrer"
            :preview-src-list="parseImages(detail.images)"
            :initial-index="i"
            preview-teleported
          />
        </div>

        <!-- 内容标签页 -->
        <el-tabs v-model="activeTab">
          <el-tab-pane label="AI 总结" name="summary">
            <div
              v-if="detail.audioSummary"
              class="text-block markdown-body"
              v-html="renderedSummary"
            />
            <el-empty v-else description="暂无总结" :image-size="60" />
          </el-tab-pane>
          <el-tab-pane label="语音转写" name="transcript">
            <div v-if="sentenceTimestamps.length > 0" class="sentences-block">
              <div
                v-for="(sent, i) in sentenceTimestamps"
                :key="i"
                class="sentence-row"
              >
                <span
                  class="sentence-time"
                  @click="videoStartTime = sent.start"
                >
                  {{ formatTs(sent.start) }}
                </span>
                <span class="sentence-text">{{ sent.text }}</span>
              </div>
            </div>
            <div v-else-if="detail.audioTranscript" class="text-block">
              {{ detail.audioTranscript }}
            </div>
            <el-empty v-else description="暂无转写" :image-size="60" />
          </el-tab-pane>
          <el-tab-pane label="正文/描述" name="content">
            <div v-if="detail.content" class="text-block">
              {{ detail.content }}
            </div>
            <el-empty v-else description="暂无正文" :image-size="60" />
          </el-tab-pane>
        </el-tabs>
      </template>
    </div>
  </el-drawer>
</template>

<style scoped lang="scss">
.drawer-resize-handle {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  width: 5px;
  height: 100%;
  cursor: ew-resize;

  &:hover,
  &:active {
    background-color: var(--el-color-primary);
    opacity: 0.4;
  }
}

.post-detail {
  padding-bottom: 20px;
}

.covers {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.video-player {
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: #000;
  border-radius: 6px;

  iframe {
    width: 100%;
    height: 100%;
  }
}

.cover-img {
  width: 110px;
  height: 110px;
  cursor: zoom-in;
  border-radius: 6px;
}

.text-block {
  max-height: 50vh;
  padding: 4px 2px;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-primary);
  word-break: break-word;
  white-space: pre-wrap;
}

.markdown-body {
  white-space: normal;

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 12px 0 8px;
    font-weight: 600;
    line-height: 1.4;
  }

  p {
    margin: 8px 0;
  }

  ul,
  ol {
    padding-left: 20px;
    margin: 8px 0;
  }

  li {
    margin: 4px 0;
  }

  code {
    padding: 2px 4px;
    font-family: monospace;
    background-color: var(--el-fill-color-light);
    border-radius: 4px;
  }

  pre {
    padding: 8px;
    overflow-x: auto;
    background-color: var(--el-fill-color-light);
    border-radius: 4px;
  }

  pre code {
    padding: 0;
    background: transparent;
  }

  blockquote {
    padding-left: 10px;
    margin: 8px 0;
    color: var(--el-text-color-secondary);
    border-left: 3px solid var(--el-border-color);
  }

  a {
    color: var(--el-color-primary);
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
}

.mb-4 {
  margin-bottom: 16px;
}

.remark-text {
  font-size: 12px;
  color: var(--el-color-danger);
  word-break: break-all;
}

.sentences-block {
  max-height: 50vh;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-primary);
}

.sentence-row {
  display: flex;
  gap: 10px;
  padding: 4px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    padding-right: 4px;
    padding-left: 4px;
    background-color: var(--el-fill-color-light);
    border-radius: 4px;
  }
}

.sentence-time {
  flex-shrink: 0;
  width: 48px;
  padding-top: 1px;
  font-family: monospace;
  font-size: 12px;
  color: var(--el-color-primary);
  cursor: pointer;
  user-select: none;

  &:hover {
    text-decoration: underline;
  }
}

.sentence-text {
  flex: 1;
  word-break: break-word;
}
</style>
