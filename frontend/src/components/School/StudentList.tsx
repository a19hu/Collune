import { getStudents } from '@/src/lib/authApi';
import { useSchoolClassOptions } from '@/src/hooks/useSchoolClassOptions';
import { Search } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClassFilter } from '@/src/HtmlComponents/HtmlSelect';

type StudentRow = {
    id?: string | number;
    user?: string | number;
    firstName?: string;
    first_name?: string;
    lastName?: string;
    last_name?: string;
    className?: string;
    class_id?: string;
    section?: string;
    rollNo?: string | number;
    roll_no?: string | number;
    parentPhone?: string;
    phone_no?: string;
    status?: string;
    photo?: string;
};

const getStudentValue = (student: StudentRow, camelKey: keyof StudentRow, snakeKey?: keyof StudentRow) =>
    String(student[camelKey] ?? (snakeKey ? student[snakeKey] : '') ?? '');

const StudentList = () => {
    const navigate = useNavigate();
    const { classOptions } = useSchoolClassOptions();
    const [students, setStudents] = useState<StudentRow[]>([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [stSearch, setStSearch] = useState('');
    const [stClassFilter, setStClassFilter] = useState('All');
    const [stStatusFilter, setStStatusFilter] = useState('All');

    const filteredStudents = students.filter((s) => {
        const search = stSearch.toLowerCase();
        const firstName = getStudentValue(s, 'firstName', 'first_name');
        const lastName = getStudentValue(s, 'lastName', 'last_name');
        const studentId = getStudentValue(s, 'id', 'user');
        const className = getStudentValue(s, 'className', 'class_id');
        const status = getStudentValue(s, 'status') || 'Active';

        const matchesSearch =
            firstName.toLowerCase().includes(search) ||
            lastName.toLowerCase().includes(search) ||
            studentId.toLowerCase().includes(search);
        const matchesClass = stClassFilter === 'All' || className === stClassFilter;
        const matchesStatus = stStatusFilter === 'All' || status === stStatusFilter;
        return matchesSearch && matchesClass && matchesStatus;
    });

    useEffect(() => {
        const loadStudents = async () => {
            try {
                const response = await getStudents();
                setStudents(response.students);
            } catch (error: any) {
                // showToast(error?.message || 'Unable to fetch students from API.');
            }
        };

        void loadStudents();
    }, []);

    useEffect(() => {
        if (stClassFilter !== 'All' && !classOptions.includes(stClassFilter)) {
            setStClassFilter('All');
        }
    }, [classOptions, stClassFilter]);
    return (
        <div className="space-y-6 animate-fade-in text-left">
            {!selectedStudent && (
                <>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Enrolled Student Directory</h1>
                            <p className="text-slate-500 text-xs text-slate-400">Manage academic files, medical logs, and parental phone indexes</p>
                        </div>
                    </div>

                    {/* SEARCH AND BAR FILTER IN STUDENTS */}
                    <div className="flex flex-col sm:flex-row gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                            <input
                                id="student-search-control"
                                type="text"
                                value={stSearch}
                                onChange={(e) => setStSearch(e.target.value)}
                                placeholder="Search student by name, blood types, admission ID..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="flex gap-2 flex-wrap">
                            <ClassFilter
                                value={stClassFilter}
                                onChange={(e) => setStClassFilter(e.target.value)}
                                id="filter-students-class"
                                selectClassName="bg-slate-50 border border-slate-200 rounded-lg px-2 text-xs py-2 font-semibold text-slate-600"

                            />

                            <div className="space-y-0.5">
                                <select
                                    id="filter-students-status"
                                    value={stStatusFilter}
                                    onChange={(e) => setStStatusFilter(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 text-xs py-2 font-semibold text-slate-600"
                                >
                                    <option value="All">All States</option>
                                    <option value="Active">Active</option>
                                    <option value="On Leave">On Leave</option>
                                    <option value="Suspended">Suspended</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* ROSTER TABLE */}
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs font-semibold text-slate-700">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-mono text-[9px]">
                                        <th className="p-4">Student Info</th>
                                        <th className="p-4">Grade & Roll</th>
                                        <th className="p-4">Phone no</th>
                                        <th className="p-4 text-center">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map((s) => {
                                        const studentId = getStudentValue(s, 'id', 'user');
                                        const firstName = getStudentValue(s, 'firstName', 'first_name');
                                        const lastName = getStudentValue(s, 'lastName', 'last_name');
                                        const className = getStudentValue(s, 'className', 'class_id');
                                        const rollNo = getStudentValue(s, 'rollNo', 'roll_no');
                                        const parentPhone = getStudentValue(s, 'parentPhone', 'phone_no');
                                        const status = getStudentValue(s, 'status') || 'Active';
                                        const fullName = `${firstName} ${lastName}`.trim() || 'Unnamed Student';

                                        return (
                                            <tr key={studentId} className="border-b border-slate-150 border-b-slate-100 hover:bg-slate-50/50">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <img referrerPolicy="no-referrer" src={s.photo || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(fullName)}`} alt={fullName} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                                                        <div>
                                                            <div className="font-extrabold text-slate-900">{fullName}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div>{className || 'Unassigned'}{s.section ? `-${s.section}` : ''}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono">Roll: #{rollNo || 'N/A'}</div>
                                                </td>
                                                <td className="p-4 text-slate-600 font-mono">{parentPhone || 'N/A'}</td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${status === 'Active'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : status === 'On Leave'
                                                            ? 'bg-amber-100 text-amber-800'
                                                            : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right shrink-0">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            id={`btn-view student-${studentId}`}
                                                            onClick={() => navigate(`/admin/students/${studentId}`)}
                                                            className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 transition-colors rounded-xl text-xs font-bold cursor-pointer"
                                                        >
                                                            Profile File
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

        </div>

    );
}

export default StudentList;
