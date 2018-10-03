//**********************************************************************
//
// SYSTEM PERFORMANCE DATA CONSTRUCTOR
// 
//**********************************************************************

function SystemPerformanceData() {
    this.DailyReadings = {
        dailyMaxAmbientTemp : null,
        dailyMinAmbientTemp : null,
        dailyMaxSolarTemp : null,
        dailyMaxIrradiance : null,
        dailyMaxIntake : null,
        dailyMaxSolarOutput : null,
        dailyMaxDemand : null,
        dailyAccIrradiance : null,
        dailyAccYield : null,
        dailyAccBuildingLoad : null,
        dailyInverterPower : null,
        dailyMinDemand : null,
        dailyTNBintake : null,
        dailyAvgSolarOutput : null,
        dailyAvgIntake : null,
        dailyAvgBuildingLoad : null,
        dailyPerformanceRatio : null,
        dailyEnergySavings : null,
        dailyPSH : null
    },
    this.WeeklyReadings = {
        weeklyAccBuildingLoad : null,
        weeklyAccYield : null,
        weeklyTNBintake : null
    },
    this.MonthlyReadings = {
        monthlyMaxDemand : null,
        monthlyAccBuildingLoad : null,
        monthlyAccYield : null,
        monthlyAccIrradiance : null,
        monthlyMinDemand : null,
        monthlyTNBintake : null,
        monthlyPerformanceRatio : null,
        monthlyEnergySavings : null,
        monthlyPSH : null,
        monthlyAvgDemand : null
    },
    this.TotalReadings = {
        totalAccYield : null,
        totalAccCO2 : null,
    }
}

var systemPerformanceData = new SystemPerformanceData();

//**********************************************************************
//
// TEMPORARY PLACE HOLDER TO CALCULATE MAXIMUM DEMAND
// 
//**********************************************************************

let maxDemand = null;
let initialActiveEnergy = null;
let dailyTNBintake_energy = null;
let dailyIntakeTNB_power = null;
let weeklyTNBintake_energy = null;
let monthlyTNBintake_energy = null;
let minDemand = null;
let count = null;
let cumulativePower = null;

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

