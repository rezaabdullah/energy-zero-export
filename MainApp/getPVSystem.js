//**********************************************************************
//
// IMPORTANT INFORMATION:
//
// Smnartlogger		:	Huawei SUN2000
// Inverter			: 	HUawei
//
// NOTE: Pls change the register definition according to datasheet.
//
//**********************************************************************

//Define payload
const payload = require("./payload.js").payload;

// Define date
var dat = new Date();

//**********************************************************************
//
// WEATHER STATION INFORMATION
//
//**********************************************************************

// Weather Station Slave ID
const weatherStationId = 1;

// Read only register for weather station data
const weatherStationRegister_R = 40031;

//**********************************************************************
//
// SMARTLOGGER INFORMATION
//
//**********************************************************************

// Smartlogger ID
const smartloggerId = 0;

// Read only register for AC power output from PV
const activePowerRegister_R = 40525;

//**********************************************************************
//
// INVERTER INFORMATION
//
//**********************************************************************

// !!! ONLY THONG GUAN LOT48
var inverterIdList = [13, 15, 18, 20, 26, 27, 25, 22, 14, 17, 30, 19, 28, 24,
    23, 21, 11, 12, 16];

// Register (R) to read inverter DC power
const dcPowerRegister_R = 32294;

// Register (R) to read inverter AC power
const acPowerRegister_R = 32290;

// Register (R) to read PV string/array DC parameters
const dcParametersRegister_R = 32262;

//**********************************************************************
//
// DEFINE PV SYSTEM OBJECT
//
//**********************************************************************

var PVSystemParameters = new Object;
var mpptPower1 = null;
var mpptPower2 = null;
var mpptPower3 = null;

//**********************************************************************
//
// GET WEATHER DATA FROM WEATHER STATION
//
//**********************************************************************

const getWeatherData = async (smartlogger) => {
	try {
		await smartlogger.setID(weatherStationId);
		await smartlogger.setTimeout(1000);
		let weatherData = await smartlogger.readHoldingRegisters(weatherStationRegister_R, 5);
		let windSpeed = weatherData.data[1] / 10;
		let moduleTemp = weatherData.data[2] / 10;
		let ambientTemp = weatherData.data[3] / 10;
		let IRRsensor = weatherData.data[4] / 10;

       	payload.logger.updatedAt = dat;		
		payload.logger.windSpeed = windSpeed;
		payload.logger.moduleTemp = moduleTemp;
		payload.logger.ambientTemp = ambientTemp;
		payload.logger.irrSensor = IRRsensor;
				
		PVSystemParameters["SmartLogger"] = {
			ambientTemp,
			windSpeed,
			moduleTemp,
			IRRsensor
		};
	} catch (error) {
		PVSystemParameters["SmartLogger"] = {
			errorWeatherStation: error.message
		};
	}
}

//**********************************************************************
//
// QUERY ALL THE INVERTERS
//
//**********************************************************************

const getInverters = async (smartlogger, totalNumberOfInverters) => {
	try {		
		for (let inverterIndex = 0; inverterIndex < totalNumberOfInverters; inverterIndex++) {
			//console.log("Test for the loop");
			await getEachInverter(smartlogger, inverterIndex);
		}
	} catch (error) {
		console.log(error.message);
	}
}

//**********************************************************************
//
// GET PV AC/DC PARAMETERS FROM EACH INVERTER
//
//**********************************************************************

const getEachInverter = async (smartlogger, inverterNumber) => {
	let inverterId = "inverter" + (inverterNumber + 1);
    try {
        await smartlogger.setID(inverterIdList[inverterNumber]);
        await smartlogger.setTimeout(500);
                
        let inverterPower = await smartlogger.readHoldingRegisters(acPowerRegister_R, 6);
        inverterACpower = inverterPower.buffer.readUInt32BE(0) / 1000;
        inverterDCpower = inverterPower.buffer.readUInt32BE(8) / 1000;
        let pvStringParameter = await smartlogger.readHoldingRegisters(dcParametersRegister_R, 12);
			
		let mppt_values = await smartlogger.readHoldingRegisters(33022, 6);
		MPPT1power = mppt_values.buffer.readUInt32BE(0)/1000;
		MPPT2power = mppt_values.buffer.readUInt32BE(4)/1000;
		MPPT3power = mppt_values.buffer.readUInt32BE(8)/1000;

		let rated_inverter = await smartlogger.readHoldingRegisters(32001,1);
		let inverter_eff = await smartlogger.readHoldingRegisters(32285,1);
		ratedPower = rated_inverter.buffer.readUInt16BE(0);
		effInverter = inverter_eff.buffer.readUInt16BE(0)/100;
		
       	payload.inverter[inverterNumber].updatedAt = dat;
		payload.inverter[inverterNumber].acPower = inverterACpower;
		payload.inverter[inverterNumber].dcPower = inverterDCpower;
		payload.inverter[inverterNumber].mpptPower[1] = MPPT1power;
		payload.inverter[inverterNumber].mpptPower[2] = MPPT2power;
		payload.inverter[inverterNumber].mpptPower[3] = MPPT3power;
		payload.inverter[inverterNumber].ratedPower = ratedPower;
		payload.inverter[inverterNumber].effInverter = effInverter;
		//console.log(payload.inverter[inverterNumber].effInverter);
		
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
        
        payload.inverter[inverterNumber].pcVoltage[1] = inverterPV1voltage;
        payload.inverter[inverterNumber].pvCurrent[1] = inverterPV1current;
        payload.inverter[inverterNumber].pcVoltage[2] = inverterPV2voltage;
        payload.inverter[inverterNumber].pvCurrent[2] = inverterPV2current;
        payload.inverter[inverterNumber].pcVoltage[3] = inverterPV3voltage;
        payload.inverter[inverterNumber].pvCurrent[3] = inverterPV3current;
        payload.inverter[inverterNumber].pcVoltage[4] = inverterPV4voltage;
        payload.inverter[inverterNumber].pvCurrent[4] = inverterPV4current;
        payload.inverter[inverterNumber].pcVoltage[5] = inverterPV5voltage;
        payload.inverter[inverterNumber].pvCurrent[5] = inverterPV5current;
        payload.inverter[inverterNumber].pcVoltage[6] = inverterPV6voltage;
        payload.inverter[inverterNumber].pvCurrent[6] = inverterPV6current;
		
		
		PVSystemParameters[inverterId] = {
			acPower, dcPower, 
			inverterPV1current, inverterPV1voltage,
			inverterPV2current, inverterPV2voltage,
			inverterPV3current, inverterPV3voltage,
			inverterPV4current, inverterPV4voltage,
			inverterPV5current, inverterPV5voltage,
			inverterPV6current, inverterPV6voltage,
			mpptPower1, mpptPower2, mpptPower3,
			ratedPower, effInverter,
			time: Date.now(),
			month: new Date().getMonth() + 1,
			year: new Date().getFullYear()
		};
		
	} catch (error) {
		PVSystemParameters[inverterId] = {
			error: error.message,
			time: Date.now()
		};
	}
};

//**********************************************************************
//
// GET SMARTLOGGER FOR TOTAL PV AC POWER SUPPLY
//
//**********************************************************************

const getSmartlogger = async (smartlogger) => {
    try {
        await smartlogger.setID(smartloggerId);
        await smartlogger.setTimeout(500);
        let pvACSupply = await smartlogger.readHoldingRegisters(activePowerRegister_R, 2);
        PVSystemParameters.SmartLogger.totalPVacPower = pvACSupply.buffer.readUInt32BE(0) / 1000;
        PVSystemParameters.SmartLogger.time = Date.now();
        PVSystemParameters.SmartLogger.month = new Date().getFullYear();
        payload.logger.activePower = PVSystemParameters.SmartLogger.totalPVacPower;
    } catch (error) {
        PVSystemParameters.SmartLogger.error = error.message;
		PVSystemParameters.SmartLogger.time = Date.now();
    } finally {
		return PVSystemParameters;
	}
}

//**********************************************************************
//
// EXPORT METHODS
//
//**********************************************************************

module.exports = {
	getWeatherData,
	getInverters,
	getSmartlogger
}
