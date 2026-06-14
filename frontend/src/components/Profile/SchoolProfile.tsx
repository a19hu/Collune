import { getSchoolProfile, type SchoolProfileResponse } from "@/src/lib/authApi";
import { getSchoolTypeByCode } from "@/src/lib/schoolTypes";
import React, { useEffect, useState } from "react";

const SchoolProfile: React.FC = () => {
    const [profile, setProfile] = useState<SchoolProfileResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        getSchoolProfile()
            .then((response) => {
                if (isMounted) setProfile(response);
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    if (isLoading) return <div className="text-sm text-slate-500">Loading school profile...</div>;

    const schoolType = getSchoolTypeByCode(profile?.school.school_type || profile?.school.settings?.school_type_code);
    const schoolTypeName = schoolType.name;
    const schoolTypeClasses = schoolType.classes;

    return (
        <div className="space-y-6 animate-fade-in text-left">
            <div>
                <span className="text-[10px] font-bold text-indigo-600 font-mono uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded">School Profile</span>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">{profile?.school.school_name || "School Profile"}</h1>
                <p className="text-slate-500 text-xs">Registered campus, address, domain, and operational status.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <Info label="School Code" value={profile?.school.short_name} />
                    <Info label="Email" value={profile?.school.email} />
                    <Info label="Phone" value={profile?.school.phone_no} />
                    <Info label="Established Year" value={profile?.school.established_year} />
                    <Info label="School Type" value={schoolTypeName || profile?.school.campus_type} />
                    <Info label="Allowed Classes" value={schoolTypeClasses} />
                    <Info label="Status" value={profile?.school.status} />
                    <Info label="Domain" value={profile?.domain?.full_domain} />
                    <Info label="City" value={profile?.address?.city} />
                    <Info label="Address" value={profile?.address?.full_address} />
                </div>
            </div>
        </div>
    );
}

const Info = ({ label, value }: { label: string; value?: string | number | null }) => (
    <div className="p-4 bg-slate-50 rounded-xl">
        <div className="text-slate-400 font-mono uppercase text-[9px]">{label}</div>
        <div className="font-bold text-slate-900 mt-1 break-words">{value || "N/A"}</div>
    </div>
);

export default SchoolProfile;
