const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const likeSchema = new mongoose.Schema({
    userId: {
        type: Schema.Types.ObjectId,
      },
    postId: {
        type: Number,
    },
    
})

module.exports = mongoose.model('Like', likeSchema)