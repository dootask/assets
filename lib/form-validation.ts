// 表单验证工具函数

// 表单字段值的可能类型
export type FormFieldValue = string | number | boolean | Date | null | undefined;

// 验证规则类型
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  custom?: (value: FormFieldValue) => string | null;
}

// 验证结果类型
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// 字段验证配置
export interface FieldValidation {
  [fieldName: string]: {
    label: string;
    rules: ValidationRule;
  };
}

// 验证单个字段
export function validateField(value: FormFieldValue, rules: ValidationRule, label: string): ValidationResult {
  const errors: string[] = [];

  // 必填验证
  if (rules.required && (value === null || value === undefined || value === '')) {
    errors.push(`${label}不能为空`);
    return { isValid: false, errors };
  }

  // 如果值为空且不是必填，跳过其他验证
  if (value === null || value === undefined || value === '') {
    return { isValid: true, errors: [] };
  }

  // 字符串长度验证
  if (typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      errors.push(`${label}至少需要${rules.minLength}个字符`);
    }
    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push(`${label}不能超过${rules.maxLength}个字符`);
    }
  }

  // 数值范围验证
  if (typeof value === 'number') {
    if (rules.min !== undefined && value < rules.min) {
      errors.push(`${label}不能小于${rules.min}`);
    }
    if (rules.max !== undefined && value > rules.max) {
      errors.push(`${label}不能大于${rules.max}`);
    }
  }

  // 正则表达式验证
  if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
    errors.push(`${label}格式不正确`);
  }

  // 自定义验证
  if (rules.custom) {
    const customError = rules.custom(value);
    if (customError) {
      errors.push(customError);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// 验证整个表单
export function validateForm(
  data: Record<string, FormFieldValue>,
  config: FieldValidation
): {
  isValid: boolean;
  errors: Record<string, string[]>;
  firstError?: string;
} {
  const errors: Record<string, string[]> = {};
  let isValid = true;
  let firstError: string | undefined;

  Object.entries(config).forEach(([fieldName, { label, rules }]) => {
    const result = validateField(data[fieldName], rules, label);
    if (!result.isValid) {
      errors[fieldName] = result.errors;
      isValid = false;
      if (!firstError) {
        firstError = result.errors[0];
      }
    }
  });

  return { isValid, errors, firstError };
}

// 常用验证规则
export const commonRules = {
  required: { required: true },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  phone: {
    pattern: /^1[3-9]\d{9}$/,
  },
  assetNo: {
    required: true,
    minLength: 3,
    maxLength: 50,
    pattern: /^[A-Za-z0-9-_]+$/,
  },
  name: {
    required: true,
    minLength: 1,
    maxLength: 100,
  },
  code: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[A-Za-z0-9-_]+$/,
  },
  price: {
    min: 0,
    max: 999999999.99,
  },
  positiveInteger: {
    min: 1,
    custom: (value: FormFieldValue) => {
      if (value && !Number.isInteger(Number(value))) {
        return '必须是整数';
      }
      return null;
    },
  },
};

// 表单字段错误显示组件辅助函数
export function getFieldError(errors: Record<string, string[]>, fieldName: string): string | undefined {
  return errors[fieldName]?.[0];
}

// 检查字段是否有错误
export function hasFieldError(errors: Record<string, string[]>, fieldName: string): boolean {
  return Boolean(errors[fieldName]?.length);
}

// 清除字段错误
export function clearFieldError(errors: Record<string, string[]>, fieldName: string): Record<string, string[]> {
  const newErrors = { ...errors };
  delete newErrors[fieldName];
  return newErrors;
}

// 设置字段错误
export function setFieldError(
  errors: Record<string, string[]>,
  fieldName: string,
  error: string
): Record<string, string[]> {
  return {
    ...errors,
    [fieldName]: [error],
  };
}

// 资产管理相关验证配置
export const assetValidationConfig: FieldValidation = {
  asset_no: {
    label: '资产编号',
    rules: commonRules.assetNo,
  },
  name: {
    label: '资产名称',
    rules: commonRules.name,
  },
  category_id: {
    label: '资产分类',
    rules: commonRules.required,
  },
  brand: {
    label: '品牌',
    rules: { maxLength: 100 },
  },
  model: {
    label: '型号',
    rules: { maxLength: 100 },
  },
  serial_number: {
    label: '序列号',
    rules: { maxLength: 100 },
  },
  purchase_price: {
    label: '采购价格',
    rules: commonRules.price,
  },
  supplier: {
    label: '供应商',
    rules: { maxLength: 200 },
  },
  warranty_period: {
    label: '保修期',
    rules: commonRules.positiveInteger,
  },
  location: {
    label: '存放位置',
    rules: { maxLength: 200 },
  },
  responsible_person: {
    label: '责任人',
    rules: { maxLength: 100 },
  },
  description: {
    label: '描述',
    rules: { maxLength: 1000 },
  },
};

// 部门管理验证配置
export const departmentValidationConfig: FieldValidation = {
  name: {
    label: '部门名称',
    rules: commonRules.name,
  },
  code: {
    label: '部门编码',
    rules: commonRules.code,
  },
  manager: {
    label: '负责人',
    rules: { maxLength: 100 },
  },
  contact: {
    label: '联系方式',
    rules: { maxLength: 100 },
  },
  description: {
    label: '描述',
    rules: { maxLength: 500 },
  },
};

// 分类管理验证配置
export const categoryValidationConfig: FieldValidation = {
  name: {
    label: '分类名称',
    rules: commonRules.name,
  },
  code: {
    label: '分类编码',
    rules: commonRules.code,
  },
  description: {
    label: '描述',
    rules: { maxLength: 500 },
  },
};
