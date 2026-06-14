import {
  createInquiry,
  getInquiries,
  updateInquiry,
  type InquiryApi,
  type InquiryStatusApi,
} from "@/src/lib/authApi";
import React from "react";
import {
  Bell,
  Download,
  Edit3,
  Eye,
  Phone,
  Plus,
  Search,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { useSchoolClassOptions } from "@/src/hooks/useSchoolClassOptions";
import HtmlInput from "@/src/HtmlComponents/HtmlInput";

const GRAPH_COLORS = ["#6366f1", "#06b6d4", "#14b8a6", "#f59e0b", "#3b82f6", "#ec4899"];
const defaultCounselors = ["Admissions Desk", "Senior Counselor", "Academic Coordinator"];
const sourceOptions = ["Walk-In", "Phone Call", "Website", "Social Media", "Referral", "Advertisement"] as const;
const editableStatusOptions = [
  "New Inquiry",
  "ADMISSION_REJECTED",
] as const;
const statusOptions = [...editableStatusOptions, "REGISTERED"] as const;

type InquiryStatus = typeof statusOptions[number];
type EditableInquiryStatus = typeof editableStatusOptions[number];
type InquirySource = typeof sourceOptions[number];

type InquiryRow = InquiryApi;

const statusToBackend: Record<EditableInquiryStatus, InquiryStatusApi> = {
  "New Inquiry": "INQUIRY",
  ADMISSION_REJECTED: "ADMISSION_REJECTED",
};

const statusToFrontend: Partial<Record<InquiryStatusApi, InquiryStatus>> = {
  INQUIRY: "New Inquiry",
  INQUIRY_CONVERTED: "REGISTERED",
  REGISTERED: "REGISTERED",
  ADMISSION_REJECTED: "ADMISSION_REJECTED",
};

const toFrontendGender = (gender: InquiryApi["gender"]): "Male" | "Female" | "Other" => {
  if (gender === "FEMALE") return "Female";
  if (gender === "OTHER") return "Other";
  return "Male";
};

const toBackendGender = (gender: "Male" | "Female" | "Other"): "MALE" | "FEMALE" | "OTHER" => {
  if (gender === "Female") return "FEMALE";
  if (gender === "Other") return "OTHER";
  return "MALE";
};

const getInquiryDate = (inquiry: InquiryRow) => inquiry.created_at?.split("T")[0] || "";
const getStatus = (inquiry: InquiryRow): InquiryStatus => statusToFrontend[inquiry.status] || "New Inquiry";

const StudentInquiry = () => {
  const navigate = useNavigate();
  const { classOptions } = useSchoolClassOptions();
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; description: string; read: boolean }>>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [classFilter, setClassFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewingInquiry, setViewingInquiry] = useState<InquiryRow | null>(null);
  const [editingInquiry, setEditingInquiry] = useState<InquiryRow | null>(null);
  const [isSavingInquiry, setIsSavingInquiry] = useState(false);

  const [studentName, setStudentName] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | "Other">("Male");
  const [dob, setDob] = useState("2018-06-15");
  const [currentSchool, setCurrentSchool] = useState("");
  const [currentClass, setCurrentClass] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [interestedClass, setInterestedClass] = useState("Class 1");
  const [academicSession, setAcademicSession] = useState("2026-2027");
  const [inquirySource, setInquirySource] = useState<InquirySource>("Walk-In");
  const [remarks, setRemarks] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");

  useEffect(() => {
    let isMounted = true;

    getInquiries().then((response) => {
      if (isMounted) setInquiries(response.inquiries);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (classOptions.length > 0 && !classOptions.includes(interestedClass)) {
      setInterestedClass(classOptions[0]);
    }
    if (classFilter !== "All" && !classOptions.includes(classFilter)) {
      setClassFilter("All");
    }
  }, [classFilter, classOptions, interestedClass]);

  const stats = useMemo(() => {
    const todayString = new Date().toISOString().split("T")[0];
    const total = inquiries.length;
    const today = inquiries.filter((inquiry) => getInquiryDate(inquiry) === todayString).length;
    const converted = inquiries.filter((inquiry) => getStatus(inquiry) === "REGISTERED").length;
    const pending = inquiries.filter((inquiry) => !["REGISTERED", "ADMISSION_REJECTED"].includes(getStatus(inquiry))).length;
    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;
    return { total, today, pending, converted, conversionRate };
  }, [inquiries]);

  const chartsData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const trendMap: Record<string, number> = Object.fromEntries(months.map((month) => [month, 0]));
    inquiries.forEach((inquiry) => {
      const monthIndex = Number.parseInt(getInquiryDate(inquiry).split("-")[1] || "0", 10) - 1;
      if (monthIndex >= 0 && monthIndex < months.length) trendMap[months[monthIndex]]++;
    });

    const sourceCounts: Record<string, number> = Object.fromEntries(sourceOptions.map((source) => [source, 0]));
    inquiries.forEach((inquiry) => {
      const source = inquiry.inquiry_source || "Website";
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });

    const contacted = inquiries.filter((inquiry) => getStatus(inquiry) !== "New Inquiry").length;
    const assessed = inquiries.filter((inquiry) => getStatus(inquiry) === "REGISTERED").length;

    return {
      trend: months.map((month) => ({ name: month, inquiries: trendMap[month] })),
      sources: Object.entries(sourceCounts).map(([name, value]) => ({ name, value })),
      funnel: [
        { stage: "1. Total Leads", count: inquiries.length, fill: "#6366f1" },
        { stage: "2. Contacted", count: contacted, fill: "#3b82f6" },
        { stage: "3. Visited / Tested", count: assessed, fill: "#06b6d4" },
        { stage: "4. Converted", count: stats.converted, fill: "#14b8a6" },
      ],
    };
  }, [inquiries, stats.converted]);

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inquiry) => {
      const source = inquiry.inquiry_source || "Website";
      const status = getStatus(inquiry);
      const search = `${inquiry.student_name} ${inquiry.parent_name} ${inquiry.phone_no} ${inquiry.email} ${inquiry.inquiry_id}`.toLowerCase();
      return (
        search.includes(searchQuery.toLowerCase()) &&
        (statusFilter === "All" || status === statusFilter) &&
        (classFilter === "All" || inquiry.grade_interested === classFilter) &&
        (sourceFilter === "All" || source === sourceFilter)
      );
    });
  }, [inquiries, searchQuery, statusFilter, classFilter, sourceFilter]);

  const handleSaveInquiry = async (directRegister: boolean) => {
    console.log({ studentName, fatherName, mobileNumber });
    if (!studentName || !fatherName || !mobileNumber) return;

    try {
      setIsSavingInquiry(true);
      const response = await createInquiry({
        student_name: studentName,
        gender: toBackendGender(gender),
        dob,
        current_school: currentSchool,
        current_class: currentClass,
        parent_name: fatherName,
        mother_name: motherName,
        guardian_name: guardianName,
        phone_no: mobileNumber,
        email: emailAddress,
        grade_interested: interestedClass,
        academic_session: academicSession,
        inquiry_source: inquirySource,
        message: remarks,
        follow_up_date: nextFollowUpDate || undefined,
      });

      const row = response.inquiry;

      setInquiries((prev) => [row, ...prev]);
      setNotifications((prev) => [{
        id: `NOT-${Date.now()}`,
        title: "New Admission Inquiry",
        description: `${studentName} applied for ${interestedClass} via ${inquirySource}`,
        read: false,
      }, ...prev]);

      setStudentName("");
      setFatherName("");
      setMotherName("");
      setMobileNumber("");
      setEmailAddress("");
      setRemarks("");
      setShowAddForm(false);

      if (directRegister) convertToRegistration(row);
    } finally {
      setIsSavingInquiry(false);
    }
  };

  const handleUpdateInquiry = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingInquiry) return;
    if (getStatus(editingInquiry) === "REGISTERED") {
      setEditingInquiry(null);
      return;
    }
    const response = await updateInquiry(editingInquiry.inquiry_id, {
      status: statusToBackend[getStatus(editingInquiry) as EditableInquiryStatus],
      message: editingInquiry.message,
    });
    setInquiries((prev) => prev.map((inquiry) => inquiry.inquiry_id === response.inquiry.inquiry_id ? response.inquiry : inquiry));
    setEditingInquiry(null);
  };

  const convertToRegistration = (inquiry: InquiryRow) => {
    localStorage.setItem("schoolmate:conversionInquiry", JSON.stringify(inquiry));
    navigate("/admin/admissions/register");
  };

  const exportCsv = () => {
    const rows = [
      ["Inquiry ID", "Date", "Student Name", "Parent Name", "Contact", "Class", "Status"],
      ...filteredInquiries.map((inquiry) => [
        inquiry.inquiry_id,
        getInquiryDate(inquiry),
        inquiry.student_name,
        inquiry.parent_name,
        inquiry.phone_no,
        inquiry.grade_interested,
        getStatus(inquiry),
        defaultCounselors[0],
      ]),
    ];
    const link = document.createElement("a");
    link.href = `data:text/csv;charset=utf-8,${encodeURI(rows.map((row) => row.join(",")).join("\n"))}`;
    link.download = `Admissions_Inquiries_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600"><Sparkles className="w-4 h-4" /></span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Admissions & Pre-Enrollment CRM</h1>
          </div>
          <p className="text-slate-500 text-xs mt-0.5">Streamline walk-ins, phone consultation records, and candidate conversion pipelines.</p>
        </div>
      </div>

      {notifications.some((item) => !item.read) && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
          <Bell className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest font-mono">Admission Workspace Alert</span>
            <p className="text-xs text-indigo-900 font-semibold mt-0.5">
              {notifications.find((item) => !item.read)?.title}: {notifications.find((item) => !item.read)?.description}
            </p>
          </div>
          <button onClick={() => setNotifications((prev) => prev.map((item, index) => index === 0 ? { ...item, read: true } : item))} className="text-[10px] bg-indigo-600 text-white rounded-lg px-2 py-1 font-mono">
            Acknowledge
          </button>
        </div>
      )}

      {!showAddForm && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: "Total Inquiries", value: stats.total, desc: "All channels logged", color: "border-l-indigo-600" },
              { label: "Today's Leads", value: stats.today, desc: "Fresh walk-ins / calls", color: "border-l-cyan-500" },
              { label: "Active Pipeline", value: stats.pending, desc: "Pending conversions", color: "border-l-amber-500" },
              { label: "Admissions Converted", value: stats.converted, desc: "ERP enrolled roster", color: "border-l-teal-600" },
              { label: "Conversion Success %", value: `${stats.conversionRate}%`, desc: "Inquiries to registration", color: "border-l-rose-500" },
            ].map((card) => (
              <div key={card.label} className={`bg-white border border-slate-200 border-l-4 ${card.color} p-4 rounded-2xl shadow-sm`}>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">{card.label}</span>
                <h3 className="text-xl font-black text-slate-800 tracking-tight mt-1">{card.value}</h3>
                <p className="text-[9px] text-slate-500 font-mono mt-0.5">{card.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartCard title="Monthly Trend" badge="Inquiry Load">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartsData.trend} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                  <YAxis stroke="#94a3b8" fontSize={9} />
                  <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="inquiries" stroke="#6366f1" strokeWidth={2} fill="#eef2ff" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Inquiry Channels" badge="Source Analysis">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartsData.sources} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={8} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} />
                  <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartsData.sources.map((_, index) => <Cell key={index} fill={GRAPH_COLORS[index % GRAPH_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase font-mono tracking-wider">Conversion Stages</h3>
                <span className="text-[9px] font-mono text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full font-bold">Funnel Pipeline</span>
              </div>
              <div className="space-y-4 pt-2">
                {chartsData.funnel.map((item) => {
                  const percentage = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0;
                  return (
                    <div key={item.stage} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-mono font-bold text-slate-600">{item.stage}</span>
                        <span className="font-mono text-slate-500 font-bold">{item.count} ({percentage}%)</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: item.fill }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search inquiries by student, parent, phone or ID..." className="w-full pl-10 pr-4 py-2 border rounded-xl bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 border-slate-200" />
              </div>
              <div className="flex items-center gap-2 flex-wrap self-stretch md:self-auto">
                <button onClick={exportCsv} className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 bg-white rounded-xl text-xs font-bold font-mono flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" /> Export Data
                </button>
                <button onClick={() => setShowAddForm(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <Plus className="w-4 h-4" /> Add New Inquiry
                </button>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-4 text-xs font-bold text-slate-500 font-mono">
              <FilterSelect label="Interested Class" value={classFilter} onChange={setClassFilter} options={["All", ...classOptions]} />
              <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={["All", ...statusOptions]} />
              <FilterSelect label="Source" value={sourceFilter} onChange={setSourceFilter} options={["All", ...sourceOptions]} />
              <div className="ml-auto text-slate-400">Matches: {filteredInquiries.length}</div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200 font-mono text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Candidate Student</th>
                    <th className="py-3 px-4">Parent / Phone</th>
                    <th className="py-3 px-4 text-center">Class</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredInquiries.length === 0 ? (
                    <tr><td colSpan={9} className="py-12 text-center text-slate-400"><Users className="w-8 h-8 mx-auto stroke-slate-300 mb-2" />No inquiries match filter parameters.</td></tr>
                  ) : filteredInquiries.map((inquiry) => (
                    <tr key={inquiry.inquiry_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 font-mono text-[10px] text-slate-500">{getInquiryDate(inquiry)}</td>
                      <td className="py-4 px-4 font-extrabold text-slate-900">{inquiry.student_name}</td>
                      <td className="py-4 px-4"><div className="font-extrabold text-slate-800">{inquiry.parent_name}</div><div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-0.5"><Phone className="w-2.5 h-2.5" /> {inquiry.phone_no}</div></td>
                      <td className="py-4 px-4 text-center"><span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-mono text-[10px] font-semibold">{inquiry.grade_interested}</span></td>
                      <td className="py-4 px-4 font-medium text-slate-600">{inquiry.inquiry_source || "Website"}</td>
                      <td className="py-4 px-4"><StatusBadge status={getStatus(inquiry)} /></td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => setViewingInquiry(inquiry)} className="p-1 px-2 border border-slate-200 text-slate-500 rounded bg-white flex items-center justify-center font-bold font-mono text-[10px] gap-1"><Eye className="w-3.5 h-3.5" /> View</button>
                          {getStatus(inquiry) !== "REGISTERED" && (
                            <button onClick={() => setEditingInquiry(inquiry)} className="p-1 border border-slate-200 text-slate-500 rounded bg-white"><Edit3 className="w-3.5 h-3.5" /></button>
                          )}
                          {(getStatus(inquiry) !== "REGISTERED" && getStatus(inquiry) !== "ADMISSION_REJECTED") && (
                            <button onClick={() => convertToRegistration(inquiry)} className="p-1 px-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200/50 rounded flex items-center gap-1 text-[10px] font-mono font-bold">
                              <UserCheck className="w-3.5 h-3.5" /> Convert
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showAddForm && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight uppercase font-mono">Admission Inquiry Form</h2>
              <p className="text-slate-500 text-[11px] mt-0.5">Collect student, parent, preference, and counseling information.</p>
            </div>
            <button onClick={() => setShowAddForm(false)} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">Back to List</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FormSection title="Section 1: Student Particulars">
              <HtmlInput
                    divClass='space-y-1 md:col-span-2'
                    labelClass="space-y-1 block"
                    inputClass="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    label='Student Name'
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    type='text'
                    ID='reg-school-name'
                    placeholder="First & Last Name"
                    required
                  />
              <Input label="Student Name" value={studentName} onChange={setStudentName} placeholder="First & Last Name" />
              <Select label="Gender" value={gender} onChange={(value) => setGender(value as typeof gender)} options={["Male", "Female", "Other"]} />
              <Input label="Date of Birth" type="date" value={dob} onChange={setDob} />
              <Input label="Current / Previous School" value={currentSchool} onChange={setCurrentSchool} placeholder="School Name" />
              <Input label="Previous Class Attended" value={currentClass} onChange={setCurrentClass} placeholder="e.g. Class 3-B" />
            </FormSection>

            <FormSection title="Section 2: Parental Demographics">
              <Input label="Father's Full Name" value={fatherName} onChange={setFatherName} placeholder="Father Name" />
              <Input label="Mother's Full Name" value={motherName} onChange={setMotherName} placeholder="Mother Name" />
              <Input label="Guardian Name" value={guardianName} onChange={setGuardianName} placeholder="Guardian Name" />
              <Input label="Phone Number" value={mobileNumber} onChange={setMobileNumber} placeholder="+91 00000 00000" />
              <Input label="Email Address" type="email" value={emailAddress} onChange={setEmailAddress} placeholder="parent@example.com" />
            </FormSection>

            <FormSection title="Section 3: Academic Preferences">
              <Select label="Interested Class" value={interestedClass} onChange={setInterestedClass} options={classOptions} />
              <Select label="Academic Session" value={academicSession} onChange={setAcademicSession} options={["2026-2027", "2027-2028"]} />
            </FormSection>

            <FormSection title="Section 4: Counseling Information">
              <Select label="Lead Source" value={inquirySource} onChange={(value) => setInquirySource(value as InquirySource)} options={[...sourceOptions]} />
              <Input label="Next Follow-Up Date" type="date" value={nextFollowUpDate} onChange={setNextFollowUpDate} />
              <TextArea label="Internal Counseling Remarks" value={remarks} onChange={setRemarks} placeholder="Discussion notes, parent interests, specific queries..." />
            </FormSection>
          </div>

          <div className="border-t border-slate-100 pt-5 flex justify-end gap-3">
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 border border-slate-200 text-slate-700 font-mono text-xs font-bold rounded-xl">Cancel</button>
            <button onClick={() => handleSaveInquiry(false)} disabled={isSavingInquiry} className="px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 text-xs font-bold rounded-xl">{isSavingInquiry ? "Saving..." : "Save Inquiry"}</button>
            <button onClick={() => handleSaveInquiry(true)} disabled={isSavingInquiry} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold">{isSavingInquiry ? "Saving..." : "Save & Register Directly"}</button>
          </div>
        </div>
      )}

      {viewingInquiry && (
        <Modal title="Inquiry Details" subtitle={viewingInquiry.student_name} onClose={() => setViewingInquiry(null)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <DetailGroup title="Student Profile" rows={[
              ["Gender", toFrontendGender(viewingInquiry.gender)],
              ["DOB", viewingInquiry.dob || "N/A"],
              ["Previous School", viewingInquiry.current_school || "N/A"],
              ["Previous Class", viewingInquiry.current_class || "N/A"],
            ]} />
            <DetailGroup title="Parent Contacts" rows={[
              ["Father Name", viewingInquiry.parent_name],
              ["Mother Name", viewingInquiry.mother_name || "N/A"],
              ["Phone", viewingInquiry.phone_no],
              ["Email", viewingInquiry.email],
            ]} />
            <DetailGroup title="Enrollment Specs" wide rows={[
              ["Interested Class", viewingInquiry.grade_interested],
              ["Source", viewingInquiry.inquiry_source || "Website"],
              ["Remarks", viewingInquiry.message || "N/A"],
            ]} />
          </div>
          <div className="p-5 border-t border-slate-100 bg-slate-50 -mx-6 -mb-6 mt-6 flex justify-end gap-2">
            {getStatus(viewingInquiry) !== "REGISTERED" && getStatus(viewingInquiry) !== "ADMISSION_REJECTED" && (
              <button onClick={() => convertToRegistration(viewingInquiry)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1">
                <UserCheck className="w-4 h-4" /> Convert to Roster
              </button>
            )}
          </div>
        </Modal>
      )}

      {editingInquiry && (
        <Modal title="Edit Inquiry Status" subtitle={editingInquiry.student_name} onClose={() => setEditingInquiry(null)}>
          <form onSubmit={handleUpdateInquiry} className="space-y-4 text-xs">
            <Select label="Status State" value={getStatus(editingInquiry) === "REGISTERED" ? "New Inquiry" : getStatus(editingInquiry)} onChange={(value) => setEditingInquiry({ ...editingInquiry, status: statusToBackend[value as EditableInquiryStatus] })} options={[...editableStatusOptions]} />
            <TextArea label="Remarks" value={editingInquiry.message || ""} onChange={(value) => setEditingInquiry({ ...editingInquiry, message: value })} />
            <div className="p-5 border-t border-slate-100 bg-slate-50 -mx-6 -mb-6 mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setEditingInquiry(null)} className="px-4 py-2 border border-slate-200 text-slate-700 bg-white rounded-xl text-xs font-bold">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">Save Updates</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

const ChartCard = ({ title, badge, children }: { title: string; badge: string; children: React.ReactNode }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
      <h3 className="text-xs font-extrabold text-slate-900 uppercase font-mono tracking-wider">{title}</h3>
      <span className="text-[9px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-bold">{badge}</span>
    </div>
    <div className="h-56">{children}</div>
  </div>
);

const FilterSelect = ({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: readonly string[] }) => (
  <div className="flex items-center gap-1.5">
    <span>{label}:</span>
    <select value={value} onChange={(event) => onChange(event.target.value)} className="bg-white border border-slate-200 rounded px-1.5 py-0.5 font-bold font-mono text-[10px] text-slate-700">
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  </div>
);

const StatusBadge = ({ status }: { status: InquiryStatus }) => {
  const styles: Record<InquiryStatus, string> = {
    "New Inquiry": "bg-blue-50 text-blue-700 border-blue-100",
    REGISTERED: "bg-emerald-50 text-emerald-700 border-emerald-100",
    ADMISSION_REJECTED: "bg-rose-50 text-rose-700 border-rose-100",
  };
  return <span className={`px-2 py-0.5 rounded-full border text-[9px] font-mono font-bold tracking-wide ${styles[status]}`}>{status}</span>;
};

const FormSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-4 md:col-span-2">
    <h3 className="text-xs font-bold text-indigo-600 font-mono uppercase tracking-wider">{title}</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
  </div>
);

const Input = ({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) => (
  <label className="space-y-1 block">
    <span className="text-[10px] font-bold text-slate-500 block font-mono uppercase">{label}</span>
    <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
  </label>
);

const Select = ({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: readonly string[] }) => (
  <label className="space-y-1 block">
    <span className="text-[10px] font-bold text-slate-500 block font-mono uppercase">{label}</span>
    <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500">
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  </label>
);

const TextArea = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) => (
  <label className="space-y-1 block sm:col-span-2">
    <span className="text-[10px] font-bold text-slate-500 block font-mono uppercase">{label}</span>
    <textarea rows={2} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
  </label>
);

const Modal = ({ title, subtitle, children, onClose }: { title: string; subtitle: string; children: React.ReactNode; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
    <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col text-left">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div>
          <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest font-mono">{title}</span>
          <h3 className="text-sm font-black text-slate-900 truncate">{subtitle}</h3>
        </div>
        <button onClick={onClose} className="p-1 px-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-mono text-[10px] rounded-lg font-extrabold">Close</button>
      </div>
      <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">{children}</div>
    </div>
  </div>
);

const DetailGroup = ({ title, rows, wide }: { title: string; rows: Array<[string, string]>; wide?: boolean }) => (
  <div className={`space-y-1 bg-slate-50 p-3 rounded-xl ${wide ? "sm:col-span-2" : ""}`}>
    <span className="font-mono text-[10px] text-indigo-500 font-extrabold uppercase block mb-1">{title}</span>
    {rows.map(([label, value]) => (
      <div key={label} className="font-bold text-slate-900">{label}: <span className="font-medium text-slate-600">{value}</span></div>
    ))}
  </div>
);

export default StudentInquiry;
