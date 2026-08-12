<script setup lang="tsx">
import { onMounted, ref, computed } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import FolderOpened from "@iconify-icons/ep/folder-opened";
import VideoCamera from "@iconify-icons/ep/video-camera";
import Refresh from "@iconify-icons/ep/refresh";
import Back from "@iconify-icons/ep/back";
import { message } from "@/utils/message";
import {
  AlistFileInfo,
  listCloudDriveFilesApi,
  syncCloudDriveApi,
  syncSelectedCloudDriveApi
} from "@/api/social/cloud-drive";
import {
  getSocialFollowUpListApi,
  type SocialFollowUpDTO
} from "@/api/social/follow";

defineOptions({
  name: "CloudDrive"
});

const pageLoading = ref(true);
const syncing = ref(false);
const syncingSelected = ref(false);
const sources = ref<SocialFollowUpDTO[]>([]);
const selectedSourceId = ref("");
const currentPath = ref("");
const pathStack = ref<string[]>([]);
const files = ref<AlistFileInfo[]>([]);
const selectedFiles = ref<AlistFileInfo[]>([]);

const fileTypeTag: Record<number, { text: string; type: string }> = {
  0: { text: "其他", type: "" },
  1: { text: "目录", type: "primary" },
  2: { text: "视频", type: "warning" },
  3: { text: "音频", type: "danger" },
  4: { text: "文档", type: "info" },
  5: { text: "图片", type: "success" }
};

const VIDEO_EXTS = new Set([
  "mp4",
  "mov",
  "avi",
  "mkv",
  "flv",
  "wmv",
  "webm",
  "m4v",
  "ts",
  "rmvb"
]);

function isVideoFile(name: string): boolean {
  const idx = name.lastIndexOf(".");
  if (idx < 0) return false;
  return VIDEO_EXTS.has(name.substring(idx + 1).toLowerCase());
}

const hasSelectedVideo = computed(() =>
  selectedFiles.value.some(f => isVideoFile(f.name))
);

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024)
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}

async function loadSources() {
  try {
    const { data } = await getSocialFollowUpListApi({
      platform: "aliyun",
      status: 1,
      pageSize: 100
    });
    sources.value = data.rows || [];
    if (sources.value.length > 0 && !selectedSourceId.value) {
      selectedSourceId.value = sources.value[0].id;
      const root = sources.value[0].remark || "/";
      currentPath.value = root;
      pathStack.value = root.split("/").filter(Boolean);
      getFiles();
    } else if (sources.value.length === 0) {
      pageLoading.value = false;
    }
  } catch {
    message("加载云盘来源失败", { type: "error" });
    pageLoading.value = false;
  }
}

function handleSourceChange(id: string) {
  const source = sources.value.find(s => s.id === id);
  if (!source) return;
  const root = source.remark || "/";
  currentPath.value = root;
  pathStack.value = root.split("/").filter(Boolean);
  getFiles();
}

async function getFiles() {
  if (!currentPath.value) return;
  pageLoading.value = true;
  try {
    const { data } = await listCloudDriveFilesApi(currentPath.value);
    files.value = data.files;
  } catch (e) {
    message("加载目录失败", { type: "error" });
    files.value = [];
  } finally {
    pageLoading.value = false;
  }
}

function handleFileClick(row: AlistFileInfo) {
  if (row.isDir) {
    pathStack.value.push(row.name);
    currentPath.value = row.path;
    getFiles();
  }
}

function goBack() {
  if (pathStack.value.length <= 1) return;
  pathStack.value.pop();
  currentPath.value = buildPathFromStack();
  getFiles();
}

function goUp() {
  const parts = currentPath.value.split("/").filter(Boolean);
  if (parts.length <= 0) return;
  parts.pop();
  currentPath.value = "/" + parts.join("/");
  pathStack.value = parts;
  if (pathStack.value.length === 0) {
    // back to source root
    const source = sources.value.find(s => s.id === selectedSourceId.value);
    if (source) {
      const root = source.remark || "/";
      currentPath.value = root;
      pathStack.value = root.split("/").filter(Boolean);
    }
  }
  getFiles();
}

function buildPathFromStack(): string {
  return "/" + pathStack.value.join("/");
}

function handleSelectionChange(selection: AlistFileInfo[]) {
  selectedFiles.value = selection.filter(f => !f.isDir);
}

