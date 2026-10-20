//¿????¿?? 80% CODED BY @victory_is_h1m

// ============================
// 📦 IMPORTS
// ============================
const dns = require('dns')
dns.setDefaultResultOrder('ipv4first')

require('./rentbot')
const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const figlet = require('figlet')
const pino = require('pino')
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason 
} = require('@whiskeysockets/baileys')

const { SESSIONS_ROOT } = require('./telegram bot.js')
// ============================
// 📁 ENSURE SESSIONS ROOT
// ============================

fs.ensureDirSync(SESSIONS_ROOT)

// ============================
// 🎨 STARTUP BANNER
// ============================

figlet('neon', (err, data) => {
    if (err) console.log(chalk.red('Figlet error'))
    else {
        console.log(chalk.red(data))
        console.log(chalk.cyan('neon loves your mom.\n'))
        console.log(chalk.red(` Sessions Root: ${SESSIONS_ROOT}`))
    }
})

// ============================
// 🛠️ PROCESS HANDLERS
// ============================

process.on('unhandledRejection', reason => {
    console.log(chalk.red('🚨 Unhandled Rejection:'), reason)
})

process.on('uncaughtException', error => {
    console.log(chalk.red('🚨 Uncaught Exception:'), error)
})
