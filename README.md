# FlashCard AI

Ứng dụng học từ vựng thông minh với trí tuệ nhân tạo, lấy cảm hứng từ phong cách Nhật Bản. Xây dựng bộ thẻ từ vựng cá nhân, theo dõi tiến độ và luyện tập cùng Sakura — gia sư AI của bạn.

Demo: [flash-card-pink-five.vercel.app](https://flash-card-pink-five.vercel.app)

---

## Tính năng

- Tạo và quản lý bộ flashcard cá nhân
- Tích hợp AI tutor (Sakura) dựa trên Qwen — chat và luyện tập theo ngữ cảnh
- Nhập liệu bằng giọng nói qua Whisper voice input
- Hiển thị hình ảnh minh họa từ vựng qua Unsplash
- Hiệu ứng chuyển trang Shoji mượt mà
- Theo dõi tiến độ học tập
- Giao diện đăng ký / đăng nhập

---

## Công nghệ sử dụng

- **Framework:** Next.js + TypeScript
- **Styling:** CSS / Tailwind CSS
- **AI:** Qwen (AI tutor Sakura)
- **Voice:** Whisper (nhập liệu bằng giọng nói)
- **Ảnh:** Unsplash API
- **Deploy:** Vercel

---

## Cài đặt & Chạy local

**Yêu cầu:** Node.js >= 18, npm hoặc yarn

```bash
# Clone repository
git clone https://github.com/dungdev-web/flash-card.git
cd flash-card/flashcard-app

# Cài dependencies
npm install

# Tạo file môi trường
cp .env.example .env.local
# Điền các biến môi trường cần thiết (xem phần bên dưới)

# Chạy development server
npm run dev
```

Mở trình duyệt tại [http://localhost:3000](http://localhost:3000)

---

## Biến môi trường

Tạo file `.env.local` trong thư mục `flashcard-app/` với nội dung:

```env
# Qwen AI (tutor Sakura)
QWEN_API_KEY=your_qwen_api_key

# Unsplash (ảnh minh họa)
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your_unsplash_access_key

# Whisper / OpenAI (voice input)
OPENAI_API_KEY=your_openai_api_key
```

---

## Cấu trúc dự án

```
flash-card/
├── flashcard-app/          # Next.js app chính
│   ├── app/                # App Router (pages, layouts)
│   ├── components/         # UI components
│   ├── lib/                # Utilities, API clients
│   ├── public/             # Static assets
│   └── package.json
└── .gitignore
```

---


## License

[MIT](LICENSE)
