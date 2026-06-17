import type { ChangeEventHandler, ReactNode } from "react";
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



export const BrandSelect =({
  label,
  icon,
  placeholder,
  labelClass,
  inputClass,
  value,
  onChange,
  required = false,
  children
}: {
  label: string;
  icon: ReactNode;
  placeholder: string;
  labelClass:string;
  inputClass:string;
  value?: string;
  onChange?: ChangeEventHandler<HTMLSelectElement>;
  required?: boolean;
  children:ReactNode;
})=>{

  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <span className="relative block">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71809a]">{icon}</span>
        <select
          className={`${inputClass} appearance-none ${value ? "" : "text-[#95a3ba]"}`}
          value={value}
          onChange={onChange}
          required={required}
        >
          <option value="" disabled>{placeholder}</option>
            {children}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#71809a]" />
      </span>
    </label>
  );
}
