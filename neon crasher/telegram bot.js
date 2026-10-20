// =================== FILE: telegram-bot.js 
// 𝐧𝐞𝐨𝐧 𝐜𝐫𝐚𝐬𝐡𝐞𝐫 — TELEGRAM CONTROL PANEL
// DEV : @victory_is_h1m

require('dotenv').config()

const config = require('./config')
const TelegramBot = require('node-telegram-bot-api')
const { restoreSessions, startSession, disconnectSession } = require('./rentbot.js')

const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const axios = require('axios')

// ================= BASIC SETUP =================

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true })
const TOKEN = process.env.TELEGRAM_TOKEN

const SESSIONS_ROOT = path.join(__dirname, 'sessions')
fs.ensureDirSync(SESSIONS_ROOT)

const ITEMS_PER_PAGE = 10
const MAX_SESSIONS = 5
const activeSockets = new Map()
const userStates = {}
const editState = {}

// ================= BRANDING =================

const BOT_NAME = "𝐧𝐞𝐨𝐧 𝐜𝐫𝐚𝐬𝐡𝐞𝐫"
const BOT_VERSION = "v𝟏.0.0"
const DEV_NAME = "𝐯𝐢𝐜𝐭𝐨𝐫𝐲"
const DEV_USERNAME = "@victory_is_h1m"
const menuPhoto = "https://files.catbox.moe/dmq0kz.jpg"

// ================= BOOT =================

const startTime = Date.now()
restoreSessions()
console.log(chalk.green("ɴᴇᴏɴ ᴠ1 ɪꜱ ᴏɴʟɪɴᴇ — ꜰʀᴇᴇ ᴍᴏᴅᴇ"))

// ================= UTILS =================

function getSystemUptime() {
    const uptime = process.uptime()
    const days = Math.floor(uptime / 86400)
    const hours = Math.floor((uptime % 86400) / 3600)
    const mins = Math.floor((uptime % 3600) / 60)
    const secs = Math.floor(uptime % 60)
    return `${days}d ${hours}h ${mins}m ${secs}s`
}

function getUserSessions(userId) {
    const userIdStr = userId.toString()
    const userPath = path.join(SESSIONS_ROOT, userIdStr)
    if (!fs.existsSync(userPath)) return []
    return fs.readdirSync(userPath)
}

function escapeHtml(str) {
    if (!str) return ''
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
}

// ================= FORCE JOIN =================

async function isJoined(userId) {
    const channels = [config.channel, config.channel2]
    for (const channel of channels) {
        if (!channel) continue
        try {
            const cleanChannel = channel.startsWith('@') ? channel.substring(1) : channel
            const member = await bot.getChatMember(`@${cleanChannel}`, userId)
            if (!["member", "administrator", "creator"].includes(member.status)) return false
        } catch (err) {
            console.log("ᴊᴏɪɴ ᴄʜᴇᴄᴋ ᴇʀʀᴏʀ:", err.message)
            return false
        }
    }
    return true
}

function getChannelUrl(channel) {
    if (!channel) return null
    const clean = channel.startsWith('@') ? channel.substring(1) : channel
    return `https://t.me/${clean}`
}

// ================= BLOCK BUILDERS (RIMURU STYLE) =================

function bannerBlock() {
    return menuPhoto ? [{ type: "photo", photo: { type: "photo", media: menuPhoto } }] : []
}
function headingBlock(text, size = 2) {
    return { type: "heading", text, size }
}
function paragraphBlock(text) {
    return { type: "paragraph", text }
}
function dividerBlock() {
    return { type: "divider" }
}
function footerBlock(text) {
    return { type: "footer", text }
}
function blockquoteBlock(text) {
    return { type: "blockquote", blocks: [{ type: "paragraph", text }] }
}
function tableBlock(rows) {
    const cells = rows.map((row, idx) => row.map(cell => ({
        align: "left", valign: "middle", text: String(cell), is_header: idx === 0
    })))
    return { type: "table", cells }
}
function buttonRows(rows) {
    return rows.map(row => ({ type: "buttons", buttons: row }))
}
function backButtonRow(target = 'go_menu') {
    return buttonRows([[{ text: '⬅ Back', style: 'primary', callback_data: target }]])
}

// ================= SEND / FALLBACK =================

