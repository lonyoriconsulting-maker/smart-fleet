const sqlite3 = require('sqlite3').verbose();

// 1. Establish Database Connection Safely
const db = new sqlite3.Database('./fleet.db', (err) => {
    if (err) return console.error("❌ Database connection failed:", err.message);
    console.log("💾 Connected to SQLite DB on branch: feature/fuel-theft-detector");
    
    // Trigger database initialization after we successfully connect
    initializeDatabaseStructure();
});

// 2. Initialize and enforce database structure first
function initializeDatabaseStructure() {
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS vehicles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                plate_number TEXT UNIQUE,
                driver_name TEXT,
                status TEXT DEFAULT 'active'
            )
        `);

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
        `, (err) => {
            if (err) return console.error("❌ Table creation failed:", err.message);
            
            // Database setup is now verified and ready! Run the calculations safely.
            executeFleetCalculations();
        });
    });
}

// 3. Operational Data Variables
const lastKnownFuelState = {
    plateNumber: "T 123 ABC",
    fuelLevelPercent: 74,
    timestamp: new Date(Date.now() - 10000).toISOString()
};

const incomingLiveStream = {
    plateNumber: "T 123 ABC",
    latitude: -3.3731, 
    longitude: 36.6853,
    speedKmh: 0, 
    fuelLevelPercent: 62, 
    timestamp: new Date().toISOString()
};

// 4. Hybrid Calculation Engine Execution Function
function executeFleetCalculations() {
    console.log(`\n📡 Analyzing Live Telemetry Stream for Truck: ${incomingLiveStream.plateNumber}`);

    // Operations Check
    const fuelLoss = lastKnownFuelState.fuelLevelPercent - incomingLiveStream.fuelLevelPercent;

    if (incomingLiveStream.speedKmh === 0 && fuelLoss >= 5) {
        console.log(`🚨 OPERATIONAL ALERT: SUSPECTED FUEL THEFT CRITICAL!`);
        console.log(`   Truck ${incomingLiveStream.plateNumber} lost ${fuelLoss}% fuel while stationary inside yard!`);
        console.log(`   Dispatching security protocols immediately...`);
    } else {
        console.log(`⛽ Fuel Burn Status: Consumption rate normal.`);
    }

    // Save Record to Database
    const sqlQuery = `INSERT INTO telemetry_logs (plate_number, latitude, longitude, speed_kmh, fuel_level_percent, recorded_at) VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.run(sqlQuery, [incomingLiveStream.plateNumber, incomingLiveStream.latitude, incomingLiveStream.longitude, incomingLiveStream.speedKmh, incomingLiveStream.fuelLevelPercent, incomingLiveStream.timestamp], function(err) {
        if (err) return console.error("❌ Database Entry Error:", err.message);
        console.log(`💾 DATA LOGGED: Telemetry saved to row ID ${this.lastID}.`);
        printLogs();
    });
}

// 5. Read Database logs
function printLogs() {
    db.all(`SELECT * FROM telemetry_logs ORDER BY id DESC LIMIT 2`, [], (err, rows) => {
        if (err) throw err;
        console.log("\n📊 LAST TWO LOGS IN DATABASE:");
        console.log(rows);
        db.close(); // Close connection cleanly
    });
}
