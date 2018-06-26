//**********************************************************************
//
// Copyright (c) Plus Solar Systems Sdn. Bhd.
// This firmware is used to read and write parameters such as voltage,
// current and power from Huawei Solar Photovoltaic Inverters and
// enables Zero Export function.
//
// Require NPM modules
// 		1. modbus-serial
//		2. firebase
//
//**********************************************************************

//**********************************************************************
//
// NPM Modules
//
//**********************************************************************

var firebase = require("firebase");         // Firebase
var ModbusRTU = require("modbus-serial");   // Modbus Serial

//**********************************************************************
//
// FIREBASE SETUP
//
//**********************************************************************

var config = {
	apiKey: "AIzaSyBpzfNgXNeKz8X0CQBG29W3R8CsXVh8pwI",
    authDomain: "source-57d08.firebaseapp.com",
    databaseURL: "https://source-57d08.firebaseio.com",
    projectId: "source-57d08",
    storageBucket: "source-57d08.appspot.com",
};
firebase.initializeApp(config);
var projectDatabase = firebase.database();

//**********************************************************************
//
// MODBUS RTU TCP/IP: HUAWEI SMARTLOGGER 
//
//**********************************************************************

// !!!!! PAY ATTENTION TO IP ADDRESS !!!!!
var smartLogger = new ModbusRTU();
smartLogger.connectTCP("10.10.0.221", {port: 502});

//**********************************************************************
//
// MODBUS RTU RS-485: DIGITAL POWER METER 
//
//**********************************************************************

var dpm = new ModbusRTU();
dpm.connectRTUBuffered("/dev/ttyAMA0", {baudRate: 9600});

//**********************************************************************
//
// INSTALLED PV SYSTEM 
//
//**********************************************************************

// !!!!! MODIFY THE PV CAPACITY !!!!!
const maxPVoutput = 11040.00;     // Max. capacity of the installed system
const zeroExportLimit = 9936.00;// Zero export ceiling rate
const bufferOutput = 0.10;      // Safety buffer 10%

//**********************************************************************
//
// DIGITAL POWER METER CONFIGURATIONS
//
//**********************************************************************

// !!!!! NEEDS TO BE VERIFIED BY KC !!!!!
const noDpm = 2;                // Number of DPM
const dpmSlaveID = 1;           // DPM slave ID
const dpmPowerRegister_R = 3060;// DPM power register
const dpmEnergyRegister_R = 3204;// DPM energy register
var intakeTNB = [null];         // Total power intake from TNB
var activeEnergyTNB = [null];   // Active energy from TNB
const meterID = [17, 19];       // Meter ID for DPM 1 & 2   

//**********************************************************************
//
// SMARTLOGGER CONFIGURATIONS
//
//**********************************************************************

const smartLoggerSensorsID = 1;         	// Weather station slave ID
const smartLoggerSlaveID = 0;           	// Smartlogger ID
const activePowerRegister_R = 40525;    	// Register (R) for current AC power supply from PV
const weatherStationRegister_R = 40031; 	// Register (R) to read weather data
const activeAdjustmentRegister_RW = 40424;	// Register (RW) for AC power supply from PV
var totalPVacPower = null;              	// Current AC power supply from PV
var activeAdjustment = null;            	// Adjusted power for Zero Export
var windSpeed = null;                   	// Windspeed
var ambientTemp = null;                 	// Ambient temperature
var moduleTemp = null;                  	// PV Module temperature
var IRRsensor = null;                   	// Solar irradiance

//**********************************************************************
//
// INVERTERS CONFIGURATIONS
//
//**********************************************************************

// Number of inverters
// !!!!! CHECK w/ KC !!!!!
var noInv = 27;

// !!!!! CAN WE DO IT NICELY FOR PENFABRIC !!!!!
var inverterIDList = [5, 4, 3, 2, 1, 7, 6, 9, 8, 20, 26, 25, 27, 22, 17,
    16, 19, 23, 18, 24, 21, 10, 14, 15, 13, 12, 11];

const dcPowerRegister_R = 32294;        // Register (R) to read inverter DC power
const acPowerRegister_R = 32290;        // Register (R) to read inverter AC power
const dcParametersRegister_R = 32262;   // Register (R) to read PV string/array DC parameters

