//**********************************************************************
//
// IMPORTANT INFORMATION:
//
// Smarlogger		: Huawei SmartLogger
// Inverter			: SUN2000
// Modbus Protocol	: Modbus TCP/IP
//
// NOTE: Pls change the register definition according to datasheet
//
//**********************************************************************

//**********************************************************************
//
// NPM Modules
//
//**********************************************************************

const ModbusRTU = require('modbus-serial');

//**********************************************************************
//
// Define Modbus RTU - TCP/IP
//
//**********************************************************************

var smartloggerTCP = new ModbusRTU();

//**********************************************************************
//
// Define Device IDs
//
//**********************************************************************

// SmartLogger Device ID (Fixed)
const smartloggerDeviceID = 0;

// Weather station slave ID
const weatherStationID = 1;

// ONLY THONG GUAN LOT 48 !!!
var inverterIDList = [13, 15, 18, 20, 26, 27, 25, 22, 14, 17, 30, 19,
	28, 24, 23, 21, 11, 12, 16];

//**********************************************************************
//
// Define SmartLgger Registers
//
//**********************************************************************

// Adjusts the output of total active power of all inverters
const activeAdjustmentRegister_RW = 40424;

// Total active power of all inverters
const activePowerRegister_R = 40525;

// Wind speed
const windSpeedRegister_R = 40031;

//**********************************************************************
//
// Define Inverter Registers
//
//**********************************************************************

// Total input power (DC)
const totalInputPowerRegister_R = 32294;

// Total output power (AC)
const activePowerRegisterInverter_R = 32290;

// PV Array parameters (DC):
// First register points to first PV array
const firstPVarrayRegister_R = 32262;

//**********************************************************************
//
// Define SmartLogger Object
//
//**********************************************************************

const Smartlogger = {
	activePowerAdjustment: null,	// Value of active power adjustent
	activePower: null,				// Total active power
}

//**********************************************************************
//
// Define Inverter Object
//
//**********************************************************************

const Inverter = {
	totalInputPowerDC: null,		// Total DC input power
	activePowerAC: null,			// Active AC ouput power
	pv1Voltage: null,				// PV1 Array voltage
	pv1Current: null,				// PV1 Array current
	pv2Voltage: null,				// PV2 Array voltage
	pv2Current: null,				// PV2 Array current
	pv3Voltage: null,				// PV3 Array voltage
	pv3Current: null,				// PV3 Array current
	pv4Voltage: null,				// PV4 Array voltage
	pv4Current: null,				// PV4 Array current
	pv5Voltage: null,				// PV5 Array voltage
	pv5Current: null,				// PV5 Array current
	pv6Voltage: null,				// PV6 Array voltage
	pv6Current: null				// PV6 Array current
}

//**********************************************************************
//
// Define Weather Station Object
//
//**********************************************************************

const WeatherStation = {
	irradiance: null,				// Irradiance
	moduleTemperature: null,		// Module temperature
	ambientTemperature: null,		// Ambient temperature
	windspeed: null					// Windspeed
}

//**********************************************************************
//
// Define array of PV system objects
// Index: 0		: SmartLogger
// 		: 1-19	: Inverters
//		: 20	: Weather station
//
//**********************************************************************

var pvSystemArray = [];

//**********************************************************************
//
// Get DC, AC and Weather parameters from the devices
//
//**********************************************************************

var getPVSystemParameters = async (totalInverters) => {
	// totalDeviceNumber = SmartLogger + totalInverters + Weatherstation
	totalDeviceNumber = totalInverters + 2;
	try {
		await smartloggerTCP.connectTCP("10.10.0.61", {port: 502 });
		for (let deviceNumber = 0; deviceNumber < totalDeviceNumber; deviceNumber++) {
			if (deviceNumber === 0) {
				await getSmartloggerStatus(deviceNumber);
			} else if ((deviceNumber > 0) && (deviceNumber <= totalInverters)) {
				await getInverterStatus(deviceNumber);
			} else {
				await getWeatherStationStatus(deviceNumber);
			}
		}
		await smartloggerTCP.close();
	} catch (error) {
		console.log(error.message);
	} finally{
		console.log('Done');
		return pvSystemArray;
	}
}

//**********************************************************************
//
// Get SmartLogger status
//
//**********************************************************************

