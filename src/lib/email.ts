import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
})

const FROM = process.env.SMTP_FROM || process.env.SMTP_USER

const typeLabel = (t?: string) => t === 'bridal' ? '💍 新娘預約' : '📚 學員約課'

interface BookingEmailData {
  teacherName: string; teacherEmail: string
  customerName: string; customerContact: string
  date: string; note?: string | null
  bookingType?: string; customerEmail?: string
}

// ── Notify teacher of new booking ──
export async function sendBookingNotificationToTeacher(data: BookingEmailData) {
  const html = `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto;color:#2E1A10">
      <h2 style="color:#D4906A;">你有一筆新預約</h2>
      <p style="color:#A08070;font-size:13px;">${typeLabel(data.bookingType)}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:8px;color:#A08070">客人姓名</td><td style="padding:8px;font-weight:700">${data.customerName}</td></tr>
        <tr style="background:#FDF6F0"><td style="padding:8px;color:#A08070">聯絡方式</td><td style="padding:8px;font-weight:700">${data.customerContact}</td></tr>
        <tr><td style="padding:8px;color:#A08070">預約日期</td><td style="padding:8px;font-weight:700">${data.date}</td></tr>
        ${data.note ? `<tr style="background:#FDF6F0"><td style="padding:8px;color:#A08070">備註</td><td style="padding:8px">${data.note}</td></tr>` : ''}
      </table>
      <p style="color:#A08070;font-size:12px;margin-top:16px">請登入後台確認預約。</p>
    </div>`
  await transporter.sendMail({ from: FROM, to: data.teacherEmail,
    subject: `新預約通知 ─ ${data.customerName}（${data.date}）`, html })
}

// ── Notify teacher of bridal ↔ student conflict ──
interface ConflictData {
  teacherName: string; teacherEmail: string
  bridalName: string; bridalContact: string
  studentName: string; studentContact: string
  date: string; note?: string | null
}

export async function sendConflictNotificationToTeacher(data: ConflictData) {
  const html = `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto;color:#2E1A10">
      <h2 style="color:#D97706;">⚠️ 預約衝突通知</h2>
      <p style="font-size:14px">新娘 <strong>${data.bridalName}</strong> 想預約
         <strong>${data.date}</strong>，但此日期已有學員課程。</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:12px">
        <tr style="background:#FEF3C7"><th colspan="2" style="padding:8px;text-align:left;color:#92400E">💍 新娘資訊</th></tr>
        <tr><td style="padding:8px;color:#A08070">姓名</td><td style="padding:8px;font-weight:700">${data.bridalName}</td></tr>
        <tr style="background:#FDF6F0"><td style="padding:8px;color:#A08070">聯絡方式</td><td style="padding:8px">${data.bridalContact}</td></tr>
        ${data.note ? `<tr><td style="padding:8px;color:#A08070">備註</td><td style="padding:8px">${data.note}</td></tr>` : ''}
        <tr style="background:#FEF3C7"><th colspan="2" style="padding:8px;text-align:left;color:#92400E">📚 學員資訊</th></tr>
        <tr><td style="padding:8px;color:#A08070">姓名</td><td style="padding:8px;font-weight:700">${data.studentName}</td></tr>
        <tr style="background:#FDF6F0"><td style="padding:8px;color:#A08070">聯絡方式</td><td style="padding:8px">${data.studentContact}</td></tr>
      </table>
      <p style="font-size:13px;color:#B45309;margin-top:16px;padding:12px;background:#FEF9C3;border-radius:8px">
        建議先聯絡學員協調換日，再至後台「確認新娘 / 取消學員課」完成處理。
      </p>
    </div>`
  await transporter.sendMail({ from: FROM, to: data.teacherEmail,
    subject: `⚠️ 預約衝突 ─ 新娘 ${data.bridalName} vs 學員 ${data.studentName}（${data.date}）`, html })
}

// ── Confirm to customer ──
export async function sendBookingConfirmationToCustomer(data: BookingEmailData) {
  if (!data.customerEmail) return
  const html = `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto;color:#2E1A10">
      <h2 style="color:#D4906A;">預約已送出！</h2>
      <p>嗨 ${data.customerName}，你的 ${typeLabel(data.bookingType)} 已送出，老師確認後會通知你。</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:8px;color:#A08070">老師</td><td style="padding:8px;font-weight:700">${data.teacherName}</td></tr>
        <tr style="background:#FDF6F0"><td style="padding:8px;color:#A08070">日期</td><td style="padding:8px;font-weight:700">${data.date}</td></tr>
      </table>
    </div>`
  await transporter.sendMail({ from: FROM, to: data.customerEmail,
    subject: `預約確認 ─ ${data.teacherName} ${data.date}`, html })
}
