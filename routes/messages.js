const express = require('express');
const axios = require('axios');
const Message = require('../models/message');

const router = express.Router();

// DeepSeek API配置
// const apiUrl = 'https://api.moonshot.cn/v1/chat/completions';
// const apiKey = 'sk-3sq88ly5bVhIQNbuqPi7xPiLlG5mtNrucHI0LbHK6RnDmDGb';
const apiUrl = "https://api.deepseek.com/chat/completions";
const apiKey = "sk-029ef31805dc4a2e944e89a161367a8e";

// 接收消息并调用DeepSeek API
router.post('/', async (req, res) => {
  const userMessage = req.body.text;

  try {
    // 保存用户消息到数据库
    const newUserMessage = new Message({
      text: userMessage,
      isUserMessage: true,
      createdAt: new Date()
    });
    await newUserMessage.save();

    // 查询最近10条消息
    const recentMessages = await Message.find()
    .sort({ createdAt: -1 })
    .limit(10);

    // 构建DeepSeek API请求体
    const messageHistory = [
    {
    role: 'system',
    content: '你现在扮演我的女友小夏，性格非常高冷，对我爱答不理。你说话通常非常简短，保持在10个字以内,非常偶尔会有长的回复'
    }
    ];

    // 将最近的消息添加到messageHistory中
    messageHistory.push(...recentMessages.reverse().map(msg => ({
    role: msg.isUserMessage ? 'user' : 'system',
    content: msg.text
    })));


    // 调用DeepSeek API获取回复
    const response = await axios.post(apiUrl, {
    //   model: 'moonshot-v1-8k',
    //   messages: messageHistory,
    //   temperature: 0.3

      model: 'deepseek-chat',
      messages: messageHistory,
      temperature: 1.25,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    const replyMessage = response.data.choices[0].message.content;

    // 保存回复消息到数据库
    const newReplyMessage = new Message({
      text: replyMessage,
      isUserMessage: false,
      createdAt: new Date()
    });
    await newReplyMessage.save();

    // 返回回复消息给客户端
    res.json({ reply: replyMessage });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
