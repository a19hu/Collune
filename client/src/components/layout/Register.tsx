import type { ReactNode } from 'react'
import logo from "../../assets/Logo.svg";
import { BarChart3, Lock, BriefcaseBusiness, Building2, Check, CheckCircle, FileText, ImageIcon, Instagram, Linkedin, MessageCircle, ShieldCheck, Star, TrendingUp, User, Users, X, Youtube } from 'lucide-react';

import heroCreator from "../../assets/collune/hero-creator-5.jpg";
import creatorregi1 from "../../assets/collune/creatorregi1.png"
import creatorregi2 from "../../assets/collune/creatorregist2.png"
import creatorregi3 from "../../assets/collune/creatorregi2.png"
import creatorregi4 from "../../assets/collune/creatorregi3.png"
import creatorregist3 from "../../assets/collune/creatorregist3.png"
import creatorregist4 from "../../assets/collune/creatorregist4.png"
import creatorregist5 from "../../assets/collune/creatorregist5.png"
import { Link } from 'react-router-dom';

type RegisterProps = {

    children: ReactNode;
    step: number;
    totalSteps?: number;
}

function BottomBenefit({ icon, label }: { icon: ReactNode; label: string }) {
    return (
        <div className="text-center">
            <div className="mx-auto mb-3 grid h-10 w-10 place-items-center text-[#4462ff]">{icon}</div>
            <p className="text-sm font-medium leading-tight text-[#697995]">{label}</p>
        </div>
    );
}

function LeftPane({ step }: { step: number }) {

    if (step === 2){
        return (
            <>
            <h1 className="mt-8 max-w-lg text-[32px] font-black leading-tight tracking-normal text-[#202337] sm:mt-12 sm:text-[38px] lg:mt-20 lg:text-[44px]">
                Your security is 
                <span className="block text-[#4965f4]">our priority</span>
            </h1>
            <p className="mt-5 max-w-lg text-sm font-medium leading-relaxed text-[#65758f] sm:mt-6 sm:text-base lg:mt-7">
                We use email and phone verification to keep your account safe.
            </p>
            <div className="relative mx-auto mt-8 h-[220px] w-full max-w-[520px] sm:mt-10 sm:h-[280px] lg:mt-12 lg:h-[330px]">
            <img src={creatorregi2} alt="Creator partnership illustration" className="mx-auto h-full w-full object-contain"/>
            </div>
        </>
        )
    }

    if (step === 3) {
        return (
            <>
                <h1 className="mt-5 max-w-lg text-[32px] font-black leading-tight tracking-normal text-[#202337] sm:mt-6 sm:text-[38px] lg:text-[44px]">
                    Tell us about <span className="block text-[#4965f4]">your company</span>
                </h1>
                <p className="mt-4 max-w-lg text-sm font-medium leading-relaxed text-[#65758f] sm:mt-5 sm:text-base">
                    This helps creators learn about your brand and builds trust in every collaboration.
                </p>
                <div className="relative mx-auto mt-8 h-[220px] w-full max-w-[520px] sm:mt-10 sm:h-[280px] lg:mt-12 lg:h-[330px]">
            <img src={creatorregi3} alt="Creator partnership illustration" className="mx-auto h-full w-full object-contain"/>
            </div>
            </>
        );
    }

    if (step === 4) {
        return (
            <>
                <h1 className="mt-8 max-w-lg text-[32px] font-black leading-tight tracking-normal text-black sm:mt-12 sm:text-[38px] lg:mt-16 lg:text-[44px]">
                    You're all set!
                    <span className="block text-[#4b22f4]">Let's get you started.</span>
                </h1>
                <p className="mt-5 max-w-md text-sm font-medium leading-relaxed text-[#65758f] sm:mt-6 sm:text-base lg:mt-7">
                    Your company profile is ready. You can now create campaigns, build shortlists, and connect with creators.
                </p>
                <div className="relative mx-auto mt-8 h-[220px] w-full max-w-[520px] sm:mt-10 sm:h-[280px] lg:mt-12 lg:h-[330px]">
            <img src={creatorregi4} alt="Creator partnership illustration" className="mx-auto h-full w-full object-contain"/>
            </div>
            </>
        );
    }

    return (
        <>
            <h1 className="mt-8 max-w-lg text-[32px] font-black leading-tight tracking-normal text-[#202337] sm:mt-12 sm:text-[38px] lg:mt-20 lg:text-[44px]">
                Start building
                <span className="block text-[#4965f4]">creator partnerships</span>
            </h1>
            <p className="mt-5 max-w-lg text-sm font-medium leading-relaxed text-[#65758f] sm:mt-6 sm:text-base lg:mt-7">
                Create your account to discover creators, launch campaigns, and build meaningful collaborations.
            </p>
            <div className="relative mx-auto mt-8 h-[220px] w-full max-w-[520px] sm:mt-10 sm:h-[280px] lg:mt-12 lg:h-[330px]">
            <img src={creatorregi1} alt="Creator partnership illustration" className="mx-auto h-full w-full object-contain"/>
            </div>
        </>
    );
}

