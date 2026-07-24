export interface JobFormData {
  templateCode: string;
  bizKey: string;
  paramsJson: string;
}

export interface FormProps {
  formInline: JobFormData;
}
