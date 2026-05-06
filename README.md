# 陪伴系统 - 部署和运行指南

## 系统要求

- **Node.js** >= 14.0
- **npm** >= 6.0
- **现代浏览器** (Chrome, Firefox, Safari, Edge)
- **网络连接** (用于 AI 对话)

---

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件，添加你的 API 密钥：

```env
API_KEY=你的_DeepSeek_API_密钥
```

**获取 API 密钥**：
1. 访问 [https://platform.deepseek.com](https://platform.deepseek.com)
2. 注册/登录账户
3. 创建 API 密钥
4. 复制到 `.env` 文件中

### 3. 启动后端服务

```bash
npm start
```

输出应该显示：
```
✅ 后端运行在 http://localhost:3000
```

### 4. 打开前端

在浏览器中访问：
```
file:///path/to/companion-app/index.html
```

或者使用 Live Server 插件（VS Code）打开 `index.html`

---

## 功能验证清单

启动应用后，请验证以下功能是否正常工作：

- [ ] **任务页面**
  - [ ] 能够添加新任务
  - [ ] 能够标记任务为完成
  - [ ] 积分系统正常运行
  - [ ] 颜色主题应用成功

- [ ] **形象页面**
  - [ ] 形象图片正常显示
  - [ ] "自定义形象"可以上传照片
  - [ ] 对话窗口可以输入和发送消息
  - [ ] AI 回复显示在对话框中
  - [ ] "训练语句"可以添加新语句
  - [ ] 系统会阻止不当内容

- [ ] **个人中心**
  - [ ] 可以保存昵称
  - [ ] 可以切换提醒开关
  - [ ] 可以选择主题颜色
  - [ ] 可以上传语音文件
  - [ ] 可以购买积分

---

## 项目文件结构

```
companion-app/
├── index.html              # 主 HTML 文件
├── script.js              # 前端 JavaScript
├── style.css              # 样式表
├── server.js              # 后端 Node.js 服务
├── package.json           # npm 依赖配置
├── .env                   # 环境变量（需要创建）
├── 功能说明.md            # 功能使用指南
└── README.md              # 本文件
```

---

## 数据存储

### 本地存储（浏览器 localStorage）
应用会自动保存以下数据到浏览器：

```javascript
- nickname              // 用户昵称
- reminder              // 提醒开关状态
- customAvatarUrl       // 自定义形象 URL
- customAvatarName      // 自定义形象名称
- trainingPhrases       // 训练的语句列表
- themeColor            // 主题颜色
- customVoiceFile       // 语音文件
```

### 清除数据

如果需要重置所有设置：

**Chrome/Firefox/Safari**：
1. 打开开发者工具 (F12)
2. 进入 Application → Local Storage
3. 找到当前网址的项目
4. 右键删除所有条目

或在控制台输入：
```javascript
localStorage.clear();
location.reload();
```

---

## 常见问题排查

### 问题：后端无法启动
**解决方案**：
- 检查 Node.js 是否正确安装：`node -v`
- 检查 npm 依赖是否安装：`npm list`
- 重新安装依赖：`npm install`
- 检查 3000 端口是否被占用

### 问题：AI 对话不工作
**解决方案**：
- 检查 `.env` 文件中的 API_KEY 是否正确
- 确保有网络连接
- 检查 DeepSeek API 额度是否充足
- 查看浏览器控制台是否有错误信息

### 问题：形象照片无法上传
**解决方案**：
- 确认图片格式是 JPG 或 PNG
- 检查图片文件大小（建议 < 5MB）
- 清除浏览器缓存后重试
- 检查浏览器是否禁用了 File API

### 问题：语句训练被拒绝
**解决方案**：
- 检查输入是否包含禁止词汇
- 输入应该是正常中文或英文
- 避免使用特殊字符或乱码
- 查看系统反馈的具体错误信息

---

## 性能优化建议

1. **清理旧数据**
   - 定期清除过期的训练语句
   - 清理浏览器缓存

2. **网络优化**
   - 使用 CDN 加速资源加载
   - 减少 API 调用频率

3. **内存优化**
   - 限制对话历史长度
   - 及时清理未使用的资源

---

## 开发调试

### 启用详细日志

在浏览器控制台中：
```javascript
// 查看所有本地存储
console.log(localStorage);

// 查看特定值
console.log(localStorage.getItem('trainingPhrases'));

// 手动添加日志
console.log('用户操作:', event);
```

### 测试 API 调用

```bash
# 测试 AI 对话
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"task":"背单词"}'

# 测试自定义语句
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"task":"chat","message":"你好","customPhrases":["你好世界"]}'
```

---

## 安全建议

1. **API 密钥保护**
   - 不要将 `.env` 文件提交到 Git
   - 定期更换 API 密钥
   - 生产环境使用环境变量配置

2. **内容安全**
   - 系统已内置过滤机制
   - 定期更新禁止词库
   - 监控用户输入日志

3. **数据隐私**
   - 所有用户数据存储在本地
   - 不收集个人隐私信息
   - 用户可随时删除所有数据

---

## 扩展和定制

### 修改形象设置
编辑 `script.js` 中的初始值：
```javascript
let customAvatarName = localStorage.getItem("customAvatarName") || "小福";
let trainingPhrases = JSON.parse(localStorage.getItem("trainingPhrases") || "[]");
```

### 修改禁止词库
编辑 `script.js` 中的 FORBIDDEN_WORDS 数组：
```javascript
const FORBIDDEN_WORDS = [
  "暴力", "恐怖", "色情", 
  // ... 添加更多词汇
];
```

### 修改 AI 系统提示
编辑 `server.js` 中的 systemPrompt：
```javascript
let systemPrompt = `你是一只聪明可爱的陪伴精灵...`;
```

---

## 更新日志

### v1.1.0 (2025-05-06)
- ✨ 新增形象自定义
- ✨ 新增对话窗口
- ✨ 新增语句训练
- 🔒 增强安全防护

### v1.0.0
- 初始版本发布

---

## 许可证

MIT License

---

## 支持和反馈

- 📧 邮件：support@example.com
- 💬 社区：GitHub Issues
- 📚 文档：查看 `功能说明.md`

祝你使用愉快！🎉
