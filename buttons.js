const {InlineKeyboard, Keyboard} = require("grammy")

module.exports = {
    checkSubscribeButton: new InlineKeyboard()
    .text("Я подписался!", "checkSubscribe"),

    referralLink: new Keyboard()
    .text("Получить реферальную ссылку", "refLink")
    .resized(),
}