function blocksToKeyboard(blocks) {
    const rows = []
    for (const b of blocks) {
        if (b.type !== 'buttons') continue
        rows.push(b.buttons.map(btn => {
            if (btn.url) return { text: btn.text, url: btn.url }
            return { text: btn.text, callback_data: btn.callback_data || 'noop' }
        }))
    }
    return rows.length ? { inline_keyboard: rows } : undefined
}

function blocksToHtml(blocks) {
    const lines = []
    for (const b of blocks) {
        if (b.type === 'heading') lines.push(`<b>${escapeHtml(b.text)}</b>`)
        else if (b.type === 'paragraph') lines.push(escapeHtml(b.text))
        else if (b.type === 'footer') lines.push(`<i>${escapeHtml(b.text)}</i>`)
        else if (b.type === 'divider') lines.push('<i>━━━━━━━━━━━━━━━━</i>')
        else if (b.type === 'blockquote') (b.blocks || []).forEach(sb => lines.push(`<blockquote>${escapeHtml(sb.text)}</blockquote>`))
        else if (b.type === 'table') b.cells.forEach((row, index) => {
            const rowText = row.map(c => escapeHtml(c.text)).join('  |  ')
            lines.push(index === 0 ? `<b>${rowText}</b>` : rowText)
        })
    }
    return lines.join('\n').slice(0, 4000) || 'ℹ️'
}

async function sendRichBlocks(chatId, blocks) {
    try {
        return await bot.sendMessage(chatId, blocksToHtml(blocks), {
            parse_mode: 'HTML',
            reply_markup: blocksToKeyboard(blocks)
        })
    } catch (err) {
        console.log(chalk.red("sendRich fail →"), err.message)
        return null
    }
}

async function deleteMsg(chatId, messageId) {
    try { await bot.deleteMessage(chatId, messageId) } catch {}
}

// ================= START =================

bot.onText(/^\/start$/, async (msg) => {
    const chatId = msg.chat.id
    const telegramId = msg.from.id

    const joined = await isJoined(telegramId)

    if (!joined) {
        const channelUrl = getChannelUrl(config.channel)
        const channel2Url = getChannelUrl(config.channel2)

        const rows = []
        if (channelUrl) rows.push([{ text: "⎙ ᴊᴏɪɴ ᴄʜᴀɴɴᴇʟ 1", url: channelUrl, style: 'primary' }])
        if (channel2Url) rows.push([{ text: "⎙ ᴊᴏɪɴ ᴄʜᴀɴɴᴇʟ 2", url: channel2Url, style: 'primary' }])
        rows.push([{ text: "✅ ɪ'ᴍ ᴀ ᴍᴇᴍʙᴇʀ", style: 'success', callback_data: 'check_join' }])

        await sendRichBlocks(chatId, [
            ...bannerBlock(),
            headingBlock(`🔒 ᴏɴᴇ ʟᴀsᴛ sᴛᴇᴘ`, 2),
            paragraphBlock(`Jᴏɪɴ ᴏᴜʀ ᴄʜᴀɴɴᴇʟ ᴛᴏ ᴜsᴇ ᴛʜɪs ʙᴏᴛ, ᴛʜᴇɴ ᴄᴏɴғɪʀᴍ ʏᴏᴜ ᴀʀᴇ ᴀ ᴍᴇᴍʙᴇʀ.`),
            dividerBlock(),
            footerBlock("🔒 ᴀᴄᴄᴇss ʀᴇǫᴜɪʀᴇᴅ"),
            ...buttonRows(rows)
        ])
        return
    }

    if (String(telegramId) === String(config.OWNER_ID)) {
        await sendAdminMenu(chatId)
    } else {
        await sendUserMenu(chatId)
    }
})

bot.onText(/^\/menu$/, async (msg) => {
    const chatId = msg.chat.id
    const telegramId = msg.from.id
    const joined = await isJoined(telegramId)
    if (!joined) return denyAccess(chatId)
    if (String(telegramId) === String(config.OWNER_ID)) await sendAdminMenu(chatId)
    else await sendUserMenu(chatId)
})

// ================= ADMIN MENU =================

