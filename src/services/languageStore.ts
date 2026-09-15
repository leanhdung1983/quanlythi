
import { create } from 'zustand';

type Language = 'en' | 'vi';

interface LanguageState {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  // Sidebar
  'dashboard': { en: 'Dashboard', vi: 'Tổng quan' },
  'id6_metadata': { en: 'ID6 Metadata', vi: 'Dữ liệu ID6' },
  'question_bank': { en: 'Question Bank', vi: 'Ngân hàng câu hỏi' },
  'ai_assigner': { en: 'AI ID Assigner', vi: 'Gán ID tự động' },
  'exam_matrix': { en: 'Exam Matrix', vi: 'Ma trận đề thi' },
  'ai_converter': { en: 'PDF to LaTeX (AI)', vi: 'Chuyển đổi PDF -> LaTeX' },
  'online_exam': { en: 'Online Exam', vi: 'Thi Trực Tuyến' }, // NEW
  'tools': { en: 'Tools', vi: 'Công cụ' },
  'data_mgmt': { en: 'Data Management', vi: 'Quản lý dữ liệu' },
  'error_manager': { en: 'Error Manager', vi: 'Quản lý báo lỗi' }, // NEW

  // Online Exam
  'oe_title': { en: 'Online Exam System', vi: 'Hệ thống Thi Trực Tuyến' },
  'oe_subtitle': { en: 'Create, manage, and take exams with automatic grading.', vi: 'Tạo, quản lý và làm bài thi với hệ thống chấm điểm tự động.' },
  'oe_create_matrix': { en: 'Create New Matrix', vi: 'Tạo Ma trận mới' },
  'oe_saved_matrices': { en: 'Saved Matrices', vi: 'Ma trận đã lưu' },
  'oe_start_exam': { en: 'Start Exam', vi: 'Bắt đầu làm bài' },
  'oe_questions_count': { en: 'Questions', vi: 'Câu hỏi' },
  'oe_submit': { en: 'Submit Exam', vi: 'Nộp bài' },
  'oe_score': { en: 'Your Score', vi: 'Điểm số của bạn' },
  'oe_review': { en: 'Review Answers', vi: 'Xem lại bài làm' },
  'oe_correct': { en: 'Correct', vi: 'Đúng' },
  'oe_incorrect': { en: 'Incorrect', vi: 'Sai' },
  'oe_unanswered': { en: 'Unanswered', vi: 'Chưa làm' },
  'oe_solution': { en: 'Detailed Solution', vi: 'Lời giải chi tiết' },
  'oe_confirm_submit': { en: 'Are you sure you want to submit?', vi: 'Bạn có chắc chắn muốn nộp bài không?' },
  'oe_save_matrix_name': { en: 'Matrix Name', vi: 'Tên ma trận' },
  'oe_save_success': { en: 'Matrix saved successfully', vi: 'Lưu ma trận thành công' },
  'oe_correct_count': { en: 'Correct Count', vi: 'Số câu đúng' },
  'oe_total_questions': { en: 'Total Questions', vi: 'Tổng số câu' },
  'oe_report_error': { en: 'Report Error', vi: 'Báo lỗi câu hỏi' }, // NEW
  'oe_report_modal_title': { en: 'Report Question Error', vi: 'Báo cáo lỗi câu hỏi' }, // NEW
  'oe_report_reason': { en: 'Reason', vi: 'Lý do báo lỗi' }, // NEW
  'oe_report_submit': { en: 'Submit Report', vi: 'Gửi báo cáo' }, // NEW
  'oe_report_success': { en: 'Report submitted successfully!', vi: 'Đã gửi báo lỗi thành công!' }, // NEW
  'oe_settings_title': { en: 'Exam Settings', vi: 'Cấu hình thi' },
  'oe_mode': { en: 'Exam Mode', vi: 'Chế độ thi' },
  'oe_mode_practice': { en: 'Practice (Unlimited)', vi: 'Thi thử (Tự do)' },
  'oe_mode_real': { en: 'Real Exam (Scheduled)', vi: 'Thi thật (Có giới hạn)' },
  'oe_start_time': { en: 'Start Time', vi: 'Thời gian mở đề' },
  'oe_end_time': { en: 'End Time', vi: 'Thời gian đóng đề' },
  'oe_max_attempts': { en: 'Max Attempts (0 = Unlimited)', vi: 'Số lần làm bài (0 = KGH)' },
  'oe_duration': { en: 'Duration (minutes)', vi: 'Thời gian làm bài (phút)' },
  'oe_status_upcoming': { en: 'Upcoming', vi: 'Sắp diễn ra' },
  'oe_status_live': { en: 'Happening Now', vi: 'Đang diễn ra' },
  'oe_status_ended': { en: 'Ended', vi: 'Đã kết thúc' },
  'oe_attempts_left': { en: 'Attempts left', vi: 'Số lần còn lại' },
  'oe_view_stats': { en: 'View Stats', vi: 'Xem thống kê' },
  'oe_stats_matrix_select': { en: 'Select Exam Matrix', vi: 'Chọn Đề thi cần xem' },

