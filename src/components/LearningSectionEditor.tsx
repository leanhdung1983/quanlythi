import React, { useState } from "react";
import { Loader2, Save, X } from "lucide-react";
import { apiService } from "../services/api";
import { LearningSection } from "../utils/learningHub";
import { LessonContent } from "./LessonContent";
export const LearningSectionEditor: React.FC<{
  section: LearningSection;
  onClose: () => void;
  onSaved: () => Promise<void>;
}> = ({ section, onClose, onSaved }) => {
  const [title, setTitle] = useState(section.title);
  const [content, setContent] = useState(section.content || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await apiService.learningHub(
        `/sections/${section.id}`,
        { title, content },
        "PUT",
      );
      await onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không lưu được mục học.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Chỉnh sửa mục học"
        className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden"
      >
        <header className="p-5 border-b flex justify-between">
          <div>
            <h2 className="font-bold text-lg">Chỉnh sửa mục học</h2>
            <p className="text-xs text-slate-500 mt-1">
              Giữ mã mục, video, ma trận và tiến độ học sinh.
            </p>
          </div>
          <button disabled={busy} aria-label="Đóng chỉnh sửa" onClick={onClose}>
            <X />
          </button>
        </header>
        {error && (
          <p role="alert" className="bg-rose-50 text-rose-700 text-sm p-4">
            {error}
          </p>
        )}
        <div className="grid md:grid-cols-2 gap-5 overflow-auto p-5">
          <div className="space-y-4">
            <label className="block text-sm">
              Tiêu đề
              <input
                value={title}
                disabled={busy}
                maxLength={200}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded-xl p-3 mt-2"
              />
            </label>
            <label className="block text-sm">
              Nội dung
              <textarea
                rows={14}
                disabled={busy}
                maxLength={20000}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full border rounded-xl p-3 mt-2 text-sm leading-7"
              />
            </label>
          </div>
          <div className="bg-slate-50 border rounded-2xl p-5">
            <h3 className="text-xs uppercase font-bold text-slate-400 mb-4">
              Xem trước
            </h3>
            <h4 className="text-xl font-bold mb-4">{title}</h4>
            <LessonContent content={content} />
          </div>
        </div>
        <footer className="p-4 border-t flex justify-end">
          <button
            disabled={busy || !title.trim()}
            onClick={() => void save()}
            className="bg-emerald-700 text-white px-5 py-3 rounded-xl text-sm font-bold flex gap-2 items-center disabled:opacity-40"
          >
            {busy ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Save size={16} />
            )}
            Lưu thay đổi
          </button>
        </footer>
      </section>
    </div>
  );
};
