<script setup lang="ts">
import { ref, watch } from "vue";
import dayjs from "dayjs";
import { getSocialPostInfoApi, SocialSyncPostDTO } from "@/api/social/post";

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

watch(
  () => props.modelValue,
  async v => {
    visible.value = v;
    if (v && props.postId) {
      loading.value = true;
      detail.value = null;
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
</script>

<template>
  <el-drawer
    v-model="visible"
    size="640px"
    :title="detail?.title || '动态详情'"
    destroy-on-close
    @close="close"
  >
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
          v-if="detail.coverUrl || parseImages(detail.images).length"
          class="covers mb-4"
        >
          <el-image
            v-if="detail.coverUrl"
            :src="detail.coverUrl"
            fit="cover"
            class="cover-img"
            :preview-src-list="[detail.coverUrl]"
            preview-teleported
          />
          <el-image
            v-for="(img, i) in parseImages(detail.images)"
            :key="i"
            :src="img"
            fit="cover"
            class="cover-img"
            :preview-src-list="parseImages(detail.images)"
            :initial-index="i"
            preview-teleported
          />
        </div>

        <!-- 内容标签页 -->
        <el-tabs v-model="activeTab">
          <el-tab-pane label="AI 总结" name="summary">
            <div v-if="detail.audioSummary" class="text-block">
              {{ detail.audioSummary }}
            </div>
            <el-empty v-else description="暂无总结" :image-size="60" />
          </el-tab-pane>
          <el-tab-pane label="语音转写" name="transcript">
            <div v-if="detail.audioTranscript" class="text-block">
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
.post-detail {
  padding-bottom: 20px;
}

.covers {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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

.mb-4 {
  margin-bottom: 16px;
}
</style>
