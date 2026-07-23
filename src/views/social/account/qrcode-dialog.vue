<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { message } from "@/utils/message";
import {
  getSocialAccountLoginStatusApi,
  getSocialAccountQrcodeApi
} from "@/api/social/account";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    accountId: string;
    accountName: string;
    platform?: string;
  }>(),
  { platform: "xhs" }
);

const emit = defineEmits(["update:modelValue", "loggedIn"]);

/** 平台扫码提示文案 */
const platformTips = computed(() =>
  props.platform === "bili"
    ? {
        appName: "哔哩哔哩",
        extra: "登录成功后此弹窗会自动关闭"
      }
    : {
        appName: "小红书",
        extra: "扫码确认后需等待约 30 秒，登录成功后此弹窗会自动关闭"
      }
);

const visible = ref(props.modelValue);
const qrImg = ref("");
const qrTimeout = ref(0);
const qrStatus = ref("");
const loading = ref(false);
const polling = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

watch(
  () => props.modelValue,
  val => {
    visible.value = val;
    if (val) {
      startLoginFlow();
    } else {
      stopPolling();
    }
  }
);

watch(visible, val => emit("update:modelValue", val));

function stopPolling() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  polling.value = false;
}

async function startLoginFlow() {
  stopPolling();
  loading.value = true;
  qrImg.value = "";
  qrStatus.value = "";
  try {
    const { data } = await getSocialAccountQrcodeApi(
      props.accountId,
      props.platform
    );
    if (data.isLoggedIn) {
      message("该账号已是登录状态", { type: "success" });
      emit("loggedIn");
      visible.value = false;
      return;
    }
    qrImg.value = data.img.startsWith("data:")
      ? data.img
      : `data:image/png;base64,${data.img}`;
    qrTimeout.value = data.timeout ?? 120;
    startPolling();
  } catch (e) {
    message(`获取二维码失败：${e.message ?? e}`, { type: "error" });
    visible.value = false;
  } finally {
    loading.value = false;
  }
}

function startPolling() {
  polling.value = true;
  let failCount = 0;
  const startedAt = Date.now();
  // 用递归 setTimeout：状态查询耗时较长，避免 setInterval 请求叠加
  const poll = async () => {
    if (!polling.value) return;
    // 二维码有效期内轮询，超时自动停止
    if (Date.now() - startedAt > (qrTimeout.value + 30) * 1000) {
      stopPolling();
      message("二维码已过期，请关闭弹窗后重新打开", { type: "warning" });
      return;
    }
    try {
      const { data } = await getSocialAccountLoginStatusApi(
        props.accountId,
        props.platform
      );
      failCount = 0;
      if (data.isLoggedIn) {
        stopPolling();
        message(`账号 ${props.accountName} 登录成功`, { type: "success" });
        emit("loggedIn");
        visible.value = false;
        return;
      }
      // 扫码中间态（"已扫码，请在手机上确认"/"二维码已过期"）
      qrStatus.value = data.qrStatus ?? "";
    } catch {
      // 扫码后 cookies 落盘需要时间；接口偶发失败可容忍，连续失败则提示
      failCount++;
      if (failCount >= 10) {
        stopPolling();
        message("登录状态查询持续失败，请检查节点后重试", { type: "error" });
        visible.value = false;
        return;
      }
    }
    if (polling.value) {
      timer = setTimeout(poll, 3000);
    }
  };
  timer = setTimeout(poll, 1000);
}

onBeforeUnmount(stopPolling);
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="`扫码登录 - ${accountName}`"
    width="360px"
    :close-on-click-modal="false"
  >
    <div v-loading="loading" class="qr-wrapper">
      <template v-if="qrImg">
        <img :src="qrImg" alt="登录二维码" class="qr-img" />
        <p class="qr-tip">
          请用{{ platformTips.appName }} App 扫码登录（{{ qrTimeout }}
          秒内有效）
          <br />
          {{ platformTips.extra }}
        </p>
        <p v-if="qrStatus" class="qr-status">{{ qrStatus }}</p>
      </template>
      <p v-else-if="!loading" class="qr-tip">二维码获取失败，请重试</p>
    </div>
  </el-dialog>
</template>

<style scoped>
.qr-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 240px;
}

.qr-img {
  width: 240px;
  height: 240px;
}

.qr-tip {
  margin-top: 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.qr-status {
  margin-top: 8px;
  font-size: 13px;
  color: var(--el-color-warning);
  text-align: center;
}
</style>
