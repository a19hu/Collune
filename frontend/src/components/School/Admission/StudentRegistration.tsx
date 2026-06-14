import {
  getClasses,
  registerStudent,
  type ClassApi,
  type InquiryApi,
} from "@/src/lib/authApi";
import { useSchoolClassOptions } from "@/src/hooks/useSchoolClassOptions";
import React from "react";
import { ImageUp, Sparkles, UserPlus } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const makeAdmissionNo = () => `ADM-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
const compactClassCode = (className: string) => className.replace(/[^a-z0-9]/gi, "").toUpperCase() || "CLASS";

type ConversionInquiry = InquiryApi & {
  gender?: InquiryApi["gender"];
};

const toBackendGender = (gender: "Male" | "Female" | "Other"): "MALE" | "FEMALE" | "OTHER" => {
  if (gender === "Female") return "FEMALE";
  if (gender === "Other") return "OTHER";
  return "MALE";
};

const toFrontendGender = (gender: InquiryApi["gender"]): "Male" | "Female" | "Other" => {
  if (gender === "FEMALE") return "Female";
  if (gender === "OTHER") return "Other";
  return "Male";
};

const StudentRegistration = () => {
  const navigate = useNavigate();
  const { classOptions } = useSchoolClassOptions();
  const [classes, setClasses] = useState<ClassApi[]>([]);
  const [conversionInquiry, setConversionInquiry] = useState<ConversionInquiry | null>(null);
  const [message, setMessage] = useState("");
  const [isRegisteringStudent, setIsRegisteringStudent] = useState(false);

  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regGender, setRegGender] = useState<"Male" | "Female" | "Other">("Male");
  const [regDob, setRegDob] = useState("2018-06-15");
  const [regBloodGroup, setRegBloodGroup] = useState("O+");
  const [regNationality, setRegNationality] = useState("Indian");
  const [regReligion, setRegReligion] = useState("");
  const [regClass, setRegClass] = useState("");
  const [regSection, setRegSection] = useState("A");
  const [regFather, setRegFather] = useState("");
  const [regMother, setRegMother] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regCity, setRegCity] = useState("");
  const [regState, setRegState] = useState("");
  const [regPincode, setRegPincode] = useState("");
  const [regCountry, setRegCountry] = useState("India");
  const [regMedicalNotes, setRegMedicalNotes] = useState("");
  const [regPhoto, setRegPhoto] = useState<File | null>(null);
  const [regPhotoPreview, setRegPhotoPreview] = useState("");
  const [academicSession, setAcademicSession] = useState("2026-2027");

  useEffect(() => {
    let isMounted = true;

    getClasses().then((response) => {
      if (!isMounted) return;
      setClasses(response.classes);
      const firstClass = response.classes[0];
      setRegClass((prev) => prev || firstClass?.class_id || classOptions[0] || "Class 1");
      setRegSection(firstClass?.section || "A");
      setAcademicSession(firstClass?.academic_year || "2026-2027");
    });

    const stored = localStorage.getItem("schoolmate:conversionInquiry");
    if (stored) {
      try {
        const inquiry = JSON.parse(stored) as ConversionInquiry;
        setConversionInquiry(inquiry);
        applyConversionInquiry(inquiry);
      } catch {
        localStorage.removeItem("schoolmate:conversionInquiry");
      }
    }

    return () => {
      isMounted = false;
    };
  }, [classOptions]);

  useEffect(() => {
    if (!regPhoto) {
      setRegPhotoPreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(regPhoto);
    setRegPhotoPreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [regPhoto]);

  const allowedClasses = useMemo(
    () => classes.filter((schoolClass) => classOptions.includes(schoolClass.class_name)),
    [classes, classOptions],
  );

  const selectedClass = useMemo(
    () => allowedClasses.find((schoolClass) => schoolClass.class_id === regClass || schoolClass.class_name === regClass),
    [allowedClasses, regClass],
  );

  useEffect(() => {
    const availableClassValues = allowedClasses.length > 0 ? allowedClasses.map((schoolClass) => schoolClass.class_id) : classOptions;
    if (availableClassValues.length > 0 && !availableClassValues.includes(regClass)) {
      setRegClass(availableClassValues[0]);
    }
  }, [allowedClasses, classOptions, regClass]);

  const applyConversionInquiry = (inquiry: ConversionInquiry) => {
    const names = inquiry.student_name.split(" ");
    setRegFirstName(names[0] || "");
    setRegLastName(names.slice(1).join(" ") || "");
    setRegGender(toFrontendGender(inquiry.gender));
    setRegDob(inquiry.dob || "2018-06-15");
    setRegClass(inquiry.grade_interested || "Class 1");
    setRegFather(inquiry.parent_name || "");
    setRegMother(inquiry.mother_name || "");
    setRegPhone(inquiry.phone_no || "");
    setRegEmail(inquiry.email || "");
    setRegAddress(inquiry.message || "Standard Inquiry Conversion Address");
    setAcademicSession(inquiry.academic_session || "2026-2027");
  };

  const clearConversion = () => {
    setConversionInquiry(null);
    localStorage.removeItem("schoolmate:conversionInquiry");
  };

  const resetForm = () => {
    setRegFirstName("");
    setRegLastName("");
    setRegGender("Male");
    setRegDob("2018-06-15");
    setRegBloodGroup("O+");
    setRegNationality("Indian");
    setRegReligion("Hindu");
    setRegFather("");
    setRegMother("");
    setRegPhone("");
    setRegEmail("");
    setRegAddress("");
    setRegMedicalNotes("");
    setRegPhoto(null);
  };

  const finalizeStudentRegistration = async (event: FormEvent) => {
    event.preventDefault();
    if (!regFirstName || !regLastName || !regPhone || !regEmail) {
      setMessage("Registration requires first name, last name, parent phone number, and email.");
      return;
    }

    try {
      setIsRegisteringStudent(true);
      const admissionNo = makeAdmissionNo();
      const rollNo = `${compactClassCode(selectedClass?.class_name || regClass)}-${regSection}-${Date.now().toString().slice(-5)}`;
      const inquiryId = conversionInquiry && uuidPattern.test(conversionInquiry.inquiry_id) ? conversionInquiry.inquiry_id : undefined;

      const response = await registerStudent({
        student: {
          first_name: regFirstName,
          last_name: regLastName,
          email: regEmail,
          phone_no: regPhone,
        },
        admission_no: admissionNo,
        roll_no: rollNo,
        class_id: selectedClass?.class_id || regClass,
        applied_for_class: selectedClass?.class_name || regClass,
        academic_year: selectedClass?.academic_year || academicSession,
        inquiry_id: inquiryId,
        admission_type: inquiryId ? "INQUIRY_THEN_REGISTRATION" : "DIRECT_REGISTRATION",
        admission_status: "REGISTERED",
        gender: toBackendGender(regGender),
        dob: regDob,
        blood_group: regBloodGroup,
        nationality: regNationality,
        religion: regReligion,
        photo: regPhoto,
        medical_notes: regMedicalNotes,
        remarks: regMedicalNotes,
        address: regAddress ? {
          address_line1: regAddress,
          city: regCity,
          state: regState,
          country: regCountry,
          pincode: regPincode,
        } : undefined,
        guardians: [
          ...(regFather ? [{ name: regFather, relation: "Father", phone_no: regPhone }] : []),
          ...(regMother ? [{ name: regMother, relation: "Mother", phone_no: regPhone }] : []),
        ],
        enrollment: {
          class_id: selectedClass?.class_id || regClass,
          section_id: regSection,
          academic_year: selectedClass?.academic_year || academicSession,
          roll_no: rollNo,
          admission_no: admissionNo,
          status: true,
        },
      });

      setMessage(`Registration completed for ${response.student.first_name} ${response.student.last_name}. Admission number: ${response.student.admission_no}. Login: ${response.login_username}`);
      clearConversion();
      resetForm();
      navigate(`/admin/admissions/students_registration_fee/${response.student.first_name}`);
    } catch (error: any) {
      setMessage(error?.message || "Unable to register student.");
    } finally {
      setIsRegisteringStudent(false);
    }
  };

  return (
    <form onSubmit={finalizeStudentRegistration} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm text-left animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4 mb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Registration & Admissions Form</h1>
          <p className="text-slate-500 text-xs mt-0.5">Formal onboarding wizard to initialize student academic catalog files.</p>
        </div>
        {conversionInquiry && (
          <div className="bg-emerald-50 border border-emerald-100 p-2 py-1 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Auto-fill mode from Inquiry: {conversionInquiry.inquiry_id}</span>
            <button type="button" onClick={clearConversion} className="p-0.5 bg-emerald-200 rounded text-emerald-800 hover:bg-emerald-300 ml-2">
              Clear fill
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Section title="Candidate Core Profile">
          <Input label="First Name" value={regFirstName} onChange={setRegFirstName} placeholder="Student First Name" />
          <Input label="Last Name" value={regLastName} onChange={setRegLastName} placeholder="Student Family Name" />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Gender" value={regGender} onChange={(value) => setRegGender(value as typeof regGender)} options={["Male", "Female", "Other"]} />
            <Select label="Blood Group" value={regBloodGroup} onChange={setRegBloodGroup} options={["O+", "A+", "B+", "AB+", "O-"]} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nationality" value={regNationality} onChange={setRegNationality} />
            <Input label="Religion" value={regReligion} onChange={setRegReligion} />
          </div>
          <Input label="Date of Birth" type="date" value={regDob} onChange={setRegDob} />
          <Input label="Student Email" type="email" value={regEmail} onChange={setRegEmail} placeholder="student@example.com" />
          <label className="space-y-1 block">
            <span className="text-[10px] font-extrabold text-slate-500 block font-mono uppercase">Student Photo</span>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
                {regPhotoPreview ? (
                  <img src={regPhotoPreview} alt="Student preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageUp className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => setRegPhoto(event.target.files?.[0] || null)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs file:mr-3 file:border-0 file:bg-indigo-50 file:text-indigo-700 file:font-bold file:text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </label>
        </Section>

        <Section title="Academic Roster Allocation">
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 block">
              <span className="text-[10px] font-extrabold text-slate-500 block font-mono uppercase">Grade / Std</span>
              <select value={regClass} onChange={(event) => setRegClass(event.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500">
                {allowedClasses.length > 0 ? allowedClasses.map((schoolClass) => (
                  <option key={schoolClass.class_id} value={schoolClass.class_id}>{schoolClass.class_name}</option>
                )) : classOptions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <Select label="Section Unit" value={regSection} onChange={setRegSection} options={["A", "B", "C"]} />
          </div>
          <Input label="Academic Session" value={academicSession} onChange={setAcademicSession} />
          <Input label="Phone Phone" type="tel" value={regPhone} onChange={setRegPhone} placeholder="Contact cell number" />
          <TextArea label="Primary Residential Address" value={regAddress} onChange={setRegAddress} placeholder="Enter full address" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="City" value={regCity} onChange={setRegCity} />
            <Input label="State" value={regState} onChange={setRegState} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Pincode" value={regPincode} onChange={setRegPincode} />
            <Input label="Country" value={regCountry} onChange={setRegCountry} />
          </div>
        </Section>

        <Section title="Family Parents & Medical Rules">
          <Input label="Father Name" value={regFather} onChange={setRegFather} placeholder="Father full name" />
          <Input label="Mother Name" value={regMother} onChange={setRegMother} placeholder="Mother full name" />
          <TextArea label="Student Medical Field" value={regMedicalNotes} onChange={setRegMedicalNotes} placeholder="Allergies, medication, special instructions, or health notes" />
        </Section>
      </div>

      {message && (
        <div className={`rounded-xl px-4 py-3 text-xs font-bold ${message.startsWith("Registration completed") ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100"}`}>
          {message}
        </div>
      )}

      <div className="border-t border-slate-100 pt-5 flex justify-end gap-3">
        <button type="button" onClick={() => navigate("/admin/admissions/inquiries")} className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-mono text-xs font-semibold rounded-xl">
          Cancel Onboarding
        </button>
        <button type="submit" disabled={isRegisteringStudent} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 shadow">
          <UserPlus className="w-4 h-4" /> {isRegisteringStudent ? "Saving Registration..." : "Save Registration & Generate Admission Code"}
        </button>
      </div>
    </form>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-4">
    <h3 className="text-xs font-extrabold text-indigo-600 font-mono uppercase tracking-wider">{title}</h3>
    {children}
  </div>
);

const Input = ({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) => (
  <label className="space-y-1 block">
    <span className="text-[10px] font-extrabold text-slate-500 block font-mono uppercase">{label}</span>
    <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
  </label>
);

const Select = ({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: readonly string[] }) => (
  <label className="space-y-1 block">
    <span className="text-[10px] font-extrabold text-slate-500 block font-mono uppercase">{label}</span>
    <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500">
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  </label>
);

const TextArea = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) => (
  <label className="space-y-1 block">
    <span className="text-[10px] font-extrabold text-slate-500 block font-mono uppercase">{label}</span>
    <textarea rows={3} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium" />
  </label>
);

export default StudentRegistration;
