# Agent Instructions for GINVA Project

## 重要指令 (Important Instructions)

### 1. 技能扫描 (Skill Scanning)
**每次收到用户请求时，必须先扫描可用的 skills，找到最适合的 skill 来帮助完成任务。**

流程：
1. 分析用户请求
2. 扫描可用的 skills 列表
3. 加载最相关的 1-2 个 skills
4. 使用 loaded skills 来完成任务

### 2. 项目概述 (Project Overview)
GINVA 是一个基于 Solana 的去中心化借贷协议 (DeFi lending protocol)。

**技术栈:**
- Smart Contract: Rust + Pinocchio (已从 Anchor 迁移)
- Frontend: React + TypeScript
- Network: Solana Devnet/Mainnet
- CI/CD: GitHub Actions (Pinocchio 构建)

### 3. 开发规范 (Development Standards)

#### CI/CD
- 使用 `cargo build --release` 在 `programs/ginva-pinocchio` 目录构建
- 不使用 Anchor (`anchor build`)
- Solana CLI 版本: 1.18.26
- Rust 版本: nightly-2026-03-01

#### 代码风格
- Rust: 使用 rustfmt, clippy
- TypeScript: 使用 ESLint, Prettier
- 提交消息格式: `type: description` (feat, fix, chore, etc.)

### 4. 安全注意事项 (Security Notes)
- 永远不要提交私钥或敏感信息
- wallet.json 仅在 develop 分支 push 时使用
- 使用 GitHub Secrets 存储敏感信息

### 5. Security Hardening Features (Phase 2)

See `docs/SECURITY_HARDENING.md` for full documentation.

**Supply Cap:**
- Limits max deposit/borrow amount per asset
- AssetConfig.supply_cap field (0 = unlimited)

**Oracle Circuit Breaker:**
- Auto-pauses on price anomaly detection
- AssetConfig.price_deviation_threshold_bps

**Multi-Oracle:**
- Pyth + Switchboard dual validation
- AssetOracleConfig supports primary/secondary oracle

### 6. 常用命令 (Common Commands)

```bash
# 构建 Pinocchio 程序
cd programs/ginva-pinocchio && cargo build --release

# 运行测试
cd programs/ginva-pinocchio && cargo test --release

# 启动前端
cd app && npm run dev

# 本地 Solana 集群
solana-test-validator
```

---

**记住: 始终先扫描 skills，选择最适合的工具来完成工作！**