import React, { useState, useEffect } from 'react';
import { Users, Search, RefreshCw, Mail, Phone, Calendar, CheckCircle2, Award } from 'lucide-react';
import { dashboardApi } from '../../../api/dashboardAndAiApi';
import PageLoader from '../../../components/PageLoader';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchStudents = () => {
    setLoading(true);
    dashboardApi.getAdminStudents()
      .then((res) => {
        if (res?.data) setStudents(res.data);
      })
      .catch((err) => console.error('Lỗi lấy danh sách học viên:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filtered = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
              Quản Trị Học Viên
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
            Danh Sách Học Viên & Tiến Độ
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Theo dõi quá trình học tập, tỷ lệ ghi nhớ và độ chuyên cần của từng học viên
          </p>
        </div>

        <button
          onClick={fetchStudents}
          className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all"
          title="Tải lại danh sách"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Filter and Stats Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên học viên hoặc email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span>Tổng số: <strong className="text-slate-800 dark:text-slate-200 font-bold">{students.length}</strong> học viên</span>
        </div>
      </div>

      {/* Students Table Card */}
      <div className="glass-card rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        {loading ? (
          <div className="py-12">
            <PageLoader />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold tracking-wider">
                  <th className="py-3.5 px-6">Học Viên</th>
                  <th className="py-3.5 px-6">Liên Hệ</th>
                  <th className="py-3.5 px-6 text-center">Đề Tham Gia</th>
                  <th className="py-3.5 px-6 text-center">Câu Đã Nhớ</th>
                  <th className="py-3.5 px-6 text-center">Tỷ Lệ Ghi Nhớ</th>
                  <th className="py-3.5 px-6 text-center">Đăng Nhập Gần Nhất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filtered.map((student) => (
                  <tr key={student.userId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
                        {student.fullName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">{student.fullName}</h4>
                        <span className="text-[11px] text-slate-400">Tham gia: {new Date(student.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-slate-500 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                        <Mail size={13} className="text-slate-400" />
                        <span>{student.email}</span>
                      </div>
                      {student.phoneNumber && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <Phone size={12} />
                          <span>{student.phoneNumber}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-6 text-center">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {student.testsEnrolled} đề
                      </span>
                    </td>

                    <td className="py-4 px-6 text-center font-bold text-green-600 dark:text-green-400">
                      {student.confidentQuestions} câu
                    </td>

                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300 border border-green-200/50 dark:border-green-900/50">
                        <Award size={13} /> {student.masteryRate}%
                      </div>
                    </td>

                    <td className="py-4 px-6 text-center text-slate-400 text-xs">
                      {student.lastLoginAt 
                        ? new Date(student.lastLoginAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
                        : 'Chưa đăng nhập'}
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Không tìm thấy học viên nào phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
