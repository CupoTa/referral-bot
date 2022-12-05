const bot = require("./connect")

module.exports = {
    checkSubscribeUser: async function (channel_name, uID) {
        const checkUser = await bot.api.getChatMember(
            channel_name,
            uID
        )
        return checkUser.status
    }
}