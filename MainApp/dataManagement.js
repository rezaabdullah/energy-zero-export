//**********************************************************************
//
// Push data to firebase. Additionally, in the event of internet
// disconnection store data locally in JSON file.
//
//**********************************************************************

const jsonFile = require("fs");

//**********************************************************************
//
// 10 MINUTES COUNTER INITIALIZED TO "1" TO PUSH DATA TO FIREBASE
// 
//**********************************************************************

var counter = 1;

//**********************************************************************
//
// LOCAL DATABASE IN THE EVENT OF NO INTERNET CONNECTION
// 
//**********************************************************************

var localDatabase = new Object;

const manageData = (parentDatabase, connectionStatus, baselineControl, meterData, solarData) => {
	// Check internet connection
	if (connectionStatus === true) {
		// Store data
		if ((counter >= 10) && (baselineControl === true)) {
			counter = 0;
			let meterLogPath = "/PowerMeter/ThongGuanLot48/Baseline/";
			pushMeterData(parentDatabase, connectionStatus, meterLogPath, meterData);
		} else if ((counter >= 9) && (baselineControl === false)) {
			counter = 0;
			let meterLogPath = "/PowerMeter/ThongGuanLot48/Actual/";
			let solarLogPath = "/SolarSystem/ThongGuanLot48/Datalog/";
			pushMeterData(parentDatabase, connectionStatus, meterLogPath, meterData);
			pushSolarData(parentDatabase, connectionStatus, solarLogPath, solarData);
		} else {
			console.log(`Countdown to push data ${9 - counter}`);
		}
		
		// Set current status for power meter
		meterCurrentStatus(parentDatabase, meterData);
		solarCurrentStatus(parentDatabase, SolarData);
		
		// Increment counter by 1		
		counter++;
	} else {
		console.log("Pi Offline");
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
				let offlineData = JSON.stringify(localDatabase, null, 2);
				uniqueKey.set(solarData[key]);
				json.writeFileSync("offlineData.JSON", offlineData);
			} else {
				console.log("Cannot read solarData");
			}
		}
	}
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

const solarCurrentStatus = (parentDatabase, SolarData) => {
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
// EXPORT METHODS
//
//**********************************************************************

module.exports.manageData = manageData;