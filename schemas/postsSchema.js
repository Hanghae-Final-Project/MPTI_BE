const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AutoIncrement = require('mongoose-sequence')(mongoose);

const PostSchema = new mongoose.Schema({
  postId: {
    type: Number,
  },
  postContent: {
    type: String,
  },
  postImage: {
    type: Array,
  },
  postCategory: {
    type: String,
  },
  createdAt: {
    type: String,
  },
  commentCount: {
    type: Number,
    default: 0,
  },
  userId: {
    type: Schema.Types.ObjectId,
  },
  nickname: {
    type: String,
  },
  userImage: {
    type: Array,
  },
});

PostSchema.plugin(AutoIncrement, { inc_field: 'postId' });
module.exports = mongoose.model('Post', PostSchema);
