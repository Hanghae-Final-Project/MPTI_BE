const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageSchema = new mongoose.Schema({
  roomId: {
    type: Number,
  },
  content: {
    type: String,
  },
  messageTime: {
    type: String,
  },
  userNum: {
    type: Number,
  },
  userImage: {
    type: Array,
  },
});

module.exports = mongoose.model('Message', MessageSchema);