async function sendAdminMenu(chatId) {
    await sendRichBlocks(chatId, [
        ...bannerBlock(),
        headingBlock(`👑 ${BOT_NAME} ${BOT_VERSION} — ᴀᴅᴍɪɴ`),
        dividerBlock(),
        tableBlock([
            ['👤 ʙᴏᴛ', BOT_NAME],
            ['📦 ᴅᴇᴠ', DEV_NAME],
            ['🏷 ᴠᴇʀ', BOT_VERSION],
            ['💼 ʜᴏsᴛ', 'Heroku']
        ]),
        dividerBlock(),
        paragraphBlock('📂 ᴠɪᴇᴡ ᴀʟʟ sᴇssɪᴏɴs\n📁 sᴇssɪᴏɴ ᴍᴀɴᴀɢᴇʀ\n📣 ʙʀᴏᴀᴅᴄᴀsᴛ\n📈 sʏsᴛᴇᴍ sᴛᴀᴛs'),
        dividerBlock(),
        footerBlock("🏆 ᴀᴅᴍɪɴ ᴘᴀɴᴇʟ"),
        ...buttonRows([
            [
                { text: '📂 ʟɪsᴛ ᴘᴀɪʀ', style: 'danger', callback_data: 'listpair' },
                { text: '📣 ʙʀᴏᴀᴅᴄᴀsᴛ', style: 'primary', callback_data: 'broadcast' }
            ],
            [{ text: '📈 sʏsᴛᴇᴍ sᴛᴀᴛs', style: 'success', callback_data: 'admin_stats' }],
            [{ text: '⬅️ ᴜsᴇʀ ᴍᴇɴᴜ', style: 'danger', callback_data: 'user_menu' }]
        ])
    ])
}

// ================= USER MENU =================

async function sendUserMenu(chatId) {
    await sendRichBlocks(chatId, [
        ...bannerBlock(),
        headingBlock(`📦 ${BOT_NAME} ${BOT_VERSION}`),
        paragraphBlock(`✋ ᴜsᴇʀ ᴍᴇɴᴜ`),
        dividerBlock(),
        tableBlock([
            ['📦 ʙᴏᴛ', BOT_NAME],
            ['📦 ᴅᴇᴠ', DEV_NAME],
            ['🏷 ᴠᴇʀ', BOT_VERSION],
            ['🔌 ᴛʏᴘᴇ', 'ᴛᴇʟᴇ x ᴡᴀ']
        ]),
        dividerBlock(),
        footerBlock("💎 ᴘᴀɪʀ ʏᴏᴜʀ ᴡʜᴀᴛsᴀᴘᴘ ᴛᴏ ɢᴇᴛ sᴛᴀʀᴛᴇᴅ"),
        ...buttonRows([
            [
                { text: 'ᴘᴀɪʀ', style: 'danger', callback_data: 'pair' },
                { text: 'ᴅᴇʟᴘᴀɪʀ', style: 'danger', callback_data: 'delpair' }
            ],
            [
                { text: 'ᴛʜᴀɴᴋs', style: 'primary', callback_data: 'thanks' },
                { text: 'ʀᴜɴᴛɪᴍᴇ', style: 'primary', callback_data: 'runtime' },
                { text: 'sᴛᴀᴛs', style: 'success', callback_data: 'stats' }
            ]
        ])
    ])
}

// ================= ADMIN STATS =================

async function sendAdminStats(chatId) {
    let totalUsers = 0
    let totalSessions = 0
    try {
        const userFolders = fs.readdirSync(SESSIONS_ROOT)
            .filter(f => fs.statSync(path.join(SESSIONS_ROOT, f)).isDirectory())
        totalUsers = userFolders.length
        for (const user of userFolders) {
            totalSessions += fs.readdirSync(path.join(SESSIONS_ROOT, user)).length
        }
    } catch (err) {
        console.log("Stats error:", err.message)
    }

    await sendRichBlocks(chatId, [
        ...bannerBlock(),
        headingBlock('📈 sʏsᴛᴇᴍ sᴛᴀᴛs'),
        dividerBlock(),
        tableBlock([
            ['ᴍᴇᴛʀɪᴄ', 'ᴠᴀʟᴜᴇ'],
            ['👥 ᴛᴏᴛᴀʟ ᴜsᴇʀs', String(totalUsers)],
            ['📞 ᴛᴏᴛᴀʟ sᴇssɪᴏɴs', String(totalSessions)],
            ['🕔 ᴜᴘᴛɪᴍᴇ', getSystemUptime()]
        ]),
        dividerBlock(),
        footerBlock("🏆 ᴀᴅᴍɪɴ ᴘᴀɴᴇʟ"),
        ...backButtonRow('admin_menu')
    ])
}

// ================= USER STATS =================

