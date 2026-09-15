
export interface User {
    id: number;
    username: string;
    email: string;
    full_name: string;
    school: string;
    role: 'ADMIN' | 'TEACHER' | 'STUDENT';
    is_pro: boolean;
    expiry_date: string | null;
    created_at: string;
}

export enum QuestionType {
  TN = 'TN', // Trắc nghiệm
  TF = 'TF', // Đúng/Sai
  KQ = 'KQ', // Trả lời ngắn
  TL = 'TL'  // Tự luận
}

// Relational Types
export interface Grade {
    id: number;
    code: string;
    name: string;
}

export interface Subject {
    id: number;
    code: string;
    name: string;
}

export interface Level {
    id: number;
    code: string;
    name: string;
}

export interface QuestionTypeEntity {
    id: number;
    code: string;
    name: string;
}

export interface Chapter {
  id: number;
  grade_id: number;
  subject_id: number;
  chapter_number: number;
  name: string;
  // Joined fields for display
  grade_code?: string;
  subject_code?: string;

  // Compatibility fields (for UI/Parser/Legacy API)
  id_class?: number;
  id_subject?: string;
  id_chapter?: number;
  chapter_name?: string;
}

export interface Unit {
  id: number;
  chapter_id: number;
  unit_number: number;
  name: string;

  // Compatibility fields
  id_unit?: number;
  unit_name?: string;
}

export interface LessonSection {
  id: number;
  unit_id: number;
  title: string;
  content: string | null;
  video_url: string | null;
  interactive_html: string | null;
  order_index: number;
  created_at: string;
  isVirtual?: boolean;
  matrix_id?: number | null;
}

export interface UserLessonProgress {
  id: number;
  user_id: number;
  section_id: number;
  is_completed: boolean;
  score: number;
  updated_at: string;
}

export interface ID6Metadata {
  id: number; // DB Primary Key
  id_full: string; // The ID6 Code (e.g., 2D1H1-1)
  description: string;
  competencies?: string[];
  
  // Relations
  grade_id?: number;
  subject_id?: number;
  chapter_id?: number;
  unit_id?: number;
  level_id?: number;
  count_id: number; 

  // Display Helpers (from Joins or Parse)
  id_class?: number;   // 0, 1, 2
  id_subject?: string; // D, H
  id_chapter?: number;
  id_unit?: number;
  id_level?: string;   // N, H, V, C
  id_count?: number;
  
  // Import Payload Helpers
  chapter_name?: string;
  unit_name?: string;
}

export interface Question {
  id: number;
  unit_id: number | null;
  level_id: number;
  type_id: number;
  grade_id?: number;
  subject_id?: string;
  chapter_id?: number;
  content_latex: string;
  content_latex_original?: string;
  original_latex?: string;
  normalized_id?: string;
  legacy_full_id?: string;
  used_count: number;
  created_by?: number;
  created_at: string;
  
  // MỚI: IRT, Năng lực, Chia sẻ
  difficulty_index?: number;
  discrimination_index?: number;
  discrimination?: number;
  competencies?: string[]; 
  choices?: string[];
  is_public?: boolean;
  is_tikz_rendered?: boolean;

  // Joined fields for UI convenience
  grade_name?: string;
  subject_name?: string;
  chapter_name?: string;
  unit_name?: string;
  level_code?: string;
  type_code?: string;
  
  // Mapped for compatibility with old components
  id_full?: string; 
  raw_latex?: string; // mapped from content_latex
  q_type?: string; // mapped from type_code
}

// --- ONLINE EXAM TYPES ---

export interface SavedMatrix {
    id: number;
    name: string;
    grade_id?: number;
    matrix_data: any; // JSON
    created_at: string;
    open_time?: string | null;
    deadline?: string | null;
    max_attempts?: number;
    allow_review?: boolean;
}

export interface ClassAssignment {
    assignment_id: number;
    id: number; // matrix_id
    class_id: number;
    name: string;
    class_name?: string;
    assigned_at: string;
    open_time?: string | null;
    deadline?: string | null;
    max_attempts?: number;
    allow_review?: boolean;
    completed_attempts?: number;
    status?: 'UPCOMING' | 'ACTIVE' | 'EXPIRED' | 'ATTEMPTS_EXHAUSTED';
    matrix_data?: any;
}

export interface OnlineQuestion {
    id: number;
    id_full: string;
    type: QuestionType;
    content: string; 
    options: {
        id: string; 
        content: string; 
        isCorrect: boolean;
        originalIndex?: number;
    }[];
    solution?: string; 
    correctAnswer?: string; 
    userAnswer?: string | string[]; 
    raw_latex?: string; 
    original_latex?: string;
    choices?: string[];
    difficulty_index?: number;
    discrimination_index?: number;
    competencies?: string[];
}

export interface ExamResult {
    id: number;
    user_id: number;
    exam_title: string;
    score: number;
    duration_seconds: number;
    created_at: string;
    full_name?: string;
    username?: string;
    school?: string;
    result_detail?: any; // JSON
}

export interface QuestionReport {
    id: number;
    question_id: number;
    user_id: number;
    report_reason: string;
    status: 'PENDING' | 'RESOLVED' | 'IGNORED';
    created_at: string;
    raw_latex?: string;
    original_latex?: string;
    id_full?: string;
    reporter_name?: string;
}

export interface ParsedData {
  chapters: Chapter[];
  units: Unit[];
  metadata: ID6Metadata[]; 
}

// Tree Data for Matrix UI
export interface MatrixTreeNode {
    grade: number; // mapped from grade_id or code logic
    subjects: {
        subject: string;
        chapters: {
            id: number;
            num: number;
            name: string;
            units: {
                id: number;
                num: number;
                name: string;
                types: {
                    count_id: number; // Using ID as count indicator
                    description: string;
                    competencies?: string[];
                    stats: Record<string, Record<string, number>>; 
                }[];
            }[];
        }[];
    }[];
}

export interface UserFeedback {
    id: number;
    user_id: number;
    content: string;
    is_read: boolean;
    created_at: string;
    // Joined fields
    username?: string;
    full_name?: string;
    email?: string;
}

export enum FileType {
    PDF = 'application/pdf',
    DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    UNKNOWN = 'unknown'
}

export interface UploadedFile {
    name: string;
    type: FileType;
    base64Data: string; 
}

export interface BackgroundJob {
    id: number;
    job_type: 'DUPLICATE_SCAN' | 'LATEX_NORM' | 'AI_GEN';
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    progress: number;
    result_data?: any;
    error_message?: string;
    created_at: string;
    updated_at: string;
}
