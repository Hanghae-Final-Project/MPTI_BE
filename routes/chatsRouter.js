const router = require('express').Router();
const User = require('../schemas/usersSchema');
const Room = require('../schemas/roomsSchema');
const Message = require('../schemas/messagesSchema');
const authMiddleware = require('../middlewares/auth-middleware');

// 채팅방 생성기능
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const senderUserNum = res.locals.user.userNum;
    const senderUserImage = res.locals.user.userImage;
    const senderNickname = res.locals.user.nickname;
    const senderMbti = res.locals.user.mbti;
    const senderIntroduction = res.locals.user.introduction;

    const senderBlockedUsers = res.locals.user.blockedUsers;

    const receiver = await User.findOne({ userNum: req.body.userNum });

    const receiverUserNum = receiver.userNum;
    const receiverUserImage = receiver.userImage;
    const receiverNickname = receiver.nickname;
    const receiverMbti = receiver.mbti;
    const receiverIntroduction = receiver.introduction;

    const members = [receiverUserNum, senderUserNum];
    const reversMembers = [senderUserNum, receiverUserNum];

    const existingRoom = await Room.findOne({
      $or: [{ members: members }, { members: reversMembers }],
    });

    if (existingRoom) {
      res
        .status(400)
        .send({ errorMessage: '이미 존재하는 방입니다', Room: existingRoom });
    } else if (receiver.blockedUsers.includes(senderUserNum) === true) {
      res.status(400).send({
        message: '상대방이 당신을 차단해서 대화를 할 수 없습니다.',
        blocked: 'blocked',
      });
    } else if (senderBlockedUsers.includes(receiverUserNum) === true) {
      res.status(400).send({
        message: '당신이 상대방을 차단해서 대화를 할 수 없습니다.',
        blocked: 'blocked',
      });
    } else {
      const createdRoom = await Room.create({
        members,
        senderUserImage,
        senderNickname,
        senderMbti,
        senderUserNum,
        senderIntroduction,
        receiverUserImage,
        receiverNickname,
        receiverMbti,
        receiverUserNum,
        receiverIntroduction,
      });
      const roomId = createdRoom.roomId;
      res.status(200).send({
        message: '방 생성 성공',
        Room: createdRoom,
        roomId,
      });
    }
  } catch (err) {
    res.status(400).send({ errorMessage: '방 생성 실패' });
    console.log('실패 로그: ' + err);
  }
});

// 채팅방 리스트 출력
router.get('/chatList', authMiddleware, async (req, res) => {
  try {
    let { userNum } = res.locals.user;
    const chatList = await Room.find({ members: userNum });

    let userImage;
    let nickname;
    let mbti;
    let introduction;
    let userInfo = [];
    chatList.forEach((chatList) => {
      if (chatList.members.length === 1) {
        userImage = chatList.leftUserImage;
        nickname = chatList.leftUserNickname;
        mbti = chatList.leftUserMbti;
        userNum = chatList.leftUserNum;
        introduction = chatList.leftUserIntroduction;
        userInfo.push({ userImage, nickname, mbti, userNum, introduction });
        userNum = res.locals.user.userNum;
      } else if (
        chatList.members.length === 2 &&
        userNum == chatList.members[1]
      ) {
        userImage = chatList.receiverUserImage;
        nickname = chatList.receiverNickname;
        mbti = chatList.receiverMbti;
        userNum = chatList.receiverUserNum;
        introduction = chatList.receiverIntroduction;
        userInfo.push({ userImage, nickname, mbti, userNum, introduction });
        userNum = res.locals.user.userNum;
      } else {
        userImage = chatList.senderUserImage;
        nickname = chatList.senderNickname;
        mbti = chatList.senderMbti;
        userNum = chatList.senderUserNum;
        introduction = chatList.senderIntroduction;
        userInfo.push({ userImage, nickname, mbti, userNum, introduction });
        userNum = res.locals.user.userNum;
      }
    });

    res.status(200).send({
      message: '방 불러오기 성공',
      chatList,
      userInfo,
    });
  } catch (err) {
    res.status(400).send({ errorMessage: '방 불러오기 실패' });
    console.log('실패 로그: ' + err);
  }
});

