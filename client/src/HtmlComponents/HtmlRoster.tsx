import {
  CheckCircle2,
  Info,
  ListPlus,
  MoreHorizontal,
  Trash2,
  TriangleAlert,
  UserMinus,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { ToastContainer, toast, type ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export type RosterActionKey = 'create' | 'delete' | 'info' | 'remove' | 'more';

export type RosterAction = {
  key: RosterActionKey;
  label: string;
  description?: string;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
};

const defaultActions: RosterAction[] = [
  {
    key: 'create',
    label: 'Create Roster',
    description: 'Start a fresh creator list.',
  },
  {
    key: 'info',
    label: 'Roster Info',
    description: 'Review roster details and stats.',
  },
  {
    key: 'remove',
    label: 'Remove Creator',
    description: 'Remove selected creators quickly.',
  },
  {
    key: 'delete',
    label: 'Delete Roster',
    description: 'Permanently delete this roster.',
    destructive: true,
  },
  {
    key: 'more',
    label: 'More Actions',
    description: 'Extra tools for your roster.',
  },
];

const iconMap = {
  create: ListPlus,
  delete: Trash2,
  info: Info,
  remove: UserMinus,
  more: MoreHorizontal,
} as const;

function getButtonClasses(action: RosterAction, isActive: boolean) {
  if (action.destructive) {
    return isActive
      ? 'border-[#f3b7b7] bg-[#fff1f1] text-[#b42318] shadow-[0_14px_24px_rgba(180,35,24,0.10)]'
      : 'border-[#f6d2d2] bg-white text-[#b42318] hover:bg-[#fff5f5]';
  }

  return isActive
    ? 'border-[#bfd0ff] bg-[linear-gradient(180deg,#eff4ff_0%,#e0ebff_100%)] text-[#1438c8] shadow-[0_16px_28px_rgba(20,56,200,0.14)]'
    : 'border-[#d8e2fb] bg-white text-[#2447bd] hover:border-[#bfd0ff] hover:bg-[#f7faff]';
}

type ProjectToastType = 'success' | 'error' | 'info';

const toastThemeMap: Record<ProjectToastType, {
  icon: LucideIcon;
  iconWrap: string;
  title: string;
  card: string;
}> = {
  success: {
    icon: CheckCircle2,
    iconWrap: 'bg-[#e9f8ef] text-[#067647]',
    title: 'Success',
    card: 'border-[#cfead9] bg-[linear-gradient(180deg,#f4fff8_0%,#ffffff_100%)]',
  },
  error: {
    icon: TriangleAlert,
    iconWrap: 'bg-[#fff0f0] text-[#b42318]',
    title: 'Something went wrong',
    card: 'border-[#f1c9c9] bg-[linear-gradient(180deg,#fff7f7_0%,#ffffff_100%)]',
  },
  info: {
    icon: Info,
    iconWrap: 'bg-[#edf3ff] text-[#2447bd]',
    title: 'Heads up',
    card: 'border-[#d5e1ff] bg-[linear-gradient(180deg,#f6f9ff_0%,#ffffff_100%)]',
  },
};

const toastBaseOptions: ToastOptions = {
  position: 'top-right',
  autoClose: 2600,
  hideProgressBar: true,
  closeButton: false,
  pauseOnHover: true,
  draggable: false,
};

export function showProjectToast(type: ProjectToastType, message: string, description?: string) {
  const theme = toastThemeMap[type];
  const Icon = theme.icon;

  toast(
    <div className={`flex items-start gap-3 rounded-[18px] border px-4 py-3 shadow-[0_18px_36px_rgba(41,64,132,0.12)] ${theme.card}`}>
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-[12px] ${theme.iconWrap}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm font-black text-[#17327c]">{message || theme.title}</p>
        {description ? <p className="mt-1 text-xs font-semibold leading-relaxed text-[#6b7a99]">{description}</p> : null}
      </div>
    </div>,
    toastBaseOptions,
  );
}

export function ProjectToastContainer() {
  return (
    <ToastContainer
      aria-label="Notifications"
      position="top-right"
      autoClose={2600}
      newestOnTop
      closeButton={false}
      hideProgressBar
      draggable={false}
      pauseOnHover
      toastClassName={() => 'bg-transparent p-0 shadow-none'}
      // bodyClassName={() => 'p-0'}
    />
  );
}

export const HtmlRoster = ({
  title = 'Roster Actions',
  subtitle = 'Manage creator groups with quick actions and polished blue controls.',
  selectedCount = 0,
  actions = defaultActions,
}: {
  title?: string;
  subtitle?: string;
  selectedCount?: number;
  actions?: RosterAction[];
}) => {
  const [activeAction, setActiveAction] = useState<RosterActionKey | null>('create');

  const actionSummary = useMemo(() => {
    if (selectedCount <= 0) return 'No creators selected';
    if (selectedCount === 1) return '1 creator selected';
    return `${selectedCount} creators selected`;
  }, [selectedCount]);

  return (
    <section className="overflow-hidden rounded-[22px] border border-[#d9e3fb] bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_36%)] shadow-[0_18px_44px_rgba(41,64,132,0.08)]">
      <div className="flex flex-col gap-4 border-b border-[#e5ecfb] px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#eaf1ff] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#3659d7]">
            <Users className="h-3.5 w-3.5" />
            Creator Roster
          </div>
          <h2 className="mt-3 text-2xl font-black text-[#17327c]">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-[#6b7a99]">{subtitle}</p>
        </div>
        <div className="rounded-[16px] border border-[#dbe6ff] bg-white/90 px-4 py-3 text-right shadow-[0_10px_24px_rgba(53,92,214,0.08)]">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#7f92bf]">Selection</p>
          <p className="mt-1 text-sm font-black text-[#17327c]">{actionSummary}</p>
        </div>
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-5">
        {actions.map((action) => {
          const Icon = iconMap[action.key];
          const isActive = activeAction === action.key;

          return (
            <button
              key={action.key}
              type="button"
              onClick={() => {
                setActiveAction(action.key);
                action.onClick?.();
              }}
              disabled={action.disabled}
              className={`group rounded-[18px] border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-55 ${getButtonClasses(action, isActive)}`}
            >
              <span className={`grid h-11 w-11 place-items-center rounded-[14px] ${action.destructive ? 'bg-[#fff1f1] text-[#b42318]' : 'bg-[#e9f1ff] text-[#2447bd]'}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="mt-4">
                <p className="text-sm font-black">{action.label}</p>
                <p className={`mt-1 text-xs font-semibold leading-relaxed ${action.destructive ? 'text-[#b25d5d]' : 'text-[#6f7f9f]'}`}>
                  {action.description || 'Action ready for this roster.'}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
