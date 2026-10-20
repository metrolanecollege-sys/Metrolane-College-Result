import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ResultSlip } from '../documents/ResultSlip';
import { StudentRecord } from '../../types';
import { computeClassification, computeGrade } from '../../utils/academic';
import { 
  GraduationCap, 
  Search, 
  ClipboardList, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Printer, 
  Check, 
  Clock,
  Sparkles,
  BookOpen,
  TrendingUp,
  UserCheck,
  Award,
  Filter,
  RotateCcw
} from 'lucide-react';

interface StudentPortalProps {
  activeTab: string;
  onSelectTab?: (tab: string) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ activeTab, onSelectTab }) => {
  const { currentUser } = useAuth();
  const { 
    students, 
    courses, 
    courseRegistrations, 
    registerStudentCourses, 
    dropStudentCourse, 
    results, 
    sessions,
    settings, 
    signatures, 
    computeStudentSemesterSummary 
  } = useData();

  // Find student profile strictly linked to this authenticated user
  const currentStudent = students.find(
    s => s.uid === currentUser?.uid || 
         (s.email && currentUser?.email && s.email.toLowerCase() === currentUser.email.toLowerCase()) ||
         (s.matricNumber && (currentUser as any)?.matricNumber && s.matricNumber.toLowerCase() === String((currentUser as any).matricNumber).toLowerCase())
  ) || students[0];

  // Tab navigation inside Student portal directly linked to activeTab
  const currentView = activeTab || 'dashboard';

  const handleTabChange = (tabId: string) => {
    onSelectTab?.(tabId);
  };

  // Result checking criteria & state based strictly on Matriculation Number & Academic Criteria
  const [searchMatric, setSearchMatric] = useState(currentStudent?.matricNumber || '26/MET/CHT/001');
  const [selectedSession, setSelectedSession] = useState(settings.currentSession);
  const [selectedSemester, setSelectedSemester] = useState<'1st Semester' | '2nd Semester'>(settings.currentSemester);
  const [selectedLevel, setSelectedLevel] = useState<string>('All Levels');
  const [activeStudent, setActiveStudent] = useState<StudentRecord>(currentStudent);
  const [searchStatus, setSearchStatus] = useState<{ 
    type: 'success' | 'warning' | 'error' | 'info'; 
    message: string; 
  } | null>(null);
  const [hasRetrieved, setHasRetrieved] = useState(true);
  const [showSlipModal, setShowSlipModal] = useState(false);

  // Synchronize when current student changes
  useEffect(() => {
    if (currentStudent) {
      setSearchMatric(currentStudent.matricNumber);
      setActiveStudent(currentStudent);
    }
  }, [currentStudent]);

  // Derive target student for results display
  const targetStudent = activeStudent || currentStudent;

  // Available sessions list
  const availableSessions = sessions && sessions.length > 0
    ? sessions.map(s => s.name)
    : ['2025/2026', '2024/2025', '2023/2024'];

  // Course registration selection
  const myRegistrations = courseRegistrations.filter(
    r => r.studentId === currentStudent?.id && r.session === settings.currentSession
  );
  const availableCourses = courses.filter(
    c => c.programme === currentStudent?.programme || c.programmeCode === currentStudent?.programmeCode
  );
  const [selectedCourseIdsToRegister, setSelectedCourseIdsToRegister] = useState<string[]>([]);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Student results strictly filtered by studentId / matriculation number and academic criteria
  const studentResults = results.filter(
    r => (r.studentId === targetStudent?.id || (targetStudent?.matricNumber && r.matricNumber.trim().toLowerCase() === targetStudent.matricNumber.trim().toLowerCase())) &&
         r.session === selectedSession &&
         r.semester === selectedSemester &&
         r.status === 'published' &&
         (selectedLevel === 'All Levels' || r.level === selectedLevel)
  );

  const studentSummary = computeStudentSemesterSummary(targetStudent?.id || '', selectedSession, selectedSemester);

  const handleRetrieveResults = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanMatric = searchMatric.trim();
    if (!cleanMatric) {
      setSearchStatus({
        type: 'error',
        message: 'Please enter a valid student Matriculation Number.'
      });
      return;
    }

    const matched = students.find(
      s => s.matricNumber.trim().toLowerCase() === cleanMatric.toLowerCase()
    );

    if (!matched) {
      setSearchStatus({
        type: 'error',
        message: `No student record found with Matriculation Number "${cleanMatric}". Please check and verify your matriculation number.`
      });
      setHasRetrieved(false);
      return;
    }

    setActiveStudent(matched);
    setHasRetrieved(true);

    const matches = results.filter(
      r => (r.studentId === matched.id || r.matricNumber.trim().toLowerCase() === matched.matricNumber.trim().toLowerCase()) &&
           r.session === selectedSession &&
           r.semester === selectedSemester &&
           r.status === 'published' &&
           (selectedLevel === 'All Levels' || r.level === selectedLevel)
    );

    if (matches.length > 0) {
      setSearchStatus({
        type: 'success',
        message: `Results retrieved successfully for ${matched.firstName} ${matched.lastName} (${matched.matricNumber}) — ${selectedSession} ${selectedSemester}.`
      });
    } else {
      setSearchStatus({
        type: 'warning',
        message: `No published results found for ${matched.firstName} ${matched.lastName} (${matched.matricNumber}) for ${selectedSession} • ${selectedSemester}${selectedLevel !== 'All Levels' ? ` (${selectedLevel})` : ''}. Results may still be undergoing departmental processing or Senate approval.`
      });
    }
  };

  const handleCourseSelectionToggle = (courseId: string) => {
    setSelectedCourseIdsToRegister(prev => 
      prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
    );
  };

  const handleConfirmRegistration = async () => {
    if (selectedCourseIdsToRegister.length === 0) return;
    await registerStudentCourses(
      currentStudent.id,
      currentStudent.matricNumber,
      selectedCourseIdsToRegister,
      settings.currentSession,
      settings.currentSemester,
      currentStudent.level
    );
    setSelectedCourseIdsToRegister([]);
    setRegSuccess(`Successfully enrolled in ${selectedCourseIdsToRegister.length} courses for ${settings.currentSession}.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#1A1A2E] via-[#2A2A4E] to-[#F47B20] text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 text-xs font-semibold text-[#F9A825] mb-2 border border-white/20">
            <GraduationCap className="w-3.5 h-3.5" />
            Metrolane Student Academic Portal
          </div>
          <h2 className="text-xl md:text-2xl font-black">
            Welcome, {currentStudent?.firstName} {currentStudent?.lastName}
          </h2>
          <p className="text-xs md:text-sm text-gray-200 mt-1">
            Matric No: <strong className="font-mono text-[#F9A825]">{currentStudent?.matricNumber}</strong> • {currentStudent?.programme}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleTabChange('check_result')}
            className="px-4 py-2 bg-white text-gray-900 hover:bg-gray-100 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Award className="w-3.5 h-3.5 text-[#F47B20]" />
            Check Result
          </button>
        </div>
      </div>

      {/* Internal Navigation Ribbon */}
      <div className="bg-white p-2 rounded-xl border border-gray-200 overflow-x-auto flex items-center gap-1 text-xs font-bold shadow-xs">
        {[
          { id: 'dashboard', label: 'My Dashboard', icon: TrendingUp },
          { id: 'check_result', label: 'Check Result', icon: Award },
          { id: 'course_registration', label: 'Course Registration', icon: ClipboardList },
          { id: 'result_slips', label: 'Result Slips & Transcripts', icon: FileText },
          { id: 'academic_profile', label: 'Student Profile', icon: GraduationCap },
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = currentView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                isSelected ? 'bg-[#F47B20] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. SECTION: DASHBOARD */}
      {currentView === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs cursor-pointer hover:border-[#F47B20]" onClick={() => handleTabChange('academic_profile')}>
              <span className="text-[11px] text-gray-400 font-bold uppercase block">Current Level / Session</span>
              <span className="text-base font-black text-gray-900 block mt-1">{currentStudent?.level}</span>
              <span className="text-xs text-gray-500">{settings.currentSession} ({settings.currentSemester})</span>
            </div>

            {/* Previous CGPA */}
            <div className="bg-white p-5 rounded-xl border border-amber-200 bg-amber-50/30 shadow-xs">
              <span className="text-[11px] text-amber-800 font-bold uppercase block">Previous CGPA</span>
              <span className="text-2xl font-black text-amber-900 block mt-1">
                {studentSummary.previousCgpaText}
              </span>
              <span className="text-xs text-amber-700 font-semibold">
                {studentSummary.previousCgpaText === 'N/A' ? 'First Semester (ND1/HND1)' : `${studentSummary.previousCreditUnits || 18} Completed Units`}
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-purple-200 bg-purple-50/20 shadow-xs cursor-pointer hover:border-[#5B4FC4]" onClick={() => handleTabChange('check_result')}>
              <span className="text-[11px] text-[#5B4FC4] font-bold uppercase block">Current CGPA (Cumulative)</span>
              <span className="text-2xl font-black text-[#5B4FC4] block mt-1">{studentSummary.cgpa.toFixed(2)}</span>
              <span className="text-xs text-emerald-700 font-bold uppercase">{studentSummary.classification}</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[11px] text-gray-400 font-bold uppercase block">Academic Standing</span>
              <span className="text-base font-black text-emerald-700 block mt-1">
                {studentSummary.remark === 'Pass' ? 'Good Standing' : studentSummary.remark}
              </span>
              <span className="text-xs text-gray-500">Normal progression</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs cursor-pointer hover:border-[#F47B20]" onClick={() => handleTabChange('course_registration')}>
              <span className="text-[11px] text-gray-400 font-bold uppercase block">Registered Courses</span>
              <span className="text-2xl font-black text-gray-900 block mt-1">{myRegistrations.length}</span>
              <span className="text-xs text-gray-500">{myRegistrations.reduce((a, b) => a + b.creditUnit, 0)} Total Credit Units</span>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#F47B20]" />
                  Check Semester Results
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Enter your matriculation number and select academic criteria to view your Continuous Assessment and Examination scores.
                </p>
              </div>
              <button
                onClick={() => handleTabChange('check_result')}
                className="mt-4 px-4 py-2 bg-[#F47B20] hover:bg-[#E8601C] text-white font-bold text-xs rounded-xl shadow-xs transition self-start cursor-pointer"
              >
                Go to Result Checker →
              </button>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Semester Result Slip
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Download or print your official Semester Result with College seal and 3 digital signatures.
                </p>
              </div>
              <button
                onClick={() => setShowSlipModal(true)}
                className="mt-4 px-4 py-2 bg-[#1A1A2E] hover:bg-[#2D2D44] text-white font-bold text-xs rounded-xl shadow-xs transition self-start cursor-pointer"
              >
                Print Semester Result →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. SECTION: CHECK RESULT (MATRICULATION NUMBER & ACADEMIC CRITERIA) */}
      {currentView === 'check_result' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-3xl mx-auto">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-orange-100 text-[#F47B20] rounded-full flex items-center justify-center mx-auto mb-2">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-gray-900">Online Result Checking Portal</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                Retrieve and view official semester results using your Matriculation Number and academic session/semester criteria.
              </p>
            </div>

            {searchStatus && (
              <div className={`mb-5 p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2.5 ${
                searchStatus.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : searchStatus.type === 'warning'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {searchStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                )}
                <div className="flex-1">{searchStatus.message}</div>
                <button
                  type="button"
                  onClick={() => setSearchStatus(null)}
                  className="text-gray-400 hover:text-gray-600 font-bold ml-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            <form onSubmit={handleRetrieveResults} className="space-y-4 text-xs">
              {/* Matriculation Number Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-gray-700">
                    Matriculation Number *
                  </label>
                  {currentStudent && searchMatric !== currentStudent.matricNumber && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchMatric(currentStudent.matricNumber);
                        setActiveStudent(currentStudent);
                      }}
                      className="text-[11px] text-[#F47B20] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Use My Matric ({currentStudent.matricNumber})
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. 26/MET/CHT/001"
                  value={searchMatric}
                  onChange={(e) => setSearchMatric(e.target.value.toUpperCase())}
                  className="w-full font-mono font-bold text-sm p-3 bg-[#F8F9FA] rounded-lg border border-gray-300 focus:border-[#F47B20] focus:bg-white outline-none tracking-wider text-center"
                />
              </div>

              {/* Academic Criteria Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Academic Session *</label>
                  <select
                    value={selectedSession}
                    onChange={(e) => setSelectedSession(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg outline-none font-medium focus:border-[#F47B20]"
                  >
                    {availableSessions.map(sess => (
                      <option key={sess} value={sess}>{sess}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Semester *</label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value as any)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg outline-none font-medium focus:border-[#F47B20]"
                  >
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Academic Level</label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg outline-none font-medium focus:border-[#F47B20]"
                  >
                    <option value="All Levels">All Levels (Comprehensive)</option>
                    <option value="ND1">ND1 (National Diploma I)</option>
                    <option value="ND2">ND2 (National Diploma II)</option>
                    <option value="HND1">HND1 (Higher National Diploma I)</option>
                    <option value="HND2">HND2 (Higher National Diploma II)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#F47B20] hover:bg-[#E8601C] text-white font-black text-sm rounded-lg shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                Retrieve Semester Results
              </button>
            </form>

            {/* Quick Matric Chips for Demo/Testing Convenience */}
            {students.length > 0 && (
              <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                <span className="font-semibold text-gray-400">Sample Students:</span>
                {students.slice(0, 4).map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSearchMatric(s.matricNumber);
                      setActiveStudent(s);
                      setHasRetrieved(true);
                    }}
                    className={`px-2 py-0.5 rounded border transition font-mono cursor-pointer ${
                      searchMatric.toLowerCase() === s.matricNumber.toLowerCase()
                        ? 'bg-orange-100 text-[#E8601C] border-orange-300 font-bold'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
                    }`}
                  >
                    {s.matricNumber} ({s.firstName})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Results Table Revealed upon Result Retrieval */}
          {hasRetrieved && studentResults.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
                <div>
                  <h3 className="font-black text-gray-900 text-base">
                    Semester Result Slip ({selectedSession} • {selectedSemester})
                  </h3>
                  <p className="text-xs text-gray-500">
                    Student: <strong className="text-gray-900">{targetStudent?.firstName} {targetStudent?.middleName || ''} {targetStudent?.lastName}</strong> • Matric No: <strong className="font-mono text-[#F47B20]">{targetStudent?.matricNumber}</strong> • {targetStudent?.programme}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSlipModal(true)}
                  className="px-4 py-2 bg-[#1A1A2E] hover:bg-[#2D2D44] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 self-start cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#F47B20]" />
                  Print Official Semester Result
                </button>
              </div>

              {/* Scores table: Course Code | Course Title | Credit Unit | Score | Grade | GP */}
              <div className="my-4 overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 uppercase text-[10px] tracking-wider border-b border-gray-200 font-bold">
                      <th className="py-2.5 px-3">Course Code</th>
                      <th className="py-2.5 px-3">Course Title</th>
                      <th className="py-2.5 px-3 text-center">Credit Unit</th>
                      <th className="py-2.5 px-3 text-center">Score</th>
                      <th className="py-2.5 px-3 text-center">Grade</th>
                      <th className="py-2.5 px-3 text-center">GP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {studentResults.map(r => {
                      const totalScore = Number(r.totalScore || (Number(r.caScore || 0) + Number(r.examScore || 0)));
                      const gp = typeof r.gradePoint === 'number' ? r.gradePoint : computeGrade(totalScore).gradePoint;

                      return (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="py-2.5 px-3 font-bold text-gray-900">{r.courseCode}</td>
                          <td className="py-2.5 px-3 text-gray-700">{r.courseTitle}</td>
                          <td className="py-2.5 px-3 text-center font-bold">{r.creditUnit}</td>
                          <td className="py-2.5 px-3 text-center font-black text-gray-900">{totalScore}</td>
                          <td className="py-2.5 px-3 text-center font-bold">
                            <span className={`px-2 py-0.5 rounded text-[11px] ${
                              r.grade === 'F' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {r.grade}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-[#E8601C]">
                            {gp.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Three Required Performance Summary Cards (Orange-and-White Theme) */}
              <div className="my-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Card A: Previous CGPA */}
                  <div className="bg-white border-2 border-amber-200 rounded-xl p-5 shadow-xs relative overflow-hidden group hover:border-[#F47B20] transition">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black uppercase text-amber-800 tracking-wider">
                        Previous CGPA
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                        {studentSummary.previousCgpaText === 'N/A' ? 'First Semester' : 'Prior Semesters'}
                      </span>
                    </div>
                    <div className="text-3xl font-black text-amber-950 font-mono tracking-tight mt-1">
                      {studentSummary.previousCgpaText}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-2">
                      {studentSummary.previousCgpaText === 'N/A' 
                        ? 'Initial semester (ND 1 / HND 1). No previous records.' 
                        : `Cumulative CGPA from completed previous semesters.`}
                    </p>
                  </div>

                  {/* Card B: Current Semester GPA */}
                  <div className="bg-white border-2 border-[#F47B20]/40 rounded-xl p-5 shadow-xs relative overflow-hidden group hover:border-[#F47B20] transition">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black uppercase text-[#E8601C] tracking-wider">
                        Current Semester GPA
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-[#E8601C] border border-orange-200">
                        {studentSummary.totalCreditUnits} Credit Units
                      </span>
                    </div>
                    <div className="text-3xl font-black text-[#E8601C] font-mono tracking-tight mt-1">
                      {studentSummary.gpa.toFixed(2)}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-2">
                      Quality Points: <strong>{studentSummary.totalQualityPoints.toFixed(2)}</strong> across {studentResults.length} registered courses.
                    </p>
                  </div>

                  {/* Card C: Cumulative CGPA */}
                  <div className="bg-gradient-to-br from-white to-purple-50/50 border-2 border-purple-300 rounded-xl p-5 shadow-xs relative overflow-hidden group hover:border-purple-500 transition">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black uppercase text-[#5B4FC4] tracking-wider">
                        Cumulative CGPA
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200 uppercase">
                        {studentSummary.classification}
                      </span>
                    </div>
                    <div className="text-3xl font-black text-[#5B4FC4] font-mono tracking-tight mt-1">
                      {studentSummary.cgpa.toFixed(2)}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-2">
                      Weighted total: <strong>{studentSummary.totalQualityPointsCumulative.toFixed(2)} QP</strong> ÷ <strong>{studentSummary.totalCreditUnitsCumulative} Units</strong>.
                    </p>
                  </div>
                </div>

                {/* Additional academic metrics bar */}
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-4 text-gray-600">
                    <span>Attempted Units: <strong>{studentSummary.totalCreditUnitsCumulative}</strong></span>
                    <span>Total Quality Points: <strong>{studentSummary.totalQualityPointsCumulative.toFixed(2)}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Academic Standing:</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                      studentSummary.remark === 'Pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                    }`}>
                      {studentSummary.remark === 'Pass' ? 'Good Standing (Pass)' : studentSummary.remark}
                    </span>
                  </div>
                </div>
              </div>

              {/* 6. Academic Performance History Section */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs md:text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#F47B20]" />
                      Academic Performance History ({studentSummary.programmeType || 'ND'} Programme)
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Progressive semester GPA and cumulative CGPA across completed academic levels.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-orange-50 border border-orange-200 text-[#E8601C] rounded-lg text-[10px] font-bold">
                    Independent {studentSummary.programmeType || 'ND'} Records
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 uppercase text-[10px] tracking-wider border-b border-gray-200 font-bold">
                        <th className="py-2.5 px-3">Academic Level</th>
                        <th className="py-2.5 px-3">Semester</th>
                        <th className="py-2.5 px-3 text-center">Credit Units</th>
                        <th className="py-2.5 px-3 text-center">Quality Points</th>
                        <th className="py-2.5 px-3 text-center bg-orange-50/50 text-[#E8601C] border-x border-orange-100">
                          GPA
                        </th>
                        <th className="py-2.5 px-3 text-center bg-purple-50/50 text-[#5B4FC4] border-r border-purple-100">
                          Cumulative CGPA
                        </th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {studentSummary.progressionHistory && studentSummary.progressionHistory.length > 0 ? (
                        studentSummary.progressionHistory.map((item, idx) => (
                          <tr key={idx} className={item.isCurrent ? 'bg-orange-50/30 font-bold' : 'hover:bg-gray-50'}>
                            <td className="py-2.5 px-3 font-bold text-gray-900">
                              {item.level}
                              {item.isCurrent && (
                                <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] bg-[#F47B20] text-white">
                                  Current
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-gray-700">{item.semesterLabel}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-gray-800">{item.creditUnits}</td>
                            <td className="py-2.5 px-3 text-center text-gray-600">{item.qualityPoints.toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-[#E8601C] bg-orange-50/30 border-x border-orange-100">
                              {item.gpa.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-black text-[#5B4FC4] bg-purple-50/30 border-r border-purple-100">
                              {item.cgpa.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {computeClassification(item.cgpa)}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-4 text-center text-gray-400">
                            Academic progression records will appear here as results are processed.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Empty State when no results found for criteria */}
          {hasRetrieved && studentResults.length === 0 && (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 shadow-xs p-8 text-center animate-in fade-in max-w-2xl mx-auto">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2.5" />
              <h4 className="font-bold text-gray-900 text-sm">No Published Results Found</h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-3">
                No published scores were found for Matriculation No. <strong className="font-mono text-gray-800">{targetStudent?.matricNumber}</strong> in <strong className="text-gray-800">{selectedSession} ({selectedSemester})</strong>{selectedLevel !== 'All Levels' ? ` for level ${selectedLevel}` : ''}.
              </p>
              <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 text-[11px] text-amber-900 max-w-md mx-auto text-left space-y-1.5">
                <p className="font-semibold">• Verify that the academic session and semester selected match your examination period.</p>
                <p className="font-semibold">• Only results officially endorsed by the Academic Board and Examination Office are visible here.</p>
                <p className="font-semibold">• If examinations were concluded recently, please check back once departmental results are approved.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. SECTION: COURSE REGISTRATION */}
      {currentView === 'course_registration' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Course Registration Portal</h3>
              <p className="text-xs text-gray-500">
                Enroll in required core and general studies courses for {settings.currentSession} ({settings.currentSemester}).
              </p>
            </div>
            {selectedCourseIdsToRegister.length > 0 && (
              <button
                type="button"
                onClick={handleConfirmRegistration}
                className="px-4 py-2 bg-[#F47B20] hover:bg-[#E8601C] text-white font-bold text-xs rounded-lg shadow-sm transition"
              >
                Register Selected ({selectedCourseIdsToRegister.length})
              </button>
            )}
          </div>

          {regSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
              <span>{regSuccess}</span>
              <button onClick={() => setRegSuccess(null)} className="font-bold">✕</button>
            </div>
          )}

          {/* Available courses list */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-3 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-700">
              Departmental Curriculum Courses
            </div>
            <div className="divide-y divide-gray-100 text-xs">
              {availableCourses.map(c => {
                const isAlreadyRegistered = myRegistrations.some(r => r.courseId === c.id);
                const isSelected = selectedCourseIdsToRegister.includes(c.id);

                return (
                  <div key={c.id} className="p-3.5 flex items-center justify-between hover:bg-gray-50 transition">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        disabled={isAlreadyRegistered}
                        checked={isAlreadyRegistered || isSelected}
                        onChange={() => handleCourseSelectionToggle(c.id)}
                        className="rounded border-gray-300 text-[#F47B20] focus:ring-[#F47B20]"
                      />
                      <div>
                        <span className="font-bold text-gray-900 block">{c.courseCode} — {c.courseTitle}</span>
                        <span className="text-gray-500 text-[11px]">
                          {c.creditUnit} Credit Units • {c.courseType} • Lecturer: {c.lecturerName || 'Assigned'}
                        </span>
                      </div>
                    </div>

                    <div>
                      {isAlreadyRegistered ? (
                        <span className="text-emerald-700 font-bold text-[11px] px-2 py-0.5 bg-emerald-50 rounded-md">
                          Enrolled ✓
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[11px]">Available</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. SECTION: RESULT SLIPS & TRANSCRIPTS */}
      {currentView === 'result_slips' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#F47B20]" />
                Official Semester Result Document
              </h3>
              <p className="text-xs text-gray-500">
                Official institutional printout featuring watermarked seal and signatures of Exam Officer, HOD, and Registrar.
              </p>
            </div>
            <button
              onClick={() => setShowSlipModal(true)}
              className="px-4 py-2 bg-[#F47B20] hover:bg-[#E8601C] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Preview &amp; Print PDF
            </button>
          </div>

          <div className="p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-center">
            <GraduationCap className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <h4 className="font-bold text-gray-800 text-sm">Semester Result Available</h4>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-4">
              Your academic scores for session {settings.currentSession} have been computed with Semester GPA: <strong>{studentSummary.gpa.toFixed(2)}</strong> and CGPA: <strong>{studentSummary.cgpa.toFixed(2)}</strong> ({studentSummary.classification}).
            </p>
            <button
              onClick={() => setShowSlipModal(true)}
              className="px-5 py-2.5 bg-[#1A1A2E] hover:bg-[#2D2D44] text-white font-bold text-xs rounded-xl shadow-sm transition inline-flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#F47B20]" />
              Download Semester Result
            </button>
          </div>
        </div>
      )}

      {/* 5. SECTION: ACADEMIC PROFILE */}
      {currentView === 'academic_profile' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6 animate-in fade-in">
          <div>
            <h3 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#F47B20]" />
              Student Academic Profile &amp; Bio-Data
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-gray-400 font-semibold block uppercase text-[10px]">Full Name:</span>
              <span className="font-bold text-gray-800">{currentStudent?.firstName} {currentStudent?.middleName || ''} {currentStudent?.lastName}</span>
            </div>
            <div>
              <span className="text-gray-400 font-semibold block uppercase text-[10px]">Matriculation No:</span>
              <span className="font-mono font-bold text-[#F47B20]">{currentStudent?.matricNumber}</span>
            </div>
            <div>
              <span className="text-gray-400 font-semibold block uppercase text-[10px]">Programme:</span>
              <span className="font-semibold text-gray-800">{currentStudent?.programme}</span>
            </div>
            <div>
              <span className="text-gray-400 font-semibold block uppercase text-[10px]">Department:</span>
              <span className="font-semibold text-gray-800">{currentStudent?.department}</span>
            </div>
            <div>
              <span className="text-gray-400 font-semibold block uppercase text-[10px]">State of Origin / LGA:</span>
              <span className="font-semibold text-gray-800">{currentStudent?.stateOfOrigin} ({currentStudent?.lga})</span>
            </div>
            <div>
              <span className="text-gray-400 font-semibold block uppercase text-[10px]">Gender:</span>
              <span className="font-semibold text-gray-800">{currentStudent?.gender}</span>
            </div>
            <div>
              <span className="text-gray-400 font-semibold block uppercase text-[10px]">Clearance Status:</span>
              <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Fully Cleared
              </span>
            </div>
            <div>
              <span className="text-gray-400 font-semibold block uppercase text-[10px]">College Email:</span>
              <span className="font-medium text-gray-700">{currentStudent?.email}</span>
            </div>
          </div>
        </div>
      )}

      {/* Result Slip Modal Preview */}
      {showSlipModal && targetStudent && (
        <ResultSlip
          student={targetStudent}
          results={studentResults}
          summary={studentSummary}
          signatures={signatures}
          session={selectedSession}
          semester={selectedSemester}
          onClose={() => setShowSlipModal(false)}
        />
      )}
    </div>
  );
};
