//**********************************************************************
//
// IMPORTANT INFORMATION:
//
// Energy Meter		: Socomec Multis L50
// Modbus Device	: Socomec Diris A20 (RS-485)
//
// NOTE: Pls change the register definition according to datasheet.
//
//**********************************************************************

//Define payload
const payload = require("./payload.js").payload;

//Define date
var dat = new Date();
//**********************************************************************
//
// TEMPORARY PLACE HOLDER TO CALCULATE MAXIMUM DEMAND
// 
//**********************************************************************

//let maxDemand = new Object;
let maxDemand = null;																																																																																																								
let hour = new Date().getHours();

//**********************************************************************
//
// DEFINE ENERGY METER OBJECTS
//
//**********************************************************************

var EnergyParameters = new Object;

//**********************************************************************
//
// HOLDING REGISTER MAP
//
//**********************************************************************

// First address of the register block
const holdingRegister_R = 4000;
// Total Number of Register to read from the register block		
const totalNumberOfRegister = 14;

var meterIdList = [1, 2, 3];

//**********************************************************************
//
// QUERY ALL THE METERS
//
//**********************************************************************

const getEnergyParameters = async (energyMeter, totalNumberOfMeters) => {
	// console.log("Inside getMeters");
	try {
		for (let meterNumber = 0; meterNumber <= totalNumberOfMeters; meterNumber++) {
			await getEachMeter(energyMeter, meterNumber);
		}
	} catch (error) {
		console.log(error.message);
	} finally {
		return EnergyParameters;
	}
}

//**********************************************************************
//
// GET ENERGY PARAMETERS FROM EACH METER
//
//**********************************************************************

var energyArray = [];
const getEachMeter = async (energyMeter, slaveId) => {
	let meterId = "Meter" + slaveId;
	try {
		await energyMeter.setID(meterIdList[slaveId]);
		await energyMeter.setTimeout(1000);
		let energyParameters = await energyMeter.readHoldingRegisters(holdingRegister_R, totalNumberOfRegister);
		
		// Power and Energy
        activeEnergy = energyParameters.buffer.readUInt32BE(4);
		intakeTNB = energyParameters.buffer.readUInt32BE(24) / 1000;

		// Daily Max Demand
		if (energyArray.length === 30 ) {
			energyArray.shift();
			energyArray.push(activeEnergy);
			maxDemand = ( energyArray[29] - energyArray[0] ) / 0.5;
		} else {
			energyArray.push(activeEnergy);
			//console.log(energyArray);
		}

       	payload.powerMeter[slaveId].updatedAt = dat;
		payload.powerMeter[slaveId].activeEnergy = activeEnergy;
		payload.powerMeter[slaveId].activePower = intakeTNB;
		payload.powerMeter[slaveId].maxDemand = maxDemand;

		EnergyParameters[meterId] = {
			activeEnergy,
			intakeTNB,
			maxDemand,
			time: Date.now(),
			month: new Date().getMonth() + 1,
			year: new Date().getFullYear()
		};

	} catch (error) {
		EnergyParameters[meterId] = {
			error: error.message,
			time: Date.now()
		};
	}
};

//**********************************************************************
//
// EXPORT METHODS
//
//**********************************************************************

module.exports.getEnergyParameters = getEnergyParameters;
