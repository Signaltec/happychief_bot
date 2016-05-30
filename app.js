/**
 * @name Happy chief bot
 */

'use strict';

global.ROOT_DIR = require('path').resolve(__dirname);

var TelegramBot = require('node-telegram-bot-api'),
	util = require('util'),
	nodemailer = require('nodemailer'),
	Colors = require('colors/safe'),
	users = require('./src/users.js'),
	config = require('./config.json');

var bot = new TelegramBot(config.token, {polling: true}),
	replyMsgs = [];

console.log(Colors.yellow.underline('Бот запущен'));

/**
 * Отправка сообщения на мыло
 * @param msg
 */
function sendMail(msg) {
	let transport = nodemailer.createTransport({
		direct: true,
		debug: true
	});

	users.get(msg.from.id)
		.then(user => {
			if (!user) {
				bot.sendMessage(msg.chat.id, 'Нужно зарегистрироваться для отправки - /reg');
				return;
			}

			transport.sendMail({
				from: `Котики ✔ <${config.mail.from}>`, // sender address
				to: config.mail.to, // list of receivers
				subject: config.mail.header, // Subject line
				text: `${user.name} ✔ ${msg.text}` // plaintext body
				// html: "<b>Hello world ✔</b>" // html body
			}, console.error);

			bot.sendMessage(msg.chat.id, config.mail.afterSendMessage);
		})
		.catch(e => bot.sendMessage(msg.chat.id, e.message));
}

function waitForReply(msg, replyText, callback) {
	let sendConfig = {
		reply_to_message_id: msg.id,
		reply_markup: {
			force_reply: true
		}
	};

	bot.sendMessage(msg.chat.id, replyText, sendConfig)
		.then(function(sendedMsg) {
			replyMsgs.push({
				sendedMsg: sendedMsg,
				callback: callback
			});
		})
		.catch(e => console.error(e));
}

bot.on('message', msg => {
	if (!msg.reply_to_message || !replyMsgs.length) {
		return;
	}

	replyMsgs.forEach((replyMsg, index) => {
		if (replyMsg.sendedMsg.message_id === msg.reply_to_message.message_id) {
			replyMsgs.splice(index, 1);

			replyMsg.callback(msg);
		}
	});
});

bot.onText(/\/xyi(?:@happychief_bot)?(.*)/, (msg, match) => {
	let body = match[1].trim();
	msg.text = body;

	if (body) {
		sendMail(msg);
	} else {
		waitForReply(msg, 'Жалуйтесь', sendMail);
	}
});

bot.onText(/\/reg(?:@happychief_bot)?(.*)/, (msg, match) => {
	let name = match[1].trim(),
		callback = (replyMsg) => {
			users.reg(replyMsg.from.id, replyMsg.text)
				.then(user => bot.sendMessage(replyMsg.chat.id, 'Готово!'))
				.catch(e => bot.sendMessage(replyMsg.chat.id, e.message));
		};

	if (name) {
		msg.text = name;
		callback(msg);
	} else {
		waitForReply(msg, 'Введи имя', callback);
	}
});

bot.onText(/\/help/, (msg, match) => {
	let message = `
	*/help* - Выводит вывод вывода
	*/reg* _Имя, которое будет выводится у Андрея_ - Регистрация в боте
	*/xyi* _Сообщение_ - Сообщение, которые будет в теле письма
	`;

	bot.sendMessage(msg.chat.id, message, {parse_mode: 'Markdown'});
});