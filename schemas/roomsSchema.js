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
    type: Number,
  },
  senderIntroduction: {
    type: String,
  },
  senderProfileImages: {
    type: Array,
  },
  senderBirthday: {
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
    type: Number,
  },
  receiverIntroduction: {
    type: String,
  },
  receiverProfileImages: {
    type: Array,
  },
  receiverBirthday: {
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
    type: Number,
  },
  leftUserIntroduction: {
    type: String,
  },
  leftUserProfileImages: {
    type: Array,
  },
  leftUserBirthday: {
    type: String,
  },
  recentMessage: {
    type: String,
  },
  recentMessageTime: {
    type: String,
  },
});

RoomSchema.plugin(AutoIncrement, { inc_field: 'roomId' });
module.exports = mongoose.model('Room', RoomSchema);