const getSmartloggerStatus = async (deviceID) => {
	try {
		await smartloggerTCP.setID(smartloggerDeviceID);
		await smartloggerTCP.setTimeout(1000);
		pvSystemArray[deviceID] = Object.create(Smartlogger);
		// Active Power Adjustment
		pvSystemArray[deviceID].activePowerAdjustment = await smartloggerTCP.readHoldingRegisters(activeAdjustmentRegister_RW, 2).then((data) => {
			return data.buffer.readUInt32BE() / 1000;
		}).catch (error => {
			return error.message;
		});
		
		// Total Active Power
		pvSystemArray[deviceID].activePower = await smartloggerTCP.readHoldingRegisters(activePowerRegister_R, 2).then((data) => {
			return data.buffer.readUInt32BE() / 1000;
		}).catch (error => {
			return error.message;
		});
	} catch (error) {
		console.log(error.message);
	}
}

//**********************************************************************
//
// Get Inverter status
//
//**********************************************************************

const getInverterStatus = async (inverterNumber) => {
	let index = inverterNumber - 1;
	try {
		await smartloggerTCP.setID(inverterIDList[index]);
		await smartloggerTCP.setTimeout(1000);
		pvSystemArray[inverterNumber] = Object.create(Inverter);
		// Total DC input power - DC
		pvSystemArray[inverterNumber].totalInputPowerDC = await smartloggerTCP.readHoldingRegisters(totalInputPowerRegister_R, 2).then((data) => {
			return data.buffer.readUInt32BE() / 1000;
		}).catch (error => {
			return error.message;
		});
		
		// Active AC output power
		pvSystemArray[inverterNumber].activePowerAC = await smartloggerTCP.readHoldingRegisters(activePowerRegisterInverter_R, 2).then((data) => {
			return data.buffer.readUInt32BE() / 1000;
		}).catch (error => {
			return error.message;
		});
		
		// PV Array DC Parameters
		let pvArrayDCParameters = await smartloggerTCP.readHoldingRegisters(firstPVarrayRegister_R, 12).then((data) => {
			pvSystemArray[inverterNumber].pv1Voltage = data.data[0] / 10;
			pvSystemArray[inverterNumber].pv1Current = data.data[1] / 10;
			pvSystemArray[inverterNumber].pv2Voltage = data.data[2] / 10;
			pvSystemArray[inverterNumber].pv2Current = data.data[3] / 10;
			pvSystemArray[inverterNumber].pv3Voltage = data.data[4] / 10;
			pvSystemArray[inverterNumber].pv3Current = data.data[5] / 10;
			pvSystemArray[inverterNumber].pv4Voltage = data.data[6] / 10;
			pvSystemArray[inverterNumber].pv4Current = data.data[7] / 10;
			pvSystemArray[inverterNumber].pv5Voltage = data.data[8] / 10;
			pvSystemArray[inverterNumber].pv5Current = data.data[9] / 10;
			pvSystemArray[inverterNumber].pv6Voltage = data.data[10] / 10;
			pvSystemArray[inverterNumber].pv6Current = data.data[11] / 10;
			return data.data;
		}).catch (error => {
			return error.message;
		});
	} catch (error) {
		console.log(error.message);
	}
}

//**********************************************************************
//
// Get Weather Station status
//
//**********************************************************************

const getWeatherStationStatus = async (arrayIndex) => {
	try {
		await smartloggerTCP.setID(weatherStationID);
		await smartloggerTCP.setTimeout(1000);
		pvSystemArray[arrayIndex] = Object.create(WeatherStation);
		// Weather parameters
		let weatherParameters = await smartloggerTCP.readHoldingRegisters(windSpeedRegister_R, 5).then((data) => {
			pvSystemArray[arrayIndex].windspeed = data.data[1] / 10 / 1000;
			pvSystemArray[arrayIndex].moduleTemperature = data.data[2] / 10;
			pvSystemArray[arrayIndex].ambientTemperature = data.data[3] / 10;
			pvSystemArray[arrayIndex].irradiance = data.data[4] / 10;
			return data.data;
		}).catch (error => {
			return error.message;
		});
	} catch (error) {
		console.log(error.message);
	}
}

<<<<<<< HEAD
module.exports.getPVSystemParameters = getPVSystemParameters;
=======
module.exports.getPVSystemParameters = getPVSystemParameters;
>>>>>>> aa4e30c57c8f674551bb71ac1cd31246e0dea5b0
