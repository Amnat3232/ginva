# Ginva DeFi Protocol - Task-Based Liquidation with Auto-Swap

## 📋 สถานะการปัจจุบัน
- ✅ Version mismatch แก้ไขแล้ว
- ✅ Solana CLI 3.0.13 ติดตั้ง
- ✅ Stack overflow แก้ไขด้วย Box<T>
- ✅ Build ผ่าน (stack size: 4,288 < 4,096)

## 🚀 วิธีใช้งาน

### 1. คำสั่ง Build
```bash
export PATH="\$HOME/.local/share/solana/install/active_release/bin:\$PATH"
cargo build-sbf
```

### 2. คำสั่ง Test
```bash
anchor test
```

### 3. การ Deploy
```bash
anchor deploy --provider.cluster devnet
```

## 🌿 Git Workflow

### Feature Development
```bash
# 1. สร้าง branch ใหม่
git checkout -b feature-name

# 2. แก้ไข
# ใช้ VSCode หรือ editor อื่น

# 3. Test
cargo build-sbf

# 4. Commit
git add .
git commit -m "feat: description"

# 5. Merge back to develop
git checkout develop
git merge feature-name

# 6. Clean up
git branch -d feature-name
```

### Release Process
```bash
# 1. Update version numbers
# 2. Merge develop to main
git checkout main
git merge develop

# 3. Tag release
git tag -a v2.0.0 -m "Release v2.0.0"

# 4. Push
git push origin main --tags
```

## 📁 โครงสร้าง
- Anchor Framework 0.29.0
- Solana CLI 3.0.13
- Rust 1.93 (system)
- Solana Toolchain 1.84 (BPF)

## 🔧 Development Tools
- VSCode (แนะนำสำหรับแก้ไข)
- Git (version control)
- Cargo (Rust build)
- Anchor (Solana framework)
