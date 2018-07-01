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

var counter = 1;

//**********************************************************************
//
// LOCAL DATABASE IN THE EVENT OF NO INTERNET CONNECTION
// 
//**********************************************************************

var localDatabase = new Object;

//**********************************************************************
//
// STORE MAXIMUM VALUE OF SOLAR PARAMETERS
// 
//**********************************************************************

var systemPerformanceData = {
	dailyMaxAmbientTemp: null,	// DONE
	dailyMaxSolarTemp: null,	// DONE
	dailyMaxIrradiance: null,	// DONE
	dailyAccIrradiance: null,	// DONE
	dailyAccYield: null,		// DONE
	dailyMaxIntake: null,		// DONE
	dailyMaxDemand: null,		// DONE
	dailyAvgSolarOutput: null, 	// DONE
	dailyMaxSolarOutput: null,	// DONE
	dailyAccBuildingLoad: null	// DONE
	// dailyPerformanceRatio: null,// NEED MORE INFO
	// dailyEnergySavings: null,	// NEED MORE INFO
	// weeklyAccBuildingLoad: null,// DONE
	// monthlyAccBuildingLoad: null,//DONE
	// monthlyMaxDemand: null,		// DONE
	// monthlyAccYield: null,		// DONE
	// monthlyAccIrradiance: null,	// DONE
	// monthlyPerformanceRatio: null,// NEED MORE INFO	
	// monthlyEnergySavings: null	// NEED MORE INFO
};

//**********************************************************************
//
// NUMBER OF DATA SAMPLE IN A DAY WITH A 10 MINUTE INTERVAL
// 
//**********************************************************************

const NUMBER_OF_DAILY_SAMPLE = 72;

//**********************************************************************
//
// MAXIMUM DEMAND IN EVERY 30 MINUTE
// 
//**********************************************************************

var maxDemand = null;
var initialActiveEnergy = null;

