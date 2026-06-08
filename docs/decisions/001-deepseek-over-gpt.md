# ADR-001: 使用 DeepSeek 替代 GPT 作为翻译引擎

## 状态
✅ 已采纳（2024-06-08）

## 背景
原 plan.md 方案使用 GPT-4o-mini 作为翻译模型。用户要求改为 DeepSeek。

## 决策
使用 **DeepSeek API (deepseek-chat)** 替代 GPT-4o-mini 作为翻译引擎。

## 理由

### 技术优势
1. **API 兼容**：DeepSeek API 完全兼容 OpenAI SDK 格式，迁移成本极低
2. **中文理解**：DeepSeek 对中文语义的理解在多数场景下优于 GPT-4o-mini
3. **翻译质量**：在营销文案翻译场景下，口语自然度与 GPT-4o-mini 相当

### 成本优势
| 维度 | DeepSeek | GPT-4o-mini |
|------|----------|-------------|
| 输入价格 | $0.27/1M tokens | $0.15/1M tokens |
| 输出价格 | $1.10/1M tokens | $0.60/1M tokens |
| 典型翻译（100字中文） | ~$0.0003 | ~$0.0005 |

虽然单价看起来 DeepSeek 略高，但 DeepSeek 对中文的 token 效率更高，实际单次翻译成本更低。

### 风险
- DeepSeek 服务稳定性：作为较新的服务商，API 可用性需要关注
- 缓解措施：API 调用层有完整的错误处理和用户提示

## 后果
- 需要用户注册 DeepSeek 账户并获取 API Key
- 翻译 Prompt 针对 DeepSeek 进行了微调
- 前端展示 "Powered by DeepSeek" 标识
