import type { ChangeEventHandler, ReactNode } from "react";
import { useSchoolClassOptions } from "../hooks/useSchoolClassOptions";
import { ChevronDown } from "lucide-react";

type HtmlSelectProps = {
    divClass?: string;
    ID?: string;
    labelClass?: string;
    inputClass?: string;
    label: string;
    value?: string | number;
    onChange: ChangeEventHandler<HTMLSelectElement>;
    required?: boolean;
    children?: ReactNode;
};

const HtmlSelect = ({
    divClass,
    labelClass,
    inputClass,
    label,
    value,
    onChange,
    ID,
    required = false,
    children,
}: HtmlSelectProps) => {
    return (
        <div className={divClass}>
            <label className={labelClass}>{label}</label>
            <select
                id={ID}
                required={required}
                value={value}
                onChange={onChange}
                className={inputClass}
            >
                {children}
            </select>
        </div>
    );
}


export default HtmlSelect;

type ClassFilter = {
    value: string;
    onChange: ChangeEventHandler<HTMLSelectElement>;
    id: string;
    selectClassName: string;
    label?:string
}

export const ClassFilter = (
    {
        value,
        onChange,
        id,
        selectClassName,
        label
    }: ClassFilter) => {
    const { classOptions } = useSchoolClassOptions();

    return (
        <>
            <div className="space-y-0.5">
                <label className="space-y-1 block">
                    <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">{label}</span>
                </label>
                <select
                    id={id}
                    value={value}
                    onChange={onChange}
                    className={selectClassName}
                >
                    <option value="All">All Class</option>
                    {classOptions.map((className) => (
                        <option key={className} value={className}>{className}</option>
                    ))}
                </select>
            </div>
        </>
    )
}


export const BrandSelect =({
  label,
  icon,
  placeholder,
  labelClass,
  inputClass,
  children
}: {
  label: string;
  icon: ReactNode;
  placeholder: string;
  labelClass:string;
  inputClass:string;
  children:ReactNode;
})=>{

  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <span className="relative block">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71809a]">{icon}</span>
        <select className={`${inputClass} appearance-none text-[#95a3ba]`} defaultValue="">
          <option value="" disabled>{placeholder}</option>
            {children}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#71809a]" />
      </span>
    </label>
  );
}