// 채팅방 나가기(members배열 수정 후 만약 members배열의 길이가 0이면 채팅방 완전 삭제)
router.put('/chat/:roomId', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userNum } = res.locals.user;
    const existingRoom = await Room.findOne({ roomId: parseInt(roomId) });
    const leftUser = await User.findOne({ userNum });

    let existingMembers = existingRoom.members;

    if (existingMembers.includes(userNum) === true) {
      existingMembers = existingMembers.filter((data) => {
        return data !== userNum;
      });
    }

    if (existingMembers.length === 0) {
      await Room.deleteOne({ roomId: parseInt(roomId) });
      await Message.deleteMany({ roomId: parseInt(roomId) });
      res
        .status(200)
        .send({ message: '대화인원이 없어서 채팅방이 삭제됐습니다' });
    } else {
      await Room.updateOne(
        { roomId: parseInt(roomId) },
        {
          $set: {
            members: existingMembers,
            leftUserImage: leftUser.userImage,
            leftUserNickname: leftUser.nickname,
            leftUserMbti: leftUser.mbti,
            leftUserNum: leftUser.userNum,
            leftUserIntroduction: leftUser.introduction,
          },
        }
      );
      res.status(200).send({ message: '채팅방에서 나갔습니다' });
    }
  } catch (err) {
    res.status(400).send({ errorMessage: '채팅방 나가기 실패' });
    console.log('실패 로그: ' + err);
  }
});

// 메세지 보내기
router.post('/message/:roomId', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content } = req.body;
    const { userNum, userImage, profileImages } = res.locals.user;

    const now = new Date();
    const date = now.toLocaleDateString('ko-KR');
    const year = Number(date.split('.')[0]);
    let month = Number(date.split('.')[1].trim());
    if (month < 10) {
      month = '0' + month;
    }
    let day = Number(date.split('.')[2].trim());
    if (day < 10) {
      day = '0' + day;
    }
    let hours = now.getHours();
    if (hours === 0) {
      hours = 12;
    } else if (hours < 10 && hours !== 0) {
      hours = '0' + hours;
    }
    let minutes = now.getMinutes();
    if (minutes < 10) {
      minutes = '0' + minutes;
    }
    const messageTime = `${year}. ${month}. ${day} ${hours}:${minutes}`;
    const createdMessage = await Message.create({
      roomId,
      content,
      userNum,
      userImage,
      profileImages,
      messageTime,
    });
    await Room.updateOne(
      { roomId: parseInt(roomId) },
      {
        $set: {
          recentMessage: content,
          recentMessageTime: messageTime,
        },
      }
    );
    res.status(200).send({ message: '메세지 보내기 성공', createdMessage });
  } catch (err) {
    res.status(400).send({ errorMessage: '메세지 보내기 실패' });
    console.log('실패 로그: ' + err);
  }
});

// 채팅방 상세보기(실시간)
router.get(
  '/message/:roomId',
  // authMiddleware,
  async (req, res) => {
    res.writeHead(200, {
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    });

    const { roomId } = req.params;
    const messages = await Message.find({ roomId: parseInt(roomId) });
    res.write('event: test\n');
    res.write(`data: ${JSON.stringify(messages)}\n\n`);

    const pipeline = [{ $match: { 'fullDocument.roomId': parseInt(roomId) } }];
    const changeStream = Message.watch(pipeline);
    changeStream.on('change', (result) => {
      res.write('event: test\n');
      res.write(`data: ${JSON.stringify([result.fullDocument])}\n\n`);
    });
  }
);

router.get('/messages/:roomId', async (req, res) => {
  const { roomId } = req.params;
  const messages = await Message.find({ roomId: parseInt(roomId) });

  res.status(200).send({ messages });
});

module.exports = router;
