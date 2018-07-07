//**********************************************************************
//
// SYSTEM PERFORMANCE DATA CONSTRUCTOR
// 
//**********************************************************************

function SystemPerformanceData() {
    this.dailyMaxAmbientTemp = null,
    this.dailyMaxSolarTemp = null,
    this.dailyMaxIrradiance = null,
    this.dailyMaxIntake = null,
    this.dailyMaxSolarOutput = null,
    this.dailyMaxDemand = null,
    this.dailyAccIrradiance = null,
    this.dailyAccYield = null,
    this.dailyAccBuildingLoad = null,
    this.dailyAvgSolarOutput = null,   
    this.dailyPerformanceRatio = null,
    this.dailyEnergySavings = null,
    this.weeklyAccBuildingLoad = null,
    this.monthlyAccBuildingLoad = null,
    this.monthlyMaxDemand = null,
    this.monthlyAccYield = null,
    this.monthlyAccIrradiance = null,
    this.monthlyPerformanceRatio = null,
    this.monthlyEnergySavings = null
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
// 6 nos./hr * 12 hr (7AM - 7PM) = 72
// 
//**********************************************************************

const NUMBER_OF_DAILY_SAMPLE = 72;

//**********************************************************************
//
// PUSH SYSTEM PERFORMANCE DATA TO FIREBASE
//
//**********************************************************************

const performanceParameters = async (meterData, smartloggerData) => {
    // Time
    let minute = new Date().getMinutes();
    let hour = new Date().getHours();
    let day = new Date().getDay();
    let date = new Date().getDate();

    // Reset systemPerformanceData
    if ((minute === 0) && (hour === 0) && (day === 0) && (date === 0)) {
        // Reset all the properties every month
        systemPerformanceData = new SystemPerformanceData();
    } else if ((minute === 0) && (hour === 0) && (day === 0)) {
        // Reset all the properties except monthly data
        let count = 0;
        for (let property in systemPerformanceData) {
            if (count < 13) {
                systemPerformanceData[property] = null;
            }
            count++;
        }
    } else if ((minute === 0) && (hour === 0)) {
        // Reset daily properties
        let count = 0;
        for (let property in systemPerformanceData) {
            if (count < 12) {
                systemPerformanceData[property] = null;
            }
            count++;
        }
    } else {
        console.log("Nothing to reset");
    }
    
    // Daily max. ambient temperature
    if ((systemPerformanceData.dailyMaxAmbientTemp === null) || (systemPerformanceData.dailyMaxAmbientTemp < smartloggerData.ambientTemp)) {
        systemPerformanceData.dailyMaxAmbientTemp = smartloggerData.ambientTemp;
    }

    // Daily max. module temperature
    if ((systemPerformanceData.dailyMaxSolarTemp === null) || (systemPerformanceData.dailyMaxSolarTemp < smartloggerData.moduleTemp)) {
        systemPerformanceData.dailyMaxSolarTemp = smartloggerData.moduleTemp;
    }
    
    // Daily max. Irradiance
    if ((systemPerformanceData.dailyMaxIrradiance === null) || (systemPerformanceData.dailyMaxIrradiance < smartloggerData.IRRsensor)) {
        systemPerformanceData.dailyMaxIrradiance = smartloggerData.IRRsensor;
    }
    
    // Daily max. Power Intake
    if ((systemPerformanceData.dailyMaxIntake === null) || (systemPerformanceData.dailyMaxIntake < meterData.intakeTNB)) {
        systemPerformanceData.dailyMaxIntake = meterData.intakeTNB;
    }
    
    // Daily max. Solar output
    if ((systemPerformanceData.dailyMaxSolarOutput === null) || (systemPerformanceData.dailyMaxSolarOutput < smartloggerData.totalPVacPower)) {
        systemPerformanceData.dailyMaxSolarOutput = smartloggerData.totalPVacPower;
    }
    
    switch (minute) {
        case 0:
            initialActiveEnergy = meterData.activeEnergy;
            break;
        case 29:
            maxDemand = (meterData.activeEnergy - initialActiveEnergy) / 0.5;
            break;
        case 30:
            initialActiveEnergy = meterData.activeEnergy;
            break;
        case 59:
            maxDemand = (meterData.activeEnergy - initialActiveEnergy) / 0.5;
            break;
        default:
            console.log("Max. demand will be 30 minutes");
            break;
    }
    if (maxDemand > systemPerformanceData.dailyMaxDemand) {
        systemPerformanceData.dailyMaxDemand = maxDemand;
    }

    // Daily accumulated Irradiance
    systemPerformanceData.dailyAccIrradiance += smartloggerData.IRRsensor;
    
    // Daily accumulated yield
    systemPerformanceData.dailyAccYield += smartloggerData.totalPVacPower;
    
    // Daily accumulated building load
    systemPerformanceData.dailyAccBuildingLoad += smartloggerData.totalBuildingLoad;

    // Daily average yield
    systemPerformanceData.dailyAvgSolarOutput = systemPerformanceData.dailyAccYield / NUMBER_OF_DAILY_SAMPLE;
    
    // Daily performance ratio
    // NEED MORE INFO
    // systemPerformanceData.dailyPerformanceRatio = (systemPerformanceData.dailyAccYield / 6) / (panelEfficiency * areaOfArray * (systemPerformanceData.dailyAccIrradiance/6000));

    // Daily energy savings
    // NEED TARIFF INFO
    // systemPerformanceData.dailyEnergySavings = systemPerformanceData.dailyAccYield * ENERGY_TARIFF;

    // Weekly accumulated building load
    systemPerformanceData.weeklyAccBuildingLoad += smartloggerData.totalBuildingLoad;   
    
    // Monthly max demand
    if (maxDemand > systemPerformanceData.monthlyMaxDemand) {
        systemPerformanceData.monthlyMaxDemand = maxDemand;
    }

    // Monthly accumulated building load
    systemPerformanceData.monthlyAccBuildingLoad += smartloggerData.totalBuildingLoad;

    // Monthly accumulated yield
    systemPerformanceData.monthlyAccYield += smartloggerData.totalBuildingLoad;

    // Monthly accumulated Irradiance
    systemPerformanceData.monthlyAccIrradiance += smartloggerData.IRRsensor;

    // Monthly performance ratio
    // NEED MORE INFO
    // systemPerformanceData.monthlyPerformanceRatio = (systemPerformanceData.monthlyAccYield / 6) / (panelEfficiency * areaOfArray * (systemPerformanceData.monthlyAccIrradiance/6000));

    // Monthly energy savings
    // NEED TARIFF INFO
    // systemPerformanceData.monthlyEnergySavings = systemPerformanceData.monthlyAccYield * ENERGY_TARIFF;

    return systemPerformanceData;
}

module.exports.performanceParameters = performanceParameters;