const performanceParameters = async (meterData, smartloggerData, solarSystemConfig) => {
    // Time elements to calculate Maximum Demand and reset systemPerformanceData
    let minute = new Date().getMinutes();
    let hour = new Date().getHours();
    let day = new Date().getDay();
    let date = new Date().getDate();
    let time = Date.now();
    
    // Reset systemPerformanceData
    //if ((minute === 0) && (hour === 1) && (date === 1)) {
    // if ((minute === 0) && (hour === 0) && (date === 1)) {
    if ((minute === 0) && (hour === 0) && (date === 1)) {
        // Reset all the properties every month
        systemPerformanceData.DailyReadings.dailyMaxAmbientTemp = null;
        systemPerformanceData.DailyReadings.dailyMinAmbientTemp = null;
        systemPerformanceData.DailyReadings.dailyMaxSolarTemp = null;
        systemPerformanceData.DailyReadings.dailyMaxIrradiance = null;
        systemPerformanceData.DailyReadings.dailyMaxIntake = null;
        systemPerformanceData.DailyReadings.dailyMaxSolarOutput = null;
        systemPerformanceData.DailyReadings.dailyMaxDemand = null;
        systemPerformanceData.DailyReadings.dailyAccIrradiance = null;
        systemPerformanceData.DailyReadings.dailyAccYield = null;
        systemPerformanceData.DailyReadings.dailyAccBuildingLoad = null;
        systemPerformanceData.DailyReadings.dailyInverterPower = null;
        systemPerformanceData.DailyReadings.dailyMinDemand = null;
        systemPerformanceData.DailyReadings.dailyTNBintake = null;
        systemPerformanceData.DailyReadings.dailyAvgSolarOutput = null;
        systemPerformanceData.DailyReadings.dailyAvgIntake = null;
        systemPerformanceData.DailyReadings.dailyAvgBuildingLoad = null;
        systemPerformanceData.DailyReadings.dailyEnergySavings = null;
        systemPerformanceData.DailyReadings.dailyPerformanceRatio = null;
        systemPerformanceData.DailyReadings.dailyPSH = null;
        systemPerformanceData.WeeklyReadings.weeklyAccBuildingLoad = null;
        systemPerformanceData.WeeklyReadings.weeklyAccYield = null;
        systemPerformanceData.WeeklyReadings.weeklyTNBintake = null;
        systemPerformanceData.MonthlyReadings.monthlyMaxDemand = null;
        systemPerformanceData.MonthlyReadings.monthlyAccBuildingLoad = null;
        systemPerformanceData.MonthlyReadings.monthlyAccYield = null;
        systemPerformanceData.MonthlyReadings.monthlyAccIrradiance = null;
        systemPerformanceData.MonthlyReadings.monthlyMinDemand = null;
        systemPerformanceData.MonthlyReadings.monthlyTNBintake = null;
        systemPerformanceData.MonthlyReadings.monthlyEnergySavings = null;
        systemPerformanceData.MonthlyReadings.monthlyPerformanceRatio = null;
        systemPerformanceData.MonthlyReadings.monthlyPSH = null;
        systemPerformanceData.MonthlyReadings.monthlyAvgDemand = null;
        monthlyTNBintake_energy = null;
    //} else if ((minute === 0) && (hour === 1) && (day === 0)) {
    // } else if ((minute === 50) && (hour === 23) && (day === 0)) {
    } else if ((minute === 0) && (hour === 0) && (day === 0)) {
        // Reset all the properties except monthly data
        systemPerformanceData.DailyReadings.dailyMaxAmbientTemp = null;
        systemPerformanceData.DailyReadings.dailyMaxAmbientTemp = null;
        systemPerformanceData.DailyReadings.dailyMinAmbientTemp = null;
        systemPerformanceData.DailyReadings.dailyMaxSolarTemp = null;
        systemPerformanceData.DailyReadings.dailyMaxIrradiance = null;
        systemPerformanceData.DailyReadings.dailyMaxIntake = null;
        systemPerformanceData.DailyReadings.dailyMaxSolarOutput = null;
        systemPerformanceData.DailyReadings.dailyMaxDemand = null;
        systemPerformanceData.DailyReadings.dailyAccIrradiance = null;
        systemPerformanceData.DailyReadings.dailyAccYield = null;
        systemPerformanceData.DailyReadings.dailyAccBuildingLoad = null;
        systemPerformanceData.DailyReadings.dailyInverterPower = null;
        systemPerformanceData.DailyReadings.dailyMinDemand = null;
        systemPerformanceData.DailyReadings.dailyTNBintake = null;
        systemPerformanceData.DailyReadings.dailyAvgSolarOutput = null;
        systemPerformanceData.DailyReadings.dailyAvgIntake = null;
        systemPerformanceData.DailyReadings.dailyMinAmbientTempt = null;
        systemPerformanceData.DailyReadings.dailyAvgBuildingLoad = null;
        systemPerformanceData.DailyReadings.dailyEnergySavings = null;
        systemPerformanceData.DailyReadings.dailyPerformanceRatio = null;
        systemPerformanceData.DailyReadings.dailyPSH = null;
        systemPerformanceData.WeeklyReadings.weeklyAccBuildingLoad = null;
        systemPerformanceData.WeeklyReadings.weeklyAccYield = null;
        systemPerformanceData.WeeklyReadings.weeklyTNBintake = null;
		weeklyTNBintake_energy = null;
    //} else if ((minute === 0) && (hour === 1)) {
    // } else if ((minute === 50) && (hour === 23)) {
	} else if ((minute === 0) && (hour === 0)) {	
        // Reset daily properties
        systemPerformanceData.DailyReadings.dailyMaxAmbientTemp = null;
        systemPerformanceData.DailyReadings.dailyMaxAmbientTemp = null;
        systemPerformanceData.DailyReadings.dailyMinAmbientTemp = null;
        systemPerformanceData.DailyReadings.dailyMaxSolarTemp = null;
        systemPerformanceData.DailyReadings.dailyMaxIrradiance = null;
        systemPerformanceData.DailyReadings.dailyMaxIntake = null;
        systemPerformanceData.DailyReadings.dailyMaxSolarOutput = null;
        systemPerformanceData.DailyReadings.dailyMaxDemand = null;
        systemPerformanceData.DailyReadings.dailyAccIrradiance = null;
        systemPerformanceData.DailyReadings.dailyAccYield = null;
        systemPerformanceData.DailyReadings.dailyAccBuildingLoad = null;
        systemPerformanceData.DailyReadings.dailyInverterPower = null;
        systemPerformanceData.DailyReadings.dailyMinDemand = null;
        systemPerformanceData.DailyReadings.dailyTNBintake = null;
        systemPerformanceData.DailyReadings.dailyAvgSolarOutput = null;
        systemPerformanceData.DailyReadings.dailyAvgIntake = null;
        systemPerformanceData.DailyReadings.dailyMinAmbientTempt = null;
        systemPerformanceData.DailyReadings.dailyAvgBuildingLoad = null;
        systemPerformanceData.DailyReadings.dailyEnergySavings = null;
        systemPerformanceData.DailyReadings.dailyPerformanceRatio = null;
        systemPerformanceData.DailyReadings.dailyPSH = null;
        dailyTNBintake_energy = null;
        count = null;
        cumulativePower= null;
    } else {
		// console.log("systemPerformanceData will reset at midnight");
    }   

//------------------------------------------------------------------------------------------------------------------------------------------------------------------
//
//              Daily Readings
//
//------------------------------------------------------------------------------------------------------------------------------------------------------------------

    // Daily max. ambient temperature
    if ((systemPerformanceData.DailyReadings.dailyMaxAmbientTemp === null) || (systemPerformanceData.DailyReadings.dailyMaxAmbientTemp.dailyMaxAmbientTemp < smartloggerData.ambientTemp)) {
        systemPerformanceData.DailyReadings.dailyMaxAmbientTemp = {
            dailyMaxAmbientTemp: smartloggerData.ambientTemp,
            time
        }
    }

    // Daily minimum ambient temperature
    if ((systemPerformanceData.DailyReadings.dailyMinAmbientTemp === null) || (systemPerformanceData.DailyReadings.dailyMinAmbientTemp.dailyMinAmbientTemp > smartloggerData.ambientTemp)) {
        systemPerformanceData.DailyReadings.dailyMinAmbientTemp = {
            dailyMinAmbientTemp: smartloggerData.ambientTemp,
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
    
    //record daily maximum demand from 8am to 10pm
    //if (hour >= 8 && hour <=22){
    if (hour >= 8 && hour <=21){ 
		if (maxDemand !== null){
			if (systemPerformanceData.DailyReadings.dailyMaxDemand === null) {
				systemPerformanceData.DailyReadings.dailyMaxDemand = {
					dailyMaxDemand: maxDemand,
					time
				}
			} else {
				if (maxDemand > systemPerformanceData.DailyReadings.dailyMaxDemand.dailyMaxDemand) {
					systemPerformanceData.DailyReadings.dailyMaxDemand = {
						dailyMaxDemand: maxDemand,
						time
					}
				}
			}
		}
	}
	
    /*
    if (systemPerformanceData.dailyMaxDemand === null) {
        systemPerformanceData.dailyMaxDemand = {
			dailyMaxDemand: maxDemand,
			time
		}
    } else {
		if (maxDemand > systemPerformanceData.dailyMaxDemand.dailyMaxDemand) {
			systemPerformanceData.dailyMaxDemand = {
				dailyMaxDemand: maxDemand,
				time
			}
		}
	}
	*/ 
	
    // Daily minimum demand record from 8am to 10pm
    //if (hour >= 8 && hour <=22){
    if (hour >= 8 && hour <=21){
		if (maxDemand !== null){
			if (systemPerformanceData.DailyReadings.dailyMinDemand === null) {
				systemPerformanceData.DailyReadings.dailyMinDemand = {
					dailyMinDemand: maxDemand,
					time
				}
			} else {
				if (maxDemand < systemPerformanceData.DailyReadings.dailyMinDemand.dailyMinDemand) {
					systemPerformanceData.DailyReadings.dailyMinDemand = {
						dailyMinDemand: maxDemand,
						time
					}
				}
			}
		}
	}

    // Daily accumulated Irradiance    
    systemPerformanceData.DailyReadings.dailyAccIrradiance += smartloggerData.IRRsensor * TIME_ELAPSED;
    //console.log(systemPerformanceData.dailyAccIrradiance);
    
    // Daily accumulated yield
    systemPerformanceData.DailyReadings.dailyAccYield += smartloggerData.totalPVacPower * TIME_ELAPSED;

    // Daily accumulated building load
    systemPerformanceData.DailyReadings.dailyAccBuildingLoad += smartloggerData.totalBuildingLoad * TIME_ELAPSED;

    // Daily average yield
    if (smartloggerData.totalPVacPower != null ) {
        cumulativePower = cumulativePower +  smartloggerData.totalPVacPower;
        count++;
        systemPerformanceData.DailyReadings.dailyAvgSolarOutput = cumulativePower/count;
    }
    //systemPerformanceData.DailyReadings.dailyAvgSolarOutput = systemPerformanceData.DailyReadings.dailyAccYield / NUMBER_OF_DAILY_SAMPLE;
    
    // Daily accumulated inverter power output
    systemPerformanceData.DailyReadings.dailyInverterPower += smartloggerData.totalPVacPower;
    
    // Daily average building Load
    systemPerformanceData.DailyReadings.dailyAvgBuildingLoad = systemPerformanceData.DailyReadings.dailyAccBuildingLoad / (NUMBER_OF_DAILY_SAMPLE * 2); 
        
    // Daily TNB intake (kWh, NOT SAME AS meterData.intakeTNB (kW))
    if (systemPerformanceData.DailyReadings.dailyTNBintake === null) {
        dailyTNBintake_energy = meterData.activeEnergy;
        systemPerformanceData.DailyReadings.dailyTNBintake = meterData.activeEnergy;
    } else {
        systemPerformanceData.DailyReadings.dailyTNBintake = meterData.activeEnergy - dailyTNBintake_energy;
    }
    
    // Daily average intake
    dailyIntakeTNB_power += meterData.intakeTNB;
    systemPerformanceData.DailyReadings.dailyAvgIntake = dailyIntakeTNB_power / (NUMBER_OF_DAILY_SAMPLE * 2);
    
    // Daily performance ratio
    if (systemPerformanceData.DailyReadings.dailyAccIrradiance !== 0) {
		systemPerformanceData.DailyReadings.dailyPerformanceRatio = ((systemPerformanceData.DailyReadings.dailyAccYield / 6) / 
			((solarSystemConfig.panelEfficiency/100) * solarSystemConfig.arrayArea * (systemPerformanceData.DailyReadings.dailyAccIrradiance/6000)))*100;
	}
											
    // Daily energy savings
    systemPerformanceData.DailyReadings.dailyEnergySavings = systemPerformanceData.DailyReadings.dailyAccYield * solarSystemConfig.energyTariff;

    // Daily peak sun hours
    systemPerformanceData.DailyReadings.dailyPSH = systemPerformanceData.DailyReadings.dailyAccYield / solarSystemConfig.capacity;
    
    systemPerformanceData.DailyReadings.time = Date.now();
    systemPerformanceData.DailyReadings.month = new Date().getMonth() + 1;
	systemPerformanceData.DailyReadings.year = new Date().getFullYear();

//------------------------------------------------------------------------------------------------------------------------------------------------------------------
//
//              Weekly Readings
//
//------------------------------------------------------------------------------------------------------------------------------------------------------------------

    // Weekly accumulated building load
    systemPerformanceData.WeeklyReadings.weeklyAccBuildingLoad += smartloggerData.totalBuildingLoad * TIME_ELAPSED;

    // Weekly accumulated yield
    systemPerformanceData.WeeklyReadings.weeklyAccYield += smartloggerData.totalPVacPower * TIME_ELAPSED;
    
    // Weekly TNB intake (kWh, NOT SAME AS meterData.intakeTNB (kW))
    if (systemPerformanceData.WeeklyReadings.weeklyTNBintake === null) {
        weeklyTNBintake_energy = meterData.activeEnergy;
        systemPerformanceData.WeeklyReadings.weeklyTNBintake = meterData.activeEnergy;
    } else {
        systemPerformanceData.WeeklyReadings.weeklyTNBintake = meterData.activeEnergy - weeklyTNBintake_energy;
    }

    systemPerformanceData.WeeklyReadings.time = Date.now();
    systemPerformanceData.WeeklyReadings.month = new Date().getMonth() + 1;
	systemPerformanceData.WeeklyReadings.year = new Date().getFullYear();

//------------------------------------------------------------------------------------------------------------------------------------------------------------------
//
//              Monthly Readings
//
//------------------------------------------------------------------------------------------------------------------------------------------------------------------

    // Monthly max demand record from 8am to 10pm
    if (hour >= 8 && hour <=21){
    // if (hour >= 8 && hour <=22){ 
		if (maxDemand !== null){
			console.log("maxDemand:", maxDemand);
			if (systemPerformanceData.MonthlyReadings.monthlyMaxDemand === null) {
				console.log("Setting monthlyMaxDemand from null");
				systemPerformanceData.MonthlyReadings.monthlyMaxDemand = {
					monthlyMaxDemand: maxDemand,
					time
				}
			} else {
				console.log("Setting monthlyMaxDemand from other");
				if (maxDemand > systemPerformanceData.MonthlyReadings.monthlyMaxDemand.monthlyMaxDemand) {
					systemPerformanceData.MonthlyReadings.monthlyMaxDemand = {
						monthlyMaxDemand: maxDemand,
						time
					}
				}
			}
		}
	}
	
    // Monthly minimum Demand record from 8am to 10pm
    if (hour >= 8 && hour <=21){
    // if (hour >= 8 && hour <=22){ 
		if (maxDemand !== null){
			if (systemPerformanceData.MonthlyReadings.monthlyMinDemand === null) {
				systemPerformanceData.MonthlyReadings.monthlyMinDemand = {
					monthlyMinDemand: maxDemand,
					time
				}
			} else {
				if (maxDemand < systemPerformanceData.MonthlyReadings.monthlyMinDemand.monthlyMinDemand) {
					systemPerformanceData.MonthlyReadings.monthlyMinDemand = {
						monthlyMinDemand: maxDemand,
						time
					}
				}
			}
		}
	}

    // Monthly accumulated building load
    systemPerformanceData.MonthlyReadings.monthlyAccBuildingLoad += smartloggerData.totalBuildingLoad * TIME_ELAPSED;

    // Monthly accumulated yield
    systemPerformanceData.MonthlyReadings.monthlyAccYield += smartloggerData.totalPVacPower * TIME_ELAPSED;
 
    // Monthly accumulated Irradiance
    systemPerformanceData.MonthlyReadings.monthlyAccIrradiance += smartloggerData.IRRsensor * TIME_ELAPSED;
     
    // Monthly TNB intake
    if (systemPerformanceData.MonthlyReadings.monthlyTNBintake === null) {
        monthlyTNBintake_energy = meterData.activeEnergy;
        systemPerformanceData.MonthlyReadings.monthlyTNBintake = meterData.activeEnergy;
    } else {
        systemPerformanceData.MonthlyReadings.monthlyTNBintake = meterData.activeEnergy - monthlyTNBintake_energy;
    }

    // Monthly performance ratio
    if (systemPerformanceData.MonthlyReadings.monthlyAccIrradiance !== 0) {
		systemPerformanceData.MonthlyReadings.monthlyPerformanceRatio = ((systemPerformanceData.MonthlyReadings.monthlyAccYield / 6) / 
			((solarSystemConfig.panelEfficiency/100) * solarSystemConfig.arrayArea * (systemPerformanceData.MonthlyReadings.monthlyAccIrradiance/6000)))*100;
	}

    // Monthly energy savings
    systemPerformanceData.MonthlyReadings.monthlyEnergySavings = systemPerformanceData.MonthlyReadings.monthlyAccYield * solarSystemConfig.energyTariff;

    // Monthly peak sun hours
    systemPerformanceData.MonthlyReadings.monthlyPSH = systemPerformanceData.MonthlyReadings.monthlyAccYield / solarSystemConfig.capacity;
    
    // Monthly average demand
    //systemPerformanceData.MonthlyReadings.monthlyAvgDemand = (systemPerformanceData.MonthlyReadings.monthlyMaxDemand.monthlyMaxDemand + systemPerformanceData.MonthlyReadings.monthlyMinDemand.monthlyMinDemand) / 2;
    if ((systemPerformanceData.MonthlyReadings.monthlyMaxDemand != null) && (systemPerformanceData.MonthlyReadings.monthlyMinDemand != null)) {
        systemPerformanceData.MonthlyReadings.monthlyAvgDemand = (systemPerformanceData.MonthlyReadings.monthlyMaxDemand.monthlyMaxDemand + systemPerformanceData.MonthlyReadings.monthlyMinDemand.monthlyMinDemand) / 2;
    }

    systemPerformanceData.MonthlyReadings.time = Date.now();
    systemPerformanceData.MonthlyReadings.month = new Date().getMonth() + 1;
    systemPerformanceData.MonthlyReadings.year = new Date().getFullYear();
    
//------------------------------------------------------------------------------------------------------------------------------------------------------------------
//
//              Total Readings
//
//------------------------------------------------------------------------------------------------------------------------------------------------------------------

    // Total accumulated yield
    systemPerformanceData.TotalReadings.totalAccYield += smartloggerData.totalPVacPower * TIME_ELAPSED;

    // Total accumulated carbon dioxide
    systemPerformanceData.TotalReadings.totalAccCO2 += (smartloggerData.totalPVacPower * TIME_ELAPSED) * 0.35156;

    return systemPerformanceData;
}

module.exports.performanceParameters = performanceParameters;