function SideArtwork({ step }: { step: number }) {
    if (step === 2) {
        return (
            <>
            <img src={creatorregi2} alt="Creator smiling" className="mx-auto h-[220px] w-[220px] rounded-full object-cover sm:h-[280px] sm:w-[280px] lg:h-[350px] lg:w-[350px]" />
                <h2 className="mt-6 text-[22px] font-black tracking-normal text-[#1438a8] sm:mt-7 sm:text-[24px] lg:mt-8 lg:text-[26px]">Your security is our priority</h2>
                <p className="mt-3 max-w-sm text-sm font-medium leading-snug text-[#70809d] sm:mt-4 sm:text-[15px]">We use email and phone verification to keep your account safe.</p>
            </>
        );
    }

    if (step === 3) {
        return (
            <>
            <img src={creatorregist3} alt="Creator smiling" className="mx-auto h-[220px] w-[220px] rounded-full object-cover sm:h-[280px] sm:w-[280px] lg:h-[350px] lg:w-[350px]" />

                <h2 className="mt-6 text-[22px] font-black tracking-normal text-[#1438a8] sm:text-[24px] lg:text-[26px]">Connect your social accounts</h2>
                <p className="mt-3 max-w-sm text-sm font-medium leading-snug text-[#70809d] sm:mt-4 sm:text-[15px]">Connect the platforms you create on so brands can discover your work.</p>
            </>
        );
    }

    if (step === 4) {
        return (
            <>
            <img src={creatorregist4} alt="Creator smiling" className="mx-auto h-[220px] w-[220px] rounded-full object-cover sm:h-[280px] sm:w-[280px] lg:h-[350px] lg:w-[350px]" />

                <h2 className="mt-6 text-[26px] font-black tracking-normal text-[#1438a8]">Tell brands who you are</h2>
                <p className="mt-4 max-w-sm text-[15px] font-medium leading-snug text-[#70809d]">A few details help brands discover the right creators.</p>
            </>
        );
    }

    if (step === 5) {
        return (
            <>
            <img src={creatorregist5} alt="Creator smiling" className="mx-auto h-[220px] w-[220px] rounded-full object-cover sm:h-[280px] sm:w-[280px] lg:h-[350px] lg:w-[350px]" />
                <h2 className="mt-6 text-[26px] font-black tracking-normal text-[#1438a8]">Tell brands who you are</h2>
                <p className="mt-4 max-w-sm text-[15px] font-medium leading-snug text-[#70809d]">A few details help brands discover the right creators.</p>
            </>
        );
    }

    return (
        <>
            <img src={heroCreator} alt="Creator smiling" className="mx-auto h-[220px] w-[220px] rounded-full object-cover sm:h-[280px] sm:w-[280px] lg:h-[350px] lg:w-[350px]" />
            <h2 className="mt-8 text-[22px] font-black tracking-normal text-[#1438a8] sm:text-[24px] lg:mt-10 lg:text-[26px]">Welcome to Collune!</h2>
            <p className="mt-3 max-w-sm text-sm font-medium leading-snug text-[#70809d] sm:mt-4 sm:text-[15px]">Join thousands of creators and brand building meaningful collaborations.</p>
        </>
    );
}

const Register = ({ children, step, totalSteps = 4 }: RegisterProps) => {
    const isBrandFlow = totalSteps === 4;
    const isFinalStep = step === totalSteps;

    if (isFinalStep && !isBrandFlow) {
        return (
            <main className="min-h-screen bg-[#f4f6fb] p-3 text-[#202337] sm:p-4 lg:p-10">
                <section className="relative mx-auto min-h-[calc(100vh-24px)] max-w-[1342px] overflow-hidden rounded-xl bg-white px-5 py-6 sm:min-h-[calc(100vh-32px)] sm:px-7 sm:py-8 lg:min-h-[calc(100vh-80px)] lg:px-12">
                    <Link to="/" aria-label="Collune home" className="inline-flex w-max lg:absolute lg:left-12 lg:top-8">
                        <img src={logo} alt="Collune" className="h-[40px] w-auto sm:h-[46px] lg:h-[53px]" />
                    </Link>

                    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center pt-8 sm:pt-10 lg:min-h-[calc(100vh-144px)] lg:pt-20">
                        {children}
                    </div>
                </section>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#f4f6fb] p-3 text-[#202337] sm:p-4 lg:p-[30px]">
            <section className={`mx-auto grid min-h-[calc(90vh-24px)] max-w-[1296px] overflow-hidden rounded-[20px] bg-white ${isBrandFlow ? "xl:grid-cols-[0.85fr_1.15fr]" : "xl:grid-cols-[1fr_1fr]"}`}>
                <aside className="flex flex-col px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10 xl:px-14 xl:py-11">
                    <Link to="/" aria-label="Collune home" className="inline-flex w-max">
                        <img src={logo} alt="Collune" className="h-[40px] w-auto sm:h-[46px] lg:h-[53px]" />
                    </Link>

                    {isBrandFlow ? (
                        <div className="flex flex-1 flex-col">
                            <div className="flex-1">
                                <LeftPane step={step} />
                            </div>
                            <div className="grid grid-cols-1 gap-5 pt-6 sm:grid-cols-3 sm:gap-4 lg:pt-8">
                                <BottomBenefit icon={<Users className="h-8 w-8" />} label="Access top creators" />
                                <BottomBenefit icon={<MessageCircle className="h-8 w-8" />} label="Run impactful campaigns" />
                                <BottomBenefit icon={<TrendingUp className="h-8 w-8" />} label="Build long-term collaborations" />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-1 flex-col items-center justify-center py-4 text-center sm:py-6 lg:py-8">
                            <SideArtwork step={step} />
                        </div>
                    )}
                </aside>

                <section className="flex items-center justify-center border-t border-[#eef2fb] px-4 py-8 sm:px-6 sm:py-10 lg:px-10 xl:border-t-0 xl:border-l">
                    {children}
                </section>
            </section>
        </main>
    );
};

export default Register;