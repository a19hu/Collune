import { sendOtp } from "./authApi";
import type { CreatorRegisterForm, VerificationState } from "../types";

type FormButtonOptions = {
    step: number;
    totalSteps: number;
    form: CreatorRegisterForm;
    setStep: (updater: (current: number) => number) => void;
    setVerificationStatus: (patch: Partial<VerificationState>) => void;
    submitCreatorRegistration: () => Promise<void>;
};

export function normalizePhoneNumber(phone: string) {
    return phone.replace(/[\s()-]/g, "");
}

export const formButton = async ({
    step,
    totalSteps,
    form,
    setStep,
    setVerificationStatus,
    submitCreatorRegistration,
}: FormButtonOptions) => {
    const goNext = () => {
        setStep((current) => Math.min(totalSteps, current + 1));
    };

    const sendContactOtp = async (
        channel: "EMAIL" | "PHONE",
        target: string,
        loadingKey: "isSendingEmail" | "isSendingPhone",
        successPatch: Partial<VerificationState>,
        fallbackError: string,
    ) => {
        setVerificationStatus({ [loadingKey]: true, error: "", message: "" });
        try {
            await sendOtp(channel, target);
            setVerificationStatus(successPatch);
        } catch (error) {
            setVerificationStatus({ error: error instanceof Error ? error.message : fallbackError });
        } finally {
            setVerificationStatus({ [loadingKey]: false });
        }
    };

    if (step === 1) {
        await sendContactOtp(
            "EMAIL",
            form.email.trim(),
            "isSendingEmail",
            { emailSent: true, emailVerified: false, message: "Email OTP sent." },
            "Could not send email OTP.",
        );
        // await sendContactOtp(
        //     "PHONE",
        //     normalizePhoneNumber(form.phone_no),
        //     "isSendingPhone",
        //     { phoneOtpSent: true, phoneVerified: false, message: "Phone OTP sent." },
        //     "Could not send phone OTP.",
        // );
        goNext();
        return;
    }

    if (step >= totalSteps) {
        await submitCreatorRegistration();
        return;
    }

    goNext();
};
