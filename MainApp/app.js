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
// 1. Energy Parameters Query - COMPLETE (REZA)
// 2. Smartlogger Parameters Query - COMPLETE (REZA)
// 3. CONTROLLING MODBUS DEVICES - COMPLETE (REZA)
// 4. DATABASE - COMPLETE (REZA)
// 5. OFFLINE DATA MANAGEMENT - COMPLETE (REZA)
// 6. AUTO STARTUP NODE SCRIPT - COMPLETE (REZA)
//
// Just wishful thinking - what if we could initiate through Firebase & GUI/HMI
//
//**********************************************************************

//**********************************************************************
//
// NPM MODULES
//
//**********************************************************************

const ModbusRTU = require("modbus-serial");
const awsIot = require("aws-iot-device-sdk");
const levelStore = require("mqtt-level-store");
const levelManager = levelStore("./store");

//**********************************************************************
//
// ADDITIONAL MODULES
//
//**********************************************************************

const getMeters = require("./getEnergyMeter.js");
const getSolar = require("./getPVSystem.js");
const solarOutputControl = require("./controlPowerOutput.js");
const manageDatabase = require("./manageDatabase.js");
const performanceData = require("./processData.js");
const payload = require("./payload.js").payload;

//**********************************************************************
//
// INITIAL CONFIGURATIONS: MODBUS-RTU RS-485
// DIGITAL POWER METER
//
//**********************************************************************

var energyMeter = new ModbusRTU();
energyMeter.connectRTUBuffered("/dev/ttyAMA0", {baudRate: 9600}, function(error, success) {
 	if (error) {
 		console.log("Serial Port initialization unsuccessful");
 	} else {
 		console.log("Serial port initialization successful");
 	}
});

//**********************************************************************
//
// INITIAL CONFIGURATIONS: MODBUS RTU TCP/IP
// HUAWEI SMARTLOGGER 
//
//**********************************************************************

var smartlogger = new ModbusRTU();
smartlogger.connectTCP("10.10.0.61", {port: 502}, function(error, data) {
	if (error) {
 		console.log("TCP/IP port initialization unsuccessful");
 	} else {
 		console.log("TCP/IP port initialization successful");
	}
});

//**********************************************************************
//
// INITIAL CONFIGURATIONS: AWS
// REALTIME DATABASE
//
//**********************************************************************

const path = "./certs/";
const device = awsIot.device({
  incomingStore: levelManager.incoming,
  outgoingStore: levelManager.outgoing,
  keyPath: `${path}449da88e49-private.pem.key`,
  certPath: `${path}449da88e49-certificate.pem.crt`,
  caPath: `${path}AmazonRootCA1.pem`,
  clientId: "MyRaspberryPi",
  host: "a3j1bzslspz95c-ats.iot.ap-southeast-1.amazonaws.com",
  offlineQueueing: false,
  port: 8883
});

//**********************************************************************
//
// 					CHECK INTERNET CONNECTION
//
//**********************************************************************

device.on("connect", function() {
  console.log("connected");
});

device.on("message", function(topic, payload) {
  console.log("receiving message");
  //console.log('message', topic, payload.toString());
});

device.on("close", function() {
  console.log("disconnected");
  //console.log('disconnected', arguments);
});

device.on("error", function() {
  //console.log('error', arguments);
});

device.on("reconnect", function() {
  console.log("reconnect...");
  //console.log('reconnect', arguments);
});

device.on("timeout", function() {
  //console.log('timeout', arguments);
});

//**********************************************************************
//
// PROJECT CONFIGURATION: DIGITAL POWER METER
//
//**********************************************************************

const numberOfMeters = 1;
const numberOfInverters = 19;
var pubOpts = { qos: 1 };
var interval = null;
var timeInterval = 10; // seconds
var dat = new Date();

//**********************************************************************
//
// MAIN FUNCTION
//
//**********************************************************************

