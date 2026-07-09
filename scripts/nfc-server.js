const { NFC } = require('nfc-pcsc');
const WebSocket = require('ws');

// Jalankan WebSocket Server di port 3001
const wss = new WebSocket.Server({ port: 3001 });
console.log('\n=============================================');
console.log('🟢 NFC BRIDGE SERVER MENYALA (PORT 3001)');
console.log('=============================================\n');

const nfc = new NFC();
let activeClients = [];

wss.on('connection', (ws) => {
    console.log('✅ Website SparkStage terhubung ke NFC Reader!');
    activeClients.push(ws);
    
    ws.on('close', () => {
        activeClients = activeClients.filter(c => c !== ws);
        console.log('❌ Website terputus dari NFC Reader.');
    });
});

nfc.on('reader', reader => {
    console.log(`[ALAT TERDETEKSI] ${reader.reader.name}`);
    
    reader.on('card', card => {
        // Ubah UID dari tipe Buffer ke format HEX (misal: E075BC5F)
        let uid = card.uid.toString('hex').toUpperCase();
        // Tambahkan titik dua (:) agar sesuai dengan format E0:75:BC:5F
        uid = uid.match(/.{1,2}/g)?.join(':') || uid;
        
        console.log(`[KOIN DITEMPEL] UID: ${uid}`);
        
        // Kirim UID tersebut ke website kita (Chrome/Edge) secara ghaib!
        activeClients.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'uid', uid: uid }));
            }
        });
    });

    reader.on('card.off', card => {
        // Koin dilepas
    });

    reader.on('error', err => {
        console.log(`[ERROR READER]`, err);
    });
    
    reader.on('end', () => {
        console.log(`[ALAT DICABUT] ${reader.reader.name}`);
    });
});

nfc.on('error', err => {
    console.log('[ERROR SISTEM NFC]', err);
});
