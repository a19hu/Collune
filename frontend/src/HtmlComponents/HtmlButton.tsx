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

export function HeaderButton({ children, onClick, variant = "solid" }: { children: ReactNode; onClick: () => void; variant?: "solid" | "outline" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-12 items-center gap-3 rounded-lg px-7 text-sm font-black ${variant === "solid"
        ? "bg-[#173ca8] text-white shadow-[0_8px_14px_rgba(23,60,168,0.22)]"
        : "border-2 border-[#173ca8] bg-white text-[#173ca8]"
        }`}
    >
      {children}
    </button>
  );
}