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
// 6. OFFLINE DATA MANAGEMENT - COMPLETE (REZA)
// 7. AUTO STARTUP NODE SCRIPT - COMPLETE (REZA)
//
//**********************************************************************

//**********************************************************************
//
// NPM MODULES
//
//**********************************************************************

const ModbusRTU = require('modbus-serial');
const firebase = require('firebase');

//**********************************************************************
//
// ADDITIONAL MODULES
//
//**********************************************************************

const getMeters = require('./getEnergyMeter.js');
// const pvSystem = require('./getPVSystem.js');

//**********************************************************************
//
// INITIAL CONFIGURATIONS: MODBUS-RTU RS-485
// DIGITAL POWER METER
//
//**********************************************************************

var energyMeter = new ModbusRTU();
energyMeter.connectRTUBuffered('/dev/ttyAMA0', {baudRate: 9600}, function(error, data) {
	if (error) {
		console.log(`Cannot initialize serial port: ${error}`);
	} else if (data) {
		console.log('Serial port has been successfully initialized', data);
	}
});

//**********************************************************************
//
// INITIAL CONFIGURATIONS: MODBUS RTU TCP/IP
// HUAWEI SMARTLOGGER 
//
//**********************************************************************

var smartLogger = new ModbusRTU();
smartLogger.connectTCP("192.168.54.10", {port: 502}, function(error, data) {
	if (error) {
		console.log(`Cannot initialize TCP/IP port: ${error}`);
	} else if (data) {
		console.log('TCP/IP port has been successfully initialized', data);
	}
});

//**********************************************************************
//
// INITIAL CONFIGURATIONS: FIREBASE
// REALTIME DATABASE
//
//**********************************************************************

var config = {
	apiKey: "AIzaSyBpzfNgXNeKz8X0CQBG29W3R8CsXVh8pwI",
    authDomain: "source-57d08.firebaseapp.com",
    databaseURL: "https://source-57d08.firebaseio.com",
    projectId: "source-57d08",
    storageBucket: "source-57d08.appspot.com",
};
firebase.initializeApp(config);
var projectDatabase = firebase.database();

//**********************************************************************
//
// CHECK INTERNET CONNECTION
//
//**********************************************************************

const connectedRef = firebase.database().ref(".info/connected");
connectedRef.on("value", function(snap) {
    if (snap.val() === true) {
        connectState = snap.val();
    } else {
        connectState = false;
        console.log(typeof connectState);
    }
});

//**********************************************************************
//
// PROJECT CONFIGURATION: DIGITAL POWER METER
//
//**********************************************************************

const numberOfMeters = 1;
const numberOfInverters = 19;

//**********************************************************************
//
// ERROR COUNTER TO HANDLE DATA PACKET LOSS
//
//**********************************************************************

var errorCount = null;

//**********************************************************************
//
// ENTRY POINT OF THE APP
//
//**********************************************************************

console.log('"Dimidium facti qui coepit habet: SAPERE AUDE" - Horace');
console.log('"He who has begun is half done: DARE TO KNOW!" - Horace');

//**********************************************************************
//
// MAIN FUNCTION
//
//**********************************************************************

const main = async () => {
	try {
		console.log('Inside main');
		getMeters.getEnergyParameters(numberOfMeters);
		// console.log('Get PV System');
		// console.log('Zero export control');
		// console.log('Push data to cloud');
	} catch (error) {
		console.log(error.message);
	} finally {
		console.log('Done');
		await delay(5000);
		main();
	}
};

//**********************************************************************
//
// DELAY
//
//**********************************************************************

const delay = microSecond => new Promise(resolve => setTimeout(resolve, microSecond));

delay(30000).then(() => {
	main();
});
// main();

// (() => {
// 	// Get energy parameters
//     meters.getMeters(numberOfMeters).then(energyParameters => {
// 		//let energyParameters = energyMeterArray;
// 		console.log(`energyParameters:, ${energyParameters}`);
// 	}).catch(error => {
// 		console.log(error.message)
// 	});
// 	// Get PV system parameters
// 	pvSystem.getPVSystemParameters(numberOfInverters).then(pvSystemArray => {
// 		//let pvSystemParameters = pvSystemArray;
// 		console.log(`pvSystemParameters:', ${pvSystemArray}`);
// 	}).catch(error => {
// 		console.log(error.message);
// 	})
// }, 30000);
