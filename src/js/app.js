/* eslint-disable func-names */
/* eslint-disable no-const-assign */

import moment from 'moment';

const httpsUrl = 'https://sse-server-2.herokuapp.com/users';
// const httpsUrl = "http://localhost:7070/users";

const wssUrl = 'wss://sse-server-2.herokuapp.com/ws';
// const wssUrl = "ws://localhost:7070/ws";

const formNickname = document.querySelector('.form');
const errMessage = document.querySelector('#errMessage');
const messenger = document.querySelector('.messenger');
const messageInput = document.querySelector('#messageInput');
const messageList = document.querySelector('#messageList');
let nickname = '';

const drawUsers = async () => {
  const response = await fetch(httpsUrl);
  const usersArray = await response.json();
  console.log(usersArray);
  const usersList = document.querySelector('#usersList');
  usersList.innerHTML = '';
  for (const item of usersArray) {
    const user = document.createElement('div');
    user.className = 'item-user';
    user.innerHTML = `
                <div class="userImg"></div>
                <div class="userNickname ${
  item.name === nickname ? 'active' : ''
}">${item.name}</div>`;
    usersList.appendChild(user);
  }
};

const drawMessage = (message) => {
  const { type } = JSON.parse(message.data);

  if (type === 'message') {
    const { name, mess, date } = JSON.parse(message.data);
    const liMessage = document.createElement('li');
    liMessage.className = `messageLi ${nickname === name ? 'active' : ''}`;
    liMessage.innerHTML = `
              <div class="header">
                <span>${nickname === name ? 'You' : name},</span>
                <span>${moment(date).format('HH:mm DD.MM.YYYY')}</span>
              </div>
              <div class="messageLi">${mess}</div>`;

    messageList.appendChild(liMessage);
    messageList.scrollTo(0, liMessage.offsetTop);
    drawUsers();
  } else if (type === 'adding' || type === 'deleting') {
    drawUsers();
  }
};

const getMessage = (name) => {
  messenger.classList.remove('hidden');
  drawUsers();

  const ws = new WebSocket(wssUrl);
  ws.addEventListener('open', () => {
    console.log('connected');
  });
  ws.addEventListener('message', (event) => {
    drawMessage(event);
  });
  ws.addEventListener('close', (event) => {
    console.log('connection closed', event);
  });
  ws.addEventListener('error', () => {
    console.log('error');
  });

  window.addEventListener('beforeunload', async () => {
    ws.onclose = function () {};
    ws.close();
    await fetch(`${httpsUrl}/${name}`, {
      method: 'delete',
    });
    drawUsers();
  });

  messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' && messageInput.value) {
      if (ws.readyState === WebSocket.OPEN) {
        const mess = {
          type: 'message',
          name,
          mess: messageInput.value,
          date: new Date(),
        };
        ws.send(JSON.stringify(mess));
      } else {
        console.log('Reconect');
        ws = new WebSocket(wssUrl);
      }
      messageInput.value = '';
    }
  });
};

document.querySelector('#submitButton').addEventListener('click', async () => {
  const inputName = document.getElementById('nicknameInput');
  nickname = inputName.value;

  if (nickname) {
    const response = await fetch(httpsUrl);
    const usersArray = await response.json();

    if (usersArray.findIndex((item) => item.name === nickname) === -1) {
      await fetch(httpsUrl, {
        body: JSON.stringify({ name: nickname }),
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      formNickname.classList.add('hidden');
      inputName.value = '';
      getMessage(nickname);
    } else {
      errMessage.classList.remove('hidden');
    }
  }
});

document.getElementById('submitBtn').addEventListener('click', () => {
  errMessage.classList.add('hidden');
});
