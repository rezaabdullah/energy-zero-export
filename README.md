# NodeJS App for Zero Export

###### Copyright (c) 2017-2018 Plus NRG Systems Sdn. Bhd.
The sript should be used as a template for future NodeJS apps. Pls refer to individual modules for more information. To ensure quality, any update or modification on any modules should be verified and approved before deployment to project sites.

### *Coding Convention*
1. Variables    : `camelCase`
2. Objects      : `camelCase`
3. Classes      : `UpperCamelCase`
4. Methods      : `camelCase`
5. Registers    : `camelCaseRegister_TYPE` e.g. `activePowerRegister_R` denotes ***Read Only Active Power Register.*** Registers can be of following types:  
    a. Read Only(**_R**)  
    b. Write Only(**_W**)  
    c. Read/Write(**_RW**)  
6. Constants    : `CAPITALIZED_SNAKECASE` e.g. `MAX_POWER`
7. Spacing      : For readability please use single space between operators and variables/objects/methods

### Important Modbus and Physical Layer Concepts
Modbus is a Master/Slave communication protocol. It has been widely implemented in industries for automation and especially for SCADA systems. Two most popular variants of Modbus implementations are Modbus TCP/IP and Modbus RTU.

For Zero Export system, more specifically this document assumes energy meters are connected via RS-485 whereas solar devices are connected via Ethernet, namely TCP/IP. Since physical layer should follow IEEE cable guidelines, in general RS-485 cables can extend upto 1000m compared to Ethernet cable which are limited to maximum distance of 100m. Nonetheless, bear in mind that it is possible although not advised, to extend the cable length beyond the aforementioned length. Few resources resources on Modbus are listed below:
1. [Modbus Technical Resources](http://modbus.org/tech.php)
2. [Correct Cabling for Modbus RS-485](http://electrical-engineering-portal.com/correct-cabling-modbus-rs485)

### Important Javascript Concepts
Since Javascript executes functions asynchronously, it is possible, indeed very likely modbus data packets will collide between two requests. Therefore, always **USE DELAY.** To block the thread i.e. to block the execution of next line, ideal approach would be usage of `Promise`. In addition, `async/await` can be used to make the code scalable. 