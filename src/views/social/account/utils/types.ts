export interface SocialAccountForm {
  id?: number;
  platform: string;
  accountName: string;
  nodeName: string;
  proxyUrl: string;
  status: number;
  remark: string;
}

interface FormProps {
  formInline: SocialAccountForm;
}

export type { FormProps };