var inverterDCpower = null;	            // Inverter DC Power
var inverterACpower = null; 	        // Inverter AC Power
var inverterPV1voltage = null;
var inverterPV1current = null;
var inverterPV2voltage = null;
var inverterPV2current = null;
var inverterPV3voltage = null;
var inverterPV3current = null;
var inverterPV4voltage = null;
var inverterPV4current = null;
var inverterPV5voltage = null;
var inverterPV5current = null;
var inverterPV6voltage = null;
var inverterPV6current = null;

//**********************************************************************
//
// ERROR COUNTER TO HANDLE DATA PACKET LOSS
//
//**********************************************************************

var errorCount = 0;

//**********************************************************************
//
// FIREBASE DATALOG CONTROL
//
//**********************************************************************

var baselineControl = null;
let baselineControlRef = projectDatabase.ref('/Customer/Penfabric/DatalogControl/');
baselineControlRef.once('value').then(function(snapshot) {
	baselineControl = snapshot.val().Baseline;
	console.log(baselineControl);
	main();
});

//**********************************************************************
//
// MAIN FUNCTION
//
//**********************************************************************

const main = async () => {
    try {
		await delay(100);
        await getWeather();
        await getInverter();
        await getMeter();
    } catch (error) {
        console.log(error);
    } finally {
        console.log('Done');
        await delay(60000);
        main();
    }
}

//**********************************************************************
//
// GET WEATHER DATA
//
//**********************************************************************

const getWeather = async () => {
    try {
        await smartLogger.setID(smartLoggerSensorsID);
        await smartLogger.setTimeout(1000);
        let weatherData = await smartLogger.readHoldingRegisters(weatherStationRegister_R, 5);
        windSpeed = weatherData.data[1] / 10;
        moduleTemp = weatherData.data[2] / 10;
        ambientTemp = weatherData.data[3] / 10;
        IRRsensor = weatherData.data[4] / 10;
        console.log(`getWeather --> windSpeed_R: ${windSpeed}`);
    } catch (error) {
        console.log(error);
    }
}

//**********************************************************************
//
// GET INVERTER DATA
//
//**********************************************************************

const getInverter = async () => {
    await smartLogger.setTimeout(500);
    for (let inverterIndex = 0; inverterIndex < noInv; inverterIndex++) {
        await getEachInverter(inverterIndex);
    }
}

const getEachInverter = async inverterNumber => {
    try {
        await smartLogger.setID(inverterIDList[inverterNumber]);
        let inverterPower = await smartLogger.readHoldingRegisters(acPowerRegister_R, 6);
        inverterACpower = inverterPower.buffer.readUInt32BE(0) / 1000;
        inverterDCpower = inverterPower.buffer.readUInt32BE(8) / 1000;
        let pvStringParameter = await smartLogger.readHoldingRegisters(dcParametersRegister_R, 12);
        inverterPV1voltage = pvStringParameter.data[0] / 10;
        inverterPV1current = pvStringParameter.data[1] / 10;
        inverterPV2voltage = pvStringParameter.data[2] / 10;
        inverterPV2current = pvStringParameter.data[3] / 10;
        inverterPV3voltage = pvStringParameter.data[4] / 10;
        inverterPV3current = pvStringParameter.data[5] / 10;
        inverterPV4voltage = pvStringParameter.data[6] / 10;
        inverterPV4current = pvStringParameter.data[7] / 10;
        inverterPV5voltage = pvStringParameter.data[8] / 10;
        inverterPV5current = pvStringParameter.data[9] / 10;
        inverterPV6voltage = pvStringParameter.data[10] / 10;
        inverterPV6current = pvStringParameter.data[11] / 10;

        // Upload to Firebase
        let currentStatusRef = projectDatabase.ref(`/SolarSystem/Penfabric/CurrentStatus/Inverter/inverter${inverterNumber + 1}`);
        currentStatusRef.set ({
            inverterACpower: inverterACpower,
            inverterDCpower: inverterDCpower,
            inverterPV1current: inverterPV1current,
            inverterPV1voltage: inverterPV1voltage,
            inverterPV2current: inverterPV2current,
            inverterPV2voltage: inverterPV2voltage,
            inverterPV3current: inverterPV3current,
            inverterPV3voltage: inverterPV3voltage,
            inverterPV4current: inverterPV4current,
            inverterPV4voltage: inverterPV4voltage,
            inverterPV5current: inverterPV5current,
            inverterPV5voltage: inverterPV5voltage,
            inverterPV6current: inverterPV6current,
            inverterPV6voltage: inverterPV6voltage,
            time: Date.now()
        });
        
        let datalogRef = projectDatabase.ref(`/SolarSystem/Penfabric/Datalog/Inverter/inverter${inverterNumber + 1}`);
        let date = new Date();
        let month = date.getMonth() + 1;
        let year = date.getFullYear();
        datalogRef.push ({
            inverterACpower: inverterACpower,
            inverterDCpower: inverterDCpower,
            inverterPV1current: inverterPV1current,
            inverterPV1voltage: inverterPV1voltage,
            inverterPV2current: inverterPV2current,
            inverterPV2voltage: inverterPV2voltage,
            inverterPV3current: inverterPV3current,
            inverterPV3voltage: inverterPV3voltage,
            inverterPV4current: inverterPV4current,
            inverterPV4voltage: inverterPV4voltage,
            inverterPV5current: inverterPV5current,
            inverterPV5voltage: inverterPV5voltage,
            inverterPV6current: inverterPV6current,
            inverterPV6voltage: inverterPV6voltage,
            time: Date.now(),
            month: month,
            year: year
        });
        console.log(`getInverter --> inv${inverterNumber + 1}: ${inverterACpower}`);
        await delay(400);
    } catch (error) {
		console.log(inverterNumber);
        let errorRef = projectDatabase.ref(`/Notification/Penfabric/Inverter/inverter${inverterNumber + 1}`);
        let date = new Date();
        let month = date.getMonth() + 1;
        let year = date.getFullYear();
        errorRef.push ({
            errorMessage: error,
            time: Date.now(),
            month: month,
            year: year
        });
        console.log(error);
    }
}

