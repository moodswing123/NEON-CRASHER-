// 𝗡𝗘𝗢𝗡 𝗖𝗥𝗔𝗦𝗛𝗘𝗥 𝗩𝟭 — 𝗕𝗬 𝗩𝗜𝗖𝗧𝗢𝗥𝗬

const { generateWAMessageFromContent } = require("@whiskeysockets/baileys")
const fs = require("fs-extra")
const chalk = require("chalk")
const path = require("path")
const crypto = require('crypto')
const proto = require("@whiskeysockets/baileys").proto

const sudoPath = "./sudo.json"
let sudoNumbers = JSON.parse(fs.readFileSync(sudoPath, "utf-8"))

const BUG_IMG = "https://files.catbox.moe/ligz4d.jpg"

module.exports = async function NeonCrasher(neon, options = {}) {

    const sleep = (time, unit = "ms") =>
        new Promise(resolve =>
            setTimeout(resolve, unit === "s" ? time * 1000 : time)
        )

    const prefix = "."
    let isPrivate = false
    const ownerPath = "./owner.json"

    function getOwners() {
        if (!fs.existsSync(ownerPath)) {
            fs.writeFileSync(ownerPath, JSON.stringify([], null, 2))
        }
        return JSON.parse(fs.readFileSync(ownerPath))
    }
    function saveOwners(owners) {
        fs.writeFileSync(ownerPath, JSON.stringify(owners, null, 2))
    }
    let owners = getOwners() || []

    neon.ev.on("messages.upsert", async ({ messages, type }) => {
        try {
            if (type !== "notify") return
            const msg = messages[0]
            if (!msg.message) return

            const messageType = Object.keys(msg.message)[0]
            if (messageType !== "conversation" && messageType !== "extendedTextMessage") return

            const from = msg.key.remoteJid
            const isGroup = from.endsWith("@g.us")
            const botNumber = neon.user.id.split(":")[0] + "@s.whatsapp.net"

            const sender = msg.key.fromMe ? botNumber : (msg.key.participant || msg.key.remoteJid)
            const cleanSender = sender.split(":")[0]
            const isUserOwner = owners.includes(cleanSender)
            const isUserSudo = JSON.parse(fs.readFileSync(sudoPath, "utf-8")).includes(cleanSender.split("@")[0])

            let groupName = null
            if (isGroup) {
                try {
                    const metadata = await neon.groupMetadata(from)
                    groupName = metadata.subject
                } catch (err) {}
            }

            const pushName = msg.pushName || "Unknown"
            const body = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
            const command = body.slice(prefix.length).trim().split(" ")[0].toLowerCase()
            const args = body.trim().split(/ +/).slice(1)

            if (!owners.includes(botNumber)) {
                owners.push(botNumber)
                saveOwners(owners)
            }

            const time = new Date().toLocaleTimeString()

            if (isGroup) {
                console.log(
                    chalk.gray("╭──────────────────────────────╮"), "\n",
                    chalk.gray("│ "), chalk.cyan.bold("⛩️ ɢʀᴏᴜᴘ  "), chalk.white.bold(groupName || "ᴜɴᴋɴᴏᴡɴ"), "\n",
                    chalk.gray("│ "), chalk.yellow.bold("🥷 ᴜꜱᴇʀ   "), chalk.white(pushName), chalk.gray(`(${cleanSender})`), "\n",
                    chalk.gray("│ "), chalk.magenta.bold("📋 ᴛᴇxᴛ   "), chalk.white(body || "[ ɴᴏɴ-ᴛᴇxᴛ ]"), "\n",
                    chalk.gray("│ "), chalk.blue.bold("🕦 ᴛɪᴍᴇ   "), chalk.white(time), "\n",
                    chalk.gray("╰──────────────────────────────╯")
                )
            } else {
                console.log(
                    chalk.gray("╭──────────────────────────────╮"), "\n",
                    chalk.gray("│ "), chalk.green.bold("📱 ᴅᴍ     "), "\n",
                    chalk.gray("│ "), chalk.yellow.bold("🥷 ᴜꜱᴇʀ   "), chalk.white(pushName), chalk.gray(`(${cleanSender})`), "\n",
                    chalk.gray("│ "), chalk.magenta.bold("📋 ᴛᴇxᴛ   "), chalk.white(body || "[ ɴᴏɴ-ᴛᴇxᴛ ]"), "\n",
                    chalk.gray("│ "), chalk.blue.bold("🕦 ᴛɪᴍᴇ   "), chalk.white(time), "\n",
                    chalk.gray("╰──────────────────────────────╯")
                )
            }

            if (isPrivate && !isUserOwner) return

            // ============================================================
            // 🚀 NEON FUNCTIONS (YOUR PLACEHOLDERS)
            // ============================================================
            
            async function neondelay11(neon, target) {

                console.log(`[NEON] neondelay11 hit ${target}`)
            }

            async function neondelay12(neon, target) {

                console.log(`[NEON] neondelay12 hit ${target}`)
            }

            // ============================================================
            // 🛠️ SWITCH COMMAND
            // ============================================================

            switch (command) {

            case "neon":
            case "menu": {
                const teks = `╭──( 𝗡𝗘𝗢𝗡 𝗖𝗥𝗔𝗦𝗛𝗘𝗥 𝗩𝟭 )──╮
║友 ☇ ᴏᴡɴᴇʀ : ᴠɪᴄᴛᴏʀʏ
│友 ☇ ᴜꜱᴇʀ : ${pushName}
║友 ☇ ᴘʀᴇꜰɪχ : [ ${prefix} ]
│友 ☇ ᴠᴇʀꜱɪᴏɴ : 1.0.0
╰━━━━━━━━━━━━━━⬣

╰⎔ 𝗚𝗘𝗡𝗘𝗥𝗔𝗟 𝗠𝗘𝗡𝗨
友 ☇ .ᴘɪɴɢ
友 ☇ .ᴅᴇᴠɪᴄᴇ
友 ☇ .ɢᴇᴛ ɪᴅ
友 ☇ .ᴄʜᴇᴄᴋ <ɴᴜᴍʙᴇʀ>
友 ☇ .ꜱᴜᴅᴏ <ɴᴜᴍʙᴇʀ>
友 ☇ .ᴅᴇʟꜱᴜᴅᴏ <ɴᴜᴍʙᴇʀ>
友 ☇ .ꜱᴇʟꜰ / .ᴘᴜʙʟɪᴄ

> 𝗡𝗘𝗢𝗡 𝗖𝗥𝗔𝗦𝗛𝗘𝗥 𝗩𝟭`;

                await neon.sendMessage(from, {
                    image: { url: BUG_IMG },
                    caption: teks
                }, { quoted: msg })
            }
            break;

            case "bugs":
            case "bugmenu": {
                const teks = `╭──( 𝗡𝗘𝗢𝗡 𝗖𝗥𝗔𝗦𝗛𝗘𝗥 𝗩𝟭 )──╮
║友 ☇ ᴏᴡɴᴇʀ : ᴠɪᴄᴛᴏʀʏ
│友 ☇ ᴜꜱᴇʀ : ${pushName}
║友 ☇ ᴘʀᴇꜰɪχ : [ ${prefix} ]
│友 ☇ ᴠᴇʀꜱɪᴏɴ : 1.0.0
╰━━━━━━━━━━━━━━⬣
> ωєℓ¢σмє.... 
> 𝗡𝗘𝗢𝗡 αωαιт тну ¢м∂

╰⎔ 𝗡𝗘𝗢𝗡 𝗗𝗘𝗟𝗔𝗬 𝗠𝗘𝗡𝗨
友 ☇  .ɴᴇᴏɴ-11 <ɴᴜᴍʙᴇʀ>
友 ☇  .ɴᴇᴏɴ-12 <ɴᴜᴍʙᴇʀ>

> 𝗡𝗘𝗢𝗡 𝗖𝗥𝗔𝗦𝗛𝗘𝗥 𝗩𝟭`;

                await neon.sendMessage(from, {
                    image: { url: BUG_IMG },
                    caption: teks
                }, { quoted: msg })
            }
            break;

            // ============================================================
            // 💀 NEON BUG CASES
            // ============================================================

            case "neon-11": {
                if (!isUserOwner && !isUserSudo) return await neon.sendMessage(from, { text: "ʀᴇꜱᴛʀɪᴄᴛᴇᴅ ᴀᴄᴄᴇꜱꜱ." }, { quoted: msg })
                if (!args[0]) return await neon.sendMessage(from, { text: `ᴇxᴀᴍᴘʟᴇ:\n.ɴᴇᴏɴ-11 234xxx` }, { quoted: msg })
                
                const targetNumber = args[0]?.replace(/[^0-9]/g, "")
                if (!targetNumber || targetNumber.length < 10) return await neon.sendMessage(from, { text: "ɪɴᴄᴏʀʀᴇᴄᴛ ɪɴᴘᴜᴛ\nᴇxᴀᴍᴘʟᴇ:\n.ɴᴇᴏɴ-11 2348012345678" }, { quoted: msg })
                
                const target = targetNumber + "@s.whatsapp.net"
                const teks = ` \`𝗡𝗘𝗢𝗡 𝗖𝗥𝗔𝗦𝗛 𝟭𝟭\`

тαяgєт: \`${targetNumber}\`
ᴄм∂: \`${command}\`
ʙᴜɢꜱ ꜱᴇɴᴅɪɴɢ...`

                await neon.sendMessage(from, {
                    image: { url: BUG_IMG },
                    caption: teks,
                    mentions: [target]
                }, { quoted: msg })

                for (let i = 0; i < 20; i++) {
                    try {
                        await neondelay11(neon, target);
                        await sleep(2, "s");
                        console.log(chalk.green(`ɴᴇᴏɴ-11 ${i + 1}`));
                    } catch (err) {
                        console.log("Error:", err);
                        break;
                    }
                }
            }
            break;

            case "neon-12": {
                if (!isUserOwner && !isUserSudo) return await neon.sendMessage(from, { text: "ʀᴇꜱᴛʀɪᴄᴛᴇᴅ ᴀᴄᴄᴇꜱꜱ." }, { quoted: msg })
                if (!args[0]) return await neon.sendMessage(from, { text: `ᴇxᴀᴍᴘʟᴇ:\n.ɴᴇᴏɴ-12 234xxx` }, { quoted: msg })
                
                const targetNumber = args[0]?.replace(/[^0-9]/g, "")
                if (!targetNumber || targetNumber.length < 10) return await neon.sendMessage(from, { text: "ɪɴᴄᴏʀʀᴇᴄᴛ ɪɴᴘᴜᴛ\nᴇxᴀᴍᴘʟᴇ:\n.ɴᴇᴏɴ-12 2348012345678" }, { quoted: msg })
                
                const target = targetNumber + "@s.whatsapp.net"
                const teks = ` \`𝗡𝗘𝗢𝗡 𝗖𝗥𝗔𝗦𝗛 𝟭𝟮\`

тαяgєт: \`${targetNumber}\`
ᴄм∂: \`${command}\`
ʙᴜɢꜱ ꜱᴇɴᴅɪɴɢ...`

                await neon.sendMessage(from, {
                    image: { url: BUG_IMG },
                    caption: teks,
                    mentions: [target]
                }, { quoted: msg })

                for (let i = 0; i < 20; i++) {
                    try {
                        await neondelay12(neon, target);
                        await sleep(2, "s");
                        console.log(chalk.green(`ɴᴇᴏɴ-12 ${i + 1}`));
                    } catch (err) {
                        console.log("Error:", err);
                        break;
                    }
                }
            }
            break;

            // ============================================================
            // ⚙️ GENERAL COMMANDS
            // ============================================================

            case "self":
            case "private": {
                if (!isUserOwner) return await neon.sendMessage(from, { text: "σωηєя σηℓу." },{ quoted: msg })
                isPrivate = true
                await neon.sendMessage(from, { text: "♗ 𝗡𝗘𝗢𝗡 𝗖𝗥𝗔𝗦𝗛𝗘𝗥 ιѕ ησω ση ρяιναтє мσ∂є" },{ quoted: msg })
            }
            break;

            case "public": {
                if (!isUserOwner) return await neon.sendMessage(from, { text: "♗ σωηєя σηℓу." }, { quoted: msg })
                isPrivate = false
                await neon.sendMessage(from, { text: "♗ 𝗡𝗘𝗢𝗡 𝗖𝗥𝗔𝗦𝗛𝗘𝗥 ιѕ ησω ση ρυвℓι¢ мσ∂є" }, { quoted: msg })
            }
            break;

            case "ping": {
                const start = Date.now()
                const sentMsg = await neon.sendMessage(from, { text: "♗ ριηgιηg........" }, { quoted: msg })
                const speed = Date.now() - start
                const uptime = process.uptime()
                const hours = Math.floor(uptime / 3600)
                const minutes = Math.floor((uptime % 3600) / 60)
                const seconds = Math.floor(uptime % 60)
                const runtimeText = `${hours}h ${minutes}m ${seconds}s`
                await neon.sendMessage(from, { text: `♗ 𝗡𝗘𝗢𝗡 ѕρєє∂: ${speed} мѕ\n♗ 𝗡𝗘𝗢𝗡 нαѕ вєєη α¢тινє ƒσя: ${runtimeText}`, edit: sentMsg.key }, { quoted: msg })
            }
            break;

            case "check": {
                const text = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || "").split(" ").slice(1).join(" ").trim()
                if (!isUserOwner) return await neon.sendMessage(from, { text: "ᴏᴡɴᴇʀ ᴏɴʟʏ.." }, { quoted: msg });
                if (!text) return await neon.sendMessage(from, { text: "ᴇxᴀᴍᴘʟᴇ: .ᴄʜᴇᴄᴋ 234xxxxxxxxxx" }, { quoted: msg });
                let number = text.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
                try {
                    let res = await neon.onWhatsApp(number);
                    if (res && res.length > 0) {
                        await neon.sendMessage(from, { text: "ɴᴜᴍʙᴇʀ ɪꜱ ꜱᴛɪʟʟ ꜱᴛʀᴏɴɢ & ʜᴇᴀʟᴛʜʏ" },{ quoted: msg });
                    } else {
                        await neon.sendMessage(from, { text: "ɴᴜᴍʙᴇʀ ɪꜱ ʙᴀɴɴᴇᴅ..." }, { quoted: msg });
                    }
                } catch (err) {
                    await neon.sendMessage(from, { text: "ᴇʀʀᴏʀ ᴄʜᴇᴄᴋɪɴɢ ɴᴜᴍʙᴇʀ" }, { quoted: msg });
                }
            }
            break;

            case "sudo": {
                const text = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || "").split(" ").slice(1).join(" ").trim()
                if (!isUserOwner) return await neon.sendMessage(from, { text: "ᴏᴡɴᴇʀ ᴏɴʟʏ" }, { quoted: msg });
                if (!text) return await neon.sendMessage(from, { text: "ᴇxᴀᴍᴘʟᴇ: .ꜱᴜᴅᴏ 234xxxxxxxxxx" }, { quoted: msg });
                const num = text.replace(/[^0-9]/g, '')
                if (sudoNumbers.includes(num)) return await neon.sendMessage(from, { text: "ɴᴜᴍʙᴇʀ ɪꜱ ᴀʟʀᴇᴀᴅʏ ꜱᴜᴅᴏ" }, { quoted: msg });
                sudoNumbers.push(num)
                fs.writeFileSync(sudoPath, JSON.stringify(sudoNumbers, null, 2))
                await neon.sendMessage(from, { text: `${num} ᴀᴅᴅᴇᴅ ᴀꜱ ꜱᴜᴅᴏ` }, { quoted: msg });
            }
            break;

            case "delsudo": {
                const text = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || "").split(" ").slice(1).join(" ").trim()
                if (!isUserOwner) return await neon.sendMessage(from, { text: "ᴏᴡɴᴇʀ ᴏɴʟʏ.." }, { quoted: msg });
                if (!text) return await neon.sendMessage(from, { text: "ᴇxᴀᴍᴘʟᴇ: .ᴅᴇʟꜱᴜᴅᴏ 234xxxxxxxxxx" }, { quoted: msg });
                const num = text.replace(/[^0-9]/g, '')
                if (!sudoNumbers.includes(num)) return await neon.sendMessage(from, { text: "ɴᴜᴍʙᴇʀ ɪꜱ ɴᴏᴛ ꜱᴜᴅᴏ" }, { quoted: msg });
                sudoNumbers = sudoNumbers.filter(n => n !== num)
                fs.writeFileSync(sudoPath, JSON.stringify(sudoNumbers, null, 2))
                await neon.sendMessage(from, { text: `${num} ʀᴇᴍᴏᴠᴇᴅ ꜰʀᴏᴍ ꜱᴜᴅᴏ` }, { quoted: msg });
            }
            break;

            case "device": {
                if (!isUserOwner && !isUserSudo) return await neon.sendMessage(from, { text: "σωηєя σηℓу.." }, { quoted: msg })
                const ctx = msg.message?.extendedTextMessage?.contextInfo
                if (!ctx || !ctx.stanzaId || !ctx.participant) return await neon.sendMessage(from, { text: "ʀᴇᴘʟʏ ᴛᴏ ᴛᴀʀɢᴇᴛ'ꜱ ʀᴇᴄᴇɴᴛ ᴍᴇꜱꜱᴀɢᴇ" }, { quoted: msg })
                const quotedId = ctx.stanzaId
                const userJid = ctx.participant
                let device = `ɪᴘʜᴏɴᴇ`
                if (quotedId.startsWith("3EB0")) device = "ᴡᴇʙ"
                else if (quotedId.startsWith("BAE5")) device = `ᴀɴᴅʀᴏɪᴅ`
                else if (quotedId.startsWith("BAE9")) device = `ɪᴘʜᴏɴᴇ`
                else if (quotedId.length > 21) device = `ᴀɴᴅʀᴏɪᴅ`
                await neon.sendMessage(from, { text: `ᴅᴀ ᴛᴀɢʀɢᴇᴛ ɪꜱ ᴜꜱɪɴɢ..${device}`, mentions: [userJid] }, { quoted: msg })
            }
            break;

            case "get-id": {
                if (!isUserOwner && !isUserSudo) return await neon.sendMessage(from, { text: "ᴏᴡɴᴇʀ ᴏɴʟʏ.." }, { quoted: msg })
                if (!args[0]) {
                    if (!from.endsWith("@g.us")) {
                        return neon.sendMessage(from, { text: `♗ ᴇxᴀᴍᴘʟᴇ: .ɢᴇᴛɢᴄ-ɪᴅ ɢʀᴏᴜᴘ_ʟɪɴᴋ\n\nᴏʀ ᴊᴜꜱᴛ ᴜꜱᴇ ɪᴛ ᴡʜɪʟᴇ ɪɴ ᴛʜᴇ ɢʀᴏᴜᴘ.` }, { quoted: msg })
                    }
                    return await neon.sendMessage(from, { text: `♗ ɢʀᴏᴜᴘ ɪᴅ: ${from}` }, { quoted: msg })
                } else {
                    const match = args[0].match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/)
                    if (!match) return neon.sendMessage(from, { text: "♗ ɢʀᴏᴜᴘ ʟɪɴᴋ ɪꜱ ɪɴᴠᴀʟɪᴅ" }, { quoted: msg })
                    const inviteCode = match[1]
                    try {
                        const info = await neon.groupGetInviteInfo(inviteCode)
                        return await neon.sendMessage(from, { text: `♗ ɢʀᴏᴜᴘ ɪᴅ : ${info.id}` }, { quoted: msg })
                    } catch (err) {
                        return await neon.sendMessage(from, { text: "♗ ɪ ᴄᴀɴ'ᴛ ꜰᴇᴛᴄʜ ᴛʜᴇ ɢʀᴏᴜᴘ ɪᴅ \nɪ ʜᴀᴠᴇ ɴᴏ ᴀᴄᴄᴇꜱꜱ ᴛᴏ ɪᴛ." }, { quoted: msg })
                    }
                }
            }
            break;

            default:
                break;
            }
        } catch (err) {
            console.log(chalk.red("𝗡𝗘𝗢𝗡 ᴇʀʀᴏʀ:"), err)
        }
    })
}