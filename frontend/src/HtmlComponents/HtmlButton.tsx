import { ArrowRight } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode,ChangeEventHandler } from "react";

type HtmlButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    children?: ReactNode;
    variant?: string;
    buttonName:string;
    onClick:ChangeEventHandler<HTMLInputElement>;

};

const HtmlButton = ({ 
    children,
    buttonName,
    variant="primary",
    ...props
}: HtmlButtonProps) => {
    return (
        <button 
        type="button"
        {...props}
        
        className={`inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full px-7 text-sm font-black transition hover:-translate-y-0.5 ${
        variant === "primary"
          ? "bg-[#174bd2] text-white shadow-[0_14px_24px_rgba(27,71,207,0.22)]"
          : "border border-[#dbe5ff] bg-white text-[#174bc6] shadow-[0_12px_26px_rgba(75,103,191,0.12)]"
      } ${props.className ?? ""}`}
        >
            {children ?? buttonName}
      <ArrowRight className="h-4 w-4" />

        </button>
    );
};

export default HtmlButton;
