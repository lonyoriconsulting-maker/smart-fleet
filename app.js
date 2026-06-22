const sqlite3 = require('sqlite3').verbose();

// 1. Establish Database Connection Safely
const db = new sqlite3.Database('./fleet.db', (err) => {
    if (err) return console.error("❌ Database connection failed:", err.message);
    console.log("💾 Connected to SQLite DB on branch: feature/geofence-monitor");
    initializeDatabaseStructure();
});

// 2. Ensure Database Tables Exist
function initializeDatabaseStructure() {
    db.serialize(() => {
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
            if (err) return console.error("❌ Table verification failed:", err.message);
            runGeofenceEngine();
        });
    });
}

// 3. OPERATIONAL BOUNDARIES: Defining the Arusha City Geofence Bounding Box
// In real fleet software, a geofence is defined by latitude and longitude limits.
const ARUSHA_GEOFENCE = {
    minLat: -3.4200, // Southern boundary
    maxLat: -3.3400, // Northern boundary
    minLng: 36.6200, // Western boundary
    maxLng: 36.7500  // Eastern boundary
};

// 4. Simulated Payload: A driver has secretly left Arusha and headed toward Moshi
const incomingLiveStream = {
    plateNumber: "T 123 ABC",
    latitude: -3.3900,  // Stays within North-South limits
    longitude: 36.9500, // OUTSIDE Eastern limit! (Heading into Kilimanjaro region)
    speedKmh: 75.0,
    fuelLevelPercent: 58,
    timestamp: new Date().toISOString()
};

// 5. The Geofence Validation Calculation Engine
function runGeofenceEngine() {
    console.log(`\n📡 Processing Geofence Validation for: ${incomingLiveStream.plateNumber}`);

    const lat = incomingLiveStream.latitude;
    const lng = incomingLiveStream.longitude;

    // Evaluate if coordinates sit inside our Arusha boundary rules
    const isInsideLat = lat >= ARUSHA_GEOFENCE.minLat && lat <= ARUSHA_GEOFENCE.maxLat;
    const isInsideLng = lng >= ARUSHA_GEOFENCE.minLng && lng <= ARUSHA_GEOFENCE.maxLng;

    // ─── HYBRID OPERATIONS ALERT ───
    if (isInsideLat && isInsideLng) {
        console.log(`✅ Safe Zone: Truck ${incomingLiveStream.plateNumber} is operating within Arusha limits.`);
    } else {
        console.log(`🚨 OPERATIONAL ALERT: GEOFENCE VIOLATION DETECTED!`);
        console.log(`   Truck ${incomingLiveStream.plateNumber} has unauthorized exit from Arusha boundaries!`);
        console.log(`   Current Coordinates: Lat ${lat}, Lng ${lng}. Notify fleet supervisor immediately.`);
    }

    // Save Log Data
    const sqlQuery = `INSERT INTO telemetry_logs (plate_number, latitude, longitude, speed_kmh, fuel_level_percent, recorded_at) VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.run(sqlQuery, [incomingLiveStream.plateNumber, lat, lng, incomingLiveStream.speedKmh, incomingLiveStream.fuelLevelPercent, incomingLiveStream.timestamp], function(err) {
        if (err) return console.error("❌ Database Entry Error:", err.message);
        console.log(`💾 DATA LOGGED: Boundary tracking event saved to row ID ${this.lastID}.`);
        printLogs();
    });
}

function printLogs() {
    db.all(`SELECT * FROM telemetry_logs ORDER BY id DESC LIMIT 1`, [], (err, rows) => {
        if (err) throw err;
        console.log("\n📊 LATEST STORED TELEMETRY LOG:");
        console.log(rows);
        db.close();
    });
}
