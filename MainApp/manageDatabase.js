//**********************************************************************
//
// Push data to firebase. Additionally, in the event of internet
// disconnection store data locally in JSON file.
//
//**********************************************************************

const jsonFile = require("fs");

//**********************************************************************
//
// 10 MINUTES COUNTER TO PUSH DATA TO FIREBASE
// 
//**********************************************************************

var counter = 10;

//**********************************************************************
//
// LOCAL DATABASE IN THE EVENT OF NO INTERNET CONNECTION
// 
//**********************************************************************

var localDatabase = new Object;

const manageData = (parentDatabase, connectionStatus, baselineControl, meterData, solarData, systemPerformance) => {
	// Set current status for the system
	meterCurrentStatus(parentDatabase, meterData);
	solarCurrentStatus(parentDatabase, solarData);

	// Log system data every 10 minutes
	if ((counter === 10) && (baselineControl === true)) {
		counter--;
		let meterLogPath = "/PowerMeter/ThongGuanLot48/Baseline/";
		pushMeterData(parentDatabase, connectionStatus, meterLogPath, meterData);
	} else if ((counter === 10) && (baselineControl === false)) {
		counter--;
		let meterLogPath = "/PowerMeter/ThongGuanLot48/Actual/";
		let solarLogPath = "/SolarSystem/ThongGuanLot48/Datalog/";
		pushMeterData(parentDatabase, connectionStatus, meterLogPath, meterData);
		pushSolarData(parentDatabase, connectionStatus, solarLogPath, solarData);
	} else {
		counter === 1 ? (
			console.log(`Countdown: ${counter}`),
			counter = 10
		) : (
			console.log(`Countdown: ${counter}`),
			counter--
		);
	}
	pushSystemPerformance(parentDatabase, connectionStatus, systemPerformance);
}

//**********************************************************************
//
// SET CURRENT STATUS OF THE METER INTO FIREBASE
//
//**********************************************************************

const meterCurrentStatus = (parentDatabase, meterData) => {
	for (const key of Object.keys(meterData)) {
		let currentStatusRef = parentDatabase.ref("/PowerMeter/ThongGuanLot48/CurrentStatus/" + key);
		currentStatusRef.set(meterData[key]);
	};
}

//**********************************************************************
//
// SET CURRENT STATUS OF THE SOLAR SYSTEM INTO FIREBASE
//
//**********************************************************************

const solarCurrentStatus = (parentDatabase, solarData) => {
	for (const key of Object.keys(solarData)) {
		if (key.indexOf("inverter") >= 0) {
			let currentStatusRef = parentDatabase.ref("/SolarSystem/ThongGuanLot48/CurrentStatus/Inverter/" + key);
			currentStatusRef.set(solarData[key]);
		} else if (key.indexOf("SmartLogger") >= 0) {
			let currentStatusRef = parentDatabase.ref("/SolarSystem/ThongGuanLot48/CurrentStatus/" + key);
			currentStatusRef.set(solarData[key]);
		} else {
			console.log("DeviceID is undefined");
		}
	}
}

//**********************************************************************
//
// PUSH METER DATA TO FIREBASE
//
//**********************************************************************

const pushMeterData = (parentDatabase, connectionStatus, logPath, meterData) => {
	if (connectionStatus === true) {
		for (const key of Object.keys(meterData)) {
			let pathRef = parentDatabase.ref(logPath + key);
			let uniqueKey = pathRef.push();
			uniqueKey.set(meterData[key]);
		}
	} else {
		for (const key of Object.keys(meterData)) {
			let pathRef = parentDatabase.ref(logPath + key);
			let uniqueKey = pathRef.push();
			localDatabase[uniqueKey.key] = meterData[key];
			uniqueKey.set(meterData[key]);
		}
	}
}

//**********************************************************************
//
// PUSH SOLAR DATA TO FIREBASE
//
//**********************************************************************

const pushSolarData = (parentDatabase, connectionStatus, solarLogPath, solarData) => {
	if (connectionStatus === true) {
		for (const key of Object.keys(solarData)) {
			if (key.indexOf("inverter") >= 0) {
				let actualRef = parentDatabase.ref(solarLogPath + "Inverter/" + key);
				let uniqueKey = actualRef.push();
				uniqueKey.set(solarData[key]);
			} else if (key.indexOf("SmartLogger") >= 0) {
				let actualRef = parentDatabase.ref(solarLogPath + key);
				let uniqueKey = actualRef.push();
				uniqueKey.set(solarData[key]);
			} else {
				console.log("Cannot read solarData");
			}
		}
	} else {
		for (const key of Object.keys(solarData)) {
			if (key.indexOf("inverter") >= 0) {
				let actualRef = parentDatabase.ref(solarLogPath + "Inverter/" + key);
				let uniqueKey = actualRef.push();
				localDatabase[uniqueKey.key] = solarData[key];
				uniqueKey.set(solarData[key]);
			} else if (key.indexOf("SmartLogger") >= 0) {
				let actualRef = parentDatabase.ref(solarLogPath + key);
				let uniqueKey = actualRef.push();
				localDatabase[uniqueKey.key] = solarData[key];
			} else {
				console.log("Cannot read solarData");
			}
		}
	}
}

