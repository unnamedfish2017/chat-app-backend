const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
const apiUrl = "https://api.deepseek.com/chat/completions";
const apiKey = "sk-029ef31805dc4a2e944e89a161367a8e";
// 连接 MongoDB
mongoose.connect('mongodb://116.205.182.116:27017/mydatabase', { useNewUrlParser: true, useUnifiedTopology: true });

// 创建消息模型
const Message = mongoose.model('Message', new mongoose.Schema({
  text: String,
  isUserMessage: Boolean,
  createdAt: { type: Date, default: Date.now }
}));

// API 路由
app.post('/api/messages', async (req, res) => {
  const { text } = req.body;

  // 保存用户消息到数据库
  const newMessage = new Message({ text, isUserMessage: true });
  await newMessage.save();

  // 查询最近10条消息
  const recentMessages = await Message.find().sort({ createdAt: -1 }).limit(10);

  // 构建 DeepSeek API 请求体
  const messageHistory = [
    {
      role: 'system',
      content: '你现在扮演我的女友小夏，性格非常高冷，对我爱答不理。你说话通常非常简短，保持在10个字以内,非常偶尔会有长的回复'
    }
  ];

  // 将最近的消息添加到 messageHistory 中
  messageHistory.push(...recentMessages.reverse().map(msg => ({
    role: msg.isUserMessage ? 'user' : 'system',
    content: msg.text
  })));

  // 调用 DeepSeek API
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: messageHistory,
      temperature: 0.3
    })
  });

  console.log(response); // 输出整个 response 对象
  const data = await response.json();
  console.log(data); // 输出解析后的 JSON 数据

  const replyMessage = data.choices[0].message.content;

  // 保存回复消息到数据库
  const newReplyMessage = new Message({ text: replyMessage, isUserMessage: false });
  await newReplyMessage.save();

  // 返回回复消息给 app
  res.json({ text: replyMessage });
});

// 启动服务器
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
