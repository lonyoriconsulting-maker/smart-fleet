const sqlite3 = require('sqlite3').verbose();

// 1. Establish Database Connection Safely
const db = new sqlite3.Database('./fleet.db', (err) => {
    if (err) return console.error("❌ Database connection failed:", err.message);
 feature/unified-fleet-engine
    console.log("💾 Connected to SQLite DB on branch: feature/unified-fleet-engine");
    initializeDatabaseStructure();
});

// 2. Enforce Database Setup

    console.log("💾 Connected to SQLite DB on branch: feature/geofence-monitor");
    initializeDatabaseStructure();
});

// 2. Ensure Database Tables Exist
feature/ingestion-engine
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
          feature/unified-fleet-engine
            runMasterFleetEngine();
        });
    });
}

// 3. OPERATIONAL RULES & PERIMETERS
const CONSTANTS = {
    SPEED_LIMIT_KMH: 80, // Tanzanian legal limit for heavy commercial vehicles
    ARUSHA_GEOFENCE: {
        minLat: -3.4200, maxLat: -3.3400,
        minLng: 36.6200, maxLng: 36.7500
    }
};

// Previous state tracker to check for fuel siphoning
const lastKnownFuelState = { plateNumber: "T 123 ABC", fuelLevelPercent: 74 };

// 4. Simulated Live Stream: An array containing logs from two separate trucks
const incomingLiveStream = [
    {
        plateNumber: "T 123 ABC",
        latitude: -3.3731, 
        longitude: 36.6853,
        speedKmh: 85.5,      // ⚠️ Problem 1: Speeding!
        fuelLevelPercent: 62, // ⚠️ Problem 2: Siphoning (dropped from 74% to 62% while parked earlier)
        timestamp: new Date().toISOString()
    },
    {
        plateNumber: "T 456 XYZ",
        latitude: -3.3900, 
        longitude: 36.9500,  // ⚠️ Problem 3: Out of Arusha geofence limits!
        speedKmh: 65.0,      // Safe speed
        fuelLevelPercent: 90, // Safe fuel
        timestamp: new Date().toISOString()
    }
];

// 5. The Master Multi-Hat Processing Engine
function runMasterFleetEngine() {
    console.log(`\n🚀 STARTING UNIFIED TELEMATICS SCAN ENGINE...`);

    incomingLiveStream.forEach((truck) => {
        console.log(`\n─────────────────────────────────────────────`);
        console.log(`📡 Processing Logs for Vehicle: ${truck.plateNumber}`);

        // MODULE A: THE SPEED INSPECTOR (ICT + Logistics Hat)
        if (truck.speedKmh > CONSTANTS.SPEED_LIMIT_KMH) {
            console.log(`⚠️ SPEED VIOLATION: Truck is speeding at ${truck.speedKmh} km/h! (Limit: ${CONSTANTS.SPEED_LIMIT_KMH} km/h)`);
        } else {
            console.log(`✅ Speed Check: Normal operating parameters.`);
        }

        // MODULE B: THE FUEL THEFT DETECTOR
        if (truck.plateNumber === lastKnownFuelState.plateNumber) {
            const fuelLoss = lastKnownFuelState.fuelLevelPercent - truck.fuelLevelPercent;
            // If vehicle lost significant fuel while stationary (or over a rapid burst)
            if (truck.speedKmh > 0 && fuelLoss >= 5) {
                console.log(`🚨 FUEL ALERT: Rapid drop of ${fuelLoss}% detected. Check for high consumption or leaks.`);
            } else if (truck.speedKmh === 0 && fuelLoss >= 5) {
                console.log(`🚨 CRITICAL EMERGENCY: Suspected active FUEL THEFT! Lost ${fuelLoss}% while parked.`);
            }
        }

        // MODULE C: THE GEOFENCE MONITOR
        const isInsideLat = truck.latitude >= CONSTANTS.ARUSHA_GEOFENCE.minLat && truck.latitude <= CONSTANTS.ARUSHA_GEOFENCE.maxLat;
        const isInsideLng = truck.longitude >= CONSTANTS.ARUSHA_GEOFENCE.minLng && truck.longitude <= CONSTANTS.ARUSHA_GEOFENCE.maxLng;

        if (!isInsideLat || !isInsideLng) {
            console.log(`🚨 GEOFENCE VIOLATION: Vehicle has left authorized Arusha boundaries! Current coordinates: (${truck.latitude}, ${truck.longitude})`);
        } else {
            console.log(`✅ Geofence Check: Inside authorized operating zone.`);
        }

        // Save entry to local database logs file
        const sqlQuery = `INSERT INTO telemetry_logs (plate_number, latitude, longitude, speed_kmh, fuel_level_percent, recorded_at) VALUES (?, ?, ?, ?, ?, ?)`;
        db.run(sqlQuery, [truck.plateNumber, truck.latitude, truck.longitude, truck.speedKmh, truck.fuelLevelPercent, truck.timestamp], function(err) {
            if (err) console.error("❌ SQL Storage Error:", err.message);
        });

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
feature/ingestion-engine
    });

    // Short timeout to let database commands finish before reading results out loud
    setTimeout(printAllUnifiedLogs, 500);
}

feature/unified-fleet-engine
function printAllUnifiedLogs() {
    db.all(`SELECT * FROM telemetry_logs ORDER BY id DESC LIMIT 2`, [], (err, rows) => {
        if (err) throw err;
        console.log(`\n📊 UNIFIED ENGINE DATABASE LOG ENTRIES SUCCESSFULLY SAVED:`);
function printLogs() {
    db.all(`SELECT * FROM telemetry_logs ORDER BY id DESC LIMIT 1`, [], (err, rows) => {
        if (err) throw err;
        console.log("\n📊 LATEST STORED TELEMETRY LOG:");
feature/ingestion-engine
        console.log(rows);
        db.close();
    });
}
