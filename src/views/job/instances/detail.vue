<template>
  <div v-loading="loading">
    <template v-if="job">
      <!-- 任务概述 -->
      <el-card class="mb-4">
        <template #header>任务概述</template>
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="ID">{{ job.id }}</el-descriptions-item>
          <el-descriptions-item label="模板">{{ job.templateName }}</el-descriptions-item>
          <el-descriptions-item label="业务键">{{ job.bizKey }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusType(job.status)" size="small">{{ job.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ fmt(job.startTime) }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ fmt(job.endTime) }}</el-descriptions-item>
          <el-descriptions-item v-if="job.errorMsg" label="错误信息" :span="3">
            <span style="color:var(--el-color-danger)">{{ job.errorMsg }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 步骤时间轴 -->
      <el-card>
        <template #header>步骤执行情况</template>
        <div v-if="steps.length === 0" class="text-center py-8" style="color:var(--el-text-color-secondary)">
          暂无步骤数据
        </div>
        <div v-for="(step, idx) in steps" :key="step.id">
          <div class="step-card" :class="{ 'step-active': step.status === 'RUNNING' }">
            <div class="step-header">
              <div class="step-left">
                <el-tag :type="statusType(step.status)" size="small" effect="dark">
                  {{ step.status }}
                </el-tag>
                <span class="step-name">{{ step.stepName }}</span>
                <span class="step-code">({{ step.stepCode }})</span>
              </div>
              <div class="step-right">
                <span v-if="step.assignedNodeId" class="step-meta">
                  <el-icon><Monitor /></el-icon> {{ step.assignedNodeId }}
                </span>
                <span v-if="step.startedAt && step.endedAt" class="step-meta">
                  耗时: {{ duration(step.startedAt, step.endedAt) }}
                </span>
                <span v-if="step.retryCount" class="step-meta" style="color:var(--el-color-warning)">
                  重试: {{ step.retryCount }}次
                </span>
              </div>
            </div>

            <div v-if="step.errorMsg" class="step-error">
              {{ step.errorMsg }}
            </div>

            <div class="step-body">
              <el-collapse v-if="step.inputJson || step.outputJson">
                <el-collapse-item v-if="step.inputJson" title="输入参数">
                  <pre class="json-block">{{ pretty(step.inputJson) }}</pre>
                </el-collapse-item>
                <el-collapse-item v-if="step.outputJson" title="输出结果">
                  <pre class="json-block">{{ pretty(step.outputJson) }}</pre>
                </el-collapse-item>
              </el-collapse>
            </div>
          </div>
          <!-- 箭头 -->
          <div v-if="idx < steps.length - 1" class="step-arrow">
            <el-icon :size="20"><ArrowDown /></el-icon>
          </div>
        </div>
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import dayjs from "dayjs";
import { getJobInstanceDetailApi, type JobInstanceDTO, type JobStepInstanceDTO } from "@/api/job";

defineOptions({ name: "JobInstanceDetail" });

const route = useRoute();
const loading = ref(false);
const job = ref<JobInstanceDTO | null>(null);
const steps = ref<JobStepInstanceDTO[]>([]);

const STATUS_TYPE: Record<string, string> = {
  PENDING: "info", RUNNING: "warning", COMPLETED: "success",
  FAILED: "danger", DEAD: "danger", CANCELLED: "info", TIMEOUT: "danger"
};

function statusType(s: string) { return STATUS_TYPE[s] || "info"; }
function fmt(d?: string) { return d ? dayjs(d).format("YYYY-MM-DD HH:mm:ss") : "-"; }
function pretty(j?: string) {
  if (!j) return "";
  try { return JSON.stringify(JSON.parse(j), null, 2); } catch { return j; }
}
function duration(start?: string, end?: string) {
  if (!start || !end) return "";
  const diff = dayjs(end).diff(dayjs(start), "second");
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s`;
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
}

onMounted(async () => {
  loading.value = true;
  try {
    const id = Number(route.params.id);
    const res = await getJobInstanceDetailApi(id);
    job.value = res.data;
    steps.value = res.data.steps || [];
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.mb-4 { margin-bottom: 16px; }
.text-center { text-align: center; }
.py-8 { padding: 32px 0; }

.step-card {
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
  transition: border-color 0.3s;
}
.step-card.step-active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.step-header {
  display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;
}
.step-left { display: flex; align-items: center; gap: 10px; }
.step-name { font-weight: 600; font-size: 15px; }
.step-code { color: var(--el-text-color-secondary); font-size: 13px; }
.step-right { display: flex; gap: 16px; }
.step-meta { display: flex; align-items: center; gap: 4px; font-size: 13px; color: var(--el-text-color-secondary); }
.step-error {
  margin-top: 10px; padding: 8px 12px;
  background: var(--el-color-danger-light-9); color: var(--el-color-danger);
  border-radius: 4px; font-size: 13px; word-break: break-all;
}
.step-body { margin-top: 10px; }
.step-arrow { text-align: center; padding: 4px 0; color: var(--el-text-color-placeholder); }
.json-block {
  background: var(--el-fill-color);
  padding: 12px; border-radius: 4px;
  font-size: 12px; max-height: 300px; overflow: auto;
  white-space: pre-wrap; word-break: break-all;
}
</style>
