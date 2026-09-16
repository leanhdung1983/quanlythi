
import { ParsedData, Question, ID6Metadata, Chapter, Unit, SavedMatrix, OnlineQuestion, UserFeedback, QuestionReport } from '../types';
import { handleSessionExpired } from './authStore';

// Trên Vercel, '/api' sẽ được proxy. Localhost sẽ dùng cấu hình proxy trong vite.config.
const API_URL = '/api';

const handleResponse = async (response: Response, endpoint: string) => {
    const contentType = response.headers.get("content-type");
    if (!response.ok) {
        let errorMessage = `Lỗi ${response.status}: ${response.statusText}`;
        try {
            const text = await response.text();
            if (contentType && contentType.includes("application/json")) {
                const json = JSON.parse(text);
                errorMessage = json.message || json.error || errorMessage;
            } else if (text.trim().startsWith('<')) {
                errorMessage = `Server Error (${response.status}). Vui lòng kiểm tra console Backend.`;
            } else {
                errorMessage = text || errorMessage;
            }
        } catch { }
        console.error(`API Error at ${endpoint}:`, errorMessage);

        // Khi gặp mã 401 từ bất kỳ endpoint nào (ngoại trừ /login khi sai mật khẩu)
        // -> Phiên làm việc đã hết hạn hoặc cookie không còn hợp lệ. Tự động chuyển về màn hình đăng nhập!
        if (response.status === 401 && endpoint !== '/login' && endpoint !== '/api/login') {
            handleSessionExpired(errorMessage);
        }

        throw Object.assign(new Error(errorMessage), { status: response.status });
    }
    if (contentType && contentType.includes("application/json")) return response.json();
    return response.text();
};

