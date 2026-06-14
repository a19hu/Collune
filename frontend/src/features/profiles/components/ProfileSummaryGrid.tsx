import React from 'react';
import type { UnifiedProfile } from '../../../types';

interface ProfileSummaryGridProps {
  title: string;
  profile: UnifiedProfile;
  extras?: Array<{ label: string; value: string | number }>;
}

export const ProfileSummaryGrid: React.FC<ProfileSummaryGridProps> = ({ title, profile, extras = [] }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
      <h3 className="text-xs font-bold font-mono tracking-widest text-slate-400 uppercase border-b border-slate-50 pb-2">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div><span className="text-slate-400">ID</span><div className="font-bold text-slate-900">{profile.id}</div></div>
        <div><span className="text-slate-400">Name</span><div className="font-bold text-slate-900">{profile.name}</div></div>
        <div><span className="text-slate-400">Status</span><div className="font-bold text-indigo-600">{profile.status || '-'}</div></div>
        <div><span className="text-slate-400">Phone</span><div className="font-bold">{profile.phone || '-'}</div></div>
        <div><span className="text-slate-400">Email</span><div className="font-bold">{profile.email || '-'}</div></div>
        <div><span className="text-slate-400">School Code</span><div className="font-bold">{profile.schoolCode || '-'}</div></div>
        {extras.map((field) => (
          <div key={field.label}><span className="text-slate-400">{field.label}</span><div className="font-bold">{field.value}</div></div>
        ))}
      </div>
    </div>
  );
};