//**********************************************************************
//
// GET ENERGY PARAMETERS FROM DPM
//
//**********************************************************************

const getMeter = async() => {
    await dpm.setTimeout(10000);
    for (let meterIndex = 0; meterIndex < noDpm; meterIndex++) {
        let meterNumber = meterIndex + 1;
        getEachMeter(meterNumber);
    }
}

const getEachMeter = async meterNumber => {
    try {
        await dpm.setID(meterNumber);

        let powerParameter = await dpm.readHoldingRegisters(dpmPowerRegister_R, 2);
        errorCount = 0;
        let arrayIndex = meterNumber - 1;
        intakeTNB[arrayIndex] = powerParameter.buffer.readFloatBE(0) / 1000;
        
        let energyParameter = await dpm.readHoldingRegisters(dpmEnergyRegister_R, 2);
        activeEnergy[arrayIndex] = energyParameter.buffer.readFloatBE(0) / 1000;

        // Upload to Firebase
        let currentStatusRef = projectDatabase.ref(`/PowerMeter/Penfabric/CurrentStatus/Meter${meterNumber}`);
        currentStatusRef.set ({
            intakeTNB: intakeTNB[arrayIndex],
            activeEnergy: activeEnergyTNB[arrayIndex],
            time: Date.now()
        });
        if (baselineControl === true) {
            let baselineRef = projectDatabase.ref(`/PowerMeter/Penfabric/Baseline/Meter${meterNumber}`);
            let date = new Date();
            let month = date.getMonth() + 1;
            let year = date.getFullYear();
            baselineRef.push ({
                intakeTNB: intakeTNB[arrayIndex],
                activeEnergy: activeEnergyTNB[arrayIndex],
                time: Date.now(),
                month: month,
                year: year
            });
        } else {
            let actualRef = projectDatabase.ref(`/PowerMeter/Penfabric/Actual/Meter${meterNumber}`);
            let date = new Date();
            let month = date.getMonth() + 1;
            let year = date.getFullYear();
            actualRef.push ({
                intakeTNB: intakeTNB[arrayIndex],
                activeEnergy: activeEnergyTNB[arrayIndex],
                time: Date.now(),
                month: month,
                year: year
            });
        }

        await getSmartLogger();
        console.log(`getEachMeter${meterNumber} --> intakeTNB: ${intakeTNB} & activeEnergyTNB: ${activeEnergyTNB}`);
    } catch (error) {
		errorCount++;
		if (errorCount < 2) {
            console.log(`error occured: ${errorCount}`);
			await delay(1000);
			await getMeter(meterNumber);
		} else {
            errorCount = 0;
            let arrayIndex = meterNumber - 1;
            intakeTNB[arrayIndex] = 0;
            await getSmartLogger();
            let errorRef = projectDatabase.ref(`/Notification/Penfabric/PowerMeter/Meter${meterNumber}`);
            let date = new Date();
            let month = date.getMonth() + 1;
            let year = date.getFullYear();
            errorRef.push ({
                errorMessage: error.message,
                time: Date.now(),
                month: month,
                year: year
            });
			console.log(`I gave up: ${error}`);
		}
    }
}

