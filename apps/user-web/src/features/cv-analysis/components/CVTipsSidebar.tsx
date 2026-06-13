// ── Tip item ───────────────────────────────────────────────────────────────────

function TipItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <svg
        className="mt-0.5 h-3.5 w-3.5 shrink-0"
        style={{ color: "#0047CC" }}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2.5"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-[13px] text-gray-600 leading-relaxed">{text}</span>
    </li>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export function CVTipsSidebar() {
  return (
    <aside className="space-y-3 lg:sticky lg:top-20">
      {/* Card 1 — Tips */}
      <div
        className="rounded-lg border p-4"
        style={{ borderColor: "#E5E7EB", backgroundColor: "#fff" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md shrink-0"
            style={{ backgroundColor: "#EEF2FF" }}
          >
            <svg
              className="h-3.5 w-3.5"
              style={{ color: "#0047CC" }}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
              />
            </svg>
          </div>
          <h4 className="text-[13px] font-semibold text-gray-900 leading-tight">
            Mẹo để có kết quả tốt hơn
          </h4>
        </div>
        <ul className="space-y-2.5">
          <TipItem text="CV rõ ràng, đầy đủ thông tin cá nhân và kinh nghiệm làm việc" />
          <TipItem text="Sử dụng định dạng chuẩn như PDF, DOCX để hệ thống dễ dàng trích xuất" />
          <TipItem text="Cập nhật CV thường xuyên để phản ánh kỹ năng và kinh nghiệm mới nhất" />
        </ul>
      </div>

      {/* Card 2 — Security */}
      <div
        className="rounded-lg border p-4"
        style={{ borderColor: "#E5E7EB", backgroundColor: "#fff" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md shrink-0"
            style={{ backgroundColor: "#ECFDF5" }}
          >
            <svg
              className="h-3.5 w-3.5"
              style={{ color: "#10B981" }}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
          </div>
          <h4 className="text-[13px] font-semibold text-gray-900 leading-tight">
            Bảo mật thông tin
          </h4>
        </div>
        <p className="text-[13px] text-gray-500 leading-relaxed">
          CV của bạn được mã hóa và bảo mật 100%. Chúng tôi không chia sẻ thông tin của bạn với bên thứ ba.
        </p>
        <a
          href="#"
          className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium transition-colors hover:underline"
          style={{ color: "#0047CC" }}
        >
          Tìm hiểu thêm về bảo mật
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </a>
      </div>
    </aside>
  );
}
