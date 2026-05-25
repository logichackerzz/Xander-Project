export default function GradesPage() {
  return (
    <div className="min-h-screen pb-32" style={{ background: '#F4EFFF' }}>
      <div className="relative overflow-hidden px-5 pt-14 pb-6">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-30 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, #6ee7b7, #22d3ee)', filter: 'blur(28px)' }} />
        <div style={{ animation: 'floatIn 0.4s ease-out forwards', opacity: 0 }}>
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#9177C9' }}>
            114學年第2學期
          </p>
          <h1 className="text-4xl font-black mt-1 tracking-tight text-gray-800">成績 📊</h1>
        </div>
      </div>

      <div className="px-4 flex flex-col items-center pt-12 gap-5"
        style={{ animation: 'floatIn 0.5s ease-out 0.1s forwards', opacity: 0 }}>
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl shadow-xl"
          style={{
            background: 'linear-gradient(135deg, #6ee7b7, #22d3ee)',
            boxShadow: '0 8px 32px rgba(5,150,105,0.3)',
          }}
        >
          📋
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-gray-800">成績尚未公布</h2>
          <p className="text-sm font-medium mt-2" style={{ color: '#9177C9' }}>
            期末成績公布後將自動顯示 ✨
          </p>
        </div>
      </div>
    </div>
  );
}
