// Browser-only UI fixture. All network requests are stubbed: never touches real lessons or AI keys.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LessonQuickComposer } from '../../src/components/LessonQuickComposer';
import '../../src/index.css';
let stored: any[] = [];
let publishCount = 0;
window.fetch = async (input, init) => {
    const url = String(input); const body = init?.body ? JSON.parse(String(init.body)) : {};
    let data: any;
    if (url.includes('/lesson-authoring/ai')) data = { success: true, data: { title: 'Tính đơn điệu của hàm số', blocks: [
        { type: 'TEXT', title: 'Mục tiêu bài học', content: 'Nhận biết khoảng đồng biến, nghịch biến bằng dấu của đạo hàm.' },
        { type: 'EXAMPLE', title: 'Ví dụ có lời giải', content: 'Xét $f(x)=x^2$ trên $(0;+\\infty)$.\n\nTa có $f\'(x)=2x>0$. Vì vậy hàm số đồng biến trên khoảng đã cho.' }
    ] } };
    else if (url.includes('/publish')) { publishCount++; data = { success: true }; }
    else if (init?.method === 'POST' || init?.method === 'PUT') { const revision = (body.revision || 0) + 1; stored = [{ id: 1, title: body.draft.title, draft: body.draft, revision }]; data = { success: true, id: 1, revision }; }
    else if (url.includes('/lesson-authoring/drafts')) data = { success: true, data: stored };
    else throw new Error(`UI fixture blocks unexpected request: ${url}`);
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
};
function Fixture() {
    const [open, setOpen] = useState(true);
    return <><h1>Soạn bài nhanh — kiểm tra giao diện, dữ liệu giả</h1><p>Đã xuất bản: {publishCount}</p><button onClick={() => setOpen(true)}>Mở trình soạn</button>{open && <LessonQuickComposer unit={{ id: 999999, chapter_id: 1, unit_number: 1, name: 'Tính đơn điệu của hàm số' }} userId={999999} matrices={[{ id: 6, name: 'Ôn tập tính đơn điệu · 8 câu', matrix_data: {}, created_at: '', is_public: true, created_by: 1 }]} onClose={() => setOpen(false)} onPublished={async () => {}}/>}</>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);
