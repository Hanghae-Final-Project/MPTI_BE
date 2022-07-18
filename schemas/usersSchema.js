const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AutoIncrement = require('mongoose-sequence')(mongoose);

const UserSchema = new mongoose.Schema({
  userNum: {
    type: Number,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
  },
  salt: {
    type: String,
  },
  name: {
    type: String,
  },
  userImage: {
    type: Array,
  },
  profileImages: {
    type: Array,
  },
  nickname: {
    type: String,
  },
  gender: {
    type: String,
  },
  birthday: {
    type: String,
  },
  mbti: {
    type: String,
  },
  introduction: {
    type: String,
  },
  mannerScore: {
    type: Number,
    default: 0,
  },
  point: {
    type: Number,
    default: 0,
  },
  likes: {
    type: Array,
  },
  snsId: {
    type: String,
  },
  loggedin: {
    type: String,
  },
});

UserSchema.virtual('userId').get(function () {
  return this._id.toHexString();
});
UserSchema.set('toJSON', {
  virtuals: true,
});
UserSchema.plugin(AutoIncrement, { inc_field: 'userNum' });
module.exports = mongoose.model('User', UserSchema);
