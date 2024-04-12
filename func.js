const fsr = require("node:fs");
const makeTime = (char, typ) => (char = String(char), [horas, minutos] = char.split(":").map(Number), tim = (char.match(":") ? (horas * 60 + minutos) : horas), (typ ? tim : `${Math.floor(tim / 60)}:${(tim % 60).toString().padStart(2, "0")}`));

const random = (number) => [...Array(number)].map((i) => Array.from("0987654321zxcvbnmlkjhgfdsapoiuytrewq1234567890")[Math.floor(Math.random() * 45)]).join("");

const database = ([key, obj], object)  =>  {
    const read = JSON.parse(fsr.readFileSync("pollUpdates.json"));
    return {
        add: () => {
            if (!read[key]) read[key]  = {};
            ;               read[key][obj] = object;
            fsr.writeFileSync("pollUpdates.json", JSON.stringify(read, null, 2));
        },
        del: () => {
            if    (!read[key][obj])  return;
            delete  read[key][obj];
            fsr.writeFileSync("pollUpdates.json", JSON.stringify(read, null, 2));
        },
        get: () => (obj ? read[key][obj] :read[key])
};
};

const stringTm = (str) => str.match(":") ? ([x, y]= str.split(":"), (x == 1 ? (y == "00" ? `${x} Hora` : `${x} Hora, ${y} Minutos`) : (y == "00" ? `${x} Horas` : `${x} Horas, ${y} Minutos`))) : `${str} Minutos`
                 
module.exports = { makeTime, database ,stringTm };