//**********************************************************************
//
// GET SMARTLOGGER PV AC POWER SUPPLY
//
//**********************************************************************

const getSmartLogger = async () => {
    try {
        await smartLogger.setID(smartLoggerSlaveID);
        await smartLogger.setTimeout(1000);
        let pvACSupply = await smartLogger.readHoldingRegisters(activePowerRegister_R, 2);
        totalPVacPower = pvACSupply.buffer.readUInt32BE(0) / 1000;        
        console.log(`getSmartLogger --> totalPVacPower: ${totalPVacPower}`);
        await adjustSolarOutput();
    } catch (error) {
        console.log(error);
    }
}

//**********************************************************************
//
// ADJUST SOLAR OUTPUT
//
//**********************************************************************

const adjustSolarOutput = async () => {
    try {
        await smartLogger.setID(smartLoggerSlaveID);
        await smartLogger.setTimeout();

        // Assuming TNB Meter slaveID 3
        totalBuildingLoad = totalPVacPower + intakeTNB[0] + intakeTNB[1];
        console.log(`adjustSolarOutput --> totalBuildingLoad: ${totalBuildingLoad}`);
        if (totalBuildingLoad > ((maxPVoutput / 10) * (1 + bufferOutput))) {
            await smartLogger.writeRegisters(activeAdjustmentRegister_RW, [0, maxPVoutput]);
            activeAdjustment = await smartLogger.readHoldingRegisters(activeAdjustmentRegister_RW, 2);
            console.log(`adjustSolarOutput --> adjustPower: ${activeAdjustment.buffer.readUInt32BE(0) / 10}`);
        } else {
            let adjustOutput = totalBuildingLoad * (1 - bufferOutput) * 10; 
            await smartLogger.writeRegisters(activeAdjustmentRegister_RW, [0, adjustOutput]);
            activeAdjustment = await smartLogger.readHoldingRegisters(activeAdjustmentRegister_RW, 2);
            console.log(`adjustSolarOutput --> adjustPower: ${activeAdjustment.buffer.readUInt32BE(0) / 10}`);
        }
        
        // Upload to firebase
		let currentStatusRef = projectDatabase.ref('/SolarSystem/Penfabric/CurrentStatus/SmartLogger');
        currentStatusRef.set ({
			totalBuildingLoad: totalBuildingLoad,
            totalPVacPower: totalPVacPower,
            activeAdjustment: activeAdjustment.buffer.readUInt32BE(0) / 10,
            totalPVacPower : totalPVacPower,
            windSpeed: windSpeed,
            moduleTemp: moduleTemp,
            ambientTemp: ambientTemp,
            IRRsensor: IRRsensor,
            time: Date.now()
        });
        let smartloggerRef = projectDatabase.ref('/SolarSystem/Penfabric/Datalog/SmartLogger');
        let date = new Date();
        let month = date.getMonth() + 1;
        let year = date.getFullYear();
        smartloggerRef.push ({
			totalBuildingLoad: totalBuildingLoad,
            totalPVacPower: totalPVacPower,
            activeAdjustment: activeAdjustment.buffer.readUInt32BE(0) / 10,
            totalPVacPower : totalPVacPower,
            windSpeed: windSpeed,
            moduleTemp: moduleTemp,
            ambientTemp: ambientTemp,
            IRRsensor: IRRsensor,
            time: Date.now(),
            month: month,
            year: year
        });

    } catch (error) {
        let errorRef = projectDatabase.ref('/Notification/Penfabric/Smartlogger');
        let date = new Date();
        let month = date.getMonth() + 1;
        let year = date.getFullYear();
        errorRef.push ({
            errorMessage: error.message,
            time: Date.now(),
            month: month,
            year: year
        });
        console.log(error);
    }
}

//**********************************************************************
//
// DELAY
//
//**********************************************************************

const delay = microSecond => new Promise(resolve => setTimeout(resolve, microSecond));