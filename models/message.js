const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text: String,
  sender: String,
  girlId: String,
  userId: String,
  timestamp: { type: Date, default: Date.now },
  isUserMessage: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now } // 添加 createdAt 字段，并设置默认值为当前时间
});

module.exports = mongoose.model('Message', messageSchema);
