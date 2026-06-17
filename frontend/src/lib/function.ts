import { sendOtp } from "./authApi";
import type { CreatorRegisterForm, VerificationState } from "../types";

type FormButtonOptions = {
    step: number;
    totalSteps: number;
    form: CreatorRegisterForm;
    setStep: (updater: (current: number) => number) => void;
    setVerificationStatus: (patch: Partial<VerificationState>) => void;
};

export const formButton = async ({
    step,
    totalSteps,
    form,
    setStep,
    setVerificationStatus,
    submitCreatorRegistration
}: FormButtonOptions) => {
    const goNext = () => {
        setStep((current) => Math.min(totalSteps, current + 1));
    };

    const sendEmailOtp = async () => {
        setVerificationStatus({ isSendingEmail: true, error: "", message: "" });
        try {
            const email = form.email.trim();
            // await sendOtp("EMAIL", email);
            setVerificationStatus({
                emailSent: true,
                emailVerified: false,
                message: "Email OTP sent.",
            });
        } catch (error) {
            setVerificationStatus({ error: error instanceof Error ? error.message : "Could not send email OTP." });
        } finally {
            setVerificationStatus({ isSendingEmail: false });
        }
    };

    const sendPhoneOtp = async () => {
        setVerificationStatus({ isSendingPhone: true, error: "", message: "" });
        try {
            const phoneNumber = form.phone_no;
            // await sendOtp("PHONE", phoneNumber);
            setVerificationStatus({ phoneOtpSent: true, phoneVerified: false, message: "Phone OTP sent." });
        } catch (error) {
            setVerificationStatus({ error: error instanceof Error ? error.message : "Could not send phone OTP." });
        } finally {
            setVerificationStatus({ isSendingPhone: false });
        }
    };

    switch (step) {
        case 1:
            await sendEmailOtp();
            await sendPhoneOtp();
            goNext();
            break;

        case 2:
            goNext();
            break;

        case 3:
            goNext();
            break;

        case 4:
            goNext();
            break;

        case 5:
            goNext();
            break;

        case 6:
            submitCreatorRegistration();
            break;

        default:
            break;
    }
};
