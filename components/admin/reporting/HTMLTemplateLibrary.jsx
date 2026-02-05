"use client";

import { FileCode } from "lucide-react";

/**
 * Thư viện các mẫu HTML có sẵn cho báo cáo.
 * Cung cấp các đoạn mã HTML mẫu như bảng, tiêu đề, chân trang, v.v.
 */
export const TEMPLATE_SNIPPETS = [
  {
    id: "ct01-residence-declaration",
    name: "Tờ khai thay đổi thông tin cư trú (CT01)",
    description:
      "Mẫu tờ khai chuẩn theo Thông tư 53/2025/TT-BCA của Bộ Công an.",
    icon: <FileCode className="h-4 w-4" />,
    content: `
<div style="font-family: 'Times New Roman', Times, serif; padding: 10mm; color: #000; line-height: 1.4; max-width: 850px; margin: auto;">
  <div style="text-align: right; font-size: 13px; margin-bottom: 5px;">
    Mẫu CT01 ban hành kèm theo Thông tư số 53/2025/TT-BCA<br/>
    ngày 01/7/2025 của Bộ trưởng Bộ Công an
  </div>

  <div style="text-align: center; margin-bottom: 20px;">
    <h3 style="margin: 0; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h3>
    <p style="margin: 5px 0; font-weight: bold;">Độc lập - Tự do - Hạnh phúc</p>
    <div style="width: 160px; border-top: 1px solid #000; margin: 5px auto;"></div>
  </div>

  <div style="text-align: center; margin-bottom: 25px;">
    <h2 style="margin: 0; font-size: 1.4em;">TỜ KHAI THAY ĐỔI THÔNG TIN CƯ TRÚ</h2>
    <p style="margin: 5px 0; font-style: italic;">Kính gửi<sup>(1)</sup>: {{submissionAgency}}</p>
  </div>

  <div style="margin-bottom: 20px; font-size: 14px;">
    <p style="margin: 8px 0;">1. Họ, chữ đệm và tên khai sinh: <span style="text-transform: uppercase; font-weight: bold;">{{fullName}}</span></p>
    <div style="display: flex; gap: 40px; margin: 8px 0;">
      <p style="margin: 0;">2. Ngày, tháng, năm sinh: {{dob}}</p>
      <p style="margin: 0;">3. Giới tính: {{gender}}</p>
    </div>
    <p style="margin: 8px 0;">4. Số định danh cá nhân: {{personalId}}</p>
    <div style="display: flex; gap: 40px; margin: 8px 0;">
      <p style="margin: 0;">5. Số điện thoại liên hệ: {{phone}}</p>
      <p style="margin: 0;">6. Email: {{email}}</p>
    </div>
    <div style="display: flex; gap: 40px; margin: 8px 0;">
      <p style="margin: 0;">7. Họ, chữ đệm và tên chủ hộ: {{hostName}}</p>
      <p style="margin: 0;">8. Mối quan hệ với chủ hộ: {{hostRelationship}}</p>
    </div>
    <p style="margin: 8px 0;">9. Số định danh cá nhân của chủ hộ: {{hostId}}</p>
    <p style="margin: 8px 0;">10. Nội dung đề nghị<sup>(2)</sup>: {{requestContent}}</p>
    <p style="margin: 8px 0;">11. Những thành viên trong hộ gia đình cùng thay đổi:</p>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; text-align: center;">
    <thead>
      <tr>
        <th style="border: 1px solid #000; padding: 8px; width: 40px;">TT</th>
        <th style="border: 1px solid #000; padding: 8px;">Họ, chữ đệm <br/> và tên</th>
        <th style="border: 1px solid #000; padding: 8px; width: 100px;">Ngày, tháng, năm <br/> sinh</th>
        <th style="border: 1px solid #000; padding: 8px; width: 70px;">Giới tính</th>
        <th style="border: 1px solid #000; padding: 8px;">Số định danh <br/> cá nhân</th>
        <th style="border: 1px solid #000; padding: 8px;">Mối quan hệ <br/> với chủ hộ</th>
      </tr>
    </thead>
    <tbody>
      {{#each familyMembers}}
      <tr>
        <td style="border: 1px solid #000; padding: 8px;">{{add @index 1}}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: left; text-transform: uppercase;">{{this.fullName}}</td>
        <td style="border: 1px solid #000; padding: 8px;">{{this.dob}}</td>
        <td style="border: 1px solid #000; padding: 8px;">{{this.gender}}</td>
        <td style="border: 1px solid #000; padding: 8px;">{{this.personalId}}</td>
        <td style="border: 1px solid #000; padding: 8px;">{{this.relationship}}</td>
      </tr>
      {{/each}}
      {{#unless familyMembers}}
      <tr>
        <td style="border: 1px solid #000; padding: 15px;">&nbsp;</td>
        <td style="border: 1px solid #000; padding: 15px;">&nbsp;</td>
        <td style="border: 1px solid #000; padding: 15px;">&nbsp;</td>
        <td style="border: 1px solid #000; padding: 15px;">&nbsp;</td>
        <td style="border: 1px solid #000; padding: 15px;">&nbsp;</td>
        <td style="border: 1px solid #000; padding: 15px;">&nbsp;</td>
      </tr>
      {{/unless}}
    </tbody>
  </table>

  <div style="font-size: 11px; font-style: italic; margin-bottom: 25px; text-align: center; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
    <div>
      <p style="margin: 0;">......,ngày......tháng......năm......</p>
      <p style="font-weight: bold; font-style: normal; margin-top: 5px;">Ý KIẾN CỦA CHỦ HỘ<sup>(3)</sup></p>
    </div>
    <div>
      <p style="margin: 0;">......,ngày......tháng......năm......</p>
      <p style="font-weight: bold; font-style: normal; margin-top: 5px;">Ý KIẾN CỦA CHỦ SỞ HỮU CHỖ Ở HỢP PHÁP<sup>(4)</sup></p>
    </div>
    <div>
      <p style="margin: 0;">......,ngày......tháng......năm......</p>
      <p style="font-weight: bold; font-style: normal; margin-top: 5px;">Ý KIẾN CỦA CHA, MẸ HOẶC NGƯỜI GIÁM HỘ<sup>(5)</sup></p>
    </div>
    <div>
      <p style="margin: 0;">......,ngày......tháng......năm......</p>
      <p style="font-weight: bold; font-style: normal; margin-top: 5px;">NGƯỜI KÊ KHAI<sup>(6)</sup></p>
    </div>
  </div>

  <div style="margin-top: 80px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; font-size: 12px; padding-left: 20mm;">
    <div>
      <p style="margin: 2px 0;">(7) Họ và tên: ....................................</p>
      <p style="margin: 2px 0;">(7) Số định danh cá nhân: .......................</p>
    </div>
    <div>
      <p style="margin: 2px 0;">(7) Họ và tên: ....................................</p>
      <p style="margin: 2px 0;">(7) Số định danh cá nhân: .......................</p>
    </div>
  </div>
</div>
`.trim(),
  },
];

export function HTMLTemplateLibrary({ onSelect }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {TEMPLATE_SNIPPETS.map((snippet) => (
        <div
          key={snippet.id}
          className="group relative flex flex-col p-4 rounded-xl border bg-card hover:border-primary hover:shadow-md transition-all cursor-pointer"
          onClick={() => onSelect(snippet.content)}
        >
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3">
            {snippet.icon}
          </div>
          <h4 className="font-semibold text-sm mb-1">{snippet.name}</h4>
          <p className="text-xs text-muted-foreground">{snippet.description}</p>
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
              Sử dụng
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
