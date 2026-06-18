import { sendOtp } from "./authApi";
import type { CreatorRegisterForm, VerificationState } from "../types";

type FormButtonOptions = {
    step: number;
    totalSteps: number;
    form: CreatorRegisterForm;
    verification: VerificationState;
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
    verification,
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
            return true;
        } catch (error) {
            setVerificationStatus({ error: error instanceof Error ? error.message : fallbackError });
            return false;
        } finally {
            setVerificationStatus({ [loadingKey]: false });
        }
    };

    if (step === 1) {
        const emailSent = await sendContactOtp(
            "EMAIL",
            form.email.trim(),
            "isSendingEmail",
            { emailSent: true, emailVerified: false, message: "Email OTP sent." },
            "Could not send email OTP.",
        );
        // const phoneSent = await sendContactOtp(
        //     "PHONE",
        //     normalizePhoneNumber(form.phone_no),
        //     "isSendingPhone",
        //     { phoneOtpSent: true, phoneVerified: false, message: "Phone OTP sent." },
        //     "Could not send phone OTP.",
        // );
        if (!emailSent) return;
        goNext();
        return;
    }

    if (step === 2) {
        const missing: string[] = [];
        if (!verification.emailVerified) missing.push("Email OTP is not verified.");
        // if (!verification.phoneVerified) missing.push("Phone OTP is not verified.");

        if (missing.length) {
            setVerificationStatus({ error: missing.join(" "), message: "" });
            return;
        }
        goNext();
        return;
    }

    if (step >= totalSteps) {
        await submitCreatorRegistration();
        return;
    }

    goNext();
};
