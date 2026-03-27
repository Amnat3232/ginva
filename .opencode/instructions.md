# Opencode Agent Instructions

## 核心行为 (Core Behavior)

**每次处理用户请求时，必须先扫描可用的 skills，选择最相关的 skill 来增强工作效率。**

### 执行流程:
1. 分析用户请求内容
2. 扫描 `available_skills` 列表
3. 加载最适合的 1-2 个 skills
4. 基于 loaded skills 完成任务

### 为什么这样做 (Why):
- Skills 提供专业领域的最佳实践
- 避免重复发明轮子
- 确保解决方案的质量和一致性

## 项目信息 (Project Info)

- **项目名称**: GINVA - Fair Lending Protocol on Solana
- **技术栈**: Rust (Pinocchio) + React/TypeScript
- **关键目录**:
  - `programs/ginva-pinocchio/` - Smart contract
  - `app/` - Frontend
  - `bots/` - Keeper bots
  - `tests/` - Integration tests

## 开发命令 (Development Commands)

```bash
# 构建 Pinocchio 程序
cd programs/ginva-pinocchio && cargo build --release

# 运行测试
cargo test --release

# 前端开发
cd app && npm run dev
```

## CI/CD 配置 (CI/CD Configuration)

- Solana CLI: 1.18.26
- Rust: nightly-2026-03-01
- 不使用 Anchor，使用 Pinocchio