export const apiService = {
    async fetchStats() {
        const res = await fetch(`${API_URL}/stats`); 
        const result = await handleResponse(res, '/stats'); 
        return result.data; 
    },
    async fetchStudentDashboardStats(userId: number) {
        const res = await fetch(`${API_URL}/users/${userId}/dashboard-stats`);
        const result = await handleResponse(res, `/users/${userId}/dashboard-stats`);
        return result.data;
    },
    async fetchMetadata() {
        const res = await fetch(`${API_URL}/metadata`);
        const r = await handleResponse(res, '/metadata');
        return r.data as ID6Metadata[];
    },
    async fetchChapters() {
        const res = await fetch(`${API_URL}/chapters`); 
        const r = await handleResponse(res, '/chapters'); 
        return r.data as Chapter[];
    },
    async fetchUnits() {
        const res = await fetch(`${API_URL}/units`); 
        const r = await handleResponse(res, '/units'); 
        return r.data as Unit[];
    },
    async createChapter(data: { gradeCode: string; subjectCode: string; chapter_number: number; name: string }) {
        const res = await fetch(`${API_URL}/admin/chapters`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await handleResponse(res, '/admin/chapters');
    },
    async createUnit(data: { chapter_id: number; unit_number: number; name: string }) {
        const res = await fetch(`${API_URL}/admin/units`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await handleResponse(res, '/admin/units');
    },
    async deleteUnit(id: number) {
        const res = await fetch(`${API_URL}/admin/units/${id}`, {
            method: 'DELETE'
        });
        return await handleResponse(res, `/admin/units/${id}`);
    },
    async deleteChapter(id: number) {
        const res = await fetch(`${API_URL}/admin/chapters/${id}`, {
            method: 'DELETE'
        });
        return await handleResponse(res, `/admin/chapters/${id}`);
    },
    async generateCurriculum(gradeCode: string, subjectCode: string) {
        const res = await fetch(`${API_URL}/admin/ai/generate-curriculum`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gradeCode, subjectCode })
        });
        return await handleResponse(res, '/admin/ai/generate-curriculum');
    },
    async generateLessonSections(unit_id: number, unit_name: string, chapter_name: string, gradeCode: string, subjectCode: string) {
        const res = await fetch(`${API_URL}/admin/ai/generate-lesson-sections`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ unit_id, unit_name, chapter_name, gradeCode, subjectCode })
        });
        return await handleResponse(res, '/admin/ai/generate-lesson-sections');
    },
    async fetchLessonSections(unitId?: number, _userId?: number) {
        void _userId;
        const url = unitId ? `${API_URL}/lesson-sections?unit_id=${unitId}` : `${API_URL}/lesson-sections`;
        const res = await fetch(url);
        const r = await handleResponse(res, '/lesson-sections');
        return r.data;
    },
    async fetchUnitPractice(unitId: number) {
        const res = await fetch(`${API_URL}/units/${unitId}/practice`);
        const r = await handleResponse(res, `/units/${unitId}/practice`);
        return r.data;
    },
    async saveLessonSection(data: Record<string, unknown> & { id?: number }) {
        const url = data.id ? `${API_URL}/admin/lesson-sections/${data.id}` : `${API_URL}/admin/lesson-sections`;
        const method = data.id ? 'PUT' : 'POST';
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await handleResponse(res, '/admin/lesson-sections');
    },
    async deleteLessonSection(id: number) {
        const res = await fetch(`${API_URL}/admin/lesson-sections/${id}`, { method: 'DELETE' });
        return await handleResponse(res, `/admin/lesson-sections/${id}`);
    },
    async fetchUserLessonProgress(userId: number) {
        const res = await fetch(`${API_URL}/user/lesson-progress/${userId}`);
        const r = await handleResponse(res, `/user/lesson-progress/${userId}`);
        return r.data;
    },
    async updateUserLessonProgress(data: { user_id: number, section_id: number, is_completed: boolean, score: number }) {
        const res = await fetch(`${API_URL}/user/lesson-progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ section_id: data.section_id, is_completed: data.is_completed, score: data.score })
        });
        return await handleResponse(res, '/user/lesson-progress');
    },
    async fetchQuestionsByIds(ids: number[]) {
        const response = await fetch(`${API_URL}/questions/by-ids`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids })
        });
        const r = await handleResponse(response, '/questions/by-ids');
        return r.data;
    },
    async fetchQuestions(params?: { 
        limit?: number, 
        unclassified?: boolean, 
        search?: string,
        grade?: string,
        subject?: string,
        chapter?: string | number,
        unit?: string | number,
        level?: string,
        type?: string,
        q_type?: string
    }) {
        let query = '?';
        if (params?.limit !== undefined) query += `limit=${params.limit}&`;
        if (params?.unclassified) query += `unclassified=true&`;
        if (params?.search) query += `search=${encodeURIComponent(params.search)}&`;
        if (params?.grade !== undefined) query += `grade=${params.grade}&`;
        if (params?.subject) query += `subject=${params.subject}&`;
        if (params?.chapter !== undefined) query += `chapter=${params.chapter}&`;
        if (params?.unit !== undefined) query += `unit=${params.unit}&`;
        if (params?.level) query += `level=${params.level}&`;
        if (params?.type) query += `type=${params.type}&`;
        if (params?.q_type) query += `q_type=${params.q_type}&`;
        
        const res = await fetch(`${API_URL}/questions${query}`); 
        return await handleResponse(res, '/questions'); 
    },
    async importQuestions(questions: Partial<Question>[], _created_by?: number, _created_by_name?: string) {
        void _created_by; void _created_by_name;
        const response = await fetch(`${API_URL}/questions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questions }), }); 
        return await handleResponse(response, '/questions');
    },
    async updateQuestion(id: number, data: Partial<Question>) {
        const response = await fetch(`${API_URL}/questions/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), }); 
        return await handleResponse(response, `/questions/${id}`);
    },
    async deleteQuestion(id: number, _user_id?: number) {
        void _user_id;
        const response = await fetch(`${API_URL}/questions/${id}`, { method: 'DELETE' }); 
        return await handleResponse(response, `/questions/${id}`);
    },
    async fetchTreeData() {
        const res = await fetch(`${API_URL}/tree-data`); 
        const r = await handleResponse(res, '/tree-data'); 
        return r.data;
    },
    async generateExamMatrix(params: unknown) {
        const payload = (params && typeof params === 'object' && ('matrix' in params || 'matrix_id' in params))
            ? params
            : { matrix: params };
        const response = await fetch(`${API_URL}/generate-exam-matrix`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload), 
        }); 
        return await handleResponse(response, '/generate-exam-matrix');
    },
    async addMetadata(data: ID6Metadata) {
        const response = await fetch(`${API_URL}/metadata`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
        return await handleResponse(response, '/metadata');
    },
    async updateMetadata(id_full: string, description: string) {
        const response = await fetch(`${API_URL}/metadata/${id_full}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ description }) });
        return await handleResponse(response, `/metadata/${id_full}`);
    },
    async deleteMetadata(id_full: string) {
        const response = await fetch(`${API_URL}/metadata/${id_full}`, { method: 'DELETE' });
        return await handleResponse(response, `/metadata/${id_full}`);
    },
    async importMetadata(data: ParsedData) {
        const response = await fetch(`${API_URL}/import-metadata`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
        return await handleResponse(response, '/import-metadata');
    },
    async checkSession() {
        const response = await fetch(`${API_URL}/me`);
        const result = await handleResponse(response, '/me');
        return result.user || result.data;
    },
    async login(username: string, password: string) {
        const response = await fetch(`${API_URL}/login`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ username, password }) }); 
        return await handleResponse(response, '/login');
    },
    async register(data: unknown) {
        const response = await fetch(`${API_URL}/register`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) }); 
        return await handleResponse(response, '/register');
    },
    async forgotPassword(email: string) {
        const response = await fetch(`${API_URL}/forgot-password`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ email }) }); 
        return await handleResponse(response, '/forgot-password');
    },
    async fetchUsers() {
        const res = await fetch(`${API_URL}/users`); 
        const r = await handleResponse(res, '/users'); 
        return r.data;
    },
    async togglePro(userId: number, isPro: boolean) {
        const response = await fetch(`${API_URL}/users/${userId}/toggle-pro`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ is_pro: isPro }) }); 
        return await handleResponse(response, `/users/${userId}/toggle-pro`);
    },
    async deleteUser(userId: number) {
        return await handleResponse(await fetch(`${API_URL}/users/${userId}`, { method: 'DELETE' }), `/users/${userId}`);
    },
    async updateUserInfo(userId: number, data: unknown) {
        const response = await fetch(`${API_URL}/users/${userId}/profile`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) }); 
        return await handleResponse(response, `/users/${userId}/profile`);
    },
    async adminResetPassword(userId: number) {
        const response = await fetch(`${API_URL}/users/${userId}/reset-password`, { method: 'POST' }); 
        return await handleResponse(response, `/users/${userId}/reset-password`);
    },
    async createUser(data: unknown) {
        const response = await fetch(`${API_URL}/users`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) }); 
        return await handleResponse(response, '/users');
    },
    async generateOnlineExam(matrix_data: unknown, _user_id?: number) {
        void _user_id;
        const response = await fetch(`${API_URL}/online-exam/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matrix_data }), }); 
        const result = await handleResponse(response, '/online-exam/generate'); 
        return result.data as OnlineQuestion[];
    },
    async saveExamResult(data: unknown, isAuto: boolean = false) {
        const response = await fetch(`${API_URL}/exam-results`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(data),
            keepalive: isAuto
        }); 
        return await handleResponse(response, '/exam-results');
    },
    async fetchExamResultDetail(id: number) {
        const response = await fetch(`${API_URL}/exam-results/${id}`, { cache: 'no-store' });
        return await handleResponse(response, `/exam-results/${id}`);
    },
    async deleteExamResult(id: number) {
        const response = await fetch(`${API_URL}/exam-results/${id}`, { method: 'DELETE' }); 
        return await handleResponse(response, `/exam-results/${id}`);
    },
    async updateExamResultScore(id: number, score: number) {
        const response = await fetch(`${API_URL}/exam-results/${id}/score`, { 
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score })
        });
        return await handleResponse(response, `/exam-results/${id}/score`);
    },
    async deleteAllExamHistory(userId: number) {
        const response = await fetch(`${API_URL}/exam-results/all/${userId}`, { method: 'DELETE' }); 
        return await handleResponse(response, `/exam-results/all/${userId}`);
    },
    async fetchAllExamHistory() {
        const res = await fetch(`${API_URL}/exam-results/all-history`, { cache: 'no-store' });
        const r = await handleResponse(res, `/exam-results/all-history`); 
        return r.data;
    },
    async fetchUserExamHistory(userId: number) {
        const res = await fetch(`${API_URL}/exam-results/history/${userId}`, { cache: 'no-store' });
        const r = await handleResponse(res, `/exam-results/history/${userId}`); 
        return r.data;
    },
    async fetchAllActiveParticipants() {
        const res = await fetch(`${API_URL}/online-exam/active-participants-all`); 
        const r = await handleResponse(res, `/online-exam/active-participants-all`); 
        return r.data;
    },
    async fetchActiveParticipants(matrixId: number) {
        const res = await fetch(`${API_URL}/online-exam/active-participants/${matrixId}`); 
        const r = await handleResponse(res, `/online-exam/active-participants/${matrixId}`); 
        return r.data;
    },
    async fetchMatrixResults(matrixId: number) {
        const res = await fetch(`${API_URL}/online-exam/results/${matrixId}`, { cache: 'no-store' });
        const r = await handleResponse(res, `/online-exam/results/${matrixId}`); 
        return r.data;
    },
    async saveMatrix(name: string, matrix_data: unknown) {
        const response = await fetch(`${API_URL}/saved-matrices`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ name, matrix_data }) }); 
        return await handleResponse(response, '/saved-matrices');
    },
    async updateSavedMatrix(id: number, name: string, matrix_data: unknown) {
        const response = await fetch(`${API_URL}/saved-matrices/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ name, matrix_data }) }); 
        return await handleResponse(response, `/saved-matrices/${id}`);
    },
    async fetchSavedMatrices(gradeId?: number) {
        const res = await fetch(`${API_URL}/saved-matrices${gradeId ? `?grade_id=${gradeId}` : ''}`); 
        const r = await handleResponse(res, '/saved-matrices'); 
        return r.data as SavedMatrix[];
    },
    async deleteMatrix(id: number) {
        return await handleResponse(await fetch(`${API_URL}/saved-matrices/${id}`, { method: 'DELETE' }), `/saved-matrices/${id}`);
    },
    async bulkDeleteQuestions(ids: number[], _user_id?: number) {
        void _user_id;
        const response = await fetch(`${API_URL}/questions/bulk-delete`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ ids }) }); 
        return await handleResponse(response, '/questions/bulk-delete');
    },
    async bulkDeleteMetadata(ids: number[], _user_id?: number) {
        void _user_id;
        const response = await fetch(`${API_URL}/metadata/bulk-delete`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ ids }) }); 
        return await handleResponse(response, '/metadata/bulk-delete');
    },
    async nuclearReset() {
        const response = await fetch(`${API_URL}/admin/nuclear-reset`, { method: 'POST' });
        return await handleResponse(response, '/admin/nuclear-reset');
    },
    async getSettings() {
        const res = await fetch(`${API_URL}/admin/settings`);
        const r = await handleResponse(res, '/admin/settings');
        return r.data;
    },
    async saveSetting(setting_key: string, setting_value: string) {
        const response = await fetch(`${API_URL}/admin/settings`, { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({ setting_key, setting_value }) 
        });
        return await handleResponse(response, '/admin/settings');
    },
    async clearChapters() {
        const response = await fetch(`${API_URL}/admin/clear-chapters`, { method: 'POST' });
        return await handleResponse(response, '/admin/clear-chapters');
    },
    async clearUnits() {
        const response = await fetch(`${API_URL}/admin/clear-units`, { method: 'POST' });
        return await handleResponse(response, '/admin/clear-units');
    },
    async findDuplicates() {
        const response = await fetch(`${API_URL}/duplicates/find`);
        return await handleResponse(response, '/duplicates/find');
    },
    async rehashQuestions() {
        const response = await fetch(`${API_URL}/duplicates/rehash`, { method: 'POST' });
        return await handleResponse(response, '/duplicates/rehash');
    },
    async batchUpdateQuestions(updates: { id: number, raw_latex: string }[]) {
        const response = await fetch(`${API_URL}/questions/batch-update`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ updates }) });
        return await handleResponse(response, '/questions/batch-update');
    },
    async fetchQuestionReview(limit = 200, page = 1, issueCode = '') {
        const issueParam = issueCode ? `&issue_code=${encodeURIComponent(issueCode)}` : '';
        const response = await fetch(`${API_URL}/questions/id-review?limit=${limit}&page=${page}${issueParam}`);
        return await handleResponse(response, '/questions/id-review');
    },
    async fetchQuestionReviewSummary() {
        const response = await fetch(`${API_URL}/questions/review-summary`);
        return await handleResponse(response, '/questions/review-summary');
    },
    async previewQuestionNormalization(ids: number[]) {
        const response = await fetch(`${API_URL}/questions/normalize/preview`, {
            method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ ids })
        });
        return await handleResponse(response, '/questions/normalize/preview');
    },
    async confirmQuestionReview(changes: unknown[]) {
        const response = await fetch(`${API_URL}/questions/review/confirm`, {
            method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ changes })
        });
        return await handleResponse(response, '/questions/review/confirm');
    },
    async fetchQuestionRevisions(id: number) {
        const response = await fetch(`${API_URL}/questions/${id}/revisions`);
        const result = await handleResponse(response, `/questions/${id}/revisions`);
        return result.data || [];
    },
    async restoreQuestionRevision(questionId: number, revisionId: number) {
        const response = await fetch(`${API_URL}/questions/${questionId}/revisions/${revisionId}/restore`, { method: 'POST' });
        return await handleResponse(response, `/questions/${questionId}/revisions/${revisionId}/restore`);
    },
    async fixQuestionTypesScan() {
        const response = await fetch(`${API_URL}/questions/fix-types-scan`, { method: 'POST' });
        return await handleResponse(response, '/questions/fix-types-scan');
    },
    async reportQuestion(data: { question_id: number, user_id: number, report_reason: string }) {
        const response = await fetch(`${API_URL}/reports`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ question_id: data.question_id, report_reason: data.report_reason }) }); 
        return await handleResponse(response, '/reports');
    },
    async fetchReports() {
        const res = await fetch(`${API_URL}/reports`); 
        const r = await handleResponse(res, '/reports'); 
        return r.data as QuestionReport[];
    },
    async updateReportStatus(id: number, status: string) {
        const response = await fetch(`${API_URL}/reports/${id}/status`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ status }) }); 
        return await handleResponse(response, `/reports/${id}/status`);
    },
    async updateApiKey(userId: number, api_key: string) {
        const response = await fetch(`${API_URL}/users/${userId}/api-key`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ api_key }) }); 
        return await handleResponse(response, `/users/${userId}/api-key`);
    },
    async renewPro(userId: number) {
        const response = await fetch(`${API_URL}/users/${userId}/renew-pro`, { method: 'POST' }); 
        return await handleResponse(response, `/users/${userId}/renew-pro`);
    },
    async validateIds(ids: string[]) {
        try {
            const response = await fetch(`${API_URL}/validate-ids`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids }),
            });
            const result = await handleResponse(response, '/validate-ids');
            return result.validIds || [];
        } catch (error) {
            console.error("Validate IDs Error:", error);
            return [];
        }
    },
    // --- EXAM SESSION MANAGEMENT ---
    async checkActiveExam(userId: number) {
        try {
            const response = await fetch(`${API_URL}/exam/active/${userId}`);
            const result = await handleResponse(response, `/exam/active/${userId}`);
            return result;
        } catch { 
            return { success: false, found: false };
        }
    },
    async startExamSession(data: unknown) {
        const response = await fetch(`${API_URL}/exam/start`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(data) 
        });
        return await handleResponse(response, '/exam/start');
    },
    async updateExamProgress(id: number, answers: unknown) {
        // Use keepalive for better reliability on tab close, but standard fetch here
        const response = await fetch(`${API_URL}/exam/progress`, { 
            method: 'PUT', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ id, answers }) 
        });
        return await handleResponse(response, '/exam/progress');
    },
    // --- NEW FEATURES ---
    async createJob(job_type: string, _user_id: number) {
        void _user_id;
        const response = await fetch(`${API_URL}/jobs`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ job_type }) });
        return await handleResponse(response, '/jobs');
    },
    async fetchJobStatus(id: number) {
        const response = await fetch(`${API_URL}/jobs/${id}`);
        return await handleResponse(response, `/jobs/${id}`);
    },
    async fetchIRTAnalysis() {
        const response = await fetch(`${API_URL}/irt/analysis`);
        return await handleResponse(response, '/irt/analysis');
    },
    async generateAdaptiveTest(_user_id: number, limit?: number) {
        void _user_id;
        const response = await fetch(`${API_URL}/adaptive/generate`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ limit }) });
        return await handleResponse(response, '/adaptive/generate');
    },
    async aiExplain(question_latex: string, user_answer_latex: string, correct_answer_latex: string) {
        const response = await fetch(`${API_URL}/ai/explain`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ question_latex, user_answer_latex, correct_answer_latex }) });
        return await handleResponse(response, '/ai/explain');
    },
    async aiGenerateSimilar(question_latex: string, type: string) {
        const response = await fetch(`${API_URL}/ai/similar`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ question_latex, type }) });
        return await handleResponse(response, '/ai/similar');
    },
    async updateQuestionCompetencies(id: number, competencies: string[]) {
        const response = await fetch(`${API_URL}/questions/${id}/competencies`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ competencies }) });
        return await handleResponse(response, `/questions/${id}/competencies`);
    },
    async toggleQuestionPublic(id: number, is_public: boolean) {
        const response = await fetch(`${API_URL}/questions/${id}/public`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ is_public }) });
        return await handleResponse(response, `/questions/${id}/public`);
    },
    async fetchSharedQuestions() {
        const response = await fetch(`${API_URL}/questions/shared`);
        return await handleResponse(response, '/questions/shared');
    },
    // --- FEEDBACK ---
    async submitFeedback(data: { user_id: number, content: string }) {
        const response = await fetch(`${API_URL}/feedback`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ content: data.content }) });
        return await handleResponse(response, '/feedback');
    },
    async fetchFeedback() {
        const res = await fetch(`${API_URL}/feedback`);
        const r = await handleResponse(res, '/feedback');
        return r.data as UserFeedback[];
    },
    async markFeedbackRead(id: number) {
        const response = await fetch(`${API_URL}/feedback/${id}/read`, { method: 'PUT' });
        return await handleResponse(response, `/feedback/${id}/read`);
    },
    async fetchCachedImage(hash: string) {
        try {
            const cleanHash = hash.trim();
            const response = await fetch(`${API_URL}/images/${cleanHash}?format=original-svg-v2`, { cache: 'no-store' });
            const result = await handleResponse(response, `/images/${cleanHash}`);
            return result?.svg || null;
        } catch (e) {
            console.error("fetchCachedImage error:", e);
            return null;
        }
    },
    async saveCachedImage(hash: string, svg: string) {
        try {
            const response = await fetch(`${API_URL}/images`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hash, svg })
            });
            return await handleResponse(response, `/images`);
        } catch {
            return null;
        }
    },
    async fetchAdminQuestionImages() {
        const res = await fetch(`${API_URL}/admin/question-images`);
        const r = await handleResponse(res, '/admin/question-images');
        return r.data;
    },
    async deleteAdminQuestionImage(hash: string) {
        const res = await fetch(`${API_URL}/admin/question-images/${hash}`, { method: 'DELETE' });
        return await handleResponse(res, `/admin/question-images/${hash}`);
    },
    async fetchAdminQuestionsFull(limit: number = 500, filterType: string = 'ALL') {
        const res = await fetch(`${API_URL}/admin/questions/full?limit=${limit}&filterType=${filterType}`);
        const r = await handleResponse(res, '/admin/questions/full');
        return r.data;
    },
    async fetchTikzAuditPage(afterId: number, limit: number = 100) {
        const res = await fetch(`${API_URL}/admin/tikz-audit?afterId=${afterId}&limit=${limit}`);
        return await handleResponse(res, '/admin/tikz-audit');
    },
    async fetchTikzJobStatus() {
        const res = await fetch(`${API_URL}/admin/tikz-jobs/status`);
        return await handleResponse(res, '/admin/tikz-jobs/status');
    },
    async startTikzJob() {
        const res = await fetch(`${API_URL}/admin/tikz-jobs`, { method: 'POST' });
        return await handleResponse(res, '/admin/tikz-jobs');
    },
    async cancelTikzJob(id: number) {
        const res = await fetch(`${API_URL}/admin/tikz-jobs/${id}/cancel`, { method: 'POST' });
        return await handleResponse(res, `/admin/tikz-jobs/${id}/cancel`);
    },

    // --- CLASS MANAGEMENT ---
    async fetchClasses(teacherId: number) {
        const res = await fetch(`${API_URL}/classes?teacher_id=${teacherId}`);
        const r = await handleResponse(res, '/classes');
        return r.data;
    },
    async createClass(_teacherId: number, name: string) {
        void _teacherId;
        const res = await fetch(`${API_URL}/classes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        return await handleResponse(res, '/classes');
    },
    async deleteClass(id: number) {
        const res = await fetch(`${API_URL}/classes/${id}`, { method: 'DELETE' });
        return await handleResponse(res, `/classes/${id}`);
    },

    async fetchClassStudents(classId: number) {
        const res = await fetch(`${API_URL}/classes/${classId}/students`);
        const r = await handleResponse(res, `/classes/${classId}/students`);
        return r.data;
    },
    async fetchClassScores(classId: number) {
        const res = await fetch(`${API_URL}/classes/${classId}/scores`, { cache: 'no-store' });
        const r = await handleResponse(res, `/classes/${classId}/scores`);
        return r.data;
    },


    async joinClass(_studentId: number, code: string) {
        void _studentId;
        const res = await fetch(`${API_URL}/classes/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        return await handleResponse(res, '/classes/join');
    },
    async addStudentToClass(classId: number, identifier: string) {
        const res = await fetch(`${API_URL}/classes/${classId}/add-student`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier })
        });
        return await handleResponse(res, `/classes/${classId}/add-student`);
    },

    async removeStudentFromClass(classId: number, studentId: number) {
        const res = await fetch(`${API_URL}/classes/${classId}/students/${studentId}`, { method: 'DELETE' });
        return await handleResponse(res, `/classes/${classId}/students/${studentId}`);
    },
    async fetchClassAssignments(classId: number) {
        const res = await fetch(`${API_URL}/classes/${classId}/assignments`);
        const r = await handleResponse(res, `/classes/${classId}/assignments`);
        return r.data;
    },
    async assignMatrixToClass(classId: number, matrixId: number, options?: { open_time?: string | null, deadline?: string | null, max_attempts?: number, allow_review?: boolean }) {
        const res = await fetch(`${API_URL}/classes/${classId}/assignments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                matrix_id: matrixId,
                open_time: options?.open_time || null,
                deadline: options?.deadline || null,
                max_attempts: options?.max_attempts || 0,
                allow_review: options?.allow_review !== false
            })
        });
        return await handleResponse(res, `/classes/${classId}/assignments`);
    },
    async updateClassAssignment(assignmentId: number, options: { open_time?: string | null, deadline?: string | null, max_attempts?: number, allow_review?: boolean }) {
        const res = await fetch(`${API_URL}/classes/assignments/${assignmentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(options)
        });
        return await handleResponse(res, `/classes/assignments/${assignmentId}`);
    },
    async deleteClassAssignment(assignmentId: number) {
        const res = await fetch(`${API_URL}/classes/assignments/${assignmentId}`, { method: 'DELETE' });
        return await handleResponse(res, `/classes/assignments/${assignmentId}`);
    },
    async fetchStudentClassAssignments(studentId: number) {
        const res = await fetch(`${API_URL}/students/${studentId}/assignments`);
        const r = await handleResponse(res, `/students/${studentId}/assignments`);
        return r.data;
    },
    async fetchStudentClasses(studentId: number) {
        const res = await fetch(`${API_URL}/students/${studentId}/classes`);
        const r = await handleResponse(res, `/students/${studentId}/classes`);
        return r.data;
    }
};