  // Dashboard General
  'dashboard_overview': { en: 'Dashboard Overview', vi: 'Tổng quan hệ thống' },
  'system_online': { en: 'System Online', vi: 'Hệ thống hoạt động' },
  'add_questions': { en: 'Add Questions', vi: 'Thêm câu hỏi' },
  'connection_error': { en: 'Connection Error', vi: 'Lỗi kết nối' },
  'connection_error_desc': { en: 'Could not retrieve data from the server. Please check your backend connection.', vi: 'Không thể lấy dữ liệu từ máy chủ. Vui lòng kiểm tra kết nối backend.' },

  // Dashboard Stats
  'total_questions': { en: 'Total Questions', vi: 'Tổng số câu hỏi' },
  'added_recently': { en: 'added recently', vi: 'mới thêm gần đây' },
  'id6_definitions': { en: 'ID6 Definitions', vi: 'Định nghĩa ID6' },
  'unique_types': { en: 'Unique Types', vi: 'Dạng bài khác nhau' },
  'curriculum_units': { en: 'Curriculum Units', vi: 'Bài học (Units)' },
  'across_chapters': { en: 'Across Chapters', vi: 'Trên tổng số chương' },
  'avg_coverage': { en: 'Avg. Coverage', vi: 'Độ phủ trung bình' },
  'questions_per_id': { en: 'Questions per ID', vi: 'Câu hỏi / 1 Mã ID' },

  // Dashboard Charts & Lists
  'cognitive_levels': { en: 'Cognitive Levels', vi: 'Mức độ nhận thức' },
  'total': { en: 'Total', vi: 'Tổng cộng' },
  'grade_breakdown': { en: 'Grade Breakdown', vi: 'Phân bố câu hỏi theo khối lớp' },
  'database_status': { en: 'Database Status', vi: 'Trạng thái CSDL' },
  'db_status_detail': { en: 'Currently managing questions across knowledge identifiers.', vi: 'Đang quản lý hệ thống câu hỏi trên nhiều mã kiến thức khác nhau.' },
  'quick_actions': { en: 'Quick Actions', vi: 'Phím tắt nhanh' },
  'recent_activity': { en: 'Recent Activity', vi: 'Hoạt động gần đây' },
  'view_all': { en: 'View All', vi: 'Xem tất cả' },
  
  // Quick Actions Cards
  'gen_matrix_title': { en: 'Generate Matrix', vi: 'Tạo ma trận đề' },
  'gen_matrix_desc': { en: 'Create random exams from matrix', vi: 'Sinh đề ngẫu nhiên từ cấu trúc' },
  'ai_assigner_desc': { en: 'Auto-tag LaTeX files with ID6', vi: 'Gán nhãn file LaTeX tự động' },
  'meta_manager_title': { en: 'Metadata Manager', vi: 'Quản lý Metadata' },
  'meta_manager_desc': { en: 'Define new chapters & types', vi: 'Định nghĩa chương & dạng bài' },

  // Recent Table
  'tbl_id_code': { en: 'ID Code', vi: 'Mã ID' },
  'tbl_status': { en: 'Status', vi: 'Trạng thái' },
  'tbl_date': { en: 'Date Added', vi: 'Ngày thêm' },
  'tbl_active': { en: 'Active', vi: 'Hoạt động' },
  'tbl_no_data': { en: 'No recent activity recorded.', vi: 'Chưa có hoạt động nào gần đây.' },

