const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AutoIncrement = require('mongoose-sequence')(mongoose);

const RoomSchema = new mongoose.Schema({
  roomId: {
    type: Number,
  },
  members: {
    type: Array,
  },
  senderUserImage: {
    type: Array,
  },
  senderNickname: {
    type: String,
  },
  senderMbti: {
    type: String,
  },
  senderUserNum: {
    type: String,
  },
  senderIntroduction: {
    type: String,
  },
  receiverUserImage: {
    type: Array,
  },
  receiverNickname: {
    type: String,
  },
  receiverMbti: {
    type: String,
  },
  receiverUserNum: {
    type: String,
  },
  receiverIntroduction: {
    type: String,
  },
  recentMessage: {
    type: String,
  },
  recentMessageTime: {
    type: String,
  },
  leftUserImage: {
    type: Array,
  },
  leftUserNickname: {
    type: String,
  },
  leftUserMbti: {
    type: String,
  },
  leftUserNum: {
    type: String,
  },
  leftUserIntroduction: {
    type: String,
  },
});

RoomSchema.plugin(AutoIncrement, { inc_field: 'roomId' });
module.exports = mongoose.model('Room', RoomSchema);
