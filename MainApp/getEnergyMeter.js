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

//**********************************************************************
//
// NPM Modules
//
//**********************************************************************

// const ModbusRTU = require('modbus-serial');

//**********************************************************************
//
// Define Modbus RTU - RS485
//
//**********************************************************************

// var energyMeter = new ModbusRTU();// Modbus client: Energy Meter

//**********************************************************************
//
// Define Energy Meter Object
//
//**********************************************************************

// Energy meter object prototype
// const EnergyMeter = {
// 	i1: null,							// Phase 1 current
// 	i2: null,							// Phase 2 current
// 	i3: null,							// Phase 3 current
// 	v12: null,							// Phase 1-2 voltage
// 	v23: null,							// Phase 2-3 voltage
// 	v31: null,							// Phase 3-1 voltage
// 	v1: null,							// Phase 1-N voltage
// 	v2: null,							// Phase 2-N voltage
// 	v3: null,							// Phase 3-N voltage
// 	totalActivePower: null,				// Total active power
// 	activePower1: null,					// Phase 1 active power
// 	activePower2: null,					// Phase 2 active power
// 	activePower3: null,					// Phase 3 active power
// 	activeEnergy: null					// Total active energy
// }

//**********************************************************************
//
// Define array of energy meter objects
//
//**********************************************************************

var EnergyParameters = new Object;

//**********************************************************************
//
// Holding Registers Definition
//
//**********************************************************************

const holdingRegister_R = 768;		// Active power register

//**********************************************************************
//
// Get energy parameters from all the meters in modbus chain
//
//**********************************************************************

const getEnergyParameters = async (totalMeters) => {
	console.log('Inside getMeters', totalMeters);
	try {
		for (let meterNumber = 1; meterNumber <= totalMeters; meterNumber++) {
			await getEachMeter(meterNumber);
		}
	} catch (error) {
		console.log(error.message);
	} finally {
		console.log('Done');
		return energyMeterArray;
	}
}

//**********************************************************************
//
// Get energy parameters of individual meter
//
//**********************************************************************

const getEachMeter = async (meterID) => {
	try {
		await energyMeterSerial.setID(meterID);
		await energyMeterSerial.setTimeout(1000);
		let meterId = "meter" + meterID;
		let energyParameters = await energyMeterSerial.readHoldingRegisters(holdingRegister_R, 10);
		// Current
		let i1 = energyParameters.buffer.readUInt32BE(0)/1000;
		let i2 = energyParameters.buffer.readUInt32BE(4)/1000;
		let i3 = energyParameters.buffer.readUInt32BE(8)/1000;
		// Voltage
		let v12 = energyParameters.buffer.readUInt32BE(16)/100;
		let v23 = energyParameters.buffer.readUInt32BE(20)/100;
		let v31 = energyParameters.buffer.readUInt32BE(24)/100;
		let v1 = energyParameters.buffer.readUInt32BE(28)/100;
		// let v2 = energyParameters.buffer.readUInt32BE(32)/100;
		// let v3 = energyParameters.buffer.readUInt32BE(36)/100;
		// // Power and Energy
		// let totalActivePower = energyParameters.buffer.readUInt32BE(44)/100;
		// let activePower1 = energyParameters.buffer.readUInt32BE(60)/100;
		// let activePower2 = energyParameters.buffer.readUInt32BE(64)/100;
		// let activePower3 = energyParameters.buffer.readUInt32BE(68)/100;
		// let activeEnergy = energyParameters.buffer.readUInt32BE(176);

		let meterObject = {
			i1: i1,
			i2: i2,
			i3: i3,
			v12: v12,
			v23: v23,
			v31: v31,
			v1: v1
		}

		energyParameters[meterId] = meterObject;
	} catch (error) {
		energyMeterArray[index] = Object.create(EnergyMeter);
		energyMeterArray[index].error = error.message;
	}
};

//**********************************************************************
//
// Exports getMeters to app.js
//
//**********************************************************************

module.exports.getEnergyParameters = getEnergyParameters;
