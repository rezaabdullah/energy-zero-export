//**********************************************************************
//
// Copyright (c) 2017-2018 Plus NRG Systems Sdn. Bhd.
//
// This software should be used as a template for future NodeJS apps. 
// Pls refer to individual modules for more information. To ensure
// quality, any update or modification on any modules should be verified
// and approved before deployment to project sites.
//
//**********************************************************************
//
// MODULES
//
// 1. Initial Configuration - In the Pipeline (Consult w/ Alvin)
// 2. Energy Parameters Query - COMPLETE (REZA)
// 3. Smartlogger Parameters Query - COMPLETE (REZA)
// 4. CONTROLLING MODBUS DEVICES - COMPLETE (REZA)
// 5. DATABASE - COMPLETE (REZA)
//
//
//**********************************************************************

const meters = require('./getEnergyMeter.js');
const pvSystem = require('./getPVSystem.js');

//**********************************************************************
//
// Project Configuration
//
//**********************************************************************

const numberOfMeters = 1;
const numberOfInverters = 19;

//**********************************************************************
//
// Entry point of the app
//
//**********************************************************************

console.log('"Dimidium facti qui coepit habet: SAPERE AUDE" - Horace');
console.log('"He who has begun is half done: DARE TO KNOW!" - Horace');

//**********************************************************************
//
// MAIN LOOP
//
//**********************************************************************

setInterval(() => {
	// Get energy parameters
    meters.getMeters(numberOfMeters).then(energyParameters => {
		//let energyParameters = energyMeterArray;
		console.log(`energyParameters:, ${energyParameters}`);
	}).catch(error => {
		console.log(error.message)
	});
	// Get PV system parameters
	pvSystem.getPVSystemParameters(numberOfInverters).then(pvSystemArray => {
		//let pvSystemParameters = pvSystemArray;
		console.log(`pvSystemParameters:', ${pvSystemArray}`);
	}).catch(error => {
		console.log(error.message);
	})
}, 30000);