//**********************************************************************
//
// PUSH SYSTEM PERFORMANCE DATA TO FIREBASE
//
//**********************************************************************

const pushSystemPerformance = (parentDatabase, connectionStatus, systemPerformance) => {
	let minute = new Date().getMinutes();
    let hour = new Date().getHours();
    let day = new Date().getDay();
    let date = new Date().getDate();
    
    let solarLogPath = "/SolarSystem/ThongGuanLot48/Datalog/";
    
	if (connectionStatus === true) {			
		for (const key of Object.keys(systemPerformance)) {
			if (key.indexOf("DailyReadings") >= 0) {
				if ((minute === 59) && (hour === 23)) {	
					let dailyReadingRef = parentDatabase.ref(solarLogPath + "DailyReadings");
					let uniqueKey = dailyReadingRef.push();
					uniqueKey.set(systemPerformance[key]);
				}
			} else if (key.indexOf("WeeklyReadings") >= 0) {
				if ((minute === 59) && (hour === 23) && (day === 6)) {
					let dailyReadingRef = parentDatabase.ref(solarLogPath + "WeeklyReadings");
					let uniqueKey = dailyReadingRef.push();
					uniqueKey.set(systemPerformance[key]);
				}
			} else if (key.indexOf("MonthlyReadings") >= 0) {
				if ((minute === 59) && (hour === 0) && (date === 1)) {
					let dailyReadingRef = parentDatabase.ref(solarLogPath + "MonthlyReadings");
					let uniqueKey = dailyReadingRef.push();
					uniqueKey.set(systemPerformance[key]);
				}
			} else {
				console.log("invalid systemPerformance");
			}
		}
	} else {
		for (const key of Object.keys(systemPerformance)) {
			if (key.indexOf("DailyReadings") >= 0) {
				if ((minute === 59) && (hour === 23)) {
					let dailyReadingRef = parentDatabase.ref(solarLogPath + "DailyReadings");
					let uniqueKey = dailyReadingRef.push();
					localDatabase[uniqueKey.key] = systemPerformance[key];
					uniqueKey.set(systemPerformance[key]);
					// Write to local database 
					localDatabase.DailyReadings[uniqueKey.key] = systemPerformance;
					let offlineData = JSON.stringify(localDatabase, null, 2);
					jsonFile.writeFileSync("offlineData.JSON", offlineData);
				}
			} else if (key.indexOf("WeeklyReadings") >= 0) {
				if ((minute === 59) && (hour === 23) && (day === 6)) {
					let dailyReadingRef = parentDatabase.ref(solarLogPath + "WeeklyReadings");
					let uniqueKey = dailyReadingRef.push();
					localDatabase[uniqueKey.key] = systemPerformance[key];
					uniqueKey.set(systemPerformance[key]);
					// Write to local database 
					localDatabase.DailyReadings[uniqueKey.key] = systemPerformance;
					let offlineData = JSON.stringify(localDatabase, null, 2);
					jsonFile.writeFileSync("offlineData.JSON", offlineData);
				}
			} else if (key.indexOf("MonthlyReadings") >= 0) {
				if ((minute === 59) && (hour === 0) && (date === 1)) {
					let dailyReadingRef = parentDatabase.ref(solarLogPath + "MonthlyReadings");
					let uniqueKey = dailyReadingRef.push();
					localDatabase[uniqueKey.key] = systemPerformance[key];
					uniqueKey.set(systemPerformance[key]);
					// Write to local database 
					localDatabase.DailyReadings[uniqueKey.key] = systemPerformance;
					let offlineData = JSON.stringify(localDatabase, null, 2);
					jsonFile.writeFileSync("offlineData.JSON", offlineData);
				}
				
			} else {
				console.log("invalid systemPerformance");
			}
		}			
	}
}

//**********************************************************************
//
// EXPORT METHODS
//
//**********************************************************************

module.exports.manageData = manageData;
