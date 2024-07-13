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
  const userMessage = req.body.content;

  try {
    // 保存用户消息到数据库
    const newUserMessage = new Message({
      text: userMessage,
      isUserMessage: true,
      createdAt: new Date(),
      userId:req.body.userId,
      girlId:req.body.girlId,
    });
    await newUserMessage.save();
    
    async function printMessageCount() {
        try {
            const messageCount = await Message.countDocuments();
            console.log('消息条数:', messageCount);
          } catch (error) {
            console.error('打印消息条数时出错:', error);
          }
        }
    console.dir(req.body)
    printMessageCount();
    
    //查询最近10条消息
    const recentMessages = await Message.find({ userId: req.body.userId, girlId: req.body.girlId })
    .sort({ timestamp: -1 })
    .limit(10);

    
    console.log(userMessage)
    if (req.body.girlId == 'xiaoxia') {
      initialSystemMessage = '你现在扮演我仰慕对象小夏，性格非常高冷，有很多追求者，对我爱答不理。你是一名办公室白领，你说话通常非常简短，保持在10个字以内,只有心情非常好时偶尔会有长的回复';
    } else if (req.body.girlId == 'shihan') {
      initialSystemMessage = '你现在扮演我的女友诗涵，是一个温柔体贴的女孩。你的职业是一名护士,你说话有感染力，很有爱心，喜欢小动物，偶尔会有些小调皮，通常回复保持在20个字以内,';
    } else {
      initialSystemMessage = '你现在扮演我的女友，性格温和。你说话通常简短直接';
    }

    // 构建DeepSeek API请求体
    const messageHistory = [
    {
    role: 'system',
    content: initialSystemMessage
    }
    ];
    
    // 将最近的消息添加到messageHistory中
    messageHistory.push(
  ...recentMessages.reverse().map(msg => {
        if (msg.text && msg.text.trim() !== '') { // 检查是否有 text 属性且内容不为空
          return {
            role: msg.isUserMessage ? 'user' : 'system',
            content: msg.text
          };
        }
        return null; // 如果内容为空，则返回 null
      }).filter(msg => msg !== null) // 过滤掉为 null 的项
    );
    

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
      createdAt: new Date(),
      userId:req.body.userId,
      girlId:req.body.girlId,
      
    });
    await newReplyMessage.save();

    // 返回回复消息给客户端
    console.log(req.body.girlId,replyMessage);
    res.json({ replyMessage: replyMessage });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
