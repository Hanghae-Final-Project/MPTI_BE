const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const likeSchema = new mongoose.Schema({
  userId: {
    type: Schema.Types.ObjectId,
  },
  userNum: {
    type: Number,
  },
  postId: {
    type: Number,
  },
});

module.exports = mongoose.model('Like', likeSchema);
