const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const messageRoutes = require('./routes/messages');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/messages', messageRoutes);

// Connect to MongoDB
mongoose.connect('mongodb://localhost/chat-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => console.log('Connected to Database'));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
 
