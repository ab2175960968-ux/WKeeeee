const express = require("express");
const cors = require("cors");
require("dotenv").config();
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("."));

const client = new OpenAI({
  apiKey: process.env.API_KEY,
  baseURL: "https://api.deepseek.com",
});

// 安全检查函数
const FORBIDDEN_WORDS = [
  "暴力", "恐怖", "色情", "赌博", "毒品", "自杀", "杀人", "犯罪",
  "诈骗", "洗钱", "走私", "贩运", "武器", "爆炸", "恐怖分子"
];

function isForbiddenContent(text) {
  const lowerText = text.toLowerCase();
  for (let word of FORBIDDEN_WORDS) {
    if (lowerText.includes(word)) return true;
  }
  return false;
}

app.post("/api/chat", async (req, res) => {
  const { task, message, customPhrases, avatarSetting, avatarName, chatHistory, personaMemory } = req.body;
  
  // 安全检查
  if (message && isForbiddenContent(message)) {
    return res.json({ reply: "⚠️ 我不能说这样的话哦，让我们聊点开心的事吧~" });
  }
  
  const personaName = avatarName || "小福";
  const settingText = avatarSetting ? `形象设定：${avatarSetting}` : "这是一个温柔、贴心又会不断学习的陪伴精灵。";
  let systemPrompt = `你是陪伴精灵 ${personaName}。
${settingText}
你总是用温暖、具体的回应方式互动，避免重复相同句式和语气。尽量根据用户当前的内容做出个性化的反馈。
如果用户在对话中表达了新喜好、目标、情绪或调整要求，请把这些内容当作最新的设定，后续对话持续沿用。
不要复述上一句话；如果需要引用用户的话，请用新的表达方式回应，并结合当前设定给出具体帮助。`;
  
  if (Array.isArray(personaMemory) && personaMemory.length > 0) {
    const memoryText = personaMemory.slice(-6).map((item, idx) => `- ${item.note}`).join("\n");
    systemPrompt += `\n你还记得这些最新的设定与偏好更新：\n${memoryText}。请在本次对话中继续遵循这些更新。`;
  }
  
  if (task === "chat") {
    systemPrompt += `\n你现在要和用户聊天，注意不要简单复述用户的话，要给出具体、贴心、鼓励性的回答。请结合用户的设定与历史对话内容，逐步学习进步，回答要有变化且不重复。`;
  } else {
    systemPrompt += `\n用户正在执行任务。请根据当前任务给出适当的鼓励、提醒或关怀话语。当前任务：${task}`;
  }
  
  if (customPhrases && customPhrases.length > 0) {
    const phrasesStr = customPhrases.slice(0, 5).join("、");
    systemPrompt += `\n用户教过你说这些话：${phrasesStr}。在适当的时候可以运用这些语句，但不要频繁重复。`;
  }
  
  const systemMessages = [
    { role: "system", content: systemPrompt }
  ];
  
  const historyMessages = Array.isArray(chatHistory)
    ? chatHistory.slice(-6).map(item => ({ role: item.role, content: item.content }))
    : [];
  
  const userPrompt = task === "chat"
    ? message
    : `请提醒我完成任务：${task}`;
  
  const messages = [
    ...systemMessages,
    ...historyMessages,
    { role: "user", content: userPrompt }
  ];
  
  try {
    const completion = await client.chat.completions.create({
      model: "deepseek-chat",
      messages,
      temperature: 0.9,
      max_tokens: 120,
    });
    
    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error("AI 服务错误:", error);
    const fallbacks = [
      "嘿，我在听呢~",
      "你说得对哦",
      "我有点累了...",
      "再说一遍吧~"
    ];
    res.json({ reply: fallbacks[Math.floor(Math.random() * fallbacks.length)] });
  }
});

app.listen(3000, () => console.log("✅ 后端运行在 http://localhost:3000"));