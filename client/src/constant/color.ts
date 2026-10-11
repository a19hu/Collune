/** Collune brand colour tokens, derived from the logo. */
export const colors = {
  brand: {
    primary: '#1438A8',
    primaryHover: '#102E86',
    primaryActive: '#0C2264',
    accent: '#B8A8FF',
    accentSoft: '#EEEAFE',
  },
  ink: {
    strong: '#182230',
    default: '#344054',
    muted: '#667085',
    subtle: '#98A2B3',
    inverse: '#FFFFFF',
  },
  surface: {
    page: '#F8FAFC',
    default: '#FFFFFF',
    subtle: '#F2F4F7',
    border: '#E4E7EC',
  },
  feedback: {
    success: '#067647',
    successSoft: '#ECFDF3',
    warning: '#B54708',
    warningSoft: '#FFF7E6',
    danger: '#B42318',
    dangerSoft: '#FEF3F2',
    info: '#175CD3',
    infoSoft: '#EFF8FF',
  },
} as const;

export const button = {
  primary: 'bg-[#1438A8] text-white hover:bg-[#102E86]',
  secondary: 'border border-[#1438A8] text-[#1438A8] hover:bg-[#EFF4FF]',
} as const;