  // Exam Generator
  'matrix_selection': { en: 'Matrix Selection', vi: 'Chọn cấu trúc ma trận' },
  'total_label': { en: 'Total', vi: 'Tổng' },
  'gen_btn_generating': { en: 'Prioritizing & Generating...', vi: 'Đang xử lý & Sinh đề...' },
  'gen_btn_generate': { en: 'Generate Randomized Exam', vi: 'Xuất đề thi ngẫu nhiên' },
  'latex_output': { en: 'LaTeX Output', vi: 'Kết quả LaTeX' },
  'download_tex': { en: 'Download .tex', vi: 'Tải file .tex' },
  'matrix_placeholder_1': { en: 'Select detailed types from the tree.', vi: 'Vui lòng chọn chi tiết các dạng bài từ danh sách bên trái.' },
  'matrix_placeholder_2': { en: 'Switch tabs to select Multiple Choice, True/False, etc.', vi: 'Chuyển đổi giữa các Tab (TN, Đúng/Sai,...) để chọn số lượng câu hỏi.' },
  'col_type_desc': { en: 'Type Description', vi: 'Mô tả dạng bài' },
  'exam_matrix_title': { en: 'Exam Matrix Generator', vi: 'Bộ Sinh Đề Thi Ma Trận' },
  
  // Exam Generator Tabs
  'tab_tn': { en: 'Multiple Choice', vi: 'Trắc nghiệm' },
  'tab_tf': { en: 'True/False', vi: 'Đúng Sai' },
  'tab_kq': { en: 'Short Ans', vi: 'Trả lời ngắn' },
  'tab_tl': { en: 'Essay', vi: 'Tự luận' },
  'active_tab_total': { en: 'Total for Tab', vi: 'Tổng số câu (Tab này)' },
  
  // IdAssigner
  'assign_title': { en: 'AI ID Assigner', vi: 'Công cụ Gán ID' },
  'assign_subtitle': { en: 'Upload raw LaTeX files and construct ID6 codes automatically.', vi: 'Tải lên file LaTeX thô và tạo mã ID6 tự động.' },
  'upload_btn': { en: 'Browse File', vi: 'Chọn File' },
  'questions_list': { en: 'Questions List', vi: 'Danh sách câu hỏi' },
  'click_edit': { en: 'Click to edit', vi: 'Chọn để sửa' },
  'prev': { en: 'Previous', vi: 'Câu trước' },
  'next': { en: 'Next Question', vi: 'Câu tiếp theo' },
  'export': { en: 'Export Result', vi: 'Xuất file' },
  'ai_suggest': { en: 'AI Suggest', vi: 'AI Gợi ý' },
  'builder_title': { en: 'ID Builder', vi: 'Bộ tạo ID thủ công' },
  'manual_id': { en: 'Assigned ID', vi: 'Mã ID đã gán' },
  'upload_instruction_title': { en: 'Upload .TeX File', vi: 'Tải lên file .TeX' },
  'upload_instruction_desc': { en: 'File must contain questions in', vi: 'File phải chứa câu hỏi trong môi trường' },
  'no_questions_found': { en: 'No \\begin{ex} questions found.', vi: 'Không tìm thấy câu hỏi \\begin{ex} nào.' },
  'question_num': { en: 'Question', vi: 'Câu' },
  'no_id': { en: 'No ID', vi: 'Chưa có ID' },
  'ai_reasoning': { en: 'AI Reasoning', vi: 'AI Lập luận' },
  'latex_preview': { en: 'LaTeX Content Preview', vi: 'Xem trước nội dung LaTeX' },
  
  // Validation
  'id_found': { en: 'ID exists in Database', vi: 'ID hợp lệ (Có trong CSDL)' },
  'id_not_found': { en: 'ID not found in DB', vi: 'ID chưa có trong CSDL (Cần kiểm tra)' },
  
