const sqlite3 = require('sqlite3').verbose();

// 1. Establish database connection to a local file cabinet called 'fleet.db'
const db = new sqlite3.Database('./fleet.db', (err) => {
    if (err) return console.error("❌ Database connection failed:", err.message);
    console.log("💾 SUCCESS: Connected to local SQLite DB inside WSL.");
});

// 2. Build our database structure
db.serialize(() => {
    // Create vehicle database table
    db.run(`
        CREATE TABLE IF NOT EXISTS vehicles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plate_number TEXT UNIQUE,
            driver_name TEXT,
            status TEXT DEFAULT 'active'
        )
    `);

    // Create live GPS tracking database table
    db.run(`
        CREATE TABLE IF NOT EXISTS telemetry_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plate_number TEXT,
            latitude REAL,
            longitude REAL,
            speed_kmh REAL,
            fuel_level_percent INTEGER,
            recorded_at TEXT
        )
    `);

    // Pre-populate our inventory with one test truck in Arusha
    db.run(`INSERT OR IGNORE INTO vehicles (plate_number, driver_name) VALUES ('T 123 ABC', 'John Doe')`);
});

// 3. Simulate a raw data packet coming from a tracker in Arusha
const incomingGpsStream = {
    plateNumber: "T 123 ABC",
    latitude: -3.3731, 
    longitude: 36.6853,
    speedKmh: 85.5, // Tanzanian truck legal speed limit is 80 km/h
    fuelLevelPercent: 74,
    timestamp: new Date().toISOString()
};

// 4. Processing Core Engine (Your Hybrid Tech/Logistics Hat)
function processIncomingData(data) {
    console.log(`\n📡 Live Packet Received for Truck: ${data.plateNumber}`);

    // LOGISTICS RULE: Speed Threshold Violation Alert
    if (data.speedKmh > 80) {
        console.log(`⚠️ OPERATIONAL ALERT: Truck ${data.plateNumber} is SPEEDING at ${data.speedKmh} km/h!`);
    }

    // ICT RULE: Log data cleanly into the file cabinet database
    const sqlQuery = `INSERT INTO telemetry_logs (plate_number, latitude, longitude, speed_kmh, fuel_level_percent, recorded_at) VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.run(sqlQuery, [data.plateNumber, data.latitude, data.longitude, data.speedKmh, data.fuelLevelPercent, data.timestamp], function(err) {
        if (err) return console.error("❌ SQL Insert Error:", err.message);
        console.log(`💾 DATA LOGGED: Telemetry saved to row ID ${this.lastID}.`);
        printSavedRecords();
    });
}

// 5. Read from our database to verify it saved perfectly
function printSavedRecords() {
    db.all(`SELECT * FROM telemetry_logs`, [], (err, rows) => {
        if (err) throw err;
        console.log("\n查看 📊 STORED DATABASE ENTRIES:");
        console.log(rows);
        db.close(); // Safely shut down database connection
    });
}

// Execute the application
processIncomingData(incomingGpsStream);
