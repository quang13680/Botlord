const login = require("fca-unofficial");
const fs = require("fs");

let db = JSON.parse(fs.readFileSync('database.json', 'utf8'));
function saveData() { fs.writeFileSync('database.json', JSON.stringify(db, null, 2)); }

login({appState: JSON.parse(fs.readFileSync('appstate.json', 'utf8'))}, (err, api) => {
    if(err) return console.error(err);

    api.listenMqtt((err, event) => {
        if (event.type != "message") return;
        const senderID = event.senderID;
        const msg = event.body.toLowerCase();
        
        // Tạo tài khoản nếu chưa có
        if (!db.users[senderID]) {
            db.users[senderID] = { name: "Người chơi", balance: 50000 };
            saveData();
        }

        // Lệnh Admin
        if (msg == "!admin") api.sendMessage("ID của bạn là: " + senderID, event.threadID);
        if (db.admins.includes(senderID)) {
            if (msg == "!share") {
                for (let id in db.users) db.users[id].balance += 18000;
                saveData();
                api.sendMessage("Đã chia 18.000 cho toàn bộ người chơi!", event.threadID);
            }
        }

        // Lệnh Đặt Cược
        if (msg.startsWith("!chan") || msg.startsWith("!le")) {
            const amount = parseInt(msg.split(" ")[1]);
            if (isNaN(amount) || amount < 10000) return api.setMessageReaction("❌", event.messageID);
            
            if (db.users[senderID].balance < amount) {
                api.setMessageReaction("❌", event.messageID);
            } else {
                db.users[senderID].balance -= amount;
                saveData();
                api.setMessageReaction("✅", event.messageID);
                // Ở đây sau này sẽ là logic Random kết quả...
            }
        }

        // Lệnh tiện ích
        if (msg == "!check") api.sendMessage("Số dư của bạn là: " + db.users[senderID].balance.toLocaleString() + " VNĐ", event.threadID);
        if (msg == "!gay" && db.users[senderID].balance < 20000) {
            db.users[senderID].balance += 36000;
            saveData();
            api.sendMessage("Chúc mừng! Bạn đã được cứu trợ 36.000.", event.threadID);
        }
    });
});
