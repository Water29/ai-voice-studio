# 环境搭建指南

## 前置条件

- **Node.js** >= 18
- **npm** >= 9
- **Git**（可选）

## 一、获取 API Keys

### DeepSeek API Key
1. 访问 [DeepSeek Platform](https://platform.deepseek.com/)
2. 注册/登录账号
3. 进入 [API Keys](https://platform.deepseek.com/api_keys) 页面
4. 创建新的 API Key，复制保存

### ElevenLabs API Key
1. 访问 [ElevenLabs](https://elevenlabs.io/)
2. 注册/登录账号
3. 进入 [API Settings](https://elevenlabs.io/app/settings/api-keys)
4. 复制 API Key

## 二、安装步骤

```bash
# 1. 克隆项目
cd D:\projects\yeete

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local

# 4. 编辑 .env.local，填入你的 API Keys
# DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
# ELEVENLABS_API_KEY=xxxxxxxxxxxxxxxx

# 5. 启动开发服务器
npm run dev
```

开发服务器启动后，访问 `http://localhost:3000`。

## 三、Python 环境（仅 Phase 3 Whisper 对齐需要）

```bash
# 创建 conda 环境
conda create -n claudecode python=3.11 -y

# 激活环境
conda activate claudecode

# 安装依赖
pip install openai-whisper
```

## 四、目录初始化

首次运行时，系统会自动创建以下目录和文件：

- `data/` — JSON 数据存储目录
- `data/history.json` — 翻译历史记录
- `public/audio/` — 生成的音频文件

## 五、常见问题

### Q: 启动后页面空白？
确保 `.env.local` 文件中的 API Key 格式正确。

### Q: 翻译/语音生成报错？
1. 检查 API Key 是否正确
2. 检查 DeepSeek/ElevenLabs 账户余额是否充足
3. 查看终端控制台错误日志

### Q: 端口被占用？
```bash
# 使用其他端口
npm run dev -- -p 3001
```
