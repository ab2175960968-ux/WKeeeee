/********************************************
 * 全局状态
 ********************************************/
let tasks = [];
let score = parseInt(localStorage.getItem("score"), 10);
if (isNaN(score)) score = 0;
let level = 1;
let avatarInteractionLevel = parseInt(localStorage.getItem("avatarInteractionLevel"), 10);
if (isNaN(avatarInteractionLevel) || avatarInteractionLevel < 1) avatarInteractionLevel = 1; // 形象互动等级
const INTERACT_COST = 50;      // 互动升级所需积分

// 新增：用户自定义状态
let customAvatarUrl = localStorage.getItem("customAvatarUrl") || null;
let customAvatarName = localStorage.getItem("customAvatarName") || "小福";
let trainingPhrases = JSON.parse(localStorage.getItem("trainingPhrases") || "[]");
let themeColor = localStorage.getItem("themeColor") || "#4e6ef2";
let customVoiceFile = localStorage.getItem("customVoiceFile") || null;
let chatHistory = JSON.parse(localStorage.getItem("chatHistory") || "[]");
let avatarSetting = localStorage.getItem("avatarSetting") || "它是一个温柔又坚定的陪伴精灵，善于鼓励你完成目标。";
let avatarPersonaMemory = JSON.parse(localStorage.getItem("avatarPersonaMemory") || "[]");
let appDetectConsent = localStorage.getItem("appDetectConsent") === "true";
let lastClickTimestamp = null;
let pageHiddenSince = null;

function savePersonaMemory(note) {
  avatarPersonaMemory.push({ time: Date.now(), note });
  if (avatarPersonaMemory.length > 20) {
    avatarPersonaMemory = avatarPersonaMemory.slice(-20);
  }
  localStorage.setItem("avatarPersonaMemory", JSON.stringify(avatarPersonaMemory));
}

/********************************************
 * DOM 元素（任务页）
 ********************************************/
const taskInput = document.getElementById("taskInput");
const taskTime = document.getElementById("taskTime");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");
const simulateReminderBtn = document.getElementById("simulateReminder");
const scoreSpan = document.getElementById("score");
const levelSpan = document.getElementById("level");

/********************************************
 * DOM 元素（形象页）
 ********************************************/
const avatarImg = document.getElementById("avatarImg");
const avatarName = document.getElementById("avatarName");
const avatarLevelSpan = document.getElementById("avatarLevel");
const avatarDesc = document.getElementById("avatarDesc");
const interactBtn = document.getElementById("interactBtn");
const previewVoiceBtn = document.getElementById("previewVoiceBtn");
const customizeAvatarBtn = document.getElementById("customizeAvatarBtn");
const trainAvatarBtn = document.getElementById("trainAvatarBtn");
const chatInput = document.getElementById("chatInput");
const sendChatBtn = document.getElementById("sendChatBtn");
const chatMessages = document.getElementById("chatMessages");

/********************************************
 * DOM 元素（个人页）
 ********************************************/
const nicknameInput = document.getElementById("nicknameInput");
const saveNicknameBtn = document.getElementById("saveNicknameBtn");
const reminderSelect = document.getElementById("reminderSelect");
const buyPointsBtn = document.getElementById("buyPointsBtn");
const taskThemeColor = document.getElementById("taskThemeColor");
const themeColorValue = document.getElementById("themeColorValue");
const applyThemeBtn = document.getElementById("applyThemeBtn");
const voiceFileInput = document.getElementById("voiceFileInput");
const uploadVoiceBtn = document.getElementById("uploadVoiceBtn");
const avatarSettingInput = document.getElementById("avatarSettingInput");
const saveAvatarSettingBtn = document.getElementById("saveAvatarSettingBtn");
const askClickConsentBtn = document.getElementById("askClickConsentBtn");
const consentAgreeBtn = document.getElementById("consentAgreeBtn");
const consentDisagreeBtn = document.getElementById("consentDisagreeBtn");

/********************************************
 * DOM 元素（动画 / 弹窗）
 ********************************************/
