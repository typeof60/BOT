// "use strict";
const { default: makeWASocket, generateWAMessageFromContent, delay, getAggregateVotesInPollMessage, makeInMemoryStore, makeCacheableSignalKeyStore, updateMessageWithPollUpdate, useMultiFileAuthState } = require("./Baileys_x/lib");
const cp = require("node:child_process");
const fs = require("node:fs");
const pn = require("pino");
const mt = require('moment-timezone');
const { Function, timeSerialize, services, makeTime, database, stringTm, concatDt } = require("./func");
const enem = {};

const store = makeInMemoryStore(pn({ level: "silent" })); store.readFromFile('./baileys_store_multi.json');
setInterval(() => {
    store.writeToFile('./baileys_store_multi.json');
}, 10_000);

const getMessage = async (key) => {
   if (store) {
      const  msg = await store.loadMessage(key.remoteJid, key.id);
      return msg.message || {};
   }
   return {};
};

const connectOnWhatsApp = async () => {
    const { state, saveCreds } = await useMultiFileAuthState("./session");
     const wpp = makeWASocket({
        printQRInTerminal: true,
        getMessage,
        auth: {
           keys: makeCacheableSignalKeyStore(state.keys),
           creds: state.creds
        }
     });
     store?.bind(wpp.ev);
     wpp.ev.on("creds.update", saveCreds);

     wpp.ev.on("messages.upsert", ({ messages, type: msgType }) => messages.forEach(async ({ message, key, pushName }, id) => {
      try {
            if (key.remoteJid == 'status@broadcast') return;
            if (key.id.startsWith('BAE5') || key.id.startsWith('SEX5')) return;
            const type = Object.keys(message || {}).filter((i) => !i.match(/Distribution|ContextInfo/gi) && i)[0];
            const chat = key.remoteJid.endsWith('@g.us');
            const timedat = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
            const content = JSON.stringify(message);
            const body = type == "conversation" ? message.conversation : (type == 'imageMessage' ? message.imageMessage.caption : (type == 'videoMessage' ? message.videoMessage.caption : (type == 'extendedTextMessage' ? message.extendedTextMessage.text : (type == 'senderKeyDistributionMessage' ? (message.conversation ? message.conversation : (message.extendedTextMessage ? message.extendedTextMessage.text : "")) : ""))));
            const from = key.remoteJid;
            const infoGroup = chat ? await wpp.groupMetadata(from).catch(() => {}) : {};
            const groupName = chat ? infoGroup?.subject : "";
            const sender = chat ? key.participant : from;
            const params = body ? body.trim().split(" ").slice(1) : [];
            const participants = chat ? infoGroup?.participants : null;
            const listOfAdmins = chat ? participants?.map(({ admin, id }) => admin && id || { id }) : false;
            const prefix = body.startsWith(".") ? "." : false;
            const whacmd = prefix  ? body.slice(1).trim().split(" ").shift().toLowerCase() : false;
            
            const sendMsgWithPresence = async (chat, msg, quoted) => new Promise(async (resolve, reject) => (await wpp.sendPresenceUpdate('composing', chat), await delay(1500), await wpp.sendMessage(chat, msg, quoted).then(async (obj) => (await wpp.sendPresenceUpdate('paused', chat), resolve(obj))).catch(err => reject({ err, message: msg }))));
            const _contextInfoWithADR = { contextInfo: { externalAdReply: { title: "Elba Hernandes (@elba.hernandes)", mediaType: 1, body: "", previewType: 1, showAdAttribution: true, renderLargerThumbnail: false, thumbnail: fs.readFileSync("OIP.jpeg"), sourceUrl: "https://www.instagram.com/elba.hernandes/" } } };
            
            var Udata = database(["form", sender]).get();
            var U_cmd
            if (Udata?.ask && Udata.options[body] !== undefined) (U_cmd = Udata.command, database(["form", sender], (["agenda_1", "marcar_1"].includes(Udata.command) ? { ...Udata, ask: false, id: Udata.options[body] } : { ...Udata, ask: false, select: Udata.options[body] })).add());

            console.log('\x1b[1;31m~\x1b[1;37m>', (whacmd ? '[\x1b[1;32mEXEC\x1b[1;37m]' : '[\x1b[1;31mRECV\x1b[1;37m]'), timedat, `\x1b[32;4m${whacmd ? whacmd : body || (type ? String(type).slice(0, -7) : 'baileys')}\x1b[0m`, `\x1b[1;31mfrom\x1b[0m`, `\x1b[32;4m${pushName.toString() || sender}\x1b[0m`, `\x1b[1;31min\x1b[0m`, `\x1b[32;4m${chat ? (groupName || 'desconhecido...') : from}\x1b[0m`);

            switch (msgType == 'notify' ? (U_cmd ||whacmd) : messages[id].messageSTubTYpe) {
               case "agenda":
               case "marcar":
                  var data = Object.keys(database(["data"]).get());
                  sendMsgWithPresence(from, { ..._contextInfoWithADR, text: `*Digite o número correspondente a opção desejada.*\n\n${data.map((i,r) => `*${r} - ${i}*`).join("\n")}` }).then(() => database(["form", sender], { ask: true, command: whacmd + "_1", options: { ...data.map((i) => i) } }).add());
               break

               case "agenda_1":
                  var secdat = mt.tz("America/Sao_Paulo").format("DD/MM/YY");
                  var select = database(["form", sender]).get().id;
                  var agenda = database(["data", select]).get()[secdat]; if  (!agenda || !agenda[0]) return sendMsgWithPresence(from, { text: "Agenda vazia." });
                  sendMsgWithPresence(from, { ..._contextInfoWithADR, text: `${agenda.map((i) => `*${i.name}*\n*${i.process}*\n*${makeTime(i.start.time, 0)} - ${makeTime(i.end.time, 0)} - ${i.start.zn == i.end.zn ? (i.start.zn == "pm" ? "Tarde" : "Manhã") : (`${i.start.zn == "pm" ? "Tarde" : "Manhã"}:${i.end.zn == "pm" ? "Tarde" : "Manhã"}`)}*`).join("\n\n")}` });
               break

               case "marcar_1":
                  var  sct = database(["form", sender]).get();
                  var data = database(["data", sct.id]).get();
                  sendMsgWithPresence(from, { ..._contextInfoWithADR, text: `*Digite o número correspondente a opção desejada.*\n\n${data.works.map((i,r) => `*${r}*\n*${i.name}*\n*${stringTm(i.time)}*\n*$${i.value}*`).join("\n\n")}` }).then(() => database(["form", sender], { ...sct, ask: true, command: "hour", options: { ...[...Array(data.works.length)].map((i, e) => e) } }).add());
               break

               case "hour":
                  var  sct = database(["form", sender]).get();
                  var data = database(["data", sct.id]).get().works[sct.select];
                  sendMsgWithPresence(from, { ..._contextInfoWithADR, text: `*Agende ${data.name}*\n*Digite:   .agendar + horário (Formato: 00:00) am/pm (manhã/tarde)*\n*Caso o horário esteja reservado será necessário altera-lo.*` });
               break

               case "agendar":
                  var  sct = database(["form", sender]).get();
                  var data = database(["data", sct.id]).get().works[sct.select];
                  if (!params[0]?.match(":")) return sendMsgWithPresence(from, { text: "O horário deve estar neste formato: 00:00" });
                  if (!params[1]?.match(/pm|am/g)) return sendMsgWithPresence(from, { text: "Especificar o turno: am-manhã pm-tarde" });
                  var zone = "pm"
                  var temp = makeTime((params[0].split(":")[0] >= 13 ? ((params[0].split(":")[0] - 12) + ":" + params[0].split(":")[1]) : params[0]), 1);
                  var endw = temp + makeTime(data.time, 1);
                  if (params[1]  ==  "am") {
                     if (makeTime(endw, 0).split(":")[0] >= 13) {
                        endz = makeTime(endw, 0).split(":")[0] >= 13 ? (makeTime(endw, 0).split(":")[0] - 12) + ":" + makeTime(endw, 0).split(":")[1] : makeTime(endw, 0);
                        endw = makeTime(endz, 1);
                     }
                     else {
                        zone = "am"
                     };
                  };
                  var gy = mt.tz("America/Sao_Paulo").format("DD/MM/YY");
                  var sx = {
                     name: pushName,
                     process: data.name,
                     valor: data.value,
                     start: {
                        time: temp,
                        zn: params[1]
                     },
                     end: {
                        time: endw,
                        zn: zone
                     }
                  };
                  var obj = database(["data", sct.id]).get();
                  var vdd = [];
                  if (obj[gy]) {
                      vdd = obj[gy].filter(({ start, end }) => ((start.zn == sx.start.zn && end.zn == sx.end.zn && (start.time < sx.end.time && end.time > sx.start.time)) || (start.zn == sx.start.zn && end.zn == sx.end.zn && start.zn !== sx.end.zn && (end.time < sx.start.time)) || (start.zn !== sx.start.zn && end.zn == sx.start.zn && (sx.start.time < end.time)) || (start.zn == sx.start.zn && end.zn !== sx.end.zn && ((sx.start.time < end.time) || (sx.end.time > start.time))) || (start.zn !== sx.start.zn && end.zn == sx.end.zn && (sx.end.time > start.time))))
                  }
                  else {
                     obj[gy] = [];
                  };
                  if (vdd[0]) return sendMsgWithPresence(from, { text: "Este horário já está reservado, olhe a agenda e tente novamente." });
                  obj[gy].unshift(sx);
                  database(["data", sct.id], obj).add();
                  sendMsgWithPresence(from, { text: "Horário reservado." });
               break

               case "intervalo":
                  if (params.length < 4) return sendMsgWithPresence(from, { text: "Há parâmentros faltando." });
                  if (!params[0].match(":")) return sendMsgWithPresence(from, { text: "Horário em formato incorreto." });
                  if (!params[2].match(":")) return sendMsgWithPresence(from, { text: "Horário em formato incorreto." });
                  var att = {
                     "559984620740@s.whatsapp.net": "Elba Hernandes",
                     "556193377842@s.whatsapp.net": "Elba Hernandes"
                  };
                  var obj = database(["data", att[sender]]).get();
                  var dat = mt.tz("America/Sao_Paulo").format("DD/MM/YY");
                  var jsn = {
                     name: att[sender],
                     process: "Intervalo",
                     start: {
                        time: makeTime((params[0].split(":")[0] >= 13 ? ((params[0].split(":")[0] - 12) + ":" + params[0].split(":")[1]) : params[0]), 1),
                        zn: params[1]
                     },
                     end: {
                        time: makeTime((params[2].split(":")[0] >= 13 ? ((params[2].split(":")[0] - 12) + ":" + params[2].split(":")[1]) : params[2]), 1),
                        zn: params[3]
                     }
                  };
                  obj[dat].unshift(jsn);
                  database(["data", att[sender]], obj).add();
                  sendMsgWithPresence(from, { text: "Horário reservado." });
               break
            };
        }
        catch (err) {
            console.log("Upsert:", err);
        };
     }));

     wpp.ev.on("connection.update",({ connection, lastDisconnect }) => (connection == "close" ? (![401, 500, 440].includes(lastDisconnect.error?.output.statusCode) ? connectOnWhatsApp() : (console.log("Desconectado."), process.exit())) : (connection == "open") ? console.log("Conectado.") : ""));
};
connectOnWhatsApp();