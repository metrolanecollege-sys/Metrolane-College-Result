import React, { useRef } from 'react';
import { MetrolaneLogo, getMetrolaneLogoDataUrl } from '../common/MetrolaneLogo';
import { ResultScore, StudentRecord, DigitalSignature, SemesterResultSummary } from '../../types';
import { computeGrade } from '../../utils/academic';
import { Printer, Download, ShieldCheck, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';

interface ResultSlipProps {
  student: StudentRecord;
  results: ResultScore[];
  summary: SemesterResultSummary;
  signatures: DigitalSignature[];
  session: string;
  semester: string;
  onClose?: () => void;
}

export const ResultSlip: React.FC<ResultSlipProps> = ({
  student,
  results,
  summary,
  signatures,
  session,
  semester,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement | null>(null);

  const examOfficerSig = signatures.find(s => s.role === 'exam_officer');
  const hodSig = signatures.find(s => s.role === 'hod');
  const registrarSig = signatures.find(s => s.role === 'registrar');

  const refCode = `MET-${student.matricNumber.replace(/\//g, '')}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
  const currentDate = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY

  // Filter results: ensure only courses belonging to the current semester and session are included
  const semesterResults = results.filter(r => {
    if (r.semester && r.semester !== semester) return false;
    if (r.session && session && r.session !== session) return false;
    return true;
  });

  // Calculate current semester credit units and quality points strictly for this semester result
  const currentSemesterUnits = semesterResults.reduce((acc, r) => acc + (r.creditUnit || 0), 0);
  const currentSemesterQP = semesterResults.reduce((acc, r) => {
    const total = Number(r.totalScore || (Number(r.caScore || 0) + Number(r.examScore || 0)));
    const gp = typeof r.gradePoint === 'number' ? r.gradePoint : computeGrade(total).gradePoint;
    return acc + parseFloat(((r.creditUnit || 0) * gp).toFixed(2));
  }, 0);
  const currentSemesterGPA = currentSemesterUnits > 0 ? parseFloat((currentSemesterQP / currentSemesterUnits).toFixed(2)) : (summary.gpa || 0.00);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    // Generate clean vectorized PDF using jsPDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // Top Header Banner
    doc.setFillColor(244, 123, 32); // #F47B20
    doc.rect(0, 0, pageWidth, 7, 'F');

    // School Logo - dynamically embedded onto PDF
    try {
      const logoDataUrl = await getMetrolaneLogoDataUrl();
      if (logoDataUrl) {
        doc.addImage(logoDataUrl, 'PNG', pageWidth / 2 - 12, 10, 24, 24);
      }
    } catch (e) {
      console.warn('Could not render logo to PDF:', e);
    }

    // Title & Institution
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(26, 26, 46); // #1A1A2E
    doc.text('METROLANE COLLEGE OF HEALTH, SCIENCE & TECHNOLOGY', pageWidth / 2, 38, { align: 'center' });

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(117, 117, 117);
    doc.text('"Compassion in Health, Precision in Science, Innovation in Technology"', pageWidth / 2, 43, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(232, 96, 28);
    doc.text('OFFICIAL SEMESTER RESULT', pageWidth / 2, 51, { align: 'center' });

    // Thin separator
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 55, pageWidth - 15, 55);

    // Student Info Box
    doc.setFontSize(9.5);
    doc.setTextColor(33, 33, 33);
    doc.setFont('helvetica', 'bold');
    doc.text('STUDENT INFORMATION', 15, 61);

    doc.setFont('helvetica', 'normal');
    doc.text(`Full Name: ${student.firstName} ${student.middleName || ''} ${student.lastName}`.trim(), 15, 67);
    doc.text(`Matriculation No: ${student.matricNumber}`, 15, 73);
    doc.text(`Programme: ${student.programme}`, 15, 79);
    doc.text(`Department: ${student.department}`, 15, 85);

    doc.text(`Academic Level: ${student.level}`, 130, 67);
    doc.text(`Academic Session: ${session}`, 130, 73);
    doc.text(`Semester: ${semester}`, 130, 79);
    doc.text(`Date Issued: ${currentDate}`, 130, 85);

    // Results Table: S/N | Course Code | Course Title | CU | Score | Grade | GP
    let startY = 92;
    doc.setFillColor(26, 26, 46);
    doc.rect(15, startY, pageWidth - 30, 7.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('S/N', 18, startY + 5);
    doc.text('Course Code', 28, startY + 5);
    doc.text('Course Title', 60, startY + 5);
    doc.text('CU', 130, startY + 5);
    doc.text('Score', 145, startY + 5);
    doc.text('Grade', 165, startY + 5);
    doc.text('GP', 182, startY + 5);

    startY += 7.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(33, 33, 33);

    semesterResults.forEach((res, index) => {
      const rowY = startY + (index * 7.5);
      // Alternating row background
      if (index % 2 === 1) {
        doc.setFillColor(245, 245, 245);
        doc.rect(15, rowY, pageWidth - 30, 7.5, 'F');
      }

      const totalScore = Number(res.totalScore || (Number(res.caScore || 0) + Number(res.examScore || 0)));
      const gp = typeof res.gradePoint === 'number' ? res.gradePoint : computeGrade(totalScore).gradePoint;

      doc.text(String(index + 1), 18, rowY + 5);
      doc.text(res.courseCode, 28, rowY + 5);
      doc.text(res.courseTitle.slice(0, 36), 60, rowY + 5);
      doc.text(String(res.creditUnit), 132, rowY + 5);
      doc.text(String(totalScore), 147, rowY + 5);
      
      doc.setFont('helvetica', 'bold');
      if (res.grade === 'F') {
        doc.setTextColor(244, 67, 54);
      } else {
        doc.setTextColor(33, 33, 33);
      }
      doc.text(res.grade, 167, rowY + 5);
      doc.setTextColor(232, 96, 28);
      doc.text(gp.toFixed(2), 182, rowY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(33, 33, 33);
    });

    const summaryY = startY + (semesterResults.length * 7.5) + 5;
    doc.setDrawColor(244, 123, 32);
    doc.setFillColor(254, 243, 199);
    doc.rect(15, summaryY, pageWidth - 30, 14, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(26, 26, 46);
    doc.text(`Total Units: ${currentSemesterUnits}`, 16, summaryY + 5.5);
    doc.text(`Total QP: ${currentSemesterQP.toFixed(1)}`, 50, summaryY + 5.5);
    doc.text(`Prev CGPA: ${summary.previousCgpaText || (summary.previousCgpa ? summary.previousCgpa.toFixed(2) : 'N/A')}`, 85, summaryY + 5.5);
    doc.text(`Sem GPA: ${currentSemesterGPA.toFixed(2)}`, 130, summaryY + 5.5);
    doc.text(`Cum CGPA: ${summary.cgpa.toFixed(2)}`, 165, summaryY + 5.5);

    doc.setFontSize(8);
    doc.setTextColor(232, 96, 28);
    doc.text(`Classification: ${summary.classification.toUpperCase()}`, 16, summaryY + 11);
    doc.text(`Academic Standing: ${summary.remark === 'Pass' ? 'GOOD STANDING (PASS)' : summary.remark}`, 120, summaryY + 11);

    // Academic Progression History Table in PDF
    let sigY = summaryY + 28;
    if (summary.progressionHistory && summary.progressionHistory.length > 0) {
      const histY = summaryY + 18;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(26, 26, 46);
      doc.text(`ACADEMIC PROGRESSION HISTORY (${(summary.programmeType || 'ND').toUpperCase()} PROGRAMME)`, 15, histY);

      // Header row
      doc.setFillColor(240, 240, 240);
      doc.rect(15, histY + 2, pageWidth - 30, 5, 'F');
      doc.setFontSize(7);
      doc.text('Level', 18, histY + 5.5);
      doc.text('Semester', 45, histY + 5.5);
      doc.text('Credit Units', 105, histY + 5.5);
      doc.text('Quality Points', 130, histY + 5.5);
      doc.text('GPA', 160, histY + 5.5);
      doc.text('Cumulative CGPA', 178, histY + 5.5);

      let curHistY = histY + 7;
      doc.setFont('helvetica', 'normal');
      summary.progressionHistory.forEach(item => {
        if (item.isCurrent) {
          doc.setFillColor(254, 243, 199);
          doc.rect(15, curHistY, pageWidth - 30, 4.5, 'F');
        }
        doc.text(item.level + (item.isCurrent ? ' *' : ''), 18, curHistY + 3.2);
        doc.text(item.semesterLabel, 45, curHistY + 3.2);
        doc.text(String(item.creditUnits), 105, curHistY + 3.2);
        doc.text(item.qualityPoints.toFixed(1), 130, curHistY + 3.2);
        doc.setFont('helvetica', 'bold');
        doc.text(item.gpa.toFixed(2), 160, curHistY + 3.2);
        doc.text(item.cgpa.toFixed(2), 178, curHistY + 3.2);
        doc.setFont('helvetica', 'normal');
        curHistY += 4.5;
      });

      sigY = curHistY + 10;
    }

    // Signatures Section
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);

    // Signatory 1: Exam Officer
    doc.line(20, sigY + 10, 65, sigY + 10);
    doc.text('Dr. (Mrs) F. Adeyemi', 20, sigY + 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Examination Officer', 20, sigY + 18);
    doc.text(`Date: ${currentDate}`, 20, sigY + 22);

    // Signatory 2: HOD
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.line(85, sigY + 10, 130, sigY + 10);
    doc.text('Dr. I. Al-Hassan', 85, sigY + 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Head of Department', 85, sigY + 18);
    doc.text(`Date: ${currentDate}`, 85, sigY + 22);

    // Signatory 3: Registrar
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.line(150, sigY + 10, 195, sigY + 10);
    doc.text('Barr. M. O. Danladi', 150, sigY + 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('College Registrar', 150, sigY + 18);
    doc.text(`Date: ${currentDate}`, 150, sigY + 22);

    // Security Footer
    doc.setFontSize(7.5);
    doc.setTextColor(130, 130, 130);
    doc.text(`Security Verification Ref: ${refCode} | Metrolane College Semester Result | Printed on: ${new Date().toLocaleString('en-GB')}`, pageWidth / 2, 285, { align: 'center' });

    doc.save(`Metrolane_Semester_Result_${student.matricNumber.replace(/\//g, '_')}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:rounded-none">
        {/* Modal Action Header (Hidden in Print) */}
        <div className="bg-gray-900 text-white px-6 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#F47B20]" />
            <span className="font-semibold text-sm">Official Semester Result Preview</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-1.5 text-xs font-semibold bg-[#F47B20] hover:bg-[#E8601C] text-white rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Official PDF
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="ml-2 text-gray-400 hover:text-white text-lg font-bold px-2 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div
          ref={printRef}
          className="p-8 md:p-12 overflow-y-auto relative bg-white text-[#212121] font-sans print:p-6"
        >
          {/* Watermark in Background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
            <MetrolaneLogo size={420} watermark />
          </div>

          {/* School Header with School Logo */}
          <div className="flex flex-col items-center text-center pb-6 border-b-2 border-[#1A1A2E]/20 relative z-10">
            <div className="mb-2">
              <MetrolaneLogo size={90} />
            </div>
            <h1 className="text-xl md:text-2xl font-black text-[#1A1A2E] tracking-tight uppercase">
              Metrolane College of Health, Science &amp; Technology
            </h1>
            <p className="text-xs md:text-sm italic font-medium text-[#757575] mt-0.5">
              "Compassion in Health, Precision in Science, Innovation in Technology"
            </p>
            <div className="mt-3 px-6 py-1 bg-[#F47B20]/10 border border-[#F47B20]/30 rounded-full inline-block">
              <span className="text-xs md:text-sm font-black uppercase text-[#E8601C] tracking-widest">
                Semester Result
              </span>
            </div>
          </div>

          {/* Student Profile Meta Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 text-xs md:text-sm border-b border-gray-200 relative z-10">
            <div>
              <span className="text-gray-500 block text-[11px] font-semibold uppercase">Student Name:</span>
              <span className="font-bold text-gray-900">{student.firstName} {student.middleName || ''} {student.lastName}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[11px] font-semibold uppercase">Matriculation No:</span>
              <span className="font-mono font-bold text-[#F47B20]">{student.matricNumber}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[11px] font-semibold uppercase">Programme:</span>
              <span className="font-semibold text-gray-800">{student.programme}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[11px] font-semibold uppercase">Level / Department:</span>
              <span className="font-semibold text-gray-800">{student.level} • {student.department}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[11px] font-semibold uppercase">Academic Session:</span>
              <span className="font-bold text-gray-900">{session}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[11px] font-semibold uppercase">Semester:</span>
              <span className="font-bold text-gray-900">{semester}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[11px] font-semibold uppercase">Clearance Status:</span>
              <span className="text-green-700 font-semibold inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Cleared
              </span>
            </div>
            <div>
              <span className="text-gray-500 block text-[11px] font-semibold uppercase">Date Issued:</span>
              <span className="font-medium text-gray-800">{currentDate}</span>
            </div>
          </div>

          {/* Results Table: S/N | Course Code | Course Title | CU | Score | Grade | GP */}
          <div className="my-6 overflow-x-auto relative z-10">
            {semesterResults.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <p className="text-sm font-semibold text-gray-600">No course results registered for this semester ({semester}, {session}).</p>
                <p className="text-xs text-gray-400 mt-1">Previous cumulative CGPA is preserved in records.</p>
              </div>
            ) : (
              <table className="w-full text-xs md:text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-[#1A1A2E] text-white uppercase text-[11px] tracking-wider">
                    <th className="py-2.5 px-3 rounded-l-md">S/N</th>
                    <th className="py-2.5 px-3">Course Code</th>
                    <th className="py-2.5 px-3">Course Title</th>
                    <th className="py-2.5 px-3 text-center">CU</th>
                    <th className="py-2.5 px-3 text-center">Score</th>
                    <th className="py-2.5 px-3 text-center">Grade</th>
                    <th className="py-2.5 px-3 text-center rounded-r-md">GP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {semesterResults.map((r, i) => {
                    const totalScore = Number(r.totalScore || (Number(r.caScore || 0) + Number(r.examScore || 0)));
                    const gp = typeof r.gradePoint === 'number' ? r.gradePoint : computeGrade(totalScore).gradePoint;

                    return (
                      <tr key={r.id || i} className={i % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="py-2 px-3 text-gray-500 font-medium">{i + 1}</td>
                        <td className="py-2 px-3 font-bold text-gray-800">{r.courseCode}</td>
                        <td className="py-2 px-3 font-medium text-gray-700">{r.courseTitle}</td>
                        <td className="py-2 px-3 text-center font-bold text-gray-800">{r.creditUnit}</td>
                        <td className="py-2 px-3 text-center font-bold text-gray-900">{totalScore}</td>
                        <td className="py-2 px-3 text-center font-black">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            r.grade === 'F' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {r.grade}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-[#E8601C]">
                          {gp.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Three Core Academic Performance Summary Cards */}
          <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-purple-50/60 border border-amber-200 rounded-xl p-4 my-6 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center mb-3">
              {/* Previous CGPA */}
              <div className="bg-white p-3 rounded-lg border border-amber-200 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-amber-800 block">Previous CGPA</span>
                <span className="text-xl font-black text-amber-900 font-mono mt-0.5 block">
                  {summary.previousCgpaText || (summary.previousCgpa ? summary.previousCgpa.toFixed(2) : 'N/A')}
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5">
                  {summary.previousCgpaText === 'N/A' ? 'First Semester Baseline' : 'Prior Completed Semesters'}
                </span>
              </div>

              {/* Current Semester GPA */}
              <div className="bg-white p-3 rounded-lg border border-orange-200 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-[#E8601C] block">Current Semester GPA</span>
                <span className="text-xl font-black text-[#E8601C] font-mono mt-0.5 block">{currentSemesterGPA.toFixed(2)}</span>
                <span className="text-[10px] text-gray-500 block mt-0.5">
                  {currentSemesterUnits} Credit Units • {currentSemesterQP.toFixed(1)} QP
                </span>
              </div>

              {/* Cumulative CGPA */}
              <div className="bg-white p-3 rounded-lg border border-purple-200 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-[#5B4FC4] block">Cumulative CGPA</span>
                <span className="text-xl font-black text-[#5B4FC4] font-mono mt-0.5 block">{summary.cgpa.toFixed(2)}</span>
                <span className="text-[10px] text-purple-700 font-bold block mt-0.5 uppercase">{summary.classification}</span>
              </div>
            </div>

            <div className="pt-2.5 border-t border-amber-200/60 flex items-center justify-between text-xs font-semibold px-2">
              <span className="text-gray-700">
                Academic Standing: <strong className="text-emerald-700 uppercase">{summary.remark === 'Pass' ? 'Good Standing' : summary.remark}</strong>
              </span>
              <span className="text-gray-700">
                Current Semester Units: <strong>{currentSemesterUnits} Units</strong> ({currentSemesterQP.toFixed(1)} Semester QP)
              </span>
            </div>
          </div>

          {/* Academic Progression History Section on Slip */}
          {summary.progressionHistory && summary.progressionHistory.length > 0 && (
            <div className="my-5 border border-gray-200 rounded-xl overflow-hidden relative z-10">
              <div className="bg-gray-100 px-3 py-1.5 text-[11px] font-black text-gray-700 uppercase tracking-wider flex justify-between items-center">
                <span>Academic Progression History ({summary.programmeType || 'ND'} Programme)</span>
                <span className="text-[10px] font-semibold text-gray-500">Official Progressive Record</span>
              </div>
              <table className="w-full text-[11px] text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 uppercase text-[9px] border-b border-gray-200 font-bold">
                    <th className="py-1.5 px-3">Level</th>
                    <th className="py-1.5 px-3">Semester</th>
                    <th className="py-1.5 px-3 text-center">Units</th>
                    <th className="py-1.5 px-3 text-center">Quality Points</th>
                    <th className="py-1.5 px-3 text-center">Semester GPA</th>
                    <th className="py-1.5 px-3 text-center">Cumulative CGPA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {summary.progressionHistory.map((item, idx) => (
                    <tr key={idx} className={item.isCurrent ? 'bg-orange-50/20 font-bold' : ''}>
                      <td className="py-1.5 px-3 font-bold text-gray-900">{item.level}</td>
                      <td className="py-1.5 px-3 text-gray-700">{item.semesterLabel}</td>
                      <td className="py-1.5 px-3 text-center">{item.creditUnits}</td>
                      <td className="py-1.5 px-3 text-center text-gray-600">{item.qualityPoints.toFixed(1)}</td>
                      <td className="py-1.5 px-3 text-center font-mono font-bold text-[#E8601C]">{item.gpa.toFixed(2)}</td>
                      <td className="py-1.5 px-3 text-center font-mono font-black text-[#5B4FC4]">{item.cgpa.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Digital Signatures Section (Three Authorized Signatories) */}
          <div className="pt-8 pb-4 border-t-2 border-gray-200 grid grid-cols-3 gap-6 text-center text-xs relative z-10">
            {/* 1. Examination Officer */}
            <div className="flex flex-col items-center">
              <div className="h-14 flex items-end justify-center mb-1">
                {examOfficerSig?.signatureImage ? (
                  <img src={examOfficerSig.signatureImage} alt="Exam Officer Sig" className="h-11 max-w-[140px] object-contain" />
                ) : (
                  <div className="italic text-gray-400 font-serif text-sm">Folashade A.</div>
                )}
              </div>
              <div className="w-4/5 border-b border-gray-400 mb-1" />
              <span className="font-bold text-gray-900">Dr. (Mrs) F. Adeyemi</span>
              <span className="text-gray-500 text-[11px]">Examination Officer</span>
              <span className="text-gray-400 text-[10px]">{currentDate}</span>
            </div>

            {/* 2. Head of Department */}
            <div className="flex flex-col items-center">
              <div className="h-14 flex items-end justify-center mb-1">
                {hodSig?.signatureImage ? (
                  <img src={hodSig.signatureImage} alt="HOD Sig" className="h-11 max-w-[140px] object-contain" />
                ) : (
                  <div className="italic text-gray-400 font-serif text-sm">I. Al-Hassan</div>
                )}
              </div>
              <div className="w-4/5 border-b border-gray-400 mb-1" />
              <span className="font-bold text-gray-900">Dr. Ibrahim Al-Hassan</span>
              <span className="text-gray-500 text-[11px]">Head of Department</span>
              <span className="text-gray-400 text-[10px]">{currentDate}</span>
            </div>

            {/* 3. College Registrar */}
            <div className="flex flex-col items-center">
              <div className="h-14 flex items-end justify-center mb-1">
                {registrarSig?.signatureImage ? (
                  <img src={registrarSig.signatureImage} alt="Registrar Sig" className="h-11 max-w-[140px] object-contain" />
                ) : (
                  <div className="italic text-gray-400 font-serif text-sm">M. O. Danladi</div>
                )}
              </div>
              <div className="w-4/5 border-b border-gray-400 mb-1" />
              <span className="font-bold text-gray-900">Barr. M. O. Danladi</span>
              <span className="text-gray-500 text-[11px]">College Registrar</span>
              <span className="text-gray-400 text-[10px]">{currentDate}</span>
            </div>
          </div>

          {/* Security & Verification Ref Footer */}
          <div className="mt-8 pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 relative z-10">
            <span>Printed on: {new Date().toLocaleString('en-GB')}</span>
            <span className="font-mono font-semibold text-gray-500">Security Ref: {refCode}</span>
            <span>Metrolane Academic Management System</span>
          </div>
        </div>
      </div>
    </div>
  );
};
