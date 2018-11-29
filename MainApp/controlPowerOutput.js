//**********************************************************************
//
// SMARTLOGGER INFORMATION
//
//**********************************************************************

// Define payload
const payload = require("./payload.js").payload;

// Smartlogger ID
const smartloggerId = 0;

// Read only register for AC power output from PV
const activePowerRegister_R = 40525;

// Register (RW) for AC power supply from PV
const activeAdjustmentRegister_RW = 40424;

//**********************************************************************
//
// INSTALLED PV SYSTEM 
//
//**********************************************************************

// Max. capacity of the installed system
const maxPVoutput = 7326;

// Zero export ceiling rate
const zeroExportLimit = 6593;

// Safety buffer 10%
const bufferOutput = 0.10;

const adjustSolarOutput = async (smartlogger, activeEnergy, smartloggerParameters) => {
    try {
        await smartlogger.setID(smartloggerId);
        await smartlogger.setTimeout(500);

        totalBuildingLoad = smartloggerParameters.totalPVacPower + activeEnergy;
        if (totalBuildingLoad > 4294967) {
			await smartlogger.writeRegisters(activeAdjustmentRegister_RW, [0, 1000]);
            activeAdjustment = await smartlogger.readHoldingRegisters(activeAdjustmentRegister_RW, 2);
            smartloggerParameters.activeAdjustment = activeAdjustment.buffer.readUInt32BE(0) / 10;
            smartloggerParameters.totalBuildingLoad = totalBuildingLoad;
            payload.logger.powerAdjustment = smartloggerParameters.activeAdjustment;
            payload.logger.totalBuildingLoad = totalBuildingLoad;

		} else if (totalBuildingLoad > ((maxPVoutput / 10) * (1 + bufferOutput))) {
            await smartlogger.writeRegisters(activeAdjustmentRegister_RW, [0, maxPVoutput]);
            activeAdjustment = await smartlogger.readHoldingRegisters(activeAdjustmentRegister_RW, 2);
            smartloggerParameters.activeAdjustment = activeAdjustment.buffer.readUInt32BE(0) / 10;
            smartloggerParameters.totalBuildingLoad = totalBuildingLoad;
            payload.logger.powerAdjustment = smartloggerParameters.activeAdjustment;    
            payload.logger.totalBuildingLoad = totalBuildingLoad;

        } else {
            let adjustOutput = totalBuildingLoad * (1 - bufferOutput) * 10; 
            await smartlogger.writeRegisters(activeAdjustmentRegister_RW, [0, adjustOutput]);
            activeAdjustment = await smartlogger.readHoldingRegisters(activeAdjustmentRegister_RW, 2);
            smartloggerParameters.activeAdjustment = activeAdjustment.buffer.readUInt32BE(0) / 10;
            smartloggerParameters.totalBuildingLoad = totalBuildingLoad;
            payload.logger.powerAdjustment = smartloggerParameters.activeAdjustment;           
            payload.logger.totalBuildingLoad = totalBuildingLoad;

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