async function handleSync() {
  syncing.value = true;
  try {
    const { data: count } = await syncCloudDriveApi(currentPath.value);
    message(`同步完成，新增 ${count || 0} 个视频`, { type: "success" });
  } catch (e) {
    message("同步失败", { type: "error" });
  } finally {
    syncing.value = false;
  }
}

async function handleSyncSelected() {
  const paths = selectedFiles.value
    .filter(f => isVideoFile(f.name))
    .map(f => f.path);
  if (paths.length === 0) {
    message("请先勾选视频文件", { type: "warning" });
    return;
  }
  syncingSelected.value = true;
  try {
    const { data: count } = await syncSelectedCloudDriveApi(paths);
    message(`勾选同步完成，新增 ${count || 0} 个视频`, { type: "success" });
  } catch (e) {
    message("勾选同步失败", { type: "error" });
  } finally {
    syncingSelected.value = false;
  }
}

onMounted(loadSources);
</script>

<template>
  <div class="main">
    <div class="source-bar">
      <span class="source-label">云盘来源：</span>
      <el-select
        v-model="selectedSourceId"
        placeholder="请选择云盘来源"
        class="!w-[200px]"
        @change="handleSourceChange"
      >
        <el-option
          v-for="src in sources"
          :key="src.id"
          :label="src.upName || src.upId"
          :value="src.id"
        />
      </el-select>
    </div>
    <div class="path-bar">
      <el-button-group style="margin-right: 12px">
        <el-button
          @click="goBack"
          :disabled="pathStack.length <= 1"
          :icon="useRenderIcon(Back)"
        />
        <el-button @click="goUp" :icon="useRenderIcon(FolderOpened)"
          >上级</el-button
        >
      </el-button-group>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item v-for="(part, index) in pathStack" :key="index">
          <span
            v-if="index < pathStack.length - 1"
            style="color: var(--el-color-primary); cursor: pointer"
            @click="
              () => {
                pathStack = pathStack.slice(0, index + 1);
                currentPath = '/' + pathStack.join('/');
                getFiles();
              }
            "
          >
            {{ part }}
          </span>
          <span v-else>{{ part }}</span>
        </el-breadcrumb-item>
      </el-breadcrumb>
      <div style="display: flex; gap: 8px; margin-left: auto">
        <el-button :icon="useRenderIcon(Refresh)" @click="getFiles"
          >刷新</el-button
        >
        <el-button
          type="warning"
          :icon="useRenderIcon(VideoCamera)"
          :loading="syncing"
          @click="handleSync"
        >
          同步此目录视频
        </el-button>
        <el-button
          type="primary"
          :icon="useRenderIcon(VideoCamera)"
          :loading="syncingSelected"
          :disabled="!hasSelectedVideo"
          @click="handleSyncSelected"
        >
          同步勾选视频
        </el-button>
      </div>
    </div>

    <PureTableBar title="文件列表">
      <template #default="{ size }">
        <el-table
          ref="tableRef"
          v-loading="pageLoading"
          :data="files"
          :size="size"
          border
          stripe
          highlight-current-row
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="50" />
          <el-table-column label="文件名" prop="name" min-width="280" sortable>
            <template #default="{ row }">
              <div
                style="
                  display: flex;
                  gap: 8px;
                  align-items: center;
                  cursor: pointer;
                "
                @click="handleFileClick(row)"
              >
                <el-avatar v-if="row.thumb" size="small" :src="row.thumb" />
                <span
                  :style="
                    row.isDir
                      ? 'color:var(--el-color-primary);font-weight:500'
                      : ''
                  "
                >
                  {{ row.name }}
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="类型" prop="type" width="90" sortable>
            <template #default="{ row }">
              <el-tag
                :size="size"
                :type="(row.isDir ? 'primary' : (fileTypeTag[row.type] && fileTypeTag[row.type].type) || '') as any"
                effect="plain"
              >
                {{
                  row.isDir
                    ? "目录"
                    : (fileTypeTag[row.type] && fileTypeTag[row.type].text) ||
                      "文件"
                }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="大小" prop="size" width="120" sortable>
            <template #default="{ row }">
              {{ row.size ? formatSize(row.size) : "-" }}
            </template>
          </el-table-column>
          <el-table-column
            label="修改时间"
            prop="modified"
            min-width="160"
            sortable
          />
        </el-table>
      </template>
    </PureTableBar>
  </div>
</template>

<style scoped>
.main {
  padding: 16px;
}

.source-bar {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
}

.source-label {
  margin-right: 8px;
  font-weight: 500;
  white-space: nowrap;
}

.path-bar {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
}
</style>
