const login = require("fca-horizon-remastered");
const fs = require("fs");

// Kiểm tra và tạo database nếu chưa có
if (!fs.existsSync('database.json')) {
    fs.writeFileSync('database.json', JSON.stringify({ users: {}, admins: ["100043777760301"] }, null, 2));
}

let db = JSON.parse(fs.readFileSync('database.json', 'utf8'));
function saveData() { fs.writeFileSync('database.json', JSON.stringify(db, null, 2)); }

login({appState: JSON.parse(fs.readFileSync('appstate.json', 'utf8'))}, (err, api) => {
    if(err) {
        console.error("Lỗi đăng nhập: ", err);
        return;
    }

    console.log("Bot đã khởi động thành công!");

    api.listenMqtt((err, event) => {
        if (err) return;
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

        // Lệnh Đặt Cược (Chẵn/Lẻ)
        if (msg.startsWith("!chan") || msg.startsWith("!le")) {
            const args = msg.split(" ");
            const amount = parseInt(args[1]);
            const type = msg.startsWith("!chan") ? "chan" : "le";

            if (isNaN(amount) || amount < 10000) {
                return api.sendMessage("❌ Số tiền cược tối thiểu là 10.000!", event.threadID);
            }
            
            if (db.users[senderID].balance < amount) {
                return api.sendMessage("❌ Bạn không đủ số dư!", event.threadID);
            }

            // Logic Random kết quả (0: Chẵn, 1: Lẻ)
            const result = Math.floor(Math.random() * 2);
            const win = (type === "chan" && result === 0) || (type === "le" && result === 1);

            if (win) {
                db.users[senderID].balance += amount; // Thắng thì nhận thêm tiền
                api.sendMessage(`✅ Kết quả: ${result === 0 ? "Chẵn" : "Lẻ"}. Chúc mừng bạn đã thắng!`, event.threadID);
            } else {
                db.users[senderID].balance -= amount; // Thua thì mất tiền
                api.sendMessage(`❌ Kết quả: ${result === 0 ? "Chẵn" : "Lẻ"}. Tiếc quá, bạn đã thua!`, event.threadID);
            }
            saveData();
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