const completeOverlay = document.getElementById("completeOverlay");
const completeText = document.getElementById("completeText");
const reminderOverlay = document.getElementById("reminderOverlay");
const modalTaskName = document.getElementById("modalTaskName");
const charMessage = document.getElementById("charMessage");
const startTaskBtn = document.getElementById("startTaskBtn");
const snoozeBtn = document.getElementById("snoozeBtn");
const snoozeCountSpan = document.getElementById("snoozeCount");
const overdueOverlay = document.getElementById("overdueOverlay");
const overdueMessage = document.getElementById("overdueMessage");
const overdueCompleteBtn = document.getElementById("overdueCompleteBtn");
const overdueNotCompleteBtn = document.getElementById("overdueNotCompleteBtn");

// 新增模态框
const customizeAvatarModal = document.getElementById("customizeAvatarModal");
const trainAvatarModal = document.getElementById("trainAvatarModal");
const avatarPhotoInput = document.getElementById("avatarPhotoInput");
const uploadPhotoBtn = document.getElementById("uploadPhotoBtn");
const previewSection = document.getElementById("previewSection");
const previewImg = document.getElementById("previewImg");
const confirmAvatarBtn = document.getElementById("confirmAvatarBtn");
const cancelAvatarBtn = document.getElementById("cancelAvatarBtn");
const trainingInput = document.getElementById("trainingInput");
const trainSentenceBtn = document.getElementById("trainSentenceBtn");
const sentencesList = document.getElementById("sentencesList");

/********************************************
 * 安全检查（防止违法乱纪的滥用行为）
 ********************************************/
const FORBIDDEN_WORDS = [
  "暴力", "恐怖", "色情", "赌博", "毒品", "自杀", "杀人", "犯罪",
  "诈骗", "洗钱", "走私", "贩运", "武器", "爆炸", "恐怖分子"
];

function isForbiddenContent(text) {
  const lowerText = text.toLowerCase();
  for (let word of FORBIDDEN_WORDS) {
    if (lowerText.includes(word)) return true;
  }
  // 检查特殊字符组合（防止绕过）
  if (/[^\u4e00-\u9fff\w\s]/g.test(text) && text.length < 5) {
    return true; // 疑似乱码或特殊攻击
  }
  return false;
}

/********************************************
 * 模态框管理
 ********************************************/
function openModal(modalId) {
  document.getElementById(modalId).classList.remove("hidden");
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add("hidden");
}

// 关闭按钮
document.querySelectorAll(".modal-close").forEach(btn => {
  btn.addEventListener("click", (e) => {
    const modalId = btn.dataset.modal;
    closeModal(modalId);
  });
});

// 点击背景关闭
document.querySelectorAll(".modal-overlay").forEach(modal => {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });
});

/********************************************
 * 导航切换
 ********************************************/
const navItems = document.querySelectorAll(".nav-item");
const pages = document.querySelectorAll(".page");

navItems.forEach(item => {
  item.addEventListener("click", () => {
    const pageId = item.dataset.page;
    navItems.forEach(i => i.classList.remove("active"));
    item.classList.add("active");
    pages.forEach(p => p.classList.remove("active"));
    document.getElementById(pageId).classList.add("active");
  });
});

/********************************************
 * 积分/等级显示更新
 ********************************************/
function updateScoreUI() {
  if (score < 0) score = 0;
  scoreSpan.textContent = score;
  localStorage.setItem("score", score);
  const newLevel = Math.floor(score / 100) + 1;
  if (newLevel !== level) {
    level = newLevel;
    levelSpan.textContent = level;
    alert("🎉 等级提升！你已达到 Lv." + level);
  }
}
function addScore(points) {
  score += points;
  if (score < 0) score = 0;
  localStorage.setItem("score", score);
  updateScoreUI();
}

/********************************************
 * AI 对话获取（复用后端）
 ********************************************/
async function fetchAIMessage(taskName) {
  try {
    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task: taskName,
        customPhrases: trainingPhrases,
        avatarSetting,
        avatarName: customAvatarName,
        chatHistory: chatHistory.slice(-6),
        personaMemory: avatarPersonaMemory.slice(-6),
      }),
    });
    const data = await response.json();
    return data.reply || "该做任务啦！";
  } catch (error) {
    console.log("AI 请求失败，使用备用语句");
    return "你好呀，主人！该去做「" + taskName + "」了哦！";
  }
}

// 获取对话回复
async function fetchChatReply(userMessage) {
  try {
    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task: "chat",
        message: userMessage,
        customPhrases: trainingPhrases,
        avatarSetting,
        avatarName: customAvatarName,
        chatHistory: chatHistory.slice(-6),
        personaMemory: avatarPersonaMemory.slice(-6),
      }),
    });
    const data = await response.json();
    return data.reply || "我想不出来了...";
  } catch (error) {
    console.log("AI 请求失败");
    return "抱歉，我有点累了...";
  }
}

