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
	if ((counter === 0) && (baselineControl === true)) {
		counter = 0;
		let meterLogPath = "/PowerMeter/ThongGuanLot48/Baseline/";
		pushMeterData(parentDatabase, connectionStatus, meterLogPath, meterData);
	} else if ((counter === 0) && (baselineControl === false)) {
		counter = 0;
		let meterLogPath = "/PowerMeter/ThongGuanLot48/Actual/";
		let solarLogPath = "/SolarSystem/ThongGuanLot48/Datalog/";
		pushMeterData(parentDatabase, connectionStatus, meterLogPath, meterData);
		pushSolarData(parentDatabase, connectionStatus, solarLogPath, solarData);
		pushSystemPerformance(parentDatabase, connectionStatus, solarLogPath, systemPerformance);
	} else {
		console.log(`Countdown to push data ${counter}`);
	}	

	// Decrement counter by 1		
	counter--;
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
			console.log("I'm lost");
		}
	}
}

//**********************************************************************
//
// PUSH METER DATA TO FIREBASE
//
//**********************************************************************

const pushMeterData = (parentDatabase, connectionStatus, logPath, meterData) => {
	let pathRef = parentDatabase.ref(logPath + key);
	let uniqueKey = pathRef.push();
	if (connectionStatus === true) {
		for (const key of Object.keys(meterData)) {
			uniqueKey.set(meterData[key]);
		}
	} else {
		for (const key of Object.keys(meterData)) {
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
				// let offlineData = JSON.stringify(localDatabase, null, 2);
				// uniqueKey.set(solarData[key]);
				// json.writeFileSync("offlineData.JSON", offlineData);
			} else {
				console.log("Cannot read solarData");
			}
		}
	}
}

//**********************************************************************
//
// PUSH DAILY SYSTEM PERFORMANCE DATA TO FIREBASE
//
//**********************************************************************

const pushSystemPerformance = (parentDatabase, connectionStatus, solarLogPath, systemPerformance) => {
	let dailyReadingRef = parentDatabase.ref(solarLogPath + "DailyReadings");
	let uniqueKey = dailyReadingRef.push();
	if (connectionStatus === true) {
		uniqueKey.set(systemPerformance);
	} else {
		localDatabase.DailyReadings[uniqueKey.key] = systemPerformance;
		let offlineData = JSON.stringify(localDatabase, null, 2);
		json.writeFileSync("offlineData.JSON", offlineData);
	}
}

//**********************************************************************
//
// EXPORT METHODS
//
//**********************************************************************

module.exports.manageData = manageData;
