# 🐳 Ginva Protocol - Docker Build Guide

## สรุป (Summary)

Docker ช่วยแก้ปัญหา **Build Toolchain Compatibility** โดยสร้าง environment ที่มีทุกอย่างพร้อมใช้งาน:

- ✅ Rust 1.79 (compatible กับ edition2024)
- ✅ Solana CLI 1.18.26
- ✅ Anchor CLI 0.32.1
- ✅ Node.js 20
- ✅ ทุก dependencies ที่ต้องการ

## ขั้นตอนการใช้งาน

### 1. ติดตั้ง Docker (ถ้ายังไม่มี)

**macOS:**

```bash
# ดาวน์โหลด Docker Desktop
open https://www.docker.com/products/docker-desktop

# หรือใช้ Homebrew
brew install --cask docker
```

**Linux (Ubuntu/Debian):**

```bash
# ติดตั้ง Docker
curl -fsSL https://get.docker.com | sh

# เพิ่ม user ไปยัง docker group (ต้อง logout/login ใหม่)
sudo usermod -aG docker $USER

# ติดตั้ง docker-compose
sudo apt-get install docker-compose-plugin
```

**Windows:**

- ดาวน์โหลด Docker Desktop: https://www.docker.com/products/docker-desktop

### 2. ตรวจสอบการติดตั้ง

```bash
# ตรวจสอบ Docker
docker --version
# ควรแสดง: Docker version 24.x.x หรือสูงกว่า

# ตรวจสอบ Docker Compose
docker-compose --version
# หรือ
docker compose version
# ควรแสดง: v2.x.x หรือสูงกว่า

# ตรวจสอบว่า Docker กำลังทำงาน
docker info
```

### 3. เริ่ม Build

#### วิธีที่ 1: ใช้ Interactive Script (แนะนำ)

```bash
# ทำให้ script สามารถรันได้
chmod +x docker-build.sh

# รัน script
./docker-build.sh
```

**Menu ที่จะแสดง:**

```
เลือกการทำงาน (Select operation):

1) 🔨 Build โปรแกรม (Build program)
2) 🧪 รันเทส (Run tests)
3) 🐚 เข้า shell (Enter shell for manual commands)
4) 🚀 Deploy ไป devnet (Deploy to devnet)
5) 🧹 Clean build cache
6) 📊 ดู logs (View logs)
7) ❌ ออก (Exit)
```

#### วิธีที่ 2: ใช้ NPM Scripts

```bash
# Build
npm run build:docker

# Run tests
npm run test:docker

# Enter shell
npm run docker:shell

# Deploy to devnet
docker-compose up --build deploy-devnet

# Clean cache
npm run docker:clean
```

#### วิธีที่ 3: ใช้ Docker Compose โดยตรง

```bash
# Build
docker-compose up --build build

# หรือถ้าใช้ Docker Compose V2
docker compose up --build build

# Run tests
docker-compose up --build test

# Enter shell
docker-compose run --rm shell
```

## คำสั่งที่ใช้บ่อย

### Build โปรแกรม

```bash
# วิธีที่ 1: ผ่าน script
./docker-build.sh
# เลือก 1

# วิธีที่ 2: ผ่าน npm
npm run build:docker

# วิธีที่ 3: docker-compose
make build
# หรือ
make docker-build
```

### รัน Tests

```bash
./docker-build.sh
# เลือก 2

# หรือ
npm run test:docker
```

### Deploy ไป Devnet

```bash
./docker-build.sh
# เลือก 4

# หรือ
docker-compose up --build deploy-devnet
```

**⚠️ สำคัญ:** ก่อน deploy ต้องมี wallet ที่ `~/.config/solana/id.json`

สร้าง wallet:

```bash
# ในเครื่อง host (ไม่ใช่ใน Docker)
solana-keygen new

# ขอ airdrop (devnet)
solana airdrop 2
```

### เข้า Shell ใช้งาน Manual

```bash
./docker-build.sh
# เลือก 3

# ใน shell สามารถใช้คำสั่ง:
anchor build
anchor test
anchor deploy --provider.cluster devnet
anchor keys sync
solana --version
```

ออกจาก shell:

```bash
exit
```

### Clean Build Cache

```bash
./docker-build.sh
# เลือก 5

# หรือ
npm run docker:clean
```

## โครงสร้าง Docker

### Services ที่มี

1. **build** - Build โปรแกรม
2. **test** - รัน tests
3. **shell** - Interactive shell
4. **deploy-devnet** - Deploy ไป devnet