async function sendStats(chatId, telegramId) {
    const sessions = getUserSessions(telegramId)

    await sendRichBlocks(chatId, [
        ...bannerBlock(),
        headingBlock('📊 ʏᴏᴜʀ sᴛᴀᴛs'),
        dividerBlock(),
        tableBlock([
            ['sᴛᴀᴛ', 'ᴠᴀʟᴜᴇ'],
            ['📦 ᴛᴏᴛᴀʟ sᴇssɪᴏɴs', String(sessions.length)],
            ['🕔 ʀᴜɴᴛɪᴍᴇ', getSystemUptime()],
            ['✅ sᴛᴀᴛᴜs', 'ᴏɴʟɪɴᴇ']
        ]),
        dividerBlock(),
        footerBlock("💎 ᴋᴇᴇᴘ ʏᴏᴜʀ sᴇssɪᴏɴs ʜᴇᴀʟᴛʜʏ"),
        ...backButtonRow('user_menu')
    ])
}

// ================= RUNTIME =================

async function sendRuntime(chatId) {
    await sendRichBlocks(chatId, [
        ...bannerBlock(),
        headingBlock('⏲ sʏsᴛᴇᴍ ʀᴜɴᴛɪᴍᴇ'),
        dividerBlock(),
        tableBlock([
            ['ᴘʀᴏᴘᴇʀᴛʏ', 'ᴠᴀʟᴜᴇ'],
            ['✅ sᴛᴀᴛᴜs', 'ᴏɴʟɪɴᴇ'],
            ['🕔 ᴜᴘᴛɪᴍᴇ', getSystemUptime()]
        ]),
        dividerBlock(),
        footerBlock(`💎 ${BOT_NAME} ʜᴀs ʙᴇᴇɴ ᴀᴄᴛɪᴠᴇ ғᴏʀ ${getSystemUptime()}`),
        ...backButtonRow('user_menu')
    ])
}

// ================= THANKS =================

async function sendThanks(chatId) {
    const names = [DEV_USERNAME, "ᴢᴀʏᴅᴇɴ-ᴛᴇᴄʜ", "ɴᴇxᴏʀᴀ-ᴛᴇᴄʜ", "ʀᴇɴɪ-ᴛᴇᴄʜ"]
    const rows = [['#', 'ɴᴀᴍᴇ']]
    names.forEach((n, i) => rows.push([String(i + 1), n]))

    await sendRichBlocks(chatId, [
        ...bannerBlock(),
        headingBlock('🏆 ᴛʜᴀɴᴋs'),
        paragraphBlock('👏 ᴛʜᴀɴᴋs ᴀʟᴏᴛ ᴛᴏ ᴇᴠᴇʀʏᴏɴᴇ'),
        dividerBlock(),
        tableBlock(rows),
        dividerBlock(),
        footerBlock("❤️ ᴍᴀᴅᴇ ᴡɪᴛʜ ʟᴏᴠᴇ"),
        ...backButtonRow('user_menu')
    ])
}

// ================= PAIR =================

async function runPair(chatId, telegramId) {
    const userIdStr = telegramId.toString()
    const userPath = path.join(SESSIONS_ROOT, userIdStr)
    let sessionCount = 0
    if (fs.existsSync(userPath)) sessionCount = fs.readdirSync(userPath).length

    if (sessionCount >= MAX_SESSIONS) {
        await sendRichBlocks(chatId, [
            headingBlock('❌ sᴇssɪᴏɴ ʟɪᴍɪᴛ ʀᴇᴀᴄʜᴇᴅ'),
            paragraphBlock(`ᴏɴʟʏ ${MAX_SESSIONS} sᴇssɪᴏɴs ᴀʟʟᴏᴡᴇᴅ ᴘᴇʀ ᴜsᴇʀ.`),
            dividerBlock(),
            tableBlock([
                ['ɪᴛᴇᴍ', 'ᴠᴀʟᴜᴇ'],
                ['📦 ᴍᴀx sᴇssɪᴏɴs', String(MAX_SESSIONS)],
                ['📞 ʏᴏᴜʀ sᴇssɪᴏɴs', String(sessionCount)],
                ['✅ sᴛᴀᴛᴜs', 'ʟɪᴍɪᴛ ʀᴇᴀᴄʜᴇᴅ']
            ]),
            dividerBlock(),
            footerBlock("💎 ᴅᴇʟᴇᴛᴇ ᴀɴ ᴇxɪsᴛɪɴɢ sᴇssɪᴏɴ ʙᴇғᴏʀᴇ ᴘᴀɪʀɪɴɢ ᴀɴᴏᴛʜᴇʀ"),
            ...buttonRows([
                [{ text: '🗑 ᴍʏ sᴇssɪᴏɴs', style: 'danger', callback_data: 'listpair' }],
                [{ text: '⬅ ʙᴀᴄᴋ', style: 'primary', callback_data: 'user_menu' }]
            ])
        ])
        return
    }

    userStates[telegramId] = { action: 'pairing', chatId }

    await sendRichBlocks(chatId, [
        headingBlock('📞 ᴘᴀɪʀ ɴᴜᴍʙᴇʀ'),
        paragraphBlock('sᴇɴᴅ ʏᴏᴜʀ ᴡʜᴀᴛsᴀᴘᴘ ɴᴜᴍʙᴇʀ ᴛᴏ ɢᴇᴛ ᴀ ᴘᴀɪʀɪɴɢ ᴄᴏᴅᴇ.'),
        dividerBlock(),
        tableBlock([
            ['ɪᴛᴇᴍ', 'ᴠᴀʟᴜᴇ'],
            ['📞 ꜰᴏʀᴍᴀᴛ', '2348012345678'],
            ['📍 ᴄᴏᴜɴᴛʀʏ ᴄᴏᴅᴇ', 'ʀᴇǫᴜɪʀᴇᴅ'],
            ['❌ ɴᴏ + sɪɢɴ', 'ᴊᴜsᴛ ᴅɪɢɪᴛs'],
            ['⏲ ᴠᴀʟɪᴅɪᴛʏ', '60 sᴇᴄᴏɴᴅs']
        ]),
        dividerBlock(),
        paragraphBlock('ᴛʏᴘᴇ /cancel ᴛᴏ ᴄᴀɴᴄᴇʟ'),
        footerBlock("💎 ᴇxᴀᴍᴘʟᴇ : 2348012345678"),
        ...buttonRows([
            [{ text: '❌ ᴄᴀɴᴄᴇʟ', style: 'primary', callback_data: 'cancel_pair' }]
        ])
    ])
}

// ================= CANCEL PAIR =================

async function cancelPair(chatId) {
    await sendRichBlocks(chatId, [
        headingBlock('❌ ᴘᴀɪʀɪɴɢ ᴄᴀɴᴄᴇʟʟᴇᴅ'),
        paragraphBlock('ʏᴏᴜ ᴄᴀɴ sᴛᴀʀᴛ ᴀ ɴᴇᴡ ᴘᴀɪʀ sᴇssɪᴏɴ ᴀɴʏ ᴛɪᴍᴇ.'),
        dividerBlock(),
        footerBlock(`💎 ${BOT_NAME} ${BOT_VERSION}`),
        ...buttonRows([
            [
                { text: '🎯 ʀᴇ-ᴘᴀɪʀ', style: 'danger', callback_data: 'pair' },
                { text: '⬅ ʙᴀᴄᴋ', style: 'primary', callback_data: 'user_menu' }
            ]
        ])
    ])
}

// ================= DELETE SESSION =================

async function runDelPair(chatId, telegramId) {
    const sessions = getUserSessions(telegramId)

    if (sessions.length === 0) {
        await sendRichBlocks(chatId, [
            headingBlock('📦 ɴᴏ sᴇssɪᴏɴ ғᴏᴜɴᴅ'),
            paragraphBlock("ʏᴏᴜ ᴅᴏɴ'ᴛ ʜᴀᴠᴇ ᴀɴʏ ᴀᴄᴛɪᴠᴇ sᴇssɪᴏɴs ʏᴇᴛ."),
            dividerBlock(),
            footerBlock("💎 ᴘᴀɪʀ ᴀ ɴᴇᴡ sᴇssɪᴏɴ ᴛᴏ ɢᴇᴛ sᴛᴀʀᴛᴇᴅ"),
            ...backButtonRow('user_menu')
        ])
        return
    }

    const rows = [['#', 'sᴇssɪᴏɴ']]
    sessions.forEach((s, i) => rows.push([String(i + 1), s]))

    const btnRows = sessions.map(s => ([{ text: `✘ ${s}`, style: 'danger', callback_data: `confirm_delete_${s}` }]))
    btnRows.push([{ text: '⬅ ʙᴀᴄᴋ', style: 'primary', callback_data: 'user_menu' }])

    await sendRichBlocks(chatId, [
        headingBlock('🗑 sᴇʟᴇᴄᴛ ᴀ sᴇssɪᴏɴ'),
        paragraphBlock('ᴄʜᴏᴏsᴇ ᴛʜᴇ sᴇssɪᴏɴ ʏᴏᴜ ᴡᴀɴᴛ ᴛᴏ ʀᴇᴍᴏᴠᴇ.'),
        dividerBlock(),
        tableBlock(rows),
        dividerBlock(),
        footerBlock("❗️ ᴛʜɪs ᴀᴄᴛɪᴏɴ ᴄᴀɴɴᴏᴛ ʙᴇ ᴜɴᴅᴏɴᴇ"),
        ...buttonRows(btnRows)
    ])
}

// ================= MY SESSIONS (ADMIN) =================

async function runMySessions(chatId, telegramId) {
    const userIdStr = telegramId.toString()
    const userPath = path.join(SESSIONS_ROOT, userIdStr)

    if (!fs.existsSync(userPath) || !fs.readdirSync(userPath).length) {
        await sendRichBlocks(chatId, [
            headingBlock('❌ ɴᴏ sᴇssɪᴏɴ ғᴏᴜɴᴅ'),
            paragraphBlock('ᴛʜɪs ᴜsᴇʀ ʜᴀs ɴᴏ sᴇssɪᴏɴs ʏᴇᴛ.'),
            ...backButtonRow('admin_menu')
        ])
        return
    }

    const numbers = fs.readdirSync(userPath)
    const page = 0
    const start = page * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    const pageItems = numbers.slice(start, end)

    const rows = [['#', 'sᴇssɪᴏɴ']]
    pageItems.forEach((n, i) => rows.push([String(start + i + 1), n]))

    const btnRows = []
    for (let i = 0; i < pageItems.length; i += 2) {
        const row = [{ text: `✕ ${pageItems[i]}`, style: 'danger', callback_data: `delsession_${userIdStr}_${pageItems[i]}` }]
        if (pageItems[i + 1]) row.push({ text: `✕ ${pageItems[i + 1]}`, style: 'danger', callback_data: `delsession_${userIdStr}_${pageItems[i + 1]}` })
        btnRows.push(row)
    }
    btnRows.push([{ text: '⬅ ʙᴀᴄᴋ', style: 'primary', callback_data: 'admin_menu' }])

    await sendRichBlocks(chatId, [
        headingBlock('📂 ᴀʟʟ ᴜsᴇʀ sᴇssɪᴏɴs'),
        paragraphBlock(`ᴘᴀɢᴇ ${page + 1}`),
        dividerBlock(),
        tableBlock(rows),
        dividerBlock(),
        paragraphBlock(`ᴛᴏᴛᴀʟ : ${numbers.length} sᴇssɪᴏɴs`),
        footerBlock("💎 ᴀᴅᴍɪɴ ᴠɪᴇᴡ"),
        ...buttonRows(btnRows)
    ])
}

// ================= BROADCAST =================

async function runBroadcast(chatId, telegramId) {
    if (String(telegramId) !== String(config.OWNER_ID)) {
        await sendRichBlocks(chatId, [headingBlock('❗️ ᴏᴡɴᴇʀ ᴏɴʟʏ')])
        return
    }

    await sendRichBlocks(chatId, [
        ...bannerBlock(),
        headingBlock('📣 ʙʀᴏᴀᴅᴄᴀsᴛ'),
        paragraphBlock('sᴇɴᴅ ᴛʜᴇ ʙʀᴏᴀᴅᴄᴀsᴛ ᴍᴇssᴀɢᴇ'),
        dividerBlock(),
        paragraphBlock('📝 ᴛᴇxᴛ\n📸 ᴘʜᴏᴛᴏ\n📦 ᴠɪᴅᴇᴏ\n📄 ᴅᴏᴄᴜᴍᴇɴᴛ'),
        dividerBlock(),
        footerBlock("💎 ᴀᴅᴍɪɴ ᴘᴀɴᴇʟ"),
        ...buttonRows([
            [{ text: '❌ ᴄᴀɴᴄᴇʟ', style: 'danger', callback_data: 'admin_menu' }]
        ])
    ])
}

// ================= DENY ACCESS =================

async function denyAccess(chatId) {
    await sendRichBlocks(chatId, [
        headingBlock('❌ ᴀᴄᴄᴇss ᴅᴇɴɪᴇᴅ'),
        paragraphBlock('Jᴏɪɴ ᴏᴜʀ ᴄʜᴀɴɴᴇʟ ᴛᴏ ᴜsᴇ ᴛʜɪs ʙᴏᴛ.')
    ])
}

// ================= CALLBACK HANDLER =================

