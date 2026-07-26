import type { ReactNode } from 'react'
import logo from "../../assets/Logo.svg";
import { BarChart3, Lock, BriefcaseBusiness, Building2, Check, CheckCircle, FileText, ImageIcon, Instagram, Linkedin, MessageCircle, ShieldCheck, Star, TrendingUp, User, Users, X, Youtube } from 'lucide-react';

import creator1 from "../../assets/collune/hero-creator-1.png";
import creator2 from "../../assets/collune/hero-creator-2.png";
import creator3 from "../../assets/collune/hero-creator-4.png";
import heroCreator from "../../assets/collune/hero-creator-5.jpg";
import socialCreator from "../../assets/collune/hero-creator-6.jpg";
import handshakeImage from "../../assets/collune/creator-2.png";
import creatorregi1 from "../../assets/collune/creatorregi1.png"
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

function CompanyPanel() {
    return (
        <div className="relative mx-auto mt-12 h-[255px] w-[505px] max-w-full rounded-2xl bg-[#f0edff] p-8 shadow-lg">
            <div className="absolute left-5 top-9 -rotate-12 rounded-lg bg-[#4965f4] p-6 text-white shadow-xl">
                <BriefcaseBusiness className="h-10 w-10" />
            </div>
            <div className="mx-auto w-52 rounded-lg bg-white p-5 shadow-xl">
                <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-lg bg-[#4965f4] text-white"><FileText className="h-7 w-7" /></span>
                    <h3 className="font-black">Acme Labs</h3>
                </div>
                <div className="mt-4 h-2 rounded bg-[#dfe4ed]" />
                <div className="mt-3 h-2 w-32 rounded bg-[#dfe4ed]" />
            </div>
            <div className="absolute bottom-10 left-36 flex gap-2">
                {[creator3, creator2, creator1].map((image) => <img key={image} src={image} alt="" className="h-8 w-8 rounded-full object-cover" />)}
            </div>
            <div className="absolute bottom-9 left-36 translate-y-10 flex gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-md bg-[#ff426d] text-white">◎</span>
                <span className="grid h-8 w-8 place-items-center rounded-md bg-red-600 text-white">▶</span>
                <span className="grid h-8 w-8 place-items-center rounded-md bg-[#116bc1] text-white">in</span>
            </div>
            <div className="absolute right-7 top-4 rounded-lg bg-white p-4 shadow-lg">
                <BarChart3 className="h-12 w-12 text-[#4965f4]" />
            </div>
        </div>
    );
}
function MegaphoneIcon() {
    return <span className="text-[#443bff]">▸</span>;
}


function BrandCardArtwork({ final = false }: { final?: boolean }) {
    if (final) {
        return (
            <div className="relative mx-auto mt-12 h-[250px] w-[420px] max-w-full">
                <div className="absolute left-0 top-4 w-[405px] max-w-full rounded-xl bg-white p-6 shadow-[0_16px_35px_rgba(24,34,65,0.12)]">
                    <div className="flex items-center gap-4">
                        <span className="grid h-14 w-14 place-items-center rounded-full bg-[#4b22f4] text-white">
                            <Building2 className="h-7 w-7" />
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-black">Acme Labs</h3>
                                <span className="rounded bg-[#c9f5df] px-2 py-1 text-xs font-black text-[#00a875]">✓ Verified</span>
                            </div>
                            <div className="mt-3 h-2 w-28 rounded-full bg-[#dfe3ea]" />
                            <div className="mt-3 h-2 w-20 rounded-full bg-[#dfe3ea]" />
                        </div>
                    </div>
                    <div className="mt-6 grid grid-cols-[1fr_60px_60px] gap-4">
                        <div className="rounded-lg border border-[#dfe4ed] p-3">
                            <div className="flex items-center gap-2 text-xs font-black text-[#202337]">
                                <MegaphoneIcon />
                                Campaign Created
                            </div>
                            <div className="mt-3 h-1.5 rounded-full bg-[#dfe4ed]">
                                <div className="h-full w-[78%] rounded-full bg-[#12c889]" />
                            </div>
                            <CheckCircle className="ml-auto mt-2 h-5 w-5 fill-[#16b989] text-white" />
                        </div>
                        {[creator3, creator2].map((image, index) => (
                            <div key={image} className="rounded-lg border border-[#dfe4ed] p-2 text-center">
                                <img src={image} alt="" className="mx-auto h-10 w-10 rounded-lg object-cover" />
                                <p className="mt-2 text-xs font-black text-[#443bff]">{index === 0 ? "120K" : "85K"}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <span className="absolute right-3 top-0 grid h-11 w-11 place-items-center rounded-full bg-[#16bf92] text-white">
                    <Check className="h-7 w-7" />
                </span>
            </div>
        );
    }

    return (
        <div className="relative mx-auto mt-12 h-[330px] w-[520px] max-w-full">
        </div>
    );
}

function LeftPane({ step }: { step: number }) {
    if (step === 2) {
        return (
            <>
                <p className="mt-12 text-sm font-black text-[#4462ff]">Step 2 of 3</p>
                <h1 className="mt-6 max-w-lg text-[44px] font-black leading-tight tracking-normal text-[#202337]">
                    Tell us about <span className="block text-[#4965f4]">your company</span>
                </h1>
                <p className="mt-5 max-w-lg text-base font-medium leading-relaxed text-[#65758f]">
                    This helps creators learn about your brand and builds trust in every collaboration.
                </p>
                <CompanyPanel />
            </>
        );
    }

    if (step === 3) {
        return (
            <>
                <h1 className="mt-16 max-w-lg text-[44px] font-black leading-tight tracking-normal text-black">
                    You're all set!
                    <span className="block text-[#4b22f4]">Let's get you started.</span>
                </h1>
                <p className="mt-7 max-w-md text-base font-medium leading-relaxed text-[#65758f]">
                    Your company profile is ready. You can now create campaigns, build shortlists, and connect with creators.
                </p>
                <BrandCardArtwork final />
            </>
        );
    }



    return (
        <>
            <h1 className="mt-20 max-w-lg text-[44px] font-black leading-tight tracking-normal text-[#202337]">
                Start building
                <span className="block text-[#4965f4]">creator partnerships</span>
            </h1>
            <p className="mt-7 max-w-lg text-base font-medium leading-relaxed text-[#65758f]">
                Create your account to discover creators, launch campaigns, and build meaningful collaborations.
            </p>
            {/* <BrandCardArtwork /> */}
            <div className="relative mx-auto mt-15 h-[330px] w-[520px] max-w-full">
            <img src={creatorregi1} className="h-[150%]"/>
            </div>
        </>
    );
}

function SideArtwork({ step }: { step: number }) {
    if (step === 2) {
        return (
            <>
                <div className="relative h-[300px] w-[390px] max-w-full">
                    <div className="absolute left-5 top-16 h-40 w-72 rounded-[22px] bg-gradient-to-br from-[#dce4ff] to-[#7f91ff] p-2 shadow-2xl shadow-[#8fa0ff]/20">
                        <div className="grid h-full place-items-center rounded-2xl bg-white">
                            <ShieldCheck className="h-16 w-16 rounded-full bg-[#dce4ff] p-4 text-[#7588ff]" />
                        </div>
                    </div>
                    <div className="absolute right-5 top-28 grid h-48 w-40 place-items-center rounded-[28px] border-4 border-[#7d8cff] bg-white shadow-2xl shadow-[#8fa0ff]/20">
                        <Lock className="h-12 w-12 text-[#7588ff]" />
                        <div className="absolute bottom-16 flex gap-2">
                            {Array.from({ length: 5 }, (_, index) => <span key={index} className="h-2 w-2 rounded-full bg-[#7588ff]" />)}
                        </div>
                    </div>
                    <span className="absolute right-16 top-10 grid h-16 w-16 place-items-center rounded-full bg-[#7588ff] text-white shadow-xl">
                        <Check className="h-8 w-8" />
                    </span>
                </div>
                <h2 className="mt-8 text-[26px] font-black tracking-normal text-[#1438a8]">Your security is our priority</h2>
                <p className="mt-4 max-w-sm text-[15px] font-medium leading-snug text-[#70809d]">We use email and phone verification to keep your account safe.</p>
            </>
        );
    }

    if (step === 3) {
        return (
            <>
                <div className="relative grid h-[340px] w-[390px] max-w-full place-items-center">
                    <div className="absolute h-[300px] w-[300px] rounded-full border-2 border-dashed border-[#d8e2ff]" />
                    <img src={socialCreator} alt="" className="h-64 w-64 rounded-full object-cover" />
                    <span className="absolute left-3 top-[132px] grid h-14 w-14 place-items-center rounded-2xl bg-[#ff0303] text-white shadow-lg"><Youtube className="h-7 w-7 fill-current" /></span>
                    <span className="absolute top-8 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#ff7a3f] to-[#d61d72] text-white shadow-lg"><Instagram className="h-7 w-7" /></span>
                    <span className="absolute right-3 top-[132px] grid h-14 w-14 place-items-center rounded-2xl bg-[#116bc1] text-white shadow-lg"><Linkedin className="h-7 w-7 fill-current" /></span>
                    <span className="absolute bottom-5 grid h-14 w-14 place-items-center rounded-2xl bg-black text-white shadow-lg"><X className="h-7 w-7" /></span>
                </div>
                <h2 className="mt-6 text-[26px] font-black tracking-normal text-[#1438a8]">Connect your social accounts</h2>
                <p className="mt-4 max-w-sm text-[15px] font-medium leading-snug text-[#70809d]">Connect the platforms you create on so brands can discover your work.</p>
            </>
        );
    }

    if (step === 4) {
        return (
            <>
                <div className="relative h-[360px] w-[390px] max-w-full">
                    <div className="absolute left-16 top-10 h-[300px] w-[300px] rounded-full border-2 border-dashed border-[#c8aeff]" />
                    <div className="absolute left-20 top-16 h-28 w-28 rounded-xl bg-white p-5 shadow-lg">
                        <User className="mx-auto h-10 w-10 rounded-full bg-[#e9e4ff] p-2 text-[#7463e9]" />
                        <div className="mx-auto mt-4 h-2 w-20 rounded-full bg-[#e5e1ee]" />
                        <div className="mx-auto mt-3 h-2 w-16 rounded-full bg-[#e5e1ee]" />
                    </div>
                    <div className="absolute left-8 top-56 grid h-24 w-28 place-items-center rounded-xl bg-[#cbb8ff] text-[#7463e9] shadow-lg"><ImageIcon className="h-10 w-10" /></div>
                    <div className="absolute right-8 top-28 grid h-28 w-32 place-items-center rounded-xl bg-white shadow-lg">
                        <span className="grid h-16 w-20 place-items-center rounded-md bg-[#ebe6ff]"><span className="h-12 w-12 rounded-full bg-[#715ce8]" /></span>
                    </div>
                    <div className="absolute bottom-8 right-16 flex h-16 w-24 items-center justify-center rounded-xl bg-white shadow-lg">
                        {[0, 1, 2].map((item) => <User key={item} className="-ml-1 h-8 w-8 rounded-full bg-[#eee9ff] p-1.5 text-[#7463e9] first:ml-0" />)}
                    </div>
                    <span className="absolute left-48 top-7 grid h-10 w-10 place-items-center rounded-full bg-[#715ce8] text-white shadow-lg"><Star className="h-5 w-5 fill-current" /></span>
                </div>
                <h2 className="mt-6 text-[26px] font-black tracking-normal text-[#1438a8]">Tell brands who you are</h2>
                <p className="mt-4 max-w-sm text-[15px] font-medium leading-snug text-[#70809d]">A few details help brands discover the right creators.</p>
            </>
        );
    }

    if (step === 5) {
        return (
            <>
                <div className="relative h-[340px] w-[430px] max-w-full">
                    <div className="absolute left-28 top-24 h-40 w-52 rounded-2xl bg-white p-4 shadow-xl">
                        <img src={handshakeImage} alt="" className="h-full w-full rounded-xl object-cover" />
                    </div>
                    <div className="absolute left-14 top-16 h-24 w-24 rounded-full border-4 border-white bg-[#d7f2ff] p-1 shadow-lg">
                        <img src={heroCreator} alt="" className="h-full w-full rounded-full object-cover" />
                    </div>
                    <span className="absolute left-16 top-44 rounded-full bg-[#8172f4] px-4 py-2 text-xs font-black text-white">CREATÄR</span>
                    <span className="absolute right-8 top-16 grid h-24 w-24 place-items-center rounded-full border-4 border-white bg-[#edf1ff] text-[#8172f4] shadow-lg"><Building2 className="h-10 w-10" /></span>
                    <span className="absolute right-6 top-44 rounded-full bg-[#8172f4] px-4 py-2 text-xs font-black text-white">BRAND</span>
                    <span className="absolute left-52 top-8 grid h-12 w-12 place-items-center rounded-full bg-[#8172f4] text-white shadow-lg"><Check className="h-7 w-7" /></span>
                    <Star className="absolute bottom-12 left-52 h-8 w-8 fill-[#ffd55f] text-[#ffb400]" />
                    <div className="absolute bottom-12 left-16 text-sm font-medium text-[#4b5874]">125K+</div>
                    <div className="absolute bottom-12 right-16 text-sm font-medium text-[#4b5874]">Team</div>
                </div>
                <h2 className="mt-6 text-[26px] font-black tracking-normal text-[#1438a8]">Tell brands who you are</h2>
                <p className="mt-4 max-w-sm text-[15px] font-medium leading-snug text-[#70809d]">A few details help brands discover the right creators.</p>
            </>
        );
    }

    return (
        <>
            <img src={heroCreator} alt="Creator smiling" className="mx-auto h-[280px] w-[280px] rounded-full object-cover md:h-[350px] md:w-[350px]" />
            <h2 className="mt-10 text-[26px] font-black tracking-normal text-[#1438a8]">Welcome to Collune!</h2>
            <p className="mt-4 max-w-sm text-[15px] font-medium leading-snug text-[#70809d]">Join thousands of creators and brand building meaningful collaborations.</p>
        </>
    );
}

const Register = ({ children, step, totalSteps = 4 }: RegisterProps) => {
    const isBrandFlow = totalSteps === 4;
    const isFinalStep = step === totalSteps;

    if (isFinalStep && !isBrandFlow) {
        return (
            <main className="min-h-screen bg-[#f4f6fb] p-4 text-[#202337] md:p-10">
                <section className="relative mx-auto min-h-[calc(100vh-80px)] max-w-[1342px] overflow-hidden rounded-xl bg-white px-7 py-8 md:px-12">
                    <Link to="/" aria-label="Collune home" className="absolute left-7 top-8 inline-flex w-max md:left-12">
                        <img src={logo} alt="Collune" className="h-[53px] w-[167px]" />
                    </Link>

                    <div className="flex min-h-[calc(100vh-144px)] items-center justify-center pt-20">
                        {children}
                    </div>
                </section>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#f4f6fb] p-4 text-[#202337] md:p-[30px]">
            <section className={`mx-auto grid min-h-[calc(90vh-60px)] max-w-[1296px] overflow-hidden rounded-[20px] bg-white ${isBrandFlow ? "lg:grid-cols-[0.85fr_1.15fr]" : "lg:grid-cols-[1fr_1fr]"}`}>
                <aside className="flex flex-col px-10 py-11 md:px-14">
                    <Link to="/" aria-label="Collune home" className="inline-flex w-max">
                        <img src={logo} alt="Collune" className="h-[53px] w-[167px]" />
                    </Link>

                    {isBrandFlow ? (
                        <div className="flex flex-1 flex-col">
                            <div className="flex-1">
                                <LeftPane step={step} />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <BottomBenefit icon={<Users className="h-8 w-8" />} label="Access top creators" />
                                <BottomBenefit icon={<MessageCircle className="h-8 w-8" />} label="Run impactful campaigns" />
                                <BottomBenefit icon={<TrendingUp className="h-8 w-8" />} label="Build long-term collaborations" />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-1 flex-col items-center justify-center text-center">
                            <SideArtwork step={step} />
                        </div>
                    )}
                </aside>

                <section className="flex items-center justify-center px-5 py-10 md:px-10">
                    {children}
                </section>
            </section>
        </main>
    );
};

export default Register;