/********************************************
 * 语音播报
 ********************************************/
function speakText(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 1.0;
  utterance.pitch = 1.1;
  const voices = window.speechSynthesis.getVoices();
  const zhVoice = voices.find(v => v.lang.startsWith("zh-CN"));
  if (zhVoice) utterance.voice = zhVoice;
  window.speechSynthesis.speak(utterance);
}

/********************************************
 * 任务完成动画
 ********************************************/
function showCompleteAnimation(taskText) {
  completeText.textContent = "✅ 完成了「" + taskText + "」！太厉害了~";
  completeOverlay.classList.remove("hidden");
  setTimeout(() => {
    completeOverlay.classList.add("hidden");
  }, 2000);
}

/********************************************
 * 任务列表渲染
 ********************************************/
function renderTasks() {
  taskList.innerHTML = "";
  tasks.forEach((task, index) => {
    const li = document.createElement("li");
    if (task.done) li.classList.add("completed");
    li.innerHTML = `
      <span class="task-time">${task.time}</span>
      <span class="task-text">${task.text}</span>
      ${!task.done ? '<button class="task-done-btn">完成</button>' : '✅'}
    `;
    const doneBtn = li.querySelector(".task-done-btn");
    if (doneBtn) {
      doneBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        task.done = true;
        addScore(30);
        showCompleteAnimation(task.text);
        renderTasks();
      });
    }
    taskList.appendChild(li);
  });
}

// 添加任务
addTaskBtn.addEventListener("click", () => {
  const text = taskInput.value.trim();
  if (!text) return;
  const time = taskTime.value;
  tasks.push({ text, time, done: false, overdueAlerted: false });
  renderTasks();
  taskInput.value = "";
});

/********************************************
 * 模拟强制提醒（弹窗 + AI 对话）
 ********************************************/
let currentTaskIndex = 0;
let snoozeRemaining = 1;

simulateReminderBtn.addEventListener("click", () => {
  const undoneTasks = tasks.filter(t => !t.done);
  if (undoneTasks.length === 0) {
    alert("所有任务都完成啦！");
    return;
  }
  currentTaskIndex = tasks.indexOf(undoneTasks[0]);
  snoozeRemaining = 1;
  reminderOverlay.classList.remove("hidden");
  updateReminderModal();
});

async function updateReminderModal() {
  const task = tasks[currentTaskIndex];
  modalTaskName.textContent = `任务：${task.text}`;
  charMessage.textContent = "正在组织语言...";
  const aiMsg = await fetchAIMessage(task.text);
  charMessage.textContent = aiMsg;
  speakText(aiMsg);
  snoozeBtn.style.display = "block";
  snoozeCountSpan.textContent = snoozeRemaining;
}

// 长按开始任务
let pressTimer;
function startPress() {
  startTaskBtn.textContent = "按住别松手...";
  pressTimer = setTimeout(() => {
    tasks[currentTaskIndex].done = true;
    addScore(30);
    showCompleteAnimation(tasks[currentTaskIndex].text);
    renderTasks();
    reminderOverlay.classList.add("hidden");
    const nextTask = tasks.find(t => !t.done);
    if (nextTask) {
      currentTaskIndex = tasks.indexOf(nextTask);
      snoozeRemaining = 1;
      updateReminderModal();
      reminderOverlay.classList.remove("hidden");
    }
  }, 3000);
}
function cancelPress() {
  clearTimeout(pressTimer);
  startTaskBtn.textContent = "开始任务（长按 3 秒解锁）";
}
startTaskBtn.addEventListener("mousedown", startPress);
startTaskBtn.addEventListener("mouseup", cancelPress);
startTaskBtn.addEventListener("touchstart", (e) => { e.preventDefault(); startPress(); });
startTaskBtn.addEventListener("touchend", cancelPress);

// 躺平按钮
snoozeBtn.addEventListener("click", () => {
  if (snoozeRemaining > 0) {
    snoozeRemaining--;
    snoozeCountSpan.textContent = snoozeRemaining;
    addScore(-5);
    setTimeout(() => {
      const task = tasks[currentTaskIndex];
      if (task && !task.done) {
        reminderOverlay.classList.remove("hidden");
        updateReminderModal();
      }
    }, 5000);
    reminderOverlay.classList.add("hidden");
  }
  if (snoozeRemaining === 0) snoozeBtn.style.display = "none";
});

