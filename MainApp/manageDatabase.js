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

//**********************************************************************
//
// 10 MINUTES COUNTER TO PUSH DATA TO FIREBASE
// 
//**********************************************************************

const CUSTOMER_NAME = 'ThongGuanLot48';

//**********************************************************************
//
// Placeholder for Firebase Push Key
// 
//**********************************************************************

var pushKey = null;

//**********************************************************************
//
// MANAGE DATA
// 
//**********************************************************************

const manageData = (parentDatabase, connectionStatus, baselineControl, meterData, solarData, systemPerformance) => {
	// Set current status for the system
	meterCurrentStatus(parentDatabase, meterData);
	solarCurrentStatus(parentDatabase, solarData);

	// Log system data every 10 minutes
	if ((counter === 10) && (baselineControl === true)) {
		counter--;
		let meterLogPath = "/PowerMeter/" + CUSTOMER_NAME + "/Baseline/";
		pushMeterData(parentDatabase, connectionStatus, meterLogPath, meterData);
	} else if ((counter === 10) && (baselineControl === false)) {
		counter--;
		let meterLogPath = "/PowerMeter/" + CUSTOMER_NAME + "/Actual/";
		let solarLogPath = "/SolarSystem/" + CUSTOMER_NAME + "/Datalog/";
		pushMeterData(parentDatabase, connectionStatus, meterLogPath, meterData);
		pushSolarData(parentDatabase, connectionStatus, solarLogPath, solarData);
		pushSystemPerformance(parentDatabase, connectionStatus, systemPerformance);
	} else {
		counter === 1 ? (
			console.log(`Countdown: ${counter}`),
			counter = 10
		) : (
			console.log(`Countdown: ${counter}`),
			counter--
		);
	}
	// pushSystemPerformance(parentDatabase, connectionStatus, systemPerformance);
}

//**********************************************************************
//
// SET CURRENT STATUS OF THE METER INTO FIREBASE
//
//**********************************************************************

const meterCurrentStatus = (parentDatabase, meterData) => {
	for (const key of Object.keys(meterData)) {
		let currentStatusPath = "/PowerMeter/" + CUSTOMER_NAME + "/CurrentStatus/";
		let currentStatusRef = parentDatabase.ref(currentStatusPath + key);
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
			let currentStatusPath = "/SolarSystem/" + CUSTOMER_NAME + "/CurrentStatus/Inverter/";
			let currentStatusRef = parentDatabase.ref(currentStatusPath + key);
			currentStatusRef.set(solarData[key]);
		} else if (key.indexOf("SmartLogger") >= 0) {
			let currentStatusPath = "/SolarSystem/" + CUSTOMER_NAME + "/CurrentStatus/";
			let currentStatusRef = parentDatabase.ref(currentStatusPath + key);
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
    
    var solarLogPath = "/SolarSystem/" + CUSTOMER_NAME + "/Datalog/DailyReadings";
    let dailyReadingsRef = parentDatabase.ref(solarLogPath);
	let uniqueKey = dailyReadingsRef.push();
    
	if (connectionStatus === true) {
		if (((minute === 0) && (hour === 0)) || (pushKey === null)) {
			pushKey = uniqueKey;
			pushKey.set(systemPerformance);
		} else {
			pushKey.set(systemPerformance);
		}
	} else {
			let dailyReadingRef = parentDatabase.ref(solarLogPath + "DailyReadings");
			let uniqueKey = dailyReadingRef.push();
			localDatabase[uniqueKey.key] = systemPerformance;
			uniqueKey.set(systemPerformance[key]);
			let offlineData = JSON.stringify(localDatabase, null, 2);
			jsonFile.writeFileSync("offlineData.JSON", offlineData);
	}
}

//**********************************************************************
//
// EXPORT METHODS
//
//**********************************************************************

module.exports.manageData = manageData;