bot.on("callback_query", async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id
    const messageId = callbackQuery.message.message_id
    const telegramId = callbackQuery.from.id
    const data = callbackQuery.data

    editState[chatId] = messageId
    console.log(chalk.blue("ᴄᴀʟʟʙᴀᴄᴋ →"), data)

    if (data === "check_join" || data === "check_channel_join") {
        const joined = await isJoined(telegramId)
        if (!joined) {
            return bot.answerCallbackQuery(callbackQuery.id, {
                text: "𖣘 ʏᴏᴜ ʜᴀᴠᴇɴ'ᴛ ᴊᴏɪɴᴇᴅ ᴛʜᴇ ᴄʜᴀɴɴᴇʟ ʏᴇᴛ.",
                show_alert: true
            })
        }
        await deleteMsg(chatId, messageId)
        bot.answerCallbackQuery(callbackQuery.id)
        if (String(telegramId) === String(config.OWNER_ID)) return sendAdminMenu(chatId)
        return sendUserMenu(chatId)
    }

    if (data === 'go_menu') {
        await deleteMsg(chatId, messageId)
        bot.answerCallbackQuery(callbackQuery.id)
        if (String(telegramId) === String(config.OWNER_ID)) return sendAdminMenu(chatId)
        return sendUserMenu(chatId)
    }

    bot.answerCallbackQuery(callbackQuery.id)

    switch (data) {
        case "admin_menu": return sendAdminMenu(chatId)
        case "user_menu": return sendUserMenu(chatId)
        case "pair": return runPair(chatId, telegramId)
        case "cancel_pair": return cancelPair(chatId)
        case "delpair": return runDelPair(chatId, telegramId)
        case "runtime": return sendRuntime(chatId)
        case "stats": return sendStats(chatId, telegramId)
        case "thanks": return sendThanks(chatId)
        case "broadcast": return runBroadcast(chatId, telegramId)
        case "listpair": return runMySessions(chatId, telegramId)
        case "admin_stats": return sendAdminStats(chatId)
    }
})

// ================= CANCEL =================

bot.onText(/^\/cancel$/, async (msg) => {
    const chatId = msg.chat.id
    const telegramId = msg.from.id
    if (userStates[telegramId]) {
        delete userStates[telegramId]
        await cancelPair(chatId)
    }
})

// ================= TEXT INPUT =================

