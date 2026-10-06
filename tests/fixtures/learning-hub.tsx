// Browser fixture: all requests are mocked, no real accounts, AI calls or DB writes.
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Learning } from "../../src/pages/Learning";
import { useAuthStore, UserRole } from "../../src/services/authStore";
import "../../src/index.css";
let role: UserRole = "STUDENT";
let progress: { section_id: number; is_completed: boolean; score: number }[] = [];
let drafts: { id: number; revision: number; title: string; draft: unknown }[] = [];
const lessons = [
  {
    id: 990001,
    name: "Tính đơn điệu của hàm số",
    section_count: 3,
    question_count: 16,
  },
  {
    id: 990002,
    name: "Cực trị của hàm số",
    section_count: 0,
    question_count: 12,
  },
  {
    id: 990003,
    name: "Giá trị lớn nhất và nhỏ nhất",
    section_count: 4,
    question_count: 20,
  },
].map((u, i) => ({
  ...u,
  chapter_id: 1,
  unit_number: i + 1,
  chapter_number: 1,
  chapter_name: "Ứng dụng đạo hàm",
  grade_code: "12",
  subject_code: "D",
  subject_name: "Đại số",
  video_count: i === 0 ? 1 : 0,
  completed_count: 0,
  draft_count: 0,
  accessible: i === 0,
}));
const sections = [
  {
    id: 990011,
    unit_id: 990001,
    title: "Kiến thức trọng tâm",
    content:
      "## Xét tính đơn điệu bằng đạo hàm\n\n- Tìm tập xác định.\n- Tính đạo hàm và xét dấu.\n- Kết luận các khoảng đồng biến, nghịch biến.\n\nNếu $f'(x)>0$ trên một khoảng thì hàm số đồng biến trên khoảng đó.",
    order_index: 1,
  },
  {
    id: 990012,
    unit_id: 990001,
    title: "Ví dụ có lời giải",
    content:
      "Xét $f(x)=x^2$ trên $(0;+\\infty)$.\n\nTa có $f'(x)=2x>0$. Vì vậy hàm số đồng biến trên khoảng đã cho.",
    order_index: 2,
  },
  {
    id: 990013,
    unit_id: 990001,
    title: "Lỗi thường gặp",
    content: "**Lưu ý:** Không bỏ qua tập xác định khi xét dấu đạo hàm.",
    order_index: 3,
  },
];
window.fetch = async (input, init) => {
  const url = String(input),
    body = init?.body ? JSON.parse(String(init.body)) : {};
  let data: unknown,
    status = 200;
  if (url.includes("/learning/catalog"))
    data = {
      success: true,
      data: lessons.map((u) => ({
        ...u,
        accessible: role !== "STUDENT" || u.accessible,
        completed_count: u.id === 990001 ? progress.length : 0,
        draft_count: u.id === 990001 ? drafts.length : 0,
      })),
    };
  else if (url.includes("/learning/units/"))
    data = {
      success: true,
      data: {
        sections: sections.map((s) => ({ ...s, editable: role !== "STUDENT" })),
        progress,
      },
    };
  else if (url.includes("/learning/sections/")) {
    Object.assign(
      sections.find((s) => s.id === Number(url.split("/").pop()))!,
      { title: body.title, content: body.content },
    );
    data = { success: true };
  } else if (url.includes("/user/lesson-progress")) {
    progress = [
      ...progress.filter((p) => p.section_id !== body.section_id),
      body,
    ];
    data = { success: true };
  } else if (url.endsWith("/chapters"))
    data = {
      success: true,
      data: [
        {
          id: 1,
          id_class: 2,
          id_subject: "D",
          chapter_number: 1,
          chapter_name: "Ứng dụng đạo hàm",
        },
      ],
    };
  else if (url.includes("/saved-matrices")) data = { success: true, data: [] };
  else if (url.includes("/lesson-authoring/ai"))
    data = {
      success: true,
      data: {
        title: "Tính đơn điệu",
        blocks: [
          {
            type: "TEXT",
            title: "Mục tiêu",
            content: "Nhận biết khoảng đồng biến và nghịch biến.",
          },
        ],
      },
    };
  else if (url.includes("/lesson-authoring/drafts")) {
    if (init?.method === "POST" || init?.method === "PUT") {
      drafts = [
        {
          id: 1,
          revision: (body.revision || 0) + 1,
          title: body.draft.title,
          draft: body.draft,
        },
      ];
      data = { success: true, id: 1, revision: drafts[0].revision };
    } else data = { success: true, data: drafts };
  } else if (url.includes("/practice"))
    data = {
      success: true,
      data: [
        {
          id: 9,
          content:
            "\\begin{ex}Đạo hàm của $x^2$ bằng\\choice{$x$}{\\True $2x$}{$x^3$}{$1$}\\loigiai{Dùng quy tắc đạo hàm lũy thừa.}\\end{ex}",
          type_code: "TN",
        },
      ],
    };
  else {
    status = 500;
    data = { error: "Fixture blocks unexpected request: " + url };
  }
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
};
export function Fixture() {
  const [mode, setMode] = useState<UserRole>("STUDENT");
  const changeRole = (value: UserRole) => {
    role = value;
    useAuthStore.setState({
      user: {
        id: value === "STUDENT" ? 990099 : 990098,
        username: "fixture",
        full_name: "Kiểm tra giao diện",
        role: value,
        is_pro: false,
      },
    });
    setMode(value);
  };
  React.useEffect(() => {
    changeRole("STUDENT");
  }, []);
  return (
    <div className="h-screen flex flex-col">
      <div className="bg-slate-900 text-white px-4 py-2 text-xs flex gap-4">
        <span>DỮ LIỆU GIẢ · Không ghi DB</span>
        <button onClick={() => changeRole("STUDENT")}>Xem học sinh</button>
        <button onClick={() => changeRole("ADMIN")}>Xem giáo viên</button>
      </div>
      <div className="min-h-0 flex-1">
        <MemoryRouter key={mode}>
          <Routes>
            <Route path="/" element={<Learning />} />
            <Route
              path="/eduloop"
              element={<div>EduLoop — đã mở đúng luồng ôn tập cá nhân.</div>}
            />
          </Routes>
        </MemoryRouter>
      </div>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