  // Builder Fields & Options
  'class': { en: 'Grade', vi: 'Lớp' },
  'subject': { en: 'Subject', vi: 'Môn' },
  'chapter': { en: 'Chapter', vi: 'Chương' },
  'unit': { en: 'Unit', vi: 'Bài' },
  'level': { en: 'Level', vi: 'Mức độ' },
  'type_count': { en: 'Type (Description)', vi: 'Dạng toán (Mô tả)' },
  'switch_manual': { en: 'Type Manually', vi: 'Nhập tay' },
  'switch_select': { en: 'Select from List', vi: 'Chọn từ DS' },
  
  // Values / Prefixes
  'grade_6': { en: 'Grade 6', vi: 'Lớp 6' },
  'grade_7': { en: 'Grade 7', vi: 'Lớp 7' },
  'grade_8': { en: 'Grade 8', vi: 'Lớp 8' },
  'grade_9': { en: 'Grade 9', vi: 'Lớp 9' },
  'grade_10': { en: 'Grade 10', vi: 'Lớp 10' },
  'grade_11': { en: 'Grade 11', vi: 'Lớp 11' },
  'grade_12': { en: 'Grade 12', vi: 'Lớp 12' },
  'sub_alg': { en: 'Algebra', vi: 'Đại số' },
  'sub_geo': { en: 'Geometry', vi: 'Hình học' },
  'sub_cd': { en: 'Subject Specialized', vi: 'Chuyên đề' },
  'lvl_nb': { en: 'Recognize (N)', vi: 'Nhận biết (N)' },
  'lvl_th': { en: 'Understand (H)', vi: 'Thông hiểu (H)' },
  'lvl_vd': { en: 'Apply (V)', vi: 'Vận dụng (V)' },
  'lvl_vdc': { en: 'High Apply (C)', vi: 'Vận dụng cao (C)' },
  
  'prefix_chapter': { en: 'Chapter', vi: 'Chương' },
  'prefix_unit': { en: 'Unit', vi: 'Bài' },
  'prefix_type': { en: 'Type', vi: 'Dạng' },
  'no_data_type': { en: 'No data available', vi: 'Chưa có dữ liệu' },

  // Metadata Manager
  'meta_title': { en: 'ID6 Metadata Database', vi: 'Cơ sở dữ liệu ID6 Metadata' },
  'meta_subtitle': { en: 'View and manage metadata definitions and check available question stock.', vi: 'Xem, quản lý định nghĩa mã kiến thức và kiểm tra kho câu hỏi.' },
  'add_manual': { en: 'Add ID Manually', vi: 'Thêm ID thủ công' },
  'import_file': { en: 'Import File', vi: 'Nhập từ file' },
  'define_new': { en: 'Define New Metadata ID', vi: 'Định nghĩa ID mới' },
  'count_stt': { en: 'Count (STT)', vi: 'Số thứ tự (STT)' },
  'desc_input': { en: 'Description (Content)', vi: 'Mô tả nội dung kiến thức' },
  'preview_id': { en: 'Preview ID', vi: 'Xem trước ID' },
  'confirm_save': { en: 'Confirm & Save to DB', vi: 'Lưu vào CSDL' },
  'import_preview': { en: 'Import Preview', vi: 'Xem trước khi nhập' },
  'parse_content': { en: 'Parse Content', vi: 'Phân tích nội dung' },
  'confirm_import': { en: 'Confirm Import', vi: 'Xác nhận nhập' },
  'db_records': { en: 'Database Records', vi: 'Danh sách bản ghi' },
  'search_placeholder': { en: 'Search ID or description...', vi: 'Tìm kiếm ID hoặc mô tả...' },
  'filter_grade_all': { en: 'Grade (All)', vi: 'Khối Lớp (Tất cả)' },
  'filter_chapter_all': { en: 'Chapter (All)', vi: 'Chương (Tất cả)' },
  'filter_unit_all': { en: 'Unit (All)', vi: 'Bài (Tất cả)' },
  'col_desc': { en: 'Description', vi: 'Mô tả' },
  'col_qty': { en: 'Qty', vi: 'SL' },
  'col_used': { en: 'Used', vi: 'Đã dùng' },
  'col_actions': { en: 'Actions', vi: 'Thao tác' },
  'backup_id6': { en: 'Backup ID6 Structure', vi: 'Sao lưu Cấu trúc ID6' },
  'restore_id6': { en: 'Restore ID6 Structure', vi: 'Phục hồi Cấu trúc ID6' },
  'backup_full': { en: 'Backup Full DB', vi: 'Sao lưu Toàn bộ CSDL' },
  'restore_full': { en: 'Restore Full DB', vi: 'Phục hồi Toàn bộ CSDL' },