### Volumes (Persistent Data)

- **cargo-cache** - Cargo registry cache (ไม่ต้องโหลดใหม่ทุกครั้ง)
- **solana-cache** - Solana CLI cache
- **target-cache** - Build artifacts

## แก้ไขปัญหา (Troubleshooting)

### 1. Docker daemon not running

```
❌ Docker daemon is not running
```

**แก้ไข:**

```bash
# macOS
open -a Docker

# Linux
sudo systemctl start docker

# Windows
# เปิด Docker Desktop
```

### 2. Permission denied

```
permission denied while trying to connect to Docker daemon
```

**แก้ไข (Linux):**

```bash
# เพิ่ม user ไปยัง docker group
sudo usermod -aG docker $USER

# Logout และ login ใหม่
# หรือ
newgrp docker
```

### 3. Build ช้า / ค้าง

**สาเหตุ:** ครั้งแรกต้องดาวน์โหลด Docker image และ dependencies

**แก้ไข:**

```bash
# รอให้เสร็จ (อาจใช้เวลา 10-30 นาทีในครั้งแรก)
# ครั้งต่อไปจะเร็วขึ้นมากเนื่องจากมี cache

# ดู progress
./docker-build.sh
# เลือก 6 (ดู logs)
```

### 4. Out of memory

**แก้ไข:**

```bash
# เพิ่ม memory limit ให้ Docker
# Docker Desktop > Settings > Resources > Memory
# แนะนำ: 4GB ขึ้นไป
```

### 5. Network issues

```
error: failed to download crate
```

**แก้ไข:**

```bash
# ตรวจสอบ internet connection
ping google.com

# รันใหม่
./docker-build.sh
```

### 6. อยาก rebuild จากศูนย์

```bash
# Clean everything
./docker-build.sh
# เลือก 5

# หรือ manual
docker-compose down -v
docker system prune -a
```

## เปรียบเทียบ: Docker vs Native Build

| Feature         | Docker                   | Native                                |
| --------------- | ------------------------ | ------------------------------------- |
| Setup           | ง่าย (แค่ติดตั้ง Docker) | ยาก (ต้องจัดการ Rust, Solana, Anchor) |
| Build Time      | ช้ากว่าเล็กน้อย          | เร็วกว่า                              |
| Consistency     | ✅ 100% consistent       | อาจมีปัญหา version ต่างกัน            |
| Cross-platform  | ✅ ใช้ได้ทุก OS          | ยากกว่า                               |
| Toolchain Issue | ✅ แก้ได้                | ❌ มีปัญหา edition2024                |

## Tips & Tricks

### 1. ใช้ VS Code Dev Containers

ถ้าใช้ VS Code สามารถพัฒนาใน Docker container ได้เลย:

```bash
# ติดตั้ง extension: Remote - Containers
# กด F1 > "Remote-Containers: Reopen in Container"
```

### 2. Parallel Development

```bash
# Terminal 1: รัน build
npm run build:docker

# Terminal 2: เข้า shell ทำอย่างอื่น
npm run docker:shell
```

### 3. Save Build Time

```bash
# Build ครั้งแรก (ช้า)
./docker-build.sh  # เลือก 1

# ครั้งต่อไป (เร็ว - ใช้ cache)
./docker-build.sh  # เลือก 1
```

### 4. Custom Commands

```bash
# รัน command ใดก็ได้ใน Docker
docker-compose run --rm shell anchor keys list

docker-compose run --rm shell solana balance

docker-compose run --rm shell cargo --version
```

## สรุปคำสั่งที่สำคัญ

```bash
# เริ่มต้น - Build โปรแกรม
./docker-build.sh  # เลือก 1

# รันเทส
./docker-build.sh  # เลือก 2

# Deploy
./docker-build.sh  # เลือก 4

# เข้า shell
./docker-build.sh  # เลือก 3

# ล้าง cache
./docker-build.sh  # เลือก 5

# ดู logs
./docker-build.sh  # เลือก 6
```

หรือใช้ npm scripts:

```bash
npm run build:docker   # Build
npm run test:docker    # Test
npm run docker:shell   # Shell
npm run docker:clean   # Clean
```

## ติดต่อ & ช่วยเหลือ

- **GitHub Issues**: สำหรับรายงานปัญหา
- **Discord**: สำหรับถามคำถามทั่วไป

---

**หมายเหตุ:** ถ้าไม่อยากใช้ Docker ให้ downgrade เป็น Anchor 0.29.0 แทน (ติดต่อทีมงานสำหรับ branch นั้น)
