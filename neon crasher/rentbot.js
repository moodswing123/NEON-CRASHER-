// RENT BOT BY @victory_is_h1m


const path = require('path')
const fs = require('fs-extra')
const chalk = require('chalk')
const pino = require('pino')

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')
//=========================
// 🔮GLOBALS 
//=========================
const activeSockets = new Map();
const reconnectAttempts = new Map();
const OWNER_ID = '8965170897'; 
const PREMIUM_PATH = path.join(__dirname, 'premium.json');
const PAIRINGS_PATH = path.join(__dirname, 'pairings.json');
const SESSIONS_ROOT = path.join(__dirname, 'sessions');
fs.ensureDirSync(SESSIONS_ROOT)


// ============================
// HELPERS
// ============================

// Read premium users from file
function getPremiumUsers() {
    if (!fs.existsSync(PREMIUM_PATH)) return [];
    return fs.readJsonSync(PREMIUM_PATH);
}

// Check if telegramId can generate a pair (owner or premium)
// ⚡ NOTE: no longer enforced — kept for future use
function canGeneratePair(telegramId) {
    const premiumUsers = getPremiumUsers();

    // If premiumUsers is an array, use it directly
    if (Array.isArray(premiumUsers)) {
        return telegramId === OWNER_ID || premiumUsers.includes(telegramId);
    }

    // If premiumUsers is an object (keys are user IDs)
    if (typeof premiumUsers === 'object' && premiumUsers !== null) {
        return telegramId === OWNER_ID || Object.keys(premiumUsers).includes(telegramId.toString());
    }

    // Fallback: treat as no premium users
    return telegramId === OWNER_ID;
}

// Cleanup expired pending pairing codes
function cleanupExpiredPairings() {
    if (!fs.existsSync(PAIRINGS_PATH)) return;

    const pairings = fs.readJsonSync(PAIRINGS_PATH);
    const now = Date.now();
    const EXPIRY = 5 * 60 * 1000; // 5 min expiration

    for (const [code, info] of Object.entries(pairings)) {
        if (info.status === 'pending' && now - info.createdAt > EXPIRY) {
            delete pairings[code];
        }
    }

    fs.writeJsonSync(PAIRINGS_PATH, pairings, { spaces: 2 });
}

// Check if a phone number is paired
function isPaired(phoneNumber) {
    if (!fs.existsSync(PAIRINGS_PATH)) return false;

    const pairings = fs.readJsonSync(PAIRINGS_PATH);
    return Object.values(pairings).some(p => p.phoneNumber === phoneNumber && p.status === 'paired');
}

function escapeMarkdown(text) {
    return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

function isOwner(id) { 
    return id.toString() === OWNER_ID.toString()
}

/* ============================
 GENERATE AND START PAIRING
=============================*/
async function startSession(telegramId, phoneNumber, isPremium) {

    // ⚡ FREE MODE — pairing is open to everyone
    // (authorization check removed — anyone can pair)

    console.log(chalk.cyan(`📥 Pair request → user: ${telegramId} | number: ${phoneNumber}`))

    const sessionPath = path.join(SESSIONS_ROOT, telegramId, phoneNumber);
    await fs.ensureDir(sessionPath);

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" })
    });

    sock.ev.on("creds.update", saveCreds);

    const Asura = require("./neon");
    await Asura(sock, { isPremium });

    const sessionKey = `${telegramId}-${phoneNumber}`;

    sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {

        if (connection === "open") {
            console.log("✅ CONNECTED:", phoneNumber);
            activeSockets.set(sessionKey, sock);
            logActiveSessions();
        }

        if (connection === "close") {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            console.log("❌ CLOSED:", statusCode);

            activeSockets.delete(sessionKey);

            if (statusCode !== DisconnectReason.loggedOut) {
                console.log("🔄 Reconnecting...");
                setTimeout(() => startSession(telegramId, phoneNumber), 5000);
            } else {
                console.log("Logged out permanently.");
            }
        }
    });

    // Request pairing only if not already registered
    let code = null;

    if (!state.creds.registered) {
        await new Promise(r => setTimeout(r, 2000));
        code = await sock.requestPairingCode(phoneNumber);
        console.log("🕊️ Pair Code:", code);
    }

    return { sock, code };
}

// ============================
// 📋 HELPERS
// ============================

function logActiveSessions() {
    console.log(chalk.magenta(`✴️ Active Sessions: ${activeSockets.size}\n`))
}

function listUserSessions(telegramId) {
    const userPath = path.join(SESSIONS_ROOT, telegramId)
    if (!fs.existsSync(userPath)) return []

    return fs
        .readdirSync(userPath)
        .filter(folder => fs.statSync(path.join(userPath, folder)).isDirectory())
}

// ============================
// ❌ DISCONNECT SESSION
// ============================

async function disconnectSession(telegramId, phoneNumber) {
    const sessionKey = `${telegramId}-${phoneNumber}`
    const sock = activeSockets.get(sessionKey)

    if (!sock) {
        console.log(chalk.yellow(`🍃 No active session for ${phoneNumber}`))
        return
    }

    await sock.logout()
    activeSockets.delete(sessionKey)

    console.log(chalk.red(`⭕ ${phoneNumber} manually disconnected`))
    logActiveSessions()
}

async function restoreSessions() {
    if (!fs.existsSync(SESSIONS_ROOT)) return;

    const users = fs.readdirSync(SESSIONS_ROOT);

    for (const telegramId of users) {
        const userPath = path.join(SESSIONS_ROOT, telegramId);

        if (!fs.statSync(userPath).isDirectory()) continue;

        const phoneNumbers = fs.readdirSync(userPath);

        for (const phoneNumber of phoneNumbers) {
            console.log("♻️ Restoring session:", telegramId, phoneNumber);

            try {
                await startSession(telegramId, phoneNumber, true);
            } catch (err) {
                console.log("Restore error:", err.message);
            }
        }
    }
}

// ============================
// 📦 EXPORTS
// ============================

module.exports = {
    activeSockets,
    startSession,
    restoreSessions,
    listUserSessions,
    disconnectSession,
    getPremiumUsers,
    canGeneratePair,
    cleanupExpiredPairings,
    escapeMarkdown,
    isOwner
}