const manageData = (parentDatabase, connectionStatus, baselineControl, meterData, solarData) => {
	if ((counter >= 10) && (baselineControl === true)) {
		counter = 0;
		let meterLogPath = "/PowerMeter/ThongGuanLot48/Baseline/";
		pushMeterData(parentDatabase, connectionStatus, meterLogPath, meterData);
	} else if ((counter >= 10) && (baselineControl === false)) {
		counter = 0;
		let meterLogPath = "/PowerMeter/ThongGuanLot48/Actual/";
		let solarLogPath = "/SolarSystem/ThongGuanLot48/Datalog/";
		pushMeterData(parentDatabase, connectionStatus, meterLogPath, meterData);
		pushSolarData(parentDatabase, connectionStatus, solarLogPath, solarData);
	} else {
		console.log(`Countdown to push data ${10 - counter}`);
	}
	
	// Set current status for power meter
	meterCurrentStatus(parentDatabase, meterData);
	solarCurrentStatus(parentDatabase, solarData);
	
	// Push system performance data
	pushSystemPerformance(parentDatabase, connectionStatus, meterData.Meter1, solarData.SmartLogger);

	// Increment counter by 1		
	counter++;
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
// PUSH SYSTEM PERFORMANCE DATA TO FIREBASE
//
//**********************************************************************

const pushSystemPerformance = (parentDatabase, connectionStatus, meterData, smartloggerData) => {
	if (connectionStatus === true) {
		// 
		let date = new Date();
		let hours = date.getHours();
		let days = date.getDay();
		let month = date.getMonth();
		if ((date.getHours() === 0) && (date.getMinutes() === 0)) {
			let dailyDataRef = parentDatabase.ref("/SolarSystem/ThongGuanLot48/DailyStatus/");
			dailyDataRef.push(systemPerformanceData);
			systemPerformanceData = {
				dailyMaxAmbientTemp: null,	// DONE
				dailyMaxSolarTemp: null,	// DONE
				dailyMaxIrradiance: null,	// DONE
				dailyAccIrradiance: null,	// DONE
				dailyAccYield: null,		// DONE
				dailyMaxIntake: null,		// DONE
				dailyMaxDemand: null,		// DONE
				dailyAvgSolarOutput: null, 	// DONE
				dailyMaxSolarOutput: null,	// DONE
				dailyAccBuildingLoad: null	// DONE
				// dailyPerformanceRatio: null,// NEED MORE INFO
				// dailyEnergySavings: null,	// NEED MORE INFO
				// weeklyAccBuildingLoad: null,// DONE
				// monthlyAccBuildingLoad: null,//DONE
				// monthlyMaxDemand: null,		// DONE
				// monthlyAccYield: null,		// DONE
				// monthlyAccIrradiance: null,	// DONE
				// monthlyPerformanceRatio: null,// NEED MORE INFO	
				// monthlyEnergySavings: null	// NEED MORE INFO
			};
			console.log("Push data and then clear systemPerformanceData");
		} else {
			console.log("Nothing to push", hours);
		}
		
		// Max. ambient temperature
		if ((systemPerformanceData.dailyMaxAmbientTemp === null) || (systemPerformanceData.dailyMaxAmbientTemp < smartloggerData.ambientTemp)) {
			systemPerformanceData.dailyMaxAmbientTemp = smartloggerData.ambientTemp;
		} else {
			console.log(`Max. Ambient Temp not changed: ${systemPerformanceData.dailyMaxAmbientTemp}`);
		}

		// Max. module temperature
		if ((systemPerformanceData.dailyMaxSolarTemp === null) || (systemPerformanceData.dailyMaxSolarTemp < smartloggerData.moduleTemp)) {
			systemPerformanceData.dailyMaxSolarTemp = smartloggerData.moduleTemp;
		} else {
			console.log(`Max. Module Temp not changed: ${systemPerformanceData.dailyMaxSolarTemp}`);
		}
		
		// Max. Irradiance
		if ((systemPerformanceData.dailyMaxIrradiance === null) || (systemPerformanceData.dailyMaxIrradiance < smartloggerData.IRRsensor)) {
			systemPerformanceData.dailyMaxIrradiance = smartloggerData.IRRsensor;
		} else {
			console.log(`Max. Irradiance not changed: ${systemPerformanceData.dailyMaxIrradiance}`);
		}
		
		// Max. Power Intake
		if ((systemPerformanceData.dailyMaxIntake === null) || (systemPerformanceData.dailyMaxIntake < meterData.intakeTNB)) {
			systemPerformanceData.dailyMaxIntake = meterData.intakeTNB;
		} else {
			console.log(`Max. Power Intake not changed: ${systemPerformanceData.dailyMaxIntake}`);
		}
		
		// Max. Solar output
		if ((systemPerformanceData.dailyMaxSolarOutput === null) || (systemPerformanceData.dailyMaxSolarOutput < smartloggerData.totalPVacPower)) {
			systemPerformanceData.dailyMaxSolarOutput = smartloggerData.totalPVacPower;
		} else {
			console.log(`Max. Solar Output not changed: ${systemPerformanceData.dailyMaxSolarOutput}`);
		}
		
		// Daily accumulated Irradiance
		systemPerformanceData.dailyAccIrradiance += smartloggerData.IRRsensor;
		
		// Daily accumulated yield
		systemPerformanceData.dailyAccYield += smartloggerData.totalPVacPower;
		
		// Daily average yield
		systemPerformanceData.dailyAvgSolarOutput = systemPerformanceData.dailyAccYield / NUMBER_OF_DAILY_SAMPLE;
		
		// Daily accumulated building load
		systemPerformanceData.dailyAccBuildingLoad += smartloggerData.totalBuildingLoad;
		
		// Daily Maximum demand
		if (((date.getMinutes() === 0) || (date.getMinutes() === 30)) && (initialActiveEnergy === null)) {
			initialActiveEnergy = meterData.activeEnergy;
			console.log("initialEnergy:", initialActiveEnergy);			
		} else if (((date.getMinutes() === 29) || (date.getMinutes() === 59)) && (initialActiveEnergy != null)) {
			maxDemand = (meterData.activeEnergy - initialActiveEnergy) / 0.5;
			initialActiveEnergy = meterData.activeEnergy;
			if (maxDemand > systemPerformanceData.dailyMaxDemand) {
				systemPerformanceData.dailyMaxDemand = maxDemand;
			} else {
				console.log("Max Demand not changed");
			}
			console.log("maxDemand:", maxDemand);
		} else {
			console.log("Insufficient time");
		}
		
		console.log(systemPerformanceData);
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
// EXPORT METHODS
//
//**********************************************************************

module.exports.manageData = manageData;
