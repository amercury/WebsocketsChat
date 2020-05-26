const express = require('express');
const router = express.Router();
const path = require('path');
const hbs = require('hbs')
const mongoose = require('mongoose');
const Message = require('./models/message');
const User = require('./models/user');
const moment = require('moment');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, { serverClient: true });


mongoose.connect('mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false', { useNewUrlParser: true, useUnifiedTopology: true });

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerPartials(`${__dirname}/views/templates/`, function (err) { });


app.get('/', async (req, res, next) => {
  let allMessages = await Message.find({ type: 'message' }).populate('messages').sort({ date: 1 });
  // правим дату сообщений перед отправкой
  // #### Доделать время!
  // allMessages.forEach(item => {
  //   item.date = moment().startOf(`${item.date}`).fromNow();
  // })
  const alex = new User({
    username: 'Alex',
    password: '12345',
    avatar: 'https://i1.pngguru.com/preview/137/834/449/cartoon-cartoon-character-avatar-drawing-film-ecommerce-facial-expression-png-clipart.jpg',
  });

  await alex.save();
  res.render('index', { allMessages: allMessages });
});

// При подключении пользователя
io.on('connection', (socket) => {
  // Передаем ему сообщение 'You are connected'
  socket.emit('connected', 'You are connected');
  //создание комнаты 
  socket.join('all');
  // Формирование и отправка сообщения на фронт
  socket.on('msg', async content => {

    // создаем message по модели Message
    let newMessage = new Message({
      username: "Yurii",
      content: content,
      likes: 0,
      date: moment().format("MMM Do YY"),
      messages: [],
      type: 'message'
    });

    // console.log(newMessage)
    // Записываем mesaage в базу Mongo
    await newMessage.save();
    // берем _id у newMessage из Mongo
    const newMessageId = await Message.findOne({ content: `${content}` });
    // и кладем его в объект, который уходит на фронт
    newMessage.id = newMessageId['_id'];
    //Отправка на фронт
    socket.emit("message", newMessage)
    //Отправка всем остальным пользователям
    socket.to('all').emit("message", newMessage)
  });
  //
  //
  // 
  // Ожидаем получить объект data: {content, id }
  //Формирование и отправка комментария на фронт
  socket.on('cmt', async data => {
    const parent = await Message.findById(data.id);

    // Создаем comment по модели Message
    let newComment = new Message({
      username: 'Vasya',
      content: `${data.content}`,
      likes: 0,
      date: `${new Date}`,
      type: 'comment'
    });
    // Записываем comment в базу Mongo
    await newComment.save();

    parent.messages.push(newComment);
    parent.markModified('messages');
    await parent.save();

    const obj = newComment.toObject();
    obj.parentId = parent._id;
    socket.emit("comment", obj);
    socket.to('all').emit("comment", obj);

  });

});

server.listen(3000)
// server.listen(3000, '0.0.0.0', () => {
//   console.log('Server started on post 3000')
// })








