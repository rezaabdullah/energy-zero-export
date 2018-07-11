//**********************************************************************
//
// SYSTEM PERFORMANCE DATA CONSTRUCTOR
// 
//**********************************************************************

function SystemPerformanceData() {
    this.DailyReadings = {
		dailyMaxAmbientTemp: null,
		dailyMaxSolarTemp: null,
		dailyMaxIrradiance: null,
		dailyMaxIntake: null,
		dailyMaxSolarOutput: null,
		dailyMaxDemand: null,
		dailyAccIrradiance: null,
		dailyAccYield: null,
		dailyAccBuildingLoad: null,
		dailyAvgSolarOutput: null
	},
	this.WeeklyReadings = {
		weeklyAccBuildingLoad: null
	},
    this.MonthlyReadings = {
		monthlyMaxDemand: null,
		monthlyAccBuildingLoad: null,
		monthlyAccYield: null,
		monthlyAccIrradiance: null
	}
}

systemPerformanceData = new SystemPerformanceData();

//**********************************************************************
//
// TEMPORARY PLACE HOLDER TO CALCULATE MAXIMUM DEMAND
// 
//**********************************************************************

let maxDemand = null;
let initialActiveEnergy = null;

//**********************************************************************
//
// NUMBER OF DATA TO CALCULATE DAILY AVERAGE SOLAR OUTPUT
// 60 nos./hr * 12 hr (7AM - 7PM) = 720
// 
//**********************************************************************

const NUMBER_OF_DAILY_SAMPLE = 720;

//**********************************************************************
//
// TIME ELAPSED BETWEEN TWO ITERATION
// 60 sec * (1hr. / 3600 sec) = 0.0167 hr
// 
//**********************************************************************

const TIME_ELAPSED = 0.0167;

//**********************************************************************
//
// PUSH SYSTEM PERFORMANCE DATA TO FIREBASE
//
//**********************************************************************