const main = async () => {
	try {
		let allMeterParameters = await getMeters.getEnergyParameters(energyMeter, numberOfMeters);
		let weatherStationObject = await getSolar.getWeatherData(smartlogger);
		let allInverterParameters = await getSolar.getInverters(smartlogger, numberOfInverters);
		let allPVParameters = await getSolar.getSmartlogger(smartlogger);
		let limitPVOutput = await solarOutputControl.adjustSolarOutput(smartlogger, allMeterParameters.Meter1.intakeTNB, allPVParameters.SmartLogger);
		//let systemPerformance = await performanceData.performanceParameters(allMeterParameters.Meter1, allPVParameters.SmartLogger, solarSystemConfig);
		//manageDatabase.manageData(projectDatabase, connectionStatus, baselineControl, allMeterParameters, allPVParameters, systemPerformance);

		//console.log(payload);
		//console.log(payload.logger);
		//console.log(payload.inverter);
		console.log(payload.powerMeter);
		
/*
		payload.logger.locationId = "xxxxx-xxx-xxx-xxx-l"; // take from admin panel
		payload.logger.lotId = "xxxxx-xxx-xxx-xxx-lo"; // take from admin panel
		payload.logger.companyId = "xxxxx-xxx-xxx-xxx-c"; // take from admin panel
		payload.logger.deviceId = "xxxxx-xxx-xxx-xxx-d"; // take from admin panel
		payload.logger.createdAt = dat;
		payload.logger.updatedAt = dat;
		payload.logger.powerAdjustment = allPVParameters.SmartLogger.activeAdjustment;
		payload.logger.ambientTemp = allPVParameters.SmartLogger.ambientTemp;
		payload.logger.moduleTemp = allPVParameters.SmartLogger.moduleTemp;
		payload.logger.irrSensor = allPVParameters.SmartLogger.IRRsensor;
		payload.logger.totalBuildingLoad = allPVParameters.SmartLogger.totalBuildingLoad;
		payload.logger.activePower = 8;
		payload.logger.windSpeed = allPVParameters.SmartLogger.windSpeed;
*/		
/*
  const totalInverter = 5;
  for (let i = 0; i < totalInverter; i++) {
    payload.inverter[i].createdAt = dat;
    payload.inverter[i].updatedAt = dat;
    payload.inverter[i].ref = i + 1;
    payload.inverter[i].effInverter = allPVParameters.inverter1.effInverter;;
    payload.inverter[i].acPower = allPVParameters.inverter1.inverterACpower;
    payload.inverter[i].dcPower = allPVParameters.inverter1.inverterDCpower;
    payload.inverter[i].pvCurrent = allPVParameters.inverter1.inverterPV1current;
    payload.inverter[i].pcVoltage = allPVParameters.inverter1.inverterPV1voltage;
    payload.inverter[i].mpptPower = allPVParameters.inverter1.MPPT1power;
  }
*/
/*
  const totalPwerMeter = 1;
  for (let j = 0; j < totalPwerMeter; j++) {
    payload.powerMeter[j].createdAt = dat;
    payload.powerMeter[j].updatedAt = dat;
    payload.powerMeter[j].ref = j + 1;
    payload.powerMeter[j].activeEnergy = allMeterParameters.Meter1.activeEnergy;
    payload.powerMeter[j].activePower = allMeterParameters.Meter1.intakeTNB;
    payload.powerMeter[j].maxDemand = allMeterParameters.Meter1.maxDemand;
    payload.powerMeter[j].voltage = {
      "1": 2,
      "2": 2,
      "3": 3
    };
    payload.powerMeter[j].current = {
      "1": 2,
      "2": 2,
      "3": 3
    };
    payload.powerMeter[j].power = {
      "1": 2,
      "2": 2,
      "3": 3
    };
    payload.powerMeter[j].mDlevel = {
      "1": 1,
      "2": 2
    };
  }
  //console.log(payload);
  //console.log(payload.logger);
  //console.log(payload.inverter[inverterNumber].inverterPV1voltage);
  //console.log(payload.inverter[1].inverterP1current);
  //console.log(payload.powerMeter);
	//console.log(payload.inverter[inverterNumber].effInverter);
*/
  device.publish("publish/reading", JSON.stringify(payload), pubOpts);
  
	} catch (error) {
		console.log(error.message);
	} finally {
		await delay(5000);
		console.log('***** ITERATION COMPLETE *****');
		main();
	}
};

//**********************************************************************
//
// DELAY
//
//**********************************************************************

const delay = microSecond => new Promise(resolve => setTimeout(resolve, microSecond));

delay(10000).then(() => {
	console.log("Start app.js")
	main();
});
