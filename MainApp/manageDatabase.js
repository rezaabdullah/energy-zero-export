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

var pushKeyDaily = null;
var pushKeyWeekly = null;
var pushKeyMonthly = null;
var pushKeyTotal = null;

//**********************************************************************
//
// MANAGE DATA
// 
//**********************************************************************

const manageData = (parentDatabase, connectionStatus, baselineControl, meterData, solarData, systemPerformance) => {
	// Set current status for the system
	meterCurrentStatus(parentDatabase, meterData);
	solarCurrentStatus(parentDatabase, solarData);
	
	let minute = new Date().getMinutes();
    let hour = new Date().getHours();

	// Log system data every 10 minutes
	if (((minute % 10) === 0) && (baselineControl === true)) {
		counter--;
		let meterLogPath = "/PowerMeter/" + CUSTOMER_NAME + "/Baseline/";
		pushMeterData(parentDatabase, connectionStatus, meterLogPath, meterData);
	} else {
		if (((minute % 10) === 0) && (baselineControl === false)) {
			counter--;
			let meterLogPath = "/PowerMeter/" + CUSTOMER_NAME + "/Actual/";
			let solarLogPath = "/SolarSystem/" + CUSTOMER_NAME + "/Datalog/";
			pushMeterData(parentDatabase, connectionStatus, meterLogPath, meterData);
			pushSolarData(parentDatabase, connectionStatus, solarLogPath, solarData);
			pushSystemPerformance(parentDatabase, connectionStatus, systemPerformance, hour, minute);
		}
	} 
	/*
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
	*/ 
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
/*
const pushSystemPerformance = (parentDatabase, connectionStatus, systemPerformance, hour, minute) => {
	// let minute = new Date().getMinutes();
    // let hour = new Date().getHours();
    
    var solarLogPath = "/SolarSystem/" + CUSTOMER_NAME + "/Datalog/DailyReadings";
    let dailyReadingsRef = parentDatabase.ref(solarLogPath);
	let uniqueKey = dailyReadingsRef.push();
	
	if (connectionStatus === true) {
		if ((minute === 0) && (hour === 1)) {
			pushKey = uniqueKey;
			pushKey.set(systemPerformance);
		} else {
			if (pushKey === null) {
				pushKey = uniqueKey;
				pushKey.set(systemPerformance);
			} else {
				pushKey.set(systemPerformance);
			}
		}
	}
*/
//	AMAR
const pushSystemPerformance = (parentDatabase, connectionStatus, systemPerformance, hour, minute) => {
	let day = new Date().getDay();
	let date = new Date().getDate();

	var solarLogPath = "/SolarSystem/" + CUSTOMER_NAME + "/Datalog/";

	let dailyReadingsRef = parentDatabase.ref(solarLogPath + "DailyReadings");
	let totalReadingsRef = parentDatabase.ref(solarLogPath + "TotalReadings");
	let weeklyReadingsRef = parentDatabase.ref(solarLogPath + "WeeklyReadings");
	let monthlyReadingsRef = parentDatabase.ref(solarLogPath + "MonthlyReadings");

	let uniqueKeyDaily = dailyReadingsRef.push();
	let uniqueKeyWeekly = weeklyReadingsRef.push();
	let uniqueKeyMonthly = monthlyReadingsRef.push();
	let uniqueKeyTotal = totalReadingsRef.push();

	if (connectionStatus === true) {			
		for (const key of Object.keys(systemPerformance)) {
			if (key.indexOf("DailyReadings") >= 0) {
				//if ((minute === 0) && (hour === 1)) {	
				// if ((minute === 50) && (hour === 23)) {
				if ((minute === 0) && (hour === 0)) {
					pushKeyDaily = uniqueKeyDaily;
					pushKeyDaily.set(systemPerformance.DailyReadings);
				} else {
					if (pushKeyDaily === null) {
						pushKeyDaily = uniqueKeyDaily;
						pushKeyDaily.set(systemPerformance.DailyReadings);
					} else {
						pushKeyDaily.set(systemPerformance.DailyReadings);
					}
				}

			} else if (key.indexOf("TotalReadings") >= 0) {
				//pushKeyTotal = uniqueKeyTotal;
				//pushKeyTotal.set(systemPerformance.TotalReadings);
				if (pushKeyTotal === null) {
					pushKeyTotal = uniqueKeyTotal;
					pushKeyTotal.set(systemPerformance.TotalReadings);
				} else {
					pushKeyTotal.set(systemPerformance.TotalReadings);
				}

			} else if (key.indexOf("WeeklyReadings") >= 0) {
				//if ((minute === 0) && (hour === 1) && (day === 0)) {
				// if ((minute === 50) && (hour === 23) && (day === 0)) {
				if ((minute === 0) && (hour === 0) && (day === 0)) {
					pushKeyWeekly = uniqueKeyWeekly;
					pushKeyWeekly.set(systemPerformance.WeeklyReadings);
				} else {
					if (pushKeyWeekly === null) {
						pushKeyWeekly = uniqueKeyWeekly;
						pushKeyWeekly.set(systemPerformance.WeeklyReadings);
					} else {
						pushKeyWeekly.set(systemPerformance.WeeklyReadings);
					}
				}
				
			} else if (key.indexOf("MonthlyReadings") >= 0) {
				//if ((minute === 0) && (hour === 1) && (date === 1)) {
				// if ((minute === 0) && (hour === 0) && (date === 1)) {
				if ((minute === 0) && (hour === 0) && (date === 1)) {
					pushKeyMonthly = uniqueKeyMonthly;
					pushKeyMonthly.set(systemPerformance.MonthlyReadings);
				} else {
					if (pushKeyMonthly === null) {
						pushKeyMonthly = uniqueKeyMonthly;
						pushKeyMonthly.set(systemPerformance.MonthlyReadings);
					} else {
						pushKeyMonthly.set(systemPerformance.MonthlyReadings);
					}
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