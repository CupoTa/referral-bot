require('dotenv').config()
const { session, InlineKeyboard, Keyboard } = require("grammy");
const mongoose = require("mongoose");
const MongoStorage = require("@grammyjs/storage-mongodb");
const {checkSubscribeButton, referralLink} = require("./buttons")
const bot = require("./connect")
const {checkSubscribeUser} = require("./helpers")

const {
    conversations,
    createConversation,
  } = require("@grammyjs/conversations");


const channel_name = process.env.CHANNEL_NAME;
const bot_name = process.env.BOT_NAME;


async function bootstrap () {


    await mongoose.connect("mongodb://127.0.0.1:27017/telega_bot?authSource=admin");

    const collection = mongoose.connection.db.collection(
      "sessions",
    );
    
    function initial() {
        return { 
            referralID: null,
        uID: null,
        chatID: null,
        subscribed: false
         };
      }

    bot.use(
        session({
            initial,
            storage: new MongoStorage.MongoDBAdapter({collection})
        })
    );

    await bot.api.setMyCommands([
        { command: "start", description: "Запустить бота" },
        { command: "help", description: "Помощь" },
        { command: "mylink", description: "Ваша реферальная ссылка" },
      ]);



    bot.hears(/\/start (\d+)/, async (ctx) => {

        ctx.reply(`Добро пожаловать ${ctx.from?.first_name}`)

        if(ctx.session.referralID === null && ctx.session.chatID === null){
            ctx.session.referralID = Number(ctx?.match[1])
            ctx.session.chatID = ctx.chat.id
            ctx.session.uID = ctx.from.id
        }
        //bot.api.sendSticker(ctx.chat.id, 'https://cdn.tlgrm.app/stickers/9f6/83c/9f683c0b-9e0a-4f2f-93f6-8068dd75de8f/192/4.webp')

        const userStatus = await checkSubscribeUser(channel_name, ctx.from.id)

        if(userStatus === "left"){
            if(!ctx.session.subscribed){
                return ctx.reply(`Чтобы получить чек, подпишитесь на канал ${channel_name}, после нажмите кнопку`, { 
                    reply_markup: checkSubscribeButton
                })
            } else {
                ctx.reply(`Вы ранее были подписаны на канал ${channel_name} и получали чек, если хотите еще получать чеки то попишитесь снова и разместите Вашу реферальную ссылку` +
                `в соц сетях или отправьте в личные сообщения и получайте за каждого приглашенного чеки на 0.1 TON`, {
                reply_markup: new InlineKeyboard().text('Получить ссылку', 'link')
            })
            }
            
        } else if(userStatus === 'member') {
            ctx.reply(`_*Ваша реферальная ссылка:*_ \`https://t.me/${bot_name}?start=${ctx.from.id}\``, { 
                parse_mode: "MarkdownV2",
                reply_markup: new InlineKeyboard().switchInline('Поделиться', `referralLink`)
            })
        } else {
            ctx.reply(`Что то пошло не так, попробуйте еще раз`)
        }

    })

    bot.command("start", async (ctx) => {

        ctx.reply(`Добро пожаловать ${ctx.from?.first_name}`)

        if(ctx.session.uID === null){
            ctx.session.chatID = ctx.chat.id
            ctx.session.uID = ctx.from.id
        } 

        const userStatus = await checkSubscribeUser(channel_name, ctx.from.id)


        if(userStatus === "left"){
            if(!ctx.session.subscribed){
                ctx.reply(`Чтобы получить чек, подпишитесь на канал ${channel_name}, после нажмите кнопку`, { 
                    reply_markup: checkSubscribeButton 
                })
            } else {
                ctx.reply(`Вы ранее были подписаны на канал ${channel_name} и получали чек, если хотите еще получать чеки то попишитесь снова и разместите Вашу реферальную ссылку` +
                `в соц сетях или отправьте в личные сообщения и получайте за каждого приглашенного чеки на 0.1 TON`, {
                    reply_markup: new InlineKeyboard().text('Получить ссылку', 'link')
                })
            }
            
        } else if(userStatus === 'member') {
            ctx.reply(`_*Ваша реферальная ссылка:*_ \n\n\`https://t.me/${bot_name}?start=${ctx.from.id}\``, { 
                parse_mode: "MarkdownV2",
                reply_markup: new InlineKeyboard().switchInline('Поделиться', `referralLink`)
            })
        } else {
            ctx.reply(`Что то пошло не так, попробуйте еще раз`)
        }
    
    });

    // нажатие на кнопку "Я подписался!"

    bot.callbackQuery('checkSubscribe', async (ctx) => {
        const userStatus = await checkSubscribeUser(channel_name, ctx.from.id)

        if(userStatus === 'left'){
            
            ctx.reply(`К сожалению я не нашел Вас в канале, поробуйте еще раз ${channel_name}, после нажмите кнопку`, { 
                reply_markup: checkSubscribeButton 
            })

        } else if(userStatus === 'member'){
            
            if(!ctx.session.subscribed) {
                const chequeUserTon = 'http://t.me/CryptoBot?start=CQxopk8OOmJJ'    // 0.05 -201
                const chequeReferralTon = 'http://t.me/CryptoBot?start=CQUGux9UeS6M' // 0.1 - 88
                ctx.reply(`Отлично! Спасибо за подписку, заберите нашу Вам благодарность. Если хотите еще получать чеки то разместите Вашу реферальную ссылку ` +
                `в соц сетях или отправьте в личные сообщения и получайте за каждого приглашенного чеки на 0.1 TON`, {
                    reply_markup: new InlineKeyboard().url('Чек на 0.05 TON', chequeUserTon)
                    .text('Получить ссылку', 'link')
                })
                ctx.session.subscribed = true

                // Проверка реферала
                let referralStatus = ''

                if(ctx.session.referralID !== null)
                    referralStatus = await checkSubscribeUser(channel_name, ctx.session.referralID)

                if(referralStatus === 'member'){
                    bot.api.sendMessage(ctx.session.referralID, `По Вашей ссылке подписался ${ctx.from.first_name}\n заберите нашу Вам благодарность`, {
                        reply_markup: new InlineKeyboard().url('Чек на 0.1 TON', chequeReferralTon)
                        .text('Получить ссылку', 'link')
                    })
                }
            } else {
                ctx.reply('Вы уже получили чек за подписку, если хотите еще получать чеки то разместите Вашу реферальную ссылку' +
                 'в соц сетях или отправьте в личные сообщения и получайте за каждого приглашенного чеки на 0.1 TON')
                 ctx.reply(`_*Ваша реферальная ссылка:*_ \n\n\`https://t.me/${bot_name}?start=${ctx.from.id}\``, { 
                parse_mode: "MarkdownV2",
                reply_markup: new InlineKeyboard().switchInline('Поделиться', `referralLink`)
            })
            }

        } else {
            
            ctx.reply(`Что то пошло не так`)

        }
    })

    bot.command('mylink', async (ctx) => {

        const userStatus = await checkSubscribeUser(channel_name, ctx.from.id)

        if(userStatus === 'left') {
            ctx.reply(`Чтобы получить реферальную ссылку, подпишитесь на канал ${channel_name}, после нажмите кнопку`, { 
                reply_markup: checkSubscribeButton 
            })
        } else if(userStatus === "member"){
            ctx.reply(`_*Ваша реферальная ссылка:*_ \n\n\`https://t.me/${bot_name}?start=${ctx.from.id}\``, { 
                parse_mode: "MarkdownV2",
                reply_markup: new InlineKeyboard().switchInline('Поделиться', `referralLink`)
            })
            
        } else {
            
        }
    })


    bot.inlineQuery(/referralLink/, async (ctx) => {
        await ctx.answerInlineQuery([
            {
              type: "article",
              id: "crypto_hanters",
              title: "TON за подписку",
              input_message_content: {
                message_text:
      "<b>TON за подписку на развлекательный канал!</b>.! 👇",
                parse_mode: "HTML",
              },
              reply_markup: new InlineKeyboard().url(
                "Хочу TON",
                `https://t.me/${bot_name}?start=${ctx.from.id}`,
              ),
              url: `https://t.me/${bot_name}?start=${ctx.from.id}`,
              hide_url: true,
              description: "CryptoHanters - развлекательный канал о крипте и не только!",
            },
          ],
          { cache_time: 30 * 24 * 3600 },)
    })

   
    bot.command('help', async (ctx) => {
        ctx.reply(`Заберите нашу Вам благодарность`,{
            reply_markup: new InlineKeyboard().url('Чек на 0.1 TON', 'http://t.me/CryptoBot?start=CQKinLPQRQov')
            .text('Получить ссылку', 'link')
        })
    })

    bot.callbackQuery('link', async (ctx) => {
        const userStatus = await checkSubscribeUser(channel_name, ctx.from.id)

        if(userStatus === 'left') {
            ctx.reply(`Чтобы получить реферальную ссылку, подпишитесь на канал ${channel_name}, после нажмите кнопку`, { 
                reply_markup: checkSubscribeButton 
            })
        } else if(userStatus === "member"){
            ctx.reply(`_*Ваша реферальная ссылка:*_ \n\n\`https://t.me/${bot_name}?start=${ctx.from.id}\``, { 
                parse_mode: "MarkdownV2",
                reply_markup: new InlineKeyboard().switchInline('Поделиться', `referralLink`)
            })
            
        } else {
            
        }
    })

    bot.start();

}
    
bootstrap()

// function initial() {
//     return { referralId: 0 };
//   }

//   mongoose.connect("mongodb://localhost:27017/test");

//   const collection = mongoose.connection.db.collection(
//     "sessions",
//   );

//   bot.use(session({ initial }));

//   const inlineKeyboard = new InlineKeyboard()
//   .text("Payload", "click-payload")
 
//   const keyboard = new Keyboard()
//   .text("Yes")
//   .text("No")
//   .resized()
//   .oneTime()
//   .placeholder("Decide now!");

// bot.command("start", (ctx) => {
// ctx.session.referralId = ctx.match || 0
// ctx.reply("Welcome! Up and running.", { reply_markup: keyboard })

// });
// // Handle other messages.
// bot.on("message", async (ctx) => await bot.api.sendMessage(ctx.chat.id, 
//     ctx.session.referralId !== 0 ? ctx.session.referralId : `_*Ваша реферальная ссылка:*_ \`https://t.me/${bot_name}?start=${ctx.from.id}\``,
//     { parse_mode: "MarkdownV2" })
// );

// bot.callbackQuery("click-payload", async (ctx) => {
//     await ctx.answerCallbackQuery({
//       text: "You were curious, indeed!",
//     });
//   });

// bot.on("callback_query:data", async (ctx) => {
//   console.log("Unknown button event with payload", ctx.callbackQuery.data);
//   await ctx.answerCallbackQuery(); // remove loading animation
// });

// // Now that you specified how to handle messages, you can start your bot.
// // This will connect to the Telegram servers and wait for messages.

// // Start the bot.
// bot.start();