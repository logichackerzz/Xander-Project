export default function ProfilePage() {
  const info = {
    name: '李凱軒', nameEn: 'LEE KAI-SYUAN', id: '11240004A',
    dept: '資料科學與大數據分析學系', grade: '資料科學三 A',
    college: '智慧科技學院',
    credits: { required: 9, elective: 12, total: 21 },
  };

  return (
    <div className="min-h-screen pb-32" style={{ background: '#F4EFFF' }}>
      {/* Hero */}
      <div className="relative overflow-hidden px-5 pt-14 pb-8">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-30 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, #fcd34d, #fb923c)', filter: 'blur(28px)' }} />

        <div style={{ animation: 'floatIn 0.4s ease-out forwards', opacity: 0 }}>
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#9177C9' }}>
            學生資訊
          </p>
          <h1 className="text-4xl font-black mt-1 tracking-tight text-gray-800">我的</h1>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Avatar card */}
        <div
          className="bg-white rounded-3xl p-5 shadow-md flex items-center gap-4"
          style={{
            boxShadow: '0 4px 24px rgba(217,119,6,0.12)',
            animation: 'floatIn 0.45s cubic-bezier(0.34,1.56,0.64,1) 0.05s forwards',
            opacity: 0,
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #fcd34d, #fb923c)',
              boxShadow: '0 4px 16px rgba(217,119,6,0.35)',
            }}
          >
            {info.name[0]}
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-800">{info.name}</h2>
            <p className="text-sm font-medium" style={{ color: '#9CA3AF' }}>{info.nameEn}</p>
            <span
              className="inline-block mt-1.5 text-xs font-black px-2.5 py-0.5 rounded-xl"
              style={{ background: '#FFFBEB', color: '#D97706' }}
            >
              資料科學三 A
            </span>
          </div>
        </div>

        {/* Credits */}
        <div
          className="rounded-3xl overflow-hidden shadow-md"
          style={{
            background: 'white',
            boxShadow: '0 4px 24px rgba(120,80,200,0.10)',
            animation: 'floatIn 0.45s ease-out 0.1s forwards',
            opacity: 0,
          }}
        >
          {/* Gradient strip */}
          <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #fcd34d, #fb923c, #f9a8d4)' }} />
          <div className="px-5 py-4">
            <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: '#9177C9' }}>
              本學期學分
            </p>
            <div className="flex justify-around">
              <CreditBadge label="必修" value={info.credits.required}
                gradient="linear-gradient(135deg, #818cf8, #c4b5fd)" />
              <CreditBadge label="選修" value={info.credits.elective}
                gradient="linear-gradient(135deg, #6ee7b7, #22d3ee)" />
              <CreditBadge label="合計" value={info.credits.total}
                gradient="linear-gradient(135deg, #fcd34d, #fb923c)" />
            </div>
          </div>
        </div>

        {/* Info card */}
        <div
          className="bg-white rounded-3xl overflow-hidden shadow-sm"
          style={{
            boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
            animation: 'floatIn 0.45s ease-out 0.15s forwards',
            opacity: 0,
          }}
        >
          <InfoRow label="學號" value={info.id} />
          <InfoRow label="系所" value={info.dept} />
          <InfoRow label="學院" value={info.college} last />
        </div>

        <p className="text-center text-xs font-medium pt-2 pb-4" style={{ color: '#D1D5DB' }}>
          非義守大學官方應用程式 · 僅供個人使用
        </p>
      </div>
    </div>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className="flex justify-between items-center px-5 py-3.5"
      style={{ borderBottom: last ? 'none' : '1px solid #F3F4F6' }}>
      <span className="text-sm" style={{ color: '#9CA3AF' }}>{label}</span>
      <span className="text-sm font-black text-gray-800 text-right max-w-[55%]">{value}</span>
    </div>
  );
}

function CreditBadge({ label, value, gradient }: { label: string; value: number; gradient: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-md"
        style={{ background: gradient, boxShadow: `0 4px 12px rgba(0,0,0,0.15)` }}
      >
        {value}
      </div>
      <span className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>{label}</span>
    </div>
  );
}