const performanceParameters = async (meterData, smartloggerData) => {
    // Time elements to calculate Maximum Demand and reset systemPerformanceData
    let minute = new Date().getMinutes();
    let hour = new Date().getHours();
    let day = new Date().getDay();
    let date = new Date().getDate();
    let time = Date.now();

    // Reset systemPerformanceData
    if ((minute === 0) && (hour === 1) && (date === 1)) {
        // Reset all the properties every month
        systemPerformanceData = new SystemPerformanceData();
    } else if ((minute === 0) && (hour === 0) && (day === 0)) {
        // Reset all the properties except monthly data
        systemPerformanceData.DailyReadings = {
			dailyMaxAmbientTemp: null,
			dailyMaxSolarTemp: null,
			dailyMaxIrradiance: null,
			dailyMaxIntake: null,
			dailyMaxSolarOutput: null,
			dailyMaxDemand: null,
			dailyAccIrradiance: null,
			dailyAccYield: null,
			dailyAccBuildingLoad: null,
			dailyAvgSolarOutput: null			
		};
        systemPerformanceData.WeeklyReadings.weeklyAccBuildingLoad = null;
    } else if ((minute === 0) && (hour === 0)) {
        // Reset daily properties
        systemPerformanceData.DailyReadings = {
			dailyMaxAmbientTemp: null,
			dailyMaxSolarTemp: null,
			dailyMaxIrradiance: null,
			dailyMaxIntake: null,
			dailyMaxSolarOutput: null,
			dailyMaxDemand: null,
			dailyAccIrradiance: null,
			dailyAccYield: null,
			dailyAccBuildingLoad: null,
			dailyAvgSolarOutput: null			
		};
    } else {
        console.log("DATA WILL RESET AT MIDNIGHT");
    }
    
    // Daily max. ambient temperature
    if ((systemPerformanceData.DailyReadings.dailyMaxAmbientTemp === null) || (systemPerformanceData.DailyReadings.dailyMaxAmbientTemp.dailyMaxAmbientTemp < smartloggerData.ambientTemp)) {
        systemPerformanceData.DailyReadings.dailyMaxAmbientTemp = {
			dailyMaxAmbientTemp: smartloggerData.ambientTemp,
			time
		}
    }

    // Daily max. module temperature
    if ((systemPerformanceData.DailyReadings.dailyMaxSolarTemp === null) || (systemPerformanceData.DailyReadings.dailyMaxSolarTemp.dailyMaxSolarTemp < smartloggerData.moduleTemp)) {
        systemPerformanceData.DailyReadings.dailyMaxSolarTemp = {
			dailyMaxSolarTemp: smartloggerData.moduleTemp,
			time
		}
    }
    
    // Daily max. Irradiance
    if ((systemPerformanceData.DailyReadings.dailyMaxIrradiance === null) || (systemPerformanceData.DailyReadings.dailyMaxIrradiance.dailyMaxIrradiance < smartloggerData.IRRsensor)) {
        systemPerformanceData.DailyReadings.dailyMaxIrradiance = {
			dailyMaxIrradiance: smartloggerData.IRRsensor,
			time
		}
    }
    
    // Daily max. Power Intake
    if ((systemPerformanceData.DailyReadings.dailyMaxIntake === null) || (systemPerformanceData.DailyReadings.dailyMaxIntake.dailyMaxIntake < meterData.intakeTNB)) {
        systemPerformanceData.DailyReadings.dailyMaxIntake = {
			dailyMaxIntake: meterData.intakeTNB,
			time
		};
    }
    
    // Daily max. Solar output
    if ((systemPerformanceData.DailyReadings.dailyMaxSolarOutput === null) || (systemPerformanceData.DailyReadings.dailyMaxSolarOutput.dailyMaxSolarOutput < smartloggerData.totalPVacPower)) {
        systemPerformanceData.DailyReadings.dailyMaxSolarOutput = {
			dailyMaxSolarOutput: smartloggerData.totalPVacPower,
			time
		}
    }
    
    // Daily maximum demand
    switch (minute) {
        case 0:
            initialActiveEnergy = meterData.activeEnergy;
            break;
        case 29:
			if (initialActiveEnergy !== null) {
				maxDemand = (meterData.activeEnergy - initialActiveEnergy) / 0.5;
			}
            break;
        case 30:
            initialActiveEnergy = meterData.activeEnergy;
            break;
        case 59:
			if (initialActiveEnergy !== null) {
				maxDemand = (meterData.activeEnergy - initialActiveEnergy) / 0.5;
			}
            break;
        default:
            break;
    }
    if (maxDemand > systemPerformanceData.DailyReadings.dailyMaxDemand) {
        systemPerformanceData.DailyReadings.dailyMaxDemand = {
			dailyMaxDemand: maxDemand,
			time
		}
    }

    // Daily accumulated Irradiance    
    systemPerformanceData.DailyReadings.dailyAccIrradiance += smartloggerData.IRRsensor * TIME_ELAPSED;
    
    // Daily accumulated yield
    systemPerformanceData.DailyReadings.dailyAccYield += smartloggerData.totalPVacPower * TIME_ELAPSED;
    
    // Daily accumulated building load
    systemPerformanceData.DailyReadings.dailyAccBuildingLoad += smartloggerData.totalBuildingLoad * TIME_ELAPSED;

    // Daily average yield
    systemPerformanceData.DailyReadings.dailyAvgSolarOutput = systemPerformanceData.DailyReadings.dailyAccYield / NUMBER_OF_DAILY_SAMPLE;
    
    // Timestamp daily readings
    systemPerformanceData.DailyReadings.time = time;
    
    // Daily performance ratio
    // NEED MORE INFO
    // systemPerformanceData.dailyPerformanceRatio = (systemPerformanceData.dailyAccYield / 6) / (panelEfficiency * areaOfArray * (systemPerformanceData.dailyAccIrradiance/6000));

    // Daily energy savings
    // NEED TARIFF INFO
    // systemPerformanceData.dailyEnergySavings = systemPerformanceData.dailyAccYield * ENERGY_TARIFF;

    // Weekly accumulated building load
    systemPerformanceData.WeeklyReadings.weeklyAccBuildingLoad += smartloggerData.totalBuildingLoad * TIME_ELAPSED;
    
    // Timestamp weekly readings
    systemPerformanceData.WeeklyReadings.time = time; 
    
    // Monthly max demand
    if (maxDemand > systemPerformanceData.MonthlyReadings.monthlyMaxDemand) {
        systemPerformanceData.MonthlyReadings.monthlyMaxDemand = {
			monthlyMaxDemand: maxDemand,
			time
		}
    }

    // Monthly accumulated building load
    systemPerformanceData.MonthlyReadings.monthlyAccBuildingLoad += smartloggerData.totalBuildingLoad * TIME_ELAPSED;

    // Monthly accumulated yield
    systemPerformanceData.MonthlyReadings.monthlyAccYield += smartloggerData.totalPVacPower * TIME_ELAPSED;

    // Monthly accumulated Irradiance
    systemPerformanceData.MonthlyReadings.monthlyAccIrradiance += smartloggerData.IRRsensor * TIME_ELAPSED;
    
    // Timestamp monthly readings
    systemPerformanceData.MonthlyReadings.time = time;

    // Monthly performance ratio
    // NEED MORE INFO
    // systemPerformanceData.monthlyPerformanceRatio = (systemPerformanceData.monthlyAccYield / 6) / (panelEfficiency * areaOfArray * (systemPerformanceData.monthlyAccIrradiance/6000));

    // Monthly energy savings
    // NEED TARIFF INFO
    // systemPerformanceData.monthlyEnergySavings = systemPerformanceData.monthlyAccYield * ENERGY_TARIFF;

    return systemPerformanceData;
}

module.exports.performanceParameters = performanceParameters;
