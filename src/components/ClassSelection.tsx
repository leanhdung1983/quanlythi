type Props = { classes: { id: number; name: string }[]; selected: number[]; onChange: (ids: number[]) => void };
export default function ClassSelection({ classes, selected, onChange }: Props) {
    return <div className="rounded-xl border p-3 space-y-2">
        <div className="flex justify-between gap-2 text-sm"><span className="font-semibold">Chọn lớp nhận bài ({selected.length})</span><button type="button" className="text-indigo-600" onClick={() => onChange(selected.length === classes.length ? [] : classes.map(c => Number(c.id)))}>{selected.length === classes.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}</button></div>
        <div className="max-h-40 overflow-y-auto grid grid-cols-2 gap-2">{classes.map(c => <label key={c.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 text-sm cursor-pointer"><input type="checkbox" checked={selected.includes(Number(c.id))} onChange={e => onChange(e.target.checked ? [...selected, Number(c.id)] : selected.filter(id => id !== Number(c.id)))}/>{c.name}</label>)}</div>
        <p className="text-xs text-slate-500">Lớp đã nhận ma trận này sẽ được bỏ qua, không thay đổi cấu hình hoặc bài làm cũ.</p>
    </div>;
}
