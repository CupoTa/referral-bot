require('dotenv').config()
const {Bot, GrammyError, HttpError} = require("grammy")

const token = process.env.BOT_TOKEN;

const bot = new Bot(token)

module.exports = bot

