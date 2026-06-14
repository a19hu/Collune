import type { ChangeEventHandler, ReactNode } from "react";

type HtmlInputProps = {
    divClass?: string;
    ID?: string;
    placeholder?: string;
    labelClass?: string;
    inputClass?: string;
    label: string;
    value?: string | number;
    onChange?: ChangeEventHandler<HTMLInputElement>;
    type?: string;
    required?: boolean;
    max?: number | string;
    maxLength?: number;
    children?: ReactNode;
    pattern?: string;
    accept?: string;
    trailing?: ReactNode;
    icon?:ReactNode;
};

const HtmlInput = ({
    divClass = "block",
    labelClass,
    inputClass,
    label,
    value,
    onChange,
    type = "text",
    ID,
    placeholder,
    required = false,
    max,
    maxLength,
    children,
    pattern,
    accept,
    trailing,
    icon
}: HtmlInputProps) => {
    return (
        <label className={divClass}>
            <span className={labelClass}>{label}</span>
            <span className="relative block">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71809a]">{icon}</span>
                <input
                    id={ID}
                    required={required}
                    type={type}
                    value={value}
                    onChange={onChange}
                    className={inputClass}
                    placeholder={placeholder}
                    max={max}
                    maxLength={maxLength}
                    pattern={pattern}
                    accept={accept}
                />
                {trailing ? (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#71809a]">{trailing}</span>
                ) : null}
            </span>

            {children}
        </label>
    );
}


export default HtmlInput;
