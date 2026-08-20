
export const HtmlProgess = ({ step, totalSteps = 3, divClassName }: { step: number; totalSteps?: number, divClassName?: string }) => {
    const helper = step === 5 ? "Almost there! Just a few more details." : "Let's get started with the basics.";
    const shouldCenterDots = divClassName?.includes("text-center");

    return (
        <>
            <div className={divClassName}>
                <p className="text-sm font-black text-[#4462ff]">Step {step} of {totalSteps}</p>
                <div className={`mt-3 flex gap-2 ${shouldCenterDots ? "justify-center" : ""}`}>
                    {Array.from({ length: totalSteps }, (_, index) => (
                        <span
                            key={index}
                            className={`h-3 w-3 rounded-full  ${index + 1 <= step ? "bg-[#4462ff]" : "bg-[#dfe5f0]"}`}
                        />
                    ))}
                </div>
                {step < 6 ? <p className="mt-4 text-sm font-medium text-[#7c879d]">{helper}</p> : null}
            </div>
        </>
    )
};