/********************************************
 * 形象页面逻辑
 ********************************************/
function updateAvatarUI() {
  avatarLevelSpan.textContent = `互动等级：${avatarInteractionLevel}`;
  avatarName.textContent = customAvatarName;
  const imgUrl = customAvatarUrl || "https://em-content.zobj.net/thumbs/120/apple/325/fox_1f98a.png";
  avatarImg.src = imgUrl;
  avatarImg.classList.add("live-avatar");
  const reminderAvatar = document.getElementById("charImg");
  if (reminderAvatar) reminderAvatar.src = imgUrl;
  const completeAvatar = completeOverlay.querySelector(".complete-char");
  if (completeAvatar) completeAvatar.src = imgUrl;
  const overdueAvatar = document.getElementById("overdueAvatarImg");
  if (overdueAvatar) overdueAvatar.src = imgUrl;
  const descList = [
    "它还有点害羞，多和它互动吧~",
    "它开始对你摇尾巴了！",
    "它现在喜欢围着你转圈~",
    "它完全信任你，时刻陪着你！"
  ];
  const idx = Math.min(avatarInteractionLevel - 1, descList.length - 1);
  avatarDesc.textContent = descList[idx];
}

interactBtn.addEventListener("click", () => {
  if (score >= INTERACT_COST) {
    score -= INTERACT_COST;
    avatarInteractionLevel++;
    localStorage.setItem("avatarInteractionLevel", avatarInteractionLevel);
    updateScoreUI();
    updateAvatarUI();
    speakText("互动升级成功！我们更亲密了~");
    alert("互动升级！消耗 50 积分，当前互动等级 " + avatarInteractionLevel);
  } else {
    alert("积分不足，需要 " + INTERACT_COST + " 积分才能互动升级哦");
  }
});

previewVoiceBtn.addEventListener("click", () => {
  const sampleText = "嘿，别偷懒呀！我一直在看着你哦~";
  speakText(sampleText);
});

/********************************************
 * 形象自定义功能
 ********************************************/
customizeAvatarBtn.addEventListener("click", () => {
  openModal("customizeAvatarModal");
  previewSection.classList.add("hidden");
});

function generateLiveAvatarFromPhoto(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const size = Math.min(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
      ctx.restore();
      
      // 增加亮度
      ctx.globalCompositeOperation = "soft-light";
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(0, 0, size, size);
      
      // 添加高光
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.beginPath();
      ctx.arc(size * 0.85, size * 0.15, size * 0.15, 0, Math.PI * 2);
      ctx.fill();
      
      // 添加轮廓
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
      ctx.stroke();
      
      resolve(canvas.toDataURL("image/png"));
    };
    img.src = dataUrl;
  });
}

uploadPhotoBtn.addEventListener("click", async () => {
  const file = avatarPhotoInput.files[0];
  if (!file) {
    alert("请先选择照片");
    return;
  }
  const reader = new FileReader();
  reader.onload = async (e) => {
    const dataUrl = e.target.result;
    previewImg.src = "";
    previewImg.alt = "生成中...";
    previewSection.classList.remove("hidden");
    const liveAvatar = await generateLiveAvatarFromPhoto(dataUrl);
    previewImg.src = liveAvatar;
    previewImg.alt = "预览";
  };
  reader.readAsDataURL(file);
});

confirmAvatarBtn.addEventListener("click", () => {
  const dataUrl = previewImg.src;
  if (!dataUrl) return;
  customAvatarUrl = dataUrl;
  localStorage.setItem("customAvatarUrl", dataUrl);
  updateAvatarUI();
  closeModal("customizeAvatarModal");
  alert("✅ 形象已更新！");
});

cancelAvatarBtn.addEventListener("click", () => {
  previewSection.classList.add("hidden");
  avatarPhotoInput.value = "";
});

/********************************************
 * 对话窗口功能
 ********************************************/
function addChatMessage(text, isUser = true, saveHistory = true) {
  const msgDiv = document.createElement("div");
  msgDiv.className = isUser ? "chat-message user" : "chat-message avatar";
  msgDiv.textContent = text;
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  if (saveHistory) {
    const role = isUser ? "user" : "assistant";
    chatHistory.push({ role, content: text });
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory.slice(-20)));
  }
}

