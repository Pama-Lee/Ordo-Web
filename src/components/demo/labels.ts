// UI labels for the Studio renders, taken from Ordo Studio's own locales
// (packages/vue/src/locale/index.ts and apps/studio/src/i18n/locales/*.ts).

export type Lang = 'en' | 'zh-CN' | 'zh-TW';

const en = {
  // flow (packages/vue step.*)
  start: 'START',
  typeDecision: 'Decision',
  typeTerminal: 'Terminal',
  branch: 'Branch',
  default: 'Default',
  // test panel (apps/studio test.project.*)
  flowReplay: 'Flow Replay',
  inputSnapshot: 'Input snapshot',
  code: 'Code',
  message: 'Message',
  output: 'Output',
  path: 'Path',
  samples: { double: 'Double charge', blender: 'Blender', parcel: 'Parcel', dispute: 'Bank dispute' },
  // decision table (packages/vue table.*)
  addRow: 'Add Row',
  addInputColumn: 'Add Input Column',
  addOutputColumn: 'Add Output Column',
  hitPolicy: 'Hit Policy',
  firstMatch: 'First Match',
  groupInput: 'Conditions',
  groupOutput: 'Outputs',
  traceStatus: 'Trace',
  traceInputRow: 'Input',
  traceActual: 'Actual',
  traceMatched: 'Matched',
  traceNotMatched: 'Skipped',
  traceAnyCell: 'Wildcard matched',
  traceAllMatched: 'All conditions matched',
  tableCases: {
    blender: 'Blender sample',
    medium: 'Medium confidence',
    amount: 'Over 200',
    repeat: 'Third refund in 90 days',
    window: 'Delivered 31 days ago',
    low: 'Low confidence',
  },
};

export type DemoLabels = typeof en;

const zhCN: DemoLabels = {
  start: '起始',
  typeDecision: '决策',
  typeTerminal: '终结',
  branch: '分支',
  default: '默认',
  flowReplay: '流程回放',
  inputSnapshot: '输入快照',
  code: '结果码',
  message: '消息',
  output: '输出',
  path: '执行路径',
  samples: { double: '重复扣款', blender: '搅拌机', parcel: '包裹', dispute: '银行争议' },
  addRow: '添加行',
  addInputColumn: '添加输入列',
  addOutputColumn: '添加输出列',
  hitPolicy: '命中策略',
  firstMatch: '首次匹配',
  groupInput: '条件',
  groupOutput: '输出',
  traceStatus: '追踪',
  traceInputRow: '输入',
  traceActual: '实际值',
  traceMatched: '命中',
  traceNotMatched: '未命中',
  traceAnyCell: '通配条件命中',
  traceAllMatched: '全部条件命中',
  tableCases: {
    blender: '搅拌机样例',
    medium: '把握中等',
    amount: '金额超过 200',
    repeat: '90 天内第 3 次退款',
    window: '签收已 31 天',
    low: '把握较低',
  },
};

const zhTW: DemoLabels = {
  start: '起始',
  typeDecision: '決策',
  typeTerminal: '終結',
  branch: '分支',
  default: '預設',
  flowReplay: '流程回放',
  inputSnapshot: '輸入快照',
  code: '結果碼',
  message: '訊息',
  output: '輸出',
  path: '執行路徑',
  samples: { double: '重複扣款', blender: '果汁機', parcel: '包裹', dispute: '銀行爭議' },
  addRow: '新增列',
  addInputColumn: '新增輸入欄',
  addOutputColumn: '新增輸出欄',
  hitPolicy: '命中策略',
  firstMatch: '首次匹配',
  groupInput: '條件',
  groupOutput: '輸出',
  traceStatus: '追蹤',
  traceInputRow: '輸入',
  traceActual: '實際值',
  traceMatched: '命中',
  traceNotMatched: '未命中',
  traceAnyCell: '萬用條件命中',
  traceAllMatched: '全部條件命中',
  tableCases: {
    blender: '果汁機樣例',
    medium: '把握中等',
    amount: '金額超過 200',
    repeat: '90 天內第 3 次退款',
    window: '簽收已 31 天',
    low: '把握較低',
  },
};

const all: Record<Lang, DemoLabels> = { en, 'zh-CN': zhCN, 'zh-TW': zhTW };

export function demoLabels(lang: string): DemoLabels {
  return all[lang as Lang] ?? zhCN;
}
