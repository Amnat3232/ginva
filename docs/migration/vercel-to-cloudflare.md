# Ginva Frontend: ย้ายจาก Vercel ไป Cloudflare Pages

## สถานะ

- [x] Deploy แล้ว: https://ginva-frontend.pages.dev
- [ ] ตั้ง Environment Variables
- [ ] CI/CD

---

### 1. ติดตั้ง wrangler CLI
```bash
npm install -g wrangler
```

### 2. ลงชื่อเข้าใช้ Cloudflare
```bash
wrangler login
```

### 3. สร้างไฟล์ config (เสร็จแล้ว)

สร้างไฟล์ `wrangler.toml` ที่ `app/wrangler.toml`:
```toml
name = "ginva-frontend"
compatibility_date = "2024-01-01"
pages_build_output_dir = "./dist"
```

### 4. สร้าง Pages Project (เสร็จแล้ว)
```bash
wrangler pages project create ginva-frontend --production-branch main
```

### 5. Deploy (เสร็จแล้ว)
```bash
# Build
npm run build

# Deploy
wrangler pages deploy dist --project-name ginva-frontend --branch main
```

### 6. ตั้ง Secrets ต่อไปนี้ใน Cloudflare Dashboard

ไปที่: https://dash.cloudflare.com → Pages → ginva-frontend → Settings → Environment variables (production)

เพิ่ม:
- `VITE_SOLANA_RPC_ENDPOINT` = RPC URL ของคุณ
- `VITE_GINVA_PROGRAM_ID` = Program ID

---

### ขั้นตอนที่เหลือ

#### สร้าง Secrets ใหม่
```bash
# Vercel Token (ถ้ายังต้องการ) - สร้างใหม่ที่ https://vercel.com/account/tokens

# Supabase Key (ถ้าจำเป็น) - สร้างใหม่ที่ supabase.com/dashboard

# Solana RPC URL (ถ้าใช้ private RPC) - สร้างใหม่จากผู้ให้บริการ

# Groq API Key - สร้างใหม่ที่ console.groq.com

# Discord Webhook - สร้างใหม่จาก Discord channel settings

# Telegram Bot Token - สร้างใหม่จาก @BotFather
```

#### ลบ Vercel Secrets ออกจาก GitHub
```bash
# ไปที่ GitHub repo → Settings → Secrets and variables → Actions
# ลบ VERCEL_TOKEN และ Secrets อื่นที่เกี่ยวกับ Vercel ออก
```

#### ตั้งค่า CI/CD อัตโนมัติ

**วิธีที่ 1: สร้าง GitHub Actions Workflow ใหม่**
```bash
# สร้างไฟล์ .github/workflows/deploy.yml
```

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_SOLANA_RPC_ENDPOINT: ${{ secrets.VITE_SOLANA_RPC_ENDPOINT }}
          VITE_GINVA_PROGRAM_ID: ${{ secrets.VITE_GINVA_PROGRAM_ID }}

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=ginva-frontend --branch=main
```

**วิธีที่ 2: เชื่อมต่อ GitHub Repo กับ Cloudflare Pages ผ่านหน้าเว็บ**
1. ไปที่ [dash.cloudflare.com](https://dash.cloudflare.com) → Workers & Pages
2. เลือกโปรเจกต์ `ginva-frontend`
3. ไปที่แท็บ **Settings** → **Builds and deployments**
4. เลือก **Git provider** เป็น **GitHub**
5. อนุญาต access ให้ Cloudflare Pages app
6. เลือก repo และ branch ที่ต้องการ

#### เพิ่ม Secrets ใน GitHub
```bash
# ไปที่ GitHub repo → Settings → Secrets and variables → Actions → New repository secret

CLOUDFLARE_API_TOKEN       # สร้างที่ dash.cloudflare.com/profile/api-tokens
CLOUDFLARE_ACCOUNT_ID    # ดูได้จาก Cloudflare Dashboard (overview)
VITE_SOLANA_RPC_ENDPOINT  # RPC URL ของ Solana
VITE_GINVA_PROGRAM_ID    # Program ID บน Solana
```

**NOTE**: GitHub Actions workflow สร้างแล้วที่ `.github/workflows/deploy.yml`

---

## สรุปการย้าย

| ขั้นตอน | สถานะ |
|--------|-------|
| ติดตั้ง wrangler | ✅ |
| สร้าง Pages project | ✅ |
| Deploy ครั้งแรก | ✅ |
| ตั้ง Environment Variables | ⏳ |
| ตั้ง CI/CD | ⏳ |

### URLs
- **Production**: https://ginva-frontend.pages.dev
- **Preview**: จะสร้างอัตโนมัติเมื่อเปิด PR
```