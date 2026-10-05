export type IPrintRow = {
  recordId: string;
  values: Record<string, IPrintCell>;
};

export type IPrintCell = {
  text: string;
  images?: string[];
};

export type IFieldMetaSettings = {
  fieldId: string;
  name: string;
  hidden: boolean;
};

export type IPrintTemplate = {
  id: string;
  name: string;
  title: string;
  orientation: 'portrait' | 'landscape';
  fields: IFieldMetaSettings[];
};