  // Question Bank
  'qb_subtitle': { en: 'Manage, filter, and review your LaTeX questions.', vi: 'Quản lý, lọc và xem lại kho câu hỏi LaTeX.' },
  'import_questions': { en: 'Import Questions', vi: 'Nhập câu hỏi' },
  'upload_files': { en: 'Upload Files', vi: 'Tải file lên' },
  'validate_import': { en: 'Validate & Import', vi: 'Kiểm tra & Nhập' },
  'invalid_ids': { en: 'Invalid IDs', vi: 'ID không hợp lệ' },
  'download_invalid': { en: 'Download', vi: 'Tải về' },
  'retry': { en: 'Retry', vi: 'Thử lại' },
  'cancel': { en: 'Cancel', vi: 'Hủy' },
  'details': { en: 'Details', vi: 'Chi tiết' },
  'save': { en: 'Save', vi: 'Lưu' },
  'edit_full_id': { en: 'Edit Full ID:', vi: 'Sửa mã ID:' },
  'select_question': { en: 'Select a question', vi: 'Chọn một câu hỏi' },
  'filter_subject_all': { en: 'Subject (All)', vi: 'Môn (Tất cả)' },
  'filter_level_all': { en: 'Level (All)', vi: 'Mức độ (Tất cả)' },
  'no_matching_questions': { en: 'No matching questions.', vi: 'Không tìm thấy câu hỏi phù hợp.' },
  'delete_confirm': { en: 'Delete this question?', vi: 'Bạn có chắc muốn xóa câu hỏi này?' },
  'export_filtered': { en: 'Export Filtered (.tex)', vi: 'Xuất kết quả lọc (.tex)' },
  
  // Database Tools
  'backup_db': { en: 'Backup DB', vi: 'Sao lưu CSDL' },
  'restore_db': { en: 'Restore DB', vi: 'Phục hồi CSDL' },
  'backup_q': { en: 'Backup Questions', vi: 'Sao lưu Câu Hỏi' },
  'restore_q': { en: 'Restore Questions', vi: 'Phục hồi Câu Hỏi' },
  'delete_all_q': { en: 'Delete All Questions', vi: 'Xoá Hết Câu Hỏi' },
  'confirm_delete_all': { en: 'DANGER: Are you sure you want to DELETE ALL QUESTIONS? This action cannot be undone and will reset used counts.', vi: 'CẢNH BÁO: Bạn có chắc chắn muốn XOÁ TOÀN BỘ CÂU HỎI không? Hành động này không thể hoàn tác và sẽ reset số lần sử dụng.' },
  'confirm_restore': { en: 'DANGER: This will OVERWRITE your current database with the backup file. Continue?', vi: 'CẢNH BÁO: Hành động này sẽ GHI ĐÈ toàn bộ dữ liệu hiện tại bằng file backup. Bạn có muốn tiếp tục?' },
  'confirm_restore_questions': { en: 'DANGER: This will DELETE ALL EXISTING QUESTIONS and import from backup. Continue?', vi: 'CẢNH BÁO: Hành động này sẽ XÓA HẾT CÂU HỎI HIỆN TẠI và nạp lại từ file backup. Bạn có muốn tiếp tục?' },
  'success_backup': { en: 'Backup downloaded successfully.', vi: 'Tải file sao lưu thành công.' },
  'success_restore': { en: 'Database restored successfully.', vi: 'Phục hồi dữ liệu thành công.' },
  'success_delete_all': { en: 'All questions deleted and stats reset.', vi: 'Đã xoá sạch câu hỏi và reset thống kê.' },
};

export const useLanguageStore = create<LanguageState>((set, get) => ({
  lang: 'vi', // Default to Vietnamese
  setLang: (l) => set({ lang: l }),
  t: (key) => {
    const l = get().lang;
    const item = translations[key];
    if (!item) return key;
    return item[l];
  }
}));
