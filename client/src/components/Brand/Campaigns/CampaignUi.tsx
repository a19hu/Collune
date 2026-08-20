import type { ChangeEventHandler, ReactNode } from "react";
import { ChevronDown, UploadCloud } from "lucide-react";

export function CampaignPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-[#e5ebf3] bg-white ${className}`}>
      {children}
    </section>
  );
}

export function CampaignSection({
  index,
  title,
  copy,
  children,
}: {
  index: number;
  title: string;
  copy: string;
  children: ReactNode;
}) {
  return (
    <CampaignPanel className="p-6">
      <div className="flex items-start gap-4">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#4b22ff] text-sm font-black text-white">
          {index}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-black text-[#1c2333]">{title}</h2>
          <p className="mt-1 text-sm font-medium text-[#8793a8]">{copy}</p>
          <div className="mt-7">{children}</div>
        </div>
      </div>
    </CampaignPanel>
  );
}

export function FieldLabel({ children, required = false }: { children: ReactNode; required?: boolean }) {
  return (
    <span className="mb-2 block text-sm font-black text-[#475166]">
      {children} {required ? <span className="text-[#e34848]">*</span> : null}
    </span>
  );
}

export function TextInput({
  label,
  placeholder,
  required,
  prefix,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  placeholder: string;
  required?: boolean;
  prefix?: string;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  type?: string;
}) {
  return (
    <label className="block">
      <FieldLabel required={required}>{label}</FieldLabel>
      <span className="relative block">
        {prefix ? <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-[#7890ad]">{prefix}</span> : null}
        <input
          value={value}
          onChange={onChange}
          type={type}
          placeholder={placeholder}
          className={`h-11 w-full rounded-lg border border-[#dce5f2] bg-white ${prefix ? "pl-9" : "px-4"} text-sm font-medium text-[#1c2333] outline-none placeholder:text-[#a8b4c5] focus:border-[#4b22ff] focus:ring-4 focus:ring-[#4b22ff]/10`}
        />
      </span>
    </label>
  );
}

export function TextArea({
  label,
  placeholder,
  required,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  required?: boolean;
  value?: string;
  onChange?: ChangeEventHandler<HTMLTextAreaElement>;
}) {
  return (
    <label className="block">
      <FieldLabel required={required}>{label}</FieldLabel>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={500}
        className="h-[132px] w-full resize-none rounded-lg border border-[#dce5f2] bg-white px-4 py-3 text-sm font-medium text-[#1c2333] outline-none placeholder:text-[#a8b4c5] focus:border-[#4b22ff] focus:ring-4 focus:ring-[#4b22ff]/10"
      />
      <span className="mt-1 block text-right text-xs font-medium text-[#8a98ad]">0/500</span>
    </label>
  );
}

export function SelectInput({
  label,
  placeholder,
  required,
  value,
  onChange,
  options = [],
}: {
  label: string;
  placeholder: string;
  required?: boolean;
  value?: string;
  onChange?: ChangeEventHandler<HTMLSelectElement>;
  options?: string[];
}) {
  return (
    <label className="block">
      <FieldLabel required={required}>{label}</FieldLabel>
      <span className="relative block">
        <select
          value={value}
          onChange={onChange}
          className="h-11 w-full appearance-none rounded-lg border border-[#dce5f2] bg-[#f1f3f6] px-4 text-sm font-semibold text-[#8090a7] outline-none"
        >
          <option value="">{placeholder}</option>
          {options.map((option) => <option key={option}>{option}</option>)}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8090a7]" />
      </span>
    </label>
  );
}

export function UploadBox({
  label,
  accept,
  fileName,
  helpText,
  onChange,
}: {
  label: string;
  accept?: string;
  fileName?: string;
  helpText?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <span className="grid h-[132px] place-items-center rounded-lg border border-dashed border-[#b8c8de] text-center">
        <span className="text-sm font-semibold text-[#8a98ad]">
          <UploadCloud className="mx-auto mb-3 h-7 w-7 text-[#4b22ff]" />
          {fileName || "Upload or drag & drop file"}
          {helpText ? <span className="mt-2 block text-xs font-medium text-[#9aa6b7]">{helpText}</span> : null}
        </span>
      </span>
      <input type="file" accept={accept} onChange={onChange} className="sr-only" />
    </label>
  );
}
