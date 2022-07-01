const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AutoIncrement = require('mongoose-sequence')(mongoose);

const CommentSchema = new mongoose.Schema({
  commentId: {
    type: Number,
  },
  comment: {
    type: String,
  },
  createdAt: {
    type: String,
  },
  postId: {
    type: Number,
  },
  userId: {
    type: Schema.Types.ObjectId,
  },
});

CommentSchema.plugin(AutoIncrement, { inc_field: 'commentId' });
module.exports = mongoose.model('Comment', CommentSchema);
