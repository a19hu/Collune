import { createTeacher } from "@/src/lib/authApi";
import { useSchoolClassOptions } from "@/src/hooks/useSchoolClassOptions";
import { schoolSubjectOptions } from "@/src/lib/schoolTypes";
import { ArrowLeft, Check, ImageUp, Save, X } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type SelectOption = {
  label: string;
  value: string;
};

const toSelectOptions = (options: string[]) => options.map((option) => ({ label: option, value: option }));

const AddTeacher = () => {
  const navigate = useNavigate();
  const { classOptions } = useSchoolClassOptions();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [qualification, setQualification] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [assignedSubjects, setAssignedSubjects] = useState<string[]>([]);
  const [assignedClasses, setAssignedClasses] = useState<string[]>([]);
  const [experience, setExperience] = useState("0");
  const [joinDate, setJoinDate] = useState(new Date().toISOString().slice(0, 10));
  const [salary, setSalary] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");
  const [country, setCountry] = useState("India");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const subjectSelectOptions = toSelectOptions(schoolSubjectOptions);
  const classSelectOptions = toSelectOptions(classOptions);

  useEffect(() => {
    if (!profileImage) {
      setProfileImagePreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(profileImage);
    setProfileImagePreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [profileImage]);

  useEffect(() => {
    setAssignedClasses((currentClasses) => currentClasses.filter((className) => classOptions.includes(className)));
  }, [classOptions]);

  const saveTeacher = async (event: FormEvent) => {
    event.preventDefault();
    const hasAddress = [state, city, pincode, fullAddress].some((value) => value.trim());
    const hasCompleteAddress = [country, state, city, pincode, fullAddress].every((value) => value.trim());

    if (hasAddress && !hasCompleteAddress) {
      setMessage("Please complete all address fields or leave the address blank.");
      return;
    }

    try {
      setIsSaving(true);
      const response = await createTeacher({
        user: { name, email, phone_no: phone },
        qualification,
        specialization,
        assigned_subjects: assignedSubjects,
        assigned_classes: assignedClasses,
        profile_image: profileImage,
        experience,
        join_date: joinDate,
        salary: salary || "0",
        address: hasAddress ? {
          country,
          state,
          city,
          pincode,
          full_address: fullAddress,
        } : undefined,
      });
      setMessage(`Teacher created. Login: ${response.login_username} / ${response.login_password}`);
    } catch (error: any) {
      setMessage(error?.message || "Unable to create teacher.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <button onClick={() => navigate("/admin/teachers")} className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600">
        <ArrowLeft className="w-4 h-4" />
        Back to instructors
      </button>

      <form onSubmit={saveTeacher} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Add New Instructor</h1>
          <p className="text-slate-500 text-xs">Create a teacher account and instructor profile.</p>
        </div>

        {message && <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-xs font-bold text-indigo-700">{message}</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Full Name" value={name} onChange={setName} required />
          <Input label="Email" type="email" value={email} onChange={setEmail} required />
          <Input label="Phone Number" value={phone} onChange={setPhone} />
          <Input label="Qualification" value={qualification} onChange={setQualification} />
          <Input label="Specialization" value={specialization} onChange={setSpecialization} />
          <Input label="Experience Years" type="number" value={experience} onChange={setExperience} />
          <MultiSelect label="Can Teach Subjects" options={subjectSelectOptions} value={assignedSubjects} onChange={setAssignedSubjects} />
          <MultiSelect label="Can Teach Classes" options={classSelectOptions} value={assignedClasses} onChange={setAssignedClasses} />
          <Input label="Join Date" type="date" value={joinDate} onChange={setJoinDate} />
          <Input label="Monthly Salary" type="number" value={salary} onChange={setSalary} />
          <label className="space-y-1 md:col-span-2">
            <span className="text-[10px] font-extrabold text-slate-500 block font-mono uppercase">Profile Image</span>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
                {profileImagePreview ? (
                  <img src={profileImagePreview} alt="Teacher preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageUp className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => setProfileImage(event.target.files?.[0] || null)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs file:mr-3 file:border-0 file:bg-indigo-50 file:text-indigo-700 file:font-bold file:text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </label>
        </div>

        <div className="border-t border-slate-100 pt-5 space-y-4">
          <h2 className="text-xs font-extrabold text-indigo-600 font-mono uppercase tracking-wider">Teacher Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input label="Country" value={country} onChange={setCountry} />
            <Input label="State" value={state} onChange={setState} />
            <Input label="City" value={city} onChange={setCity} />
            <Input label="Pincode" value={pincode} onChange={setPincode} />
            <label className="space-y-1 md:col-span-4">
              <span className="text-[10px] font-extrabold text-slate-500 block font-mono uppercase">Full Address</span>
              <textarea
                rows={3}
                value={fullAddress}
                onChange={(event) => setFullAddress(event.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button type="button" onClick={() => navigate("/admin/teachers")} className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-700">
            Cancel
          </button>
          <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 text-xs font-bold text-white disabled:opacity-60">
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Instructor"}
          </button>
        </div>
      </form>
    </div>
  );
};

const MultiSelect = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: SelectOption[];
}) => {
  const selectedOptions = options.filter((option) => value.includes(option.value));

  const toggleOption = (optionValue: string) => {
    onChange(
      value.includes(optionValue)
        ? value.filter((selectedValue) => selectedValue !== optionValue)
        : [...value, optionValue],
    );
  };

  const removeOption = (optionValue: string) => {
    onChange(value.filter((selectedValue) => selectedValue !== optionValue));
  };

  return (
    <div className="space-y-1">
      <span className="text-[10px] font-extrabold text-slate-500 block font-mono uppercase">{label}</span>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
        <div className="min-h-8 flex flex-wrap gap-1.5 pb-2">
          {selectedOptions.length ? (
            selectedOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => removeOption(option.value)}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-700"
              >
                {option.label}
                <X className="h-3 w-3" />
              </button>
            ))
          ) : (
            <span className="px-1 py-1.5 text-xs font-semibold text-slate-400">Select multiple options</span>
          )}
        </div>
        <div className="max-h-36 overflow-y-auto border-t border-slate-200 pt-2 space-y-1">
          {options.map((option) => {
            const isSelected = value.includes(option.value);

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleOption(option.value)}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-bold transition-colors ${
                  isSelected ? "bg-indigo-600 text-white" : "bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span>{option.label}</span>
                {isSelected && <Check className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Input = ({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) => (
  <label className="space-y-1">
    <span className="text-[10px] font-extrabold text-slate-500 block font-mono uppercase">{label}</span>
    <input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
  </label>
);

export default AddTeacher;
