<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import { message } from "@/utils/message";
import {
  getSocialAccountLoginStatusApi,
  getSocialAccountQrcodeApi
} from "@/api/social/account";

const props = defineProps<{
  modelValue: boolean;
  accountId: string;
  accountName: string;
}>();

const emit = defineEmits(["update:modelValue", "loggedIn"]);

const visible = ref(props.modelValue);
const qrImg = ref("");
const qrTimeout = ref(0);
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
  try {
    const { data } = await getSocialAccountQrcodeApi(props.accountId);
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
  timer = setInterval(async () => {
    try {
      const { data } = await getSocialAccountLoginStatusApi(props.accountId);
      if (data.isLoggedIn) {
        stopPolling();
        message(`账号 ${props.accountName} 登录成功`, { type: "success" });
        emit("loggedIn");
        visible.value = false;
      }
    } catch {
      // 轮询失败静默，等下一次
    }
  }, 3000);
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
        <img :src="qrImg" alt="小红书登录二维码" class="qr-img" />
        <p class="qr-tip">
          请用小红书 App 扫码登录（{{ qrTimeout }} 秒内有效）<br />
          扫码成功后此弹窗会自动关闭
        </p>
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
</style>