bot.on('message', async (msg) => {
    const chatId = msg.chat.id
    const telegramId = msg.from.id
    const text = msg.text

    if (!text || text.startsWith('/')) return

    const userState = userStates[telegramId]
    if (!userState) return

    if (userState.action === 'pairing') {
        let phoneNumber = text.trim().replace(/[^0-9]/g, '').toString()

        if (!phoneNumber || phoneNumber.length < 10) {
            await sendRichBlocks(chatId, [
                headingBlock('❌ ɪɴᴠᴀʟɪᴅ ɴᴜᴍʙᴇʀ'),
                paragraphBlock('ᴘʟᴇᴀsᴇ ᴇɴᴛᴇʀ ᴀ ᴠᴀʟɪᴅ ᴘʜᴏɴᴇ ɴᴜᴍʙᴇʀ.'),
                dividerBlock(),
                tableBlock([
                    ['ɪᴛᴇᴍ', 'ᴠᴀʟᴜᴇ'],
                    ['📞 ʀᴇᴄᴇɪᴠᴇᴅ', text.trim() || 'empty'],
                    ['✅ ᴇxᴘᴇᴄᴛᴇᴅ', '2348012345678'],
                    ['🔢 ᴍɪɴ ᴅɪɢɪᴛs', '10']
                ]),
                dividerBlock(),
                paragraphBlock('ᴛʏᴘᴇ /cancel ᴛᴏ ᴄᴀɴᴄᴇʟ')
            ])
            return
        }

        if (phoneNumber.length === 10) phoneNumber = '234' + phoneNumber

        try {
            const { code } = await startSession(telegramId.toString(), phoneNumber.toString())

            if (!code) {
                await sendRichBlocks(chatId, [
                    headingBlock('✅ sᴇssɪᴏɴ ʀᴇsᴛᴏʀᴇᴅ'),
                    paragraphBlock('sᴇssɪᴏɴ ᴀʟʀᴇᴀᴅʏ ᴘᴀɪʀᴇᴅ — ʀᴇsᴛᴏʀᴇᴅ sᴜᴄᴄᴇssғᴜʟʟʏ.'),
                    dividerBlock(),
                    tableBlock([
                        ['ɪᴛᴇᴍ', 'ᴠᴀʟᴜᴇ'],
                        ['📞 ɴᴜᴍʙᴇʀ', phoneNumber],
                        ['🔗 sᴛᴀᴛᴜs', 'ᴀʟʀᴇᴀᴅʏ ᴘᴀɪʀᴇᴅ'],
                        ['🔄 ᴀᴄᴛɪᴏɴ', 'ʀᴇsᴛᴏʀᴇᴅ']
                    ]),
                    dividerBlock(),
                    footerBlock(`💎 ${BOT_NAME} ${BOT_VERSION}`),
                    ...buttonRows([
                        [{ text: '📂 ᴠɪᴇᴡ sᴇssɪᴏɴs', style: 'danger', callback_data: 'listpair' }],
                        [{ text: '⬅ ʙᴀᴄᴋ', style: 'primary', callback_data: 'user_menu' }]
                    ])
                ])
                delete userStates[telegramId]
                return
            }

            await sendRichBlocks(chatId, [
                headingBlock('🔑 ᴘᴀɪʀɪɴɢ ᴄᴏᴅᴇ'),
                paragraphBlock('ᴜsᴇ ᴛʜɪs ᴄᴏᴅᴇ ǫᴜɪᴄᴋʟʏ ʙᴇғᴏʀᴇ ɪᴛ ᴇxᴘɪʀᴇs:'),
                dividerBlock(),
                tableBlock([
                    ['ɪᴛᴇᴍ', 'ᴠᴀʟᴜᴇ'],
                    ['📞 ɴᴜᴍʙᴇʀ', phoneNumber],
                    ['🔑 ᴄᴏᴅᴇ', code],
                    ['⏲ ᴠᴀʟɪᴅɪᴛʏ', '60 sᴇᴄᴏɴᴅs'],
                    ['❗️ ᴀᴄᴛɪᴏɴ', 'ᴜsᴇ ɪᴛ ǫᴜɪᴄᴋʟʏ!']
                ]),
                dividerBlock(),
                paragraphBlock('❗️ ᴛʜɪs ᴄᴏᴅᴇ ɪs ᴠᴀʟɪᴅ ғᴏʀ 60 sᴇᴄᴏɴᴅs ᴏɴʟʏ!'),
                footerBlock(`💎 ${BOT_NAME} ${BOT_VERSION}`),
                ...buttonRows([
                    [{ text: '📂 ᴠɪᴇᴡ sᴇssɪᴏɴs', style: 'danger', callback_data: 'listpair' }],
                    [{ text: '⬅ ʙᴀᴄᴋ', style: 'primary', callback_data: 'user_menu' }]
                ])
            ])
            delete userStates[telegramId]

        } catch (err) {
            console.log(err.stack)

            await sendRichBlocks(chatId, [
                headingBlock('❌ ᴇʀʀᴏʀ'),
                paragraphBlock('ᴄᴏᴜʟᴅ ɴᴏᴛ ᴄᴏᴍᴘʟᴇᴛᴇ ᴘᴀɪʀɪɴɢ.'),
                dividerBlock(),
                tableBlock([
                    ['ɪᴛᴇᴍ', 'ᴠᴀʟᴜᴇ'],
                    ['📞 ɴᴜᴍʙᴇʀ', phoneNumber],
                    ['💬 ʀᴇᴀsᴏɴ', (err.message || 'Unknown error').slice(0, 200)]
                ]),
                dividerBlock(),
                footerBlock("💎 ᴛʀʏ ᴀɢᴀɪɴ ᴏʀ ᴄᴏɴᴛᴀᴄᴛ sᴜᴘᴘᴏʀᴛ")
            ])
            delete userStates[telegramId]
        }
    }
})

// ================= ERROR HANDLING =================

bot.on("polling_error", (err) => {
    console.log(chalk.red("ᴘᴏʟʟɪɴɢ ᴇʀʀᴏʀ:"), err.message)
})

console.log(chalk.bgBlack.magenta.bold(` ᴢᴇʀᴀɪx ᴠ2
[ꜰʀᴇᴇ ᴍᴏᴅᴇ ᴀᴄᴛɪᴠᴇ — ɴᴏ ᴘʀᴇᴍɪᴜᴍ ʀᴇǫᴜɪʀᴇᴅ]`))

module.exports = { bot, config, SESSIONS_ROOT, ITEMS_PER_PAGE }
