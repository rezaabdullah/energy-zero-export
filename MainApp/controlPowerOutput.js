//**********************************************************************
//
// SMARTLOGGER INFORMATION
//
//**********************************************************************

// Smartlogger ID
const smartloggerId = 0;

// Register (RW) for AC power supply from PV
const activeAdjustmentRegister_RW = 40424;

//**********************************************************************
//
// INSTALLED PV SYSTEM CAPACITY
//
//**********************************************************************

// Max. capacity of the installed system
const maxPVoutput = 7326;

// Safety buffer 10%
const bufferOutput = 0.10;

//**********************************************************************
//
// GAIN FACTOR AS DESCRIBED BY THE SMARTLOGGER USER MANUAL
//
//**********************************************************************

const GAIN_FACTOR = 10;

//**********************************************************************
//
// MAXIMUM VALUE OF THE POWER REGISTER
// SINCE POWER REGISTER REPRESENTS UInt32 VALUE, MAX. VALUE REPRESENTS
// ENERGY EXPORT BACK TO THE GRID
//
//**********************************************************************

const NEGATIVE_POWER = 4294967;

const adjustSolarOutput = async (smartlogger, intakeTNB, smartloggerParameters) => {
    try {
        await smartlogger.setID(smartloggerId);
        await smartlogger.setTimeout(500);

        totalBuildingLoad = smartloggerParameters.totalPVacPower + intakeTNB;
        if (totalBuildingLoad > NEGATIVE_POWER) {
            let adjustOutput = maxPVoutput * 0.01;
			await smartlogger.writeRegisters(activeAdjustmentRegister_RW, [0, adjustOutput]);
            activeAdjustment = await smartlogger.readHoldingRegisters(activeAdjustmentRegister_RW, 2);
            smartloggerParameters.activeAdjustment = activeAdjustment.buffer.readUInt32BE(0) / GAIN_FACTOR;
            smartloggerParameters.totalBuildingLoad = totalBuildingLoad;
		} else if (totalBuildingLoad > ((maxPVoutput / GAIN_FACTOR) * (1 + bufferOutput))) {
            await smartlogger.writeRegisters(activeAdjustmentRegister_RW, [0, maxPVoutput]);
            activeAdjustment = await smartlogger.readHoldingRegisters(activeAdjustmentRegister_RW, 2);
            smartloggerParameters.activeAdjustment = activeAdjustment.buffer.readUInt32BE(0) / GAIN_FACTOR;
            smartloggerParameters.totalBuildingLoad = totalBuildingLoad;
        } else {
            let adjustOutput = totalBuildingLoad * (1 - bufferOutput) * GAIN_FACTOR; 
            await smartlogger.writeRegisters(activeAdjustmentRegister_RW, [0, adjustOutput]);
            activeAdjustment = await smartlogger.readHoldingRegisters(activeAdjustmentRegister_RW, 2);
            smartloggerParameters.activeAdjustment = activeAdjustment.buffer.readUInt32BE(0) / GAIN_FACTOR;
            smartloggerParameters.totalBuildingLoad = totalBuildingLoad;
        }
	} catch (error) {
		console.log(error.message);
	}
}

//**********************************************************************
//
// EXPORT METHODS
//
//**********************************************************************

module.exports.adjustSolarOutput = adjustSolarOutput;