function renderChatHistory() {
  chatMessages.innerHTML = "";
  chatHistory.forEach(msg => addChatMessage(msg.content, msg.role === "user", false));
}

sendChatBtn.addEventListener("click", async () => {
  const userText = chatInput.value.trim();
  if (!userText) return;
  
  // 检查违规内容
  if (isForbiddenContent(userText)) {
    alert("⚠️ 检测到不当内容，请文明交流");
    chatInput.value = "";
    return;
  }
  
  addChatMessage(userText, true);
  chatInput.value = "";
  
  const reply = await fetchChatReply(userText);
  addChatMessage(reply, false);
});

chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendChatBtn.click();
});

/********************************************
 * 语句训练功能
 ********************************************/
function renderTrainingList() {
  sentencesList.innerHTML = "";
  trainingPhrases.forEach((phrase, idx) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${phrase}</span>
      <button class="delete-sentence" data-idx="${idx}">删除</button>
    `;
    sentencesList.appendChild(li);
  });
  
  // 绑定删除按钮
  document.querySelectorAll(".delete-sentence").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = parseInt(e.target.dataset.idx);
      trainingPhrases.splice(idx, 1);
      localStorage.setItem("trainingPhrases", JSON.stringify(trainingPhrases));
      renderTrainingList();
    });
  });
}

trainAvatarBtn.addEventListener("click", () => {
  openModal("trainAvatarModal");
  renderTrainingList();
});

trainSentenceBtn.addEventListener("click", () => {
  const text = trainingInput.value.trim();
  if (!text) {
    alert("请输入要训练的语句");
    return;
  }
  
  // 安全检查
  if (isForbiddenContent(text)) {
    alert("⚠️ 不允许训练包含违法、暴力或歧视内容的语句！");
    return;
  }
  
  if (text.length > 200) {
    alert("语句太长了，请限制在 200 字以内");
    return;
  }
  
  trainingPhrases.push(text);
  localStorage.setItem("trainingPhrases", JSON.stringify(trainingPhrases));
  savePersonaMemory(`学会了表达：${text}`);
  trainingInput.value = "";
  renderTrainingList();
  alert("✅ 语句已添加！形象会学会这个说法，并在后续对话中尝试使用。");
});

/********************************************
 * 主题颜色自定义
 ********************************************/
taskThemeColor.addEventListener("change", (e) => {
  const color = e.target.value;
  themeColorValue.textContent = color;
});

applyThemeBtn.addEventListener("click", () => {
  const color = taskThemeColor.value;
  themeColor = color;
  localStorage.setItem("themeColor", color);
  
  // 应用主题色
  document.documentElement.style.setProperty("--primary-color", color);
  const style = document.querySelector("style") || document.createElement("style");
  style.innerHTML = `
    :root { --primary-color: ${color}; }
    .status-bar, .plan-form button, .task-done-btn, #simulateReminder, 
    #interactBtn, #previewVoiceBtn, #customizeAvatarBtn, #trainAvatarBtn,
    .form-group button, #applyThemeBtn, .modal-header { 
      background: ${color} !important;
    }
  `;
  document.head.appendChild(style);
  alert("✅ 主题色已应用！");
});

// 初始化主题色
taskThemeColor.value = themeColor;
themeColorValue.textContent = themeColor;

/********************************************
 * 语音文件上传
 ********************************************/
uploadVoiceBtn.addEventListener("click", () => {
  const file = voiceFileInput.files[0];
  if (!file) {
    alert("请先选择语音文件");
    return;
  }
  
  if (!["audio/mpeg", "audio/wav", "audio/mp4"].includes(file.type)) {
    alert("仅支持 MP3、WAV、M4A 格式");
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    customVoiceFile = dataUrl;
    localStorage.setItem("customVoiceFile", dataUrl);
    alert("✅ 语音文件已上传！");
  };
  reader.readAsDataURL(file);
});

function confirmOverdueCompletion(task) {
  task.done = true;
  addScore(30);
  showCompleteAnimation(task.text);
  renderTasks();
  closeOverdueOverlay();
}

function closeOverdueOverlay() {
  overdueOverlay.classList.add("hidden");
}

function showOverdueOverlay(task) {
  overdueMessage.textContent = `${customAvatarName} 发现你还没有按计划完成「${task.text}」，我有点担心你哦。现在告诉我，你是否已完成任务？`;
  overdueOverlay.classList.remove("hidden");
  speakText(`${customAvatarName} 提示：你还没有完成任务，我在这里支持你。`);
  task.overdueAlerted = true;
}

overdueCompleteBtn.addEventListener("click", () => {
  const task = tasks.find(t => !t.done && t.overdueAlerted);
  if (task) confirmOverdueCompletion(task);
});

overdueNotCompleteBtn.addEventListener("click", () => {
  const task = tasks.find(t => !t.done && t.overdueAlerted);
  if (task) {
    task.overdueAlerted = true;
    closeOverdueOverlay();
    alert("没关系，慢慢来，我会继续陪着你。");
  }
});

function checkTaskDeadlines() {
  const now = new Date();
  tasks.forEach(task => {
    if (task.done || task.overdueAlerted) return;
    const [hour, minute] = task.time.split(":").map(Number);
    const dueTime = new Date();
    dueTime.setHours(hour, minute, 0, 0);
    if (now >= dueTime && !task.done) {
      showOverdueOverlay(task);
    }
  });
}

function startAppDetection() {
  if (!appDetectConsent) return;
  document.addEventListener("visibilitychange", handleVisibilityChange);
  document.addEventListener("click", () => {
    lastClickTimestamp = Date.now();
  });
}

function handleVisibilityChange() {
  if (!appDetectConsent) return;
  if (document.hidden) {
    pageHiddenSince = Date.now();
  } else {
    if (!pageHiddenSince) return;
    const secondsAway = Math.round((Date.now() - pageHiddenSince) / 1000);
    if (lastClickTimestamp && lastClickTimestamp > pageHiddenSince) {
      alert(`${customAvatarName} 发现你刚刚回来了，继续加油吧！`);
    } else {
      alert(`${customAvatarName} 注意到你离开了一小会儿，我只检测页面可见状态，不会读取其他应用内容。`);
    }
    pageHiddenSince = null;
  }
}

/********************************************
 * 个人页面逻辑
 ********************************************/
const savedNick = localStorage.getItem("nickname");
if (savedNick) nicknameInput.value = savedNick;
saveNicknameBtn.addEventListener("click", () => {
  const nick = nicknameInput.value.trim();
  if (nick) {
    localStorage.setItem("nickname", nick);
    alert("昵称已保存：" + nick);
  }
});

if (localStorage.getItem("avatarSetting")) {
  avatarSettingInput.value = localStorage.getItem("avatarSetting");
}
saveAvatarSettingBtn.addEventListener("click", () => {
  const setting = avatarSettingInput.value.trim();
  if (!setting) {
    alert("请为形象输入一段设定描述");
    return;
  }
  avatarSetting = setting;
  localStorage.setItem("avatarSetting", avatarSetting);
  savePersonaMemory(`设定更新：${setting}`);
  alert("形象设定已保存！形象会根据最新设定不断调整对话。");
});

askClickConsentBtn.addEventListener("click", () => {
  openModal("consentModal");
});

consentAgreeBtn.addEventListener("click", () => {
  appDetectConsent = true;
  localStorage.setItem("appDetectConsent", "true");
  askClickConsentBtn.textContent = "检测已开启";
  startAppDetection();
  closeModal("consentModal");
  alert("✅ 检测已开启！我会留意你的页面状态。");
});

consentDisagreeBtn.addEventListener("click", () => {
  appDetectConsent = false;
  localStorage.setItem("appDetectConsent", "false");
  askClickConsentBtn.textContent = "检测已拒绝";
  closeModal("consentModal");
  alert("已拒绝检测，系统不会访问其他 App 内容。");
});

reminderSelect.value = localStorage.getItem("reminder") || "1";
reminderSelect.addEventListener("change", () => {
  localStorage.setItem("reminder", reminderSelect.value);
  alert(reminderSelect.value === "1" ? "已开启每日提醒" : "已关闭每日提醒");
});

buyPointsBtn.addEventListener("click", () => {
  score += 100;
  updateScoreUI();
  alert("购买成功！+100 积分，当前积分：" + score);
});

/********************************************
 * 初始化
 ********************************************/
updateScoreUI();
updateAvatarUI();
renderTasks();
renderTrainingList();
renderChatHistory();
if (appDetectConsent) {
  askClickConsentBtn.textContent = "检测已开启";
  startAppDetection();
}
checkTaskDeadlines();
setInterval(checkTaskDeadlines, 30000);