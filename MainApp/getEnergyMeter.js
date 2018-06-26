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

const ModbusRTU = require('modbus-serial');

//**********************************************************************
//
// Define Modbus RTU - RS485
//
//**********************************************************************

var energyMeterSerial = new ModbusRTU();// Modbus client: Energy Meter

//**********************************************************************
//
// Define Energy Meter Object
//
//**********************************************************************

// Energy meter object prototype
const EnergyMeter = {
	i1: null,							// Phase 1 current
	i2: null,							// Phase 2 current
	i3: null,							// Phase 3 current
	v12: null,							// Phase 1-2 voltage
	v23: null,							// Phase 2-3 voltage
	v31: null,							// Phase 3-1 voltage
	v1: null,							// Phase 1-N voltage
	v2: null,							// Phase 2-N voltage
	v3: null,							// Phase 3-N voltage
	totalActivePower: null,				// Total active power
	activePower1: null,					// Phase 1 active power
	activePower2: null,					// Phase 2 active power
	activePower3: null,					// Phase 3 active power
	activeEnergy: null					// Total active energy
}

//**********************************************************************
//
// Define array of energy meter objects
//
//**********************************************************************

var energyMeterArray = [];

//**********************************************************************
//
// Holding Registers Definition
//
//**********************************************************************

const activePowerRegister_R = 4012;		// Active power register

//**********************************************************************
//
// Get energy parameters from all the meters in modbus chain
//
//**********************************************************************

const getMeters = async (totalMeters) => {
	try {
		await energyMeterSerial.connectRTUBuffered('/dev/ttyAMA0', {baudRate: 9600});
		for (let meterNumber = 1; meterNumber <= totalMeters; meterNumber++) {
			await getEachMeter(meterNumber);
		}
		await energyMeterSerial.close();
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
	let index = meterID - 1;
	try {
		await energyMeterSerial.setID(meterID);
		await energyMeterSerial.setTimeout(1000);
		energyMeterArray[index] = Object.create(EnergyMeter);
		let energyParameters = await energyMeterSerial.readHoldingRegisters(firstHoldingRegister_R, totalHoldingRegister_R);
		// Current
		energyMeterArray[index].i1 = energyParameters.buffer.readUInt32BE(0)/1000;
		energyMeterArray[index].i2 = energyParameters.buffer.readUInt32BE(4)/1000;
		energyMeterArray[index].i3 = energyParameters.buffer.readUInt32BE(8)/1000;
		// Voltage
		energyMeterArray[index].v12 = energyParameters.buffer.readUInt32BE(16)/100;
		energyMeterArray[index].v23 = energyParameters.buffer.readUInt32BE(20)/100;
		energyMeterArray[index].v31 = energyParameters.buffer.readUInt32BE(24)/100;
		energyMeterArray[index].v1 = energyParameters.buffer.readUInt32BE(28)/100;
		energyMeterArray[index].v2 = energyParameters.buffer.readUInt32BE(32)/100;
		energyMeterArray[index].v3 = energyParameters.buffer.readUInt32BE(36)/100;
		// Power and Energy
		energyMeterArray[index].totalActivePower = energyParameters.buffer.readUInt32BE(44)/100;
		energyMeterArray[index].activePower1 = energyParameters.buffer.readUInt32BE(60)/100;
		energyMeterArray[index].activePower2 = energyParameters.buffer.readUInt32BE(64)/100;
		energyMeterArray[index].activePower3 = energyParameters.buffer.readUInt32BE(68)/100;
		energyMeterArray[index].activeEnergy = energyParameters.buffer.readUInt32BE(176);
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

module.exports.getMeters = getMeters;
