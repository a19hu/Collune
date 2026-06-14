import { getSchoolProfile, type SchoolProfileResponse } from "@/src/lib/authApi";
import React, { useEffect, useState } from "react";

const PrincipleProfile: React.FC = () => {
    const [profile, setProfile] = useState<SchoolProfileResponse | null>(null);

    useEffect(() => {
        let isMounted = true;
        getSchoolProfile().then((response) => {
            if (isMounted) setProfile(response);
        });

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="space-y-6 animate-fade-in text-left">
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Principal Profile</h1>
                <p className="text-slate-500 text-xs">Primary academic authority and campus contact.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <Info label="Name" value={profile?.principal?.name} />
                <Info label="Phone" value={profile?.principal?.phone} />
                <Info label="Email" value={profile?.principal?.email} />
            </div>
        </div>
    );
}

const Info = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="p-4 bg-slate-50 rounded-xl">
        <div className="text-slate-400 font-mono uppercase text-[9px]">{label}</div>
        <div className="font-bold text-slate-900 mt-1 break-words">{value || "N/A"}</div>
    </div>
);

export default PrincipleProfile;
