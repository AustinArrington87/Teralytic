'use strict';
console.log(JSON.stringify(process.env));
const mqtt = require('mqtt');
const mqttclient = mqtt.connect(process.env.MQTT_CONNECTION_STRING);
const redis = require('redis');
const client = redis.createClient(6379, process.env.REDIS_CONNECTION_STRING);
const loglevel=process.env.LOG_LEVEL||"info";
console.log(`log level set to ${loglevel}`);

//redis connection
client.on('connect', function () {
  console.log("redis connected");
});

// Subscribe to mosquitto topic
mqttclient.on('connect', () => {
  console.log("mqtt connected");
  mqttclient.subscribe('application/34/device/+/rx');
});

mqttclient.on('message', function (topic, message) {
  console.log(`topic is ${topic}`);
  var messageJson=JSON.parse(message);
  console.log(messageJson.fPort + ' ' + messageJson.deviceName);
  if(loglevel=="verbose" || loglevel=="extra-verbose"){
    console.log(JSON.stringify(messageJson.rxInfo));
    console.log(JSON.stringify(messageJson.txInfo));
  }
 
  let bytes = new Buffer(messageJson.data, 'base64');
  let epoch = Math.round((new Date()).getTime() / 1000);    
  // moisture voltage calibration values, used at all depths 
  var vm1 = 2.880;
  var vm2 = 2.860;
  var vm3 = 2.850;
  var vm4 = 2.840;     
  var vm5 = 2.830;
  var vm6 = 2.636;
  var vm7 = 2.500;
  var vm8 = 2.475;
  var vm9 = 2.450; 
  var vm10 = 2.430;  
  var vm11 = 2.300; 
  var vm12 = 2.250;
  var vm13 = 2.160;
  var vm14 = 2.000;
  var vm15 = 1.900;
  var vm16 = 1.760;
  var vm17 = 1.660;
  var vm18 = 1.440;
  var vm19 = 1.380;
  var vm20 = 1.330;
  var vm21 = 1.300;
  var vm22 = 1.270;
  var vm23 = 1.230;
  var vm24 = 1.200;    
  // moisture concentration 
  var cm1 = 1.00;
  var cm2 = 3.54; 
  var cm3 = 5.22;
  var cm4 = 5.50;    
  var cm5 = 6.00;
  var cm6 = 8.00;
  var cm7 = 9.00; 
  var cm8 = 10.00;
  var cm9 = 11.00;
  var cm10 = 13.00;
  var cm11 = 14.00;
  var cm12 = 15.00;
  var cm13 = 16.00;
  var cm14 = 17.00;
  var cm15 = 17.25;
  var cm16 = 17.50;
  var cm17 = 17.75;
  var cm18 = 18.00;
  var cm19 = 19.00;
  var cm20 = 20.00;
  var cm21 = 25.00;
  var cm22 = 47.85;
  var cm23 = 54.93;
  var cm24 = 81.88;     
  // ec voltage calibration, used at all depths 
  var vec1 = 1.60;
  var vec2 = 1.55;
  var vec3 = 1.50;
  var vec4 = 1.45;
  var vec5 = 1.40;  
  // ec concentration 
  var cec1 = 0.00;
  var cec2 = 0.62;
  var cec3 = 0.59;
  var cec4 = 1.10;
  var cec5 = 1.55;        
  // o2 calibration - millivolts 
  var v1 = 3.0769;
  var v2 = 200.0000;
  var v3 = 400.0000;
  var v4 = 600.0000;
  var v5 = 1206.1538;
  var v6 = 1867.6923;
  var c1 = 0.00018;
  var c2 = 2.66129;
  var c3 = 5.32258;
  var c4 = 8.05300;
  var c5 = 16.19851;
  var c6 = 25.15367;    
  // assign packets to ports 
  switch(messageJson.fPort){
    case 9:
      var readID9 = (bytes[0]);
      var batteryLife = (bytes[1]);      
      var firmVers = (bytes[2]);
      var latitudeInt = (bytes[3] << 24) | (bytes[4] << 16) | (bytes[5] << 8) | (bytes[6]);
      var latitude = latitudeInt/1000000;
      var longitudeInt = (bytes[7] << 24) | (bytes[8] << 16) | (bytes[9] << 8) | (bytes[10]);
      var longitude = longitudeInt/1000000;
      //var errorReserved = (bytes[11]);
      if(loglevel=="verbose" || loglevel=="extra-verbose"){
        console.log("fPort9");
        console.log("--------------");
        console.log(`packetId is ${readID9}`);
        console.log("batteryLife is " + batteryLife);  
        console.log(`firmVers is ${firmVers}`);
        console.log(`latitudeInt is ${latitudeInt}`);
        console.log(`latitude is ${latitude}`);
        console.log(`longitudeInt is ${longitudeInt}`);
        console.log(`longitude is ${longitude}`);
        console.log("---------------");
      }
      client.hmset(`${messageJson.devEUI}-${readID9}`, {
        "packetID": readID9,
        "applicationID": messageJson.applicationID,
        "applicationName": messageJson.applicationName,
        "deviceName": messageJson.deviceName,
        "epoch": epoch,  
        "battery": batteryLife,  
        "firmware": firmVers,
        "latitude": latitude,
        "longitude": longitude,
        "rxInfo": JSON.stringify(messageJson.rxInfo),
        "txInfo": JSON.stringify(messageJson.txInfo),
        "rssi": JSON.stringify(messageJson.rxInfo[0].rssi),
        "loRaSNR": JSON.stringify(messageJson.rxInfo[0].loRaSNR)  
      });
      if(loglevel=="extra-verbose"){
        client.hgetall(`${messageJson.devEUI}-${readID9}`, function(err, object){
          console.log(object);
        });
      };
    break;
    case 10:
      var readID10 = (bytes[0]);
      var luxExp =  (bytes[1]);
      var luxRaw = (bytes[3]);
      // skip bytes 3 and 4 for lux ... 0s for now      
      var luxInt = Math.pow(2,luxExp)*luxRaw*0.045;      
      var airTempInt = (bytes[6] << 8) | (bytes[5]);
      // degrees celcius   
      var airTemp = ((airTempInt*175.52)/65536) - 46.85;
      var humidInt = (bytes[8] << 8) | (bytes[7]);
      // humidity expressed as percentage       
      var humid = ((humidInt*125)/65536) - 6;
      // its possible for humid < 0, so make equal to 0%
      if (humid < 0) {
          humid = 0;
      };
      if (humid > 100) {
          humid = 100;
      };      
      if(loglevel=="verbose" || loglevel=="extra-verbose"){
        console.log("fPort10");
        console.log("----------------");
        console.log("packetId is " + readID10);
        console.log("luxInt is " + luxInt);
        console.log("airTempInt is " + airTempInt);
        console.log("airTemp is " + airTemp);
        console.log("humidInt is " + humidInt);
        console.log("humid is " + humid);
        console.log("----------------");
      }
      client.hmset(`${messageJson.devEUI}-${readID10}`, {
        "packetID": readID10,
        "applicationID": messageJson.applicationID,
        "applicationName": messageJson.applicationName,
        "deviceName": messageJson.deviceName,
        "epoch": epoch,  
        "lux": luxInt,
        "airTemperature": airTemp,
        "humidity": humid,
        "rxInfo": JSON.stringify(messageJson.rxInfo),
        "txInfo": JSON.stringify(messageJson.txInfo)
      });
      if(loglevel=="extra-verbose"){
        client.hgetall(`${messageJson.devEUI}-${readID10}`, function(err, object){
          console.log(object);
        });
      };
    break;
    case 11:
      var readID11 = (bytes[0]);
      var soilTempInt6 = (bytes[2] << 8) | (bytes[1]);
      // soilTemp conversion is 4 step process 
      var soilTemp6Converted1 = ((soilTempInt6/4095)*3.3);
      var soilTemp6Converted2 = ((soilTemp6Converted1*100000)/(3.3 - soilTemp6Converted1));
      var soilTemp6Converted3 = (Math.log(10000/soilTemp6Converted2))/(Math.log(2.71828));
      // temp in Kelvin 
      var soilTemp6Converted4 = 3380/((3380/298.15) - soilTemp6Converted3); 
      // temp in Celcius       
      // the conversion should be minus 273.15 to get C but we will minus by 3 degrees more to correct for innacuracy       
      var soilTemp6 = soilTemp6Converted4 - 273.15;             
      var co2Int6 = (bytes[4] << 8) | (bytes[3]);
      var co26 = ((co2Int6/1023)*3.6)*20000;   
      // map ec voltage      
      var ecInt6 = (bytes[6] << 8) | (bytes[5]);
      // convert ec to Volts and times by -1 for the filtering
      // note: we divide by 4095 because this is 12-bit ADC 
      var ec6 = (ecInt6*3.3)/4095;         
      var convertedEC6;  
      if (ec6 <= 0) {
	      convertedEC6 = 0;
      } else if (ec6 >= vec1) {
          convertedEC6 = cec1;
      } else if (ec6 < vec1 && ec6 >= vec2) {
	      convertedEC6 = (ec6 - vec1)*((cec2-cec1)/(vec2-vec1))+cec1;
      } else if (ec6 < vec2 && ec6 >= vec3) {
	      convertedEC6 = (ec6 - vec2)*((cec3-cec2)/(vec3-vec2))+cec2;
      } else if (ec6 < vec3 && ec6 >= vec4) {
	      convertedEC6 = (ec6 - vec3)*((cec4-cec3)/(vec4-vec3))+cec3;
      } else if (ec6 < vec4 && ec6 >= vec5) {
	      convertedEC6 = (ec6 - vec4)*((cec5-cec4)/(vec5-vec4))+cec4;
      } else if (ec6 < vec5 && ec6 != 0) {
          convertedEC6 = cec5;  
      };        
      // map moisture voltage so it's converted to permitivity (Decagon comparison)      
      var moistureInt6 = (bytes[8] << 8) | (bytes[7]);
      var moisture6 = (moistureInt6*3.3)/4095;         
      var convertedMoisture6;
      if (moisture6 <= 0) {
	      convertedMoisture6 = 0;
      } else if (moisture6 >= vm1) {
	      convertedMoisture6 = cm1;	
      } else if (moisture6 < vm1 && moisture6 >= vm2) {
	      convertedMoisture6 = (moisture6 - vm1)*((cm2-cm1)/(vm2-vm1))+cm1;
      } else if (moisture6 < vm2 && moisture6 >= vm3){
	     convertedMoisture6 = (moisture6 - vm2)*((cm3-cm2)/(vm3-vm2))+cm2;
      } else if (moisture6 < vm3 && moisture6 >= vm4) {
	     convertedMoisture6 = (moisture6 - vm3)*((cm4-cm3)/(vm4-vm3))+cm3;
      } else if (moisture6 < vm4 && moisture6 >= vm5) {
	     convertedMoisture6 = (moisture6 - vm4)*((cm5-cm4)/(vm5-vm4))+cm4;	
      } else if (moisture6 < vm5 && moisture6 >= vm6) {
	     convertedMoisture6 = (moisture6 - vm5)*((cm6-cm5)/(vm6-vm5))+cm5;
      } else if (moisture6 < vm6 && moisture6 >= vm7) {
	     convertedMoisture6 = (moisture6 - vm6)*((cm7-cm6)/(vm7-vm6))+cm6;
      } else if (moisture6 < vm7 && moisture6 >= vm8) {
	     convertedMoisture6 = (moisture6 - vm7)*((cm8-cm7)/(vm8-vm7))+cm7;
      } else if (moisture6 < vm8 && moisture6 >= vm9) {
         convertedMoisture6 = (moisture6 - vm8)*((cm9-cm8)/(vm9-vm8))+cm8;
      } else if (moisture6 < vm9 && moisture6 >= vm10) {
         convertedMoisture6 = (moisture6 - vm9)*((cm10-cm9)/(vm10-vm9))+cm9;
      } else if (moisture6 < vm10 && moisture6 >= vm11) {
         convertedMoisture6 = (moisture6 - vm10)*((cm11-cm10)/(vm11-vm10))+cm10;
      } else if (moisture6 < vm11 && moisture6 >= vm12) {
         convertedMoisture6 = (moisture6 - vm11)*((cm12-cm11)/(vm12-vm11))+cm11;
      } else if (moisture6 < vm12 && moisture6 >= vm13) {
         convertedMoisture6 = (moisture6 - vm12)*((cm13-cm12)/(vm13-vm12))+cm12;
      } else if (moisture6 < vm13 && moisture6 >= vm14) {
         convertedMoisture6 = (moisture6 - vm13)*((cm14-cm13)/(vm14-vm13))+cm13;  
      } else if (moisture6 < vm14 && moisture6 >= vm15) {
         convertedMoisture6 = (moisture6 - vm14)*((cm15-cm14)/(vm15-vm14))+cm14;
      } else if (moisture6 < vm15 && moisture6 >= vm16) {
         convertedMoisture6 = (moisture6 - vm15)*((cm16-cm15)/(vm16-vm15))+cm15;
      } else if (moisture6 < vm16 && moisture6 >= vm17) {
         convertedMoisture6 = (moisture6 - vm16)*((cm17-cm16)/(vm17-vm16))+cm16;
      } else if (moisture6 < vm17 && moisture6 >= vm18) {
         convertedMoisture6 = (moisture6 - vm17)*((cm18-cm17)/(vm18-vm17))+cm17;
      } else if (moisture6 < vm18 && moisture6 >= vm19) {
         convertedMoisture6 = (moisture6 - vm18)*((cm19-cm18)/(vm19-vm18))+cm18;
      } else if (moisture6 < vm19 && moisture6 >= vm20) {
         convertedMoisture6 = (moisture6 - vm19)*((cm20-cm19)/(vm20-vm19))+cm19; 
      } else if (moisture6 < vm20 && moisture6 >= vm21) {
         convertedMoisture6 = (moisture6 - vm20)*((cm21-cm20)/(vm21-vm20))+cm20;
      } else if (moisture6 < vm21 && moisture6 >= vm22) {
         convertedMoisture6 = (moisture6 - vm21)*((cm22-cm21)/(vm22-vm21))+cm21;
      } else if (moisture6 < vm22 && moisture6 >= vm23) {
         convertedMoisture6 = (moisture6 - vm22)*((cm23-cm22)/(vm23-vm22))+cm22;
      } else if (moisture6 < vm23 && moisture6 >= vm24) {
         convertedMoisture6 = (moisture6 - vm23)*((cm24-cm23)/(vm24-vm23))+cm23;
      } else if (moisture6 < vm24 && moisture6 != 0) {
         convertedMoisture6 = cm24;  
      }; 
      // convert permitivity to VWC using Topp equation    
      var VolWater6 = (4.3*Math.pow(10,-6)*Math.pow(convertedMoisture6,3)) - (5.5*Math.pow(10,-4)*Math.pow(convertedMoisture6,2)) + (2.92*Math.pow(10,-2)*convertedMoisture6) - (5.3*Math.pow(10,-2));
      if (VolWater6 < 0) {
          VolWater6 = 0;  
      } else if (VolWater6 > 1) {
          VolWater6 = 1;  
      };        
      if(loglevel=="verbose" || loglevel=="extra-verbose"){
        console.log("fPort11");
        console.log("-----------------");
        console.log("packetId is " + readID11);
        console.log("soilTempInt6 is " + soilTempInt6);
        console.log("soilTemp6 is " + soilTemp6);  
        console.log("co2Int6 is " + co2Int6);
        console.log("co26 is " + co26);  
        console.log("ecInt6 is " + ecInt6);
        console.log("ec6 is " + convertedEC6);  
        console.log("moistureInt6 is " + moistureInt6);
        console.log("perm6 is " + convertedMoisture6);  
        console.log("moisture6 is " + VolWater6);  
        console.log("-----------------");
      }
      client.hmset(`${messageJson.devEUI}-${readID11}`, {
        "packetID": readID11,
        "applicationID": messageJson.applicationID,
        "applicationName": messageJson.applicationName,
        "deviceName": messageJson.deviceName,
        "epoch": epoch,  
        "soilTempRaw6": soilTempInt6,  
        "soilTemp6": soilTemp6,
        "co2Raw6": co2Int6,  
        "co2": co26,
        "ecRaw6": ec6,  
        "ec6": convertedEC6, 
        "moistureRaw6": moisture6,
        "perm6": convertedMoisture6,  
        "moisture6": VolWater6,  
        "rxInfo": JSON.stringify(messageJson.rxInfo),
        "txInfo": JSON.stringify(messageJson.txInfo)
      });
      if(loglevel=="extra-verbose"){
        client.hgetall(`${messageJson.devEUI}-${readID11}`, function(err, object){
          console.log(object);
        });
      };
      break;
    case 12:
      var readID12 = (bytes[0]);
      var pHInt6 = (bytes[2] << 8) | (bytes[1]);
      var pH6 = (pHInt6*3300)/4095;  
      var nInt6 = (bytes[4] << 8) | (bytes[3]);
      //convert N into mV from raw ADC counts
      var n6 = (nInt6*3300)/4095;             
      var pInt6 = (bytes[6] << 8) | (bytes[5]);
      var p6 = (pInt6*3300)/4095;        
      var kInt6 = (bytes[8] << 8) | (bytes[7]);
      var k6 = (kInt6*3300)/4095;
      if(loglevel=="verbose" || loglevel=="extra-verbose"){
        console.log("fPort12");
        console.log("-----------------");
        console.log("packetId is " + readID12);
        console.log("pHInt6 is " + pHInt6);
        console.log("pH6 is " + convertedpH6);
        console.log("nInt6 is " + nInt6);  
        console.log("convertedN6 is " + convertedN6);  
        console.log("pInt6 is " + pInt6);
        console.log("kInt6 is " + kInt6);
        console.log("convertedK6 is " + convertedK6);  
        console.log("-----------------");
      }
      client.hmset(`${messageJson.devEUI}-${readID12}`, {
        "packetID": readID12,
        "applicationID": messageJson.applicationID,
        "applicationName": messageJson.applicationName,
        "deviceName": messageJson.deviceName,
        "epoch": epoch,  
        "pHRaw6": pH6,  
        "nRaw6": n6,  
        "pRaw6": p6, 
        "kRaw6": k6,
        "rxInfo": JSON.stringify(messageJson.rxInfo),
        "txInfo": JSON.stringify(messageJson.txInfo)
      });
      if(loglevel=="extra-verbose"){
        client.hgetall(`${messageJson.devEUI}-${readID12}`, function(err, object){
          console.log(object);
        });
      };
    break;
    case 13:
      var readID13 = (bytes[0]);
      var soilTempInt18 = (bytes[2] << 8) | (bytes[1]);
      var soilTemp18Converted1 = (soilTempInt18/4095)*3.3;
      var soilTemp18Converted2 = (soilTemp18Converted1*100000)/(3.3 - soilTemp18Converted1);
      var soilTemp18Converted3 = (Math.log(10000/soilTemp18Converted2))/(Math.log(2.71828));
      // temp in Kelvin 
      var soilTemp18Converted4 = 3380/((3380/298.15) - soilTemp18Converted3); 
      // temp in Celcius       
      var soilTemp18 = soilTemp18Converted4 - 273.15;     
      var o2Int18 = (bytes[4] << 8) | (bytes[3]);
      // convert o218 to milliVolts from ADC counts       
      var o218 = (o2Int18*3600)/1023;
      var convertedO2;      
      //o2 mapping function                
      if (o218 <= v1) {
          convertedO2 = c1;
      } else if (o218 > v1 && o218 <= v2) {
          convertedO2 = (o218 - v1)*((c2-c1)/(v2-v1))+c1;
      } else if (o218 > v2 && o218 <= v3) {
          convertedO2 = (o218 - v2)*((c3-c2)/(v3-v2))+c2;
      } else if (o218 > v3 && o218 <= v4) {
          convertedO2 = (o218 - v3)*((c4-c3)/(v4-v3))+c3;
      } else if (o218 > v4 && o218 <= v5) {
          convertedO2 = (o218 - v4)*((c5-c4)/(v5-v4))+c4;
      } else if (o218 > v5 && o218 <= v6) {
	      convertedO2 = (o218 - v5)*((c6-c5)/(v6-v5))+c5;
      }; 
      //end o2 mapping function 
      // map EC 18       
      var ecInt18 = (bytes[6] << 8) | (bytes[5]);
      var ec18 = (ecInt18*3.3)/4095;
      var convertedEC18;
      if (ec18 <= 0) {
	      convertedEC18 = 0;
      } else if (ec18 >= vec1) {
          convertedEC18 = cec1;         
      } else if (ec18 < vec1 && ec18 >= vec2) {
	      convertedEC18 = (ec18 - vec1)*((cec2-cec1)/(vec2-vec1))+cec1;
      } else if (ec18 < vec2 && ec18 >= vec3) {
	      convertedEC18 = (ec18 - vec2)*((cec3-cec2)/(vec3-vec2))+cec2;
      } else if (ec18 < vec3 && ec18 >= vec4) {
	      convertedEC18 = (ec18 - vec3)*((cec4-cec3)/(vec4-vec3))+cec3;
      } else if (ec18 < vec4 && ec18 >= vec5) {
	      convertedEC18 = (ec18 - vec4)*((cec5-cec4)/(vec5-vec4))+cec4;
      } else if (ec18 < vec5 && ec18 != 0) {
          convertedEC18 = cec5;
      };       
      // map Moisture 18       
      var moistureInt18 = (bytes[8] << 8) | (bytes[7]);
      var moisture18 = (moistureInt18*3.3)/4095;
      var convertedMoisture18;      
      if (moisture18 <= 0) {
	     convertedMoisture18 = 0;
      } else if (moisture18 >= vm1) {
         convertedMoisture18 = cm1;       
      } else if (moisture18 < vm1 && moisture18 >= vm2) {
	     convertedMoisture18 = (moisture18 - vm1)*((cm2-cm1)/(vm2-vm1))+cm1;
      } else if (moisture18 < vm2 && moisture18 >= vm3) {
	     convertedMoisture18 = (moisture18 - vm2)*((cm3-cm2)/(vm3-vm2))+cm2;
      } else if (moisture18 < vm3 && moisture18 >= vm4) {
	     convertedMoisture18 = (moisture18 - vm3)*((cm4-cm3)/(vm4-vm3))+cm3;
      } else if (moisture18 < vm4 && moisture18 >= vm5) {
	     convertedMoisture18 = (moisture18 - vm4)*((cm5-cm4)/(vm5-vm4))+cm4;
      } else if (moisture18 < vm5 && moisture18 >= vm6) {
	     convertedMoisture18 = (moisture18 - vm5)*((cm6-cm5)/(vm6-vm5))+cm5;
      } else if (moisture18 < vm6 && moisture18 >= vm7) {
	     convertedMoisture18 = (moisture18 - vm6)*((cm7-cm6)/(vm7-vm6))+cm6;
      } else if (moisture18 < vm7 && moisture18 >= vm8) {
         convertedMoisture18 = (moisture18 - vm7)*((cm8-cm7)/(vm8-vm7))+cm7;          
      } else if (moisture18 < vm8 && moisture18 >= vm9) {
         convertedMoisture18 = (moisture18 - vm8)*((cm9-cm8)/(vm9-vm8))+cm8;  
      } else if (moisture18 < vm9 && moisture18 >= vm10) {
         convertedMoisture18 = (moisture18 - vm9)*((cm10-cm9)/(vm10-vm9))+cm9;
      } else if (moisture18 < vm10 && moisture18 >= vm11) {
         convertedMoisture18 = (moisture18 - vm10)*((cm11-cm10)/(vm11-vm10))+cm10;
      } else if (moisture18 < vm11 && moisture18 >= vm12) {
         convertedMoisture18 = (moisture18 - vm11)*((cm12-cm11)/(vm12-vm11))+cm11;  
      } else if (moisture18 < vm12 && moisture18 >= vm13) {
         convertedMoisture18 = (moisture18 - vm12)*((cm13-cm12)/(vm13-vm12))+cm12;
      } else if (moisture18 < vm13 && moisture18 >= vm14) {
         convertedMoisture18 = (moisture18 - vm13)*((cm14-cm13)/(vm14-vm13))+cm13;
      } else if (moisture18 < vm14 && moisture18 >= vm15) {
         convertedMoisture18 = (moisture18 - vm14)*((cm15-cm14)/(vm15-vm14))+cm14;
      } else if (moisture18 < vm15 && moisture18 >= vm16) {
         convertedMoisture18 = (moisture18 - vm15)*((cm16-cm15)/(vm16-vm15))+cm15;
      } else if (moisture18 < vm16 && moisture18 >= vm17) {
         convertedMoisture18 = (moisture18 - vm16)*((cm17-cm16)/(vm17-vm16))+cm16;
      } else if (moisture18 < vm17 && moisture18 >= vm18) {
         convertedMoisture18 = (moisture18 - vm17)*((cm18-cm17)/(vm18-vm17))+cm17;
      } else if (moisture18 < vm18 && moisture18 >= vm19) {
         convertedMoisture18 = (moisture18 - vm18)*((cm19-cm18)/(vm19-vm18))+cm18;
      } else if (moisture18 < vm19 && moisture18 >= vm20) {
         convertedMoisture18 = (moisture18 - vm19)*((cm20-cm19)/(vm20-vm19))+cm19;
      } else if (moisture18 < vm20 && moisture18 >= vm21) {
         convertedMoisture18 = (moisture18 - vm20)*((cm21-cm20)/(vm21-vm20))+cm20;
      } else if (moisture18 < vm21 && moisture18 >= vm22) {
         convertedMoisture18 = (moisture18 - vm21)*((cm22-cm21)/(vm22-vm21))+cm21;
      } else if (moisture18 < vm22 && moisture18 >= vm23) {
         convertedMoisture18 = (moisture18 - vm22)*((cm23-cm22)/(vm23-vm22))+cm22;
      } else if (moisture18 < vm23 && moisture18 >= vm24) {
         convertedMoisture18 = (moisture18 - vm23)*((cm24-cm23)/(vm24-vm23))+cm23;
      } else if (moisture18 < vm24 && moisture18 != 0) {
         convertedMoisture18 = cm24;
      };         
      // volumetric water content - Topp Equation 
      var VolWater18 = (4.3*Math.pow(10,-6)*Math.pow(convertedMoisture18,3)) - (5.5*Math.pow(10,-4)*Math.pow(convertedMoisture18,2)) + (2.92*Math.pow(10,-2)*convertedMoisture18) - (5.3*Math.pow(10,-2));
      if (VolWater18 < 0) {
          VolWater18 = 0;  
      } else if (VolWater18 > 1) {
          VolWater18 = 1;  
      };      
      if(loglevel=="verbose" || loglevel=="extra-verbose"){
        console.log("fPort13");
        console.log("--------------");
        console.log("packetId is " + readID13);
        console.log("soilTempInt18 is " + soilTempInt18);
        console.log("soilTemp18 is " + soilTemp18);  
        console.log("o2Int18 is " + o2Int18);
        console.log("o218 is " + convertedO2);
        console.log("ecInt18 is " + ecInt18);
        console.log("ec18 is " + convertedEC18);  
        console.log("moistureInt18 is " + moistureInt18);
        console.log("perm18 is " + convertedMoisture18);  
        console.log("moisture18 is " + VolWater18);   
        console.log("---------------");
      }
      client.hmset(`${messageJson.devEUI}-${readID13}`, {
        "packetID": readID13,
        "applicationID": messageJson.applicationID,
        "applicationName": messageJson.applicationName,
        "deviceName": messageJson.deviceName,
        "epoch": epoch,  
        "soilTempRaw18": soilTempInt18,  
        "soilTemp18": soilTemp18,
        "o2Raw18": o2Int18,  
        "o2": convertedO2,
        "ecRaw18": ec18,
        "ec18": convertedEC18,
        "moistureRaw18": moisture18,
        "perm18": convertedMoisture18,   
        "moisture18": VolWater18,    
        "rxInfo": JSON.stringify(messageJson.rxInfo),
        "txInfo": JSON.stringify(messageJson.txInfo)
      });
      if(loglevel=="extra-verbose"){
        client.hgetall(`${messageJson.devEUI}-${readID13}`, function(err, object){
          console.log(object);
        });
      };
    break;
    case 14:
      var readID14 = (bytes[0]);
      var pHInt18 = (bytes[2] << 8) | (bytes[1]);
      var pH18 = (pHInt18*3300)/4095;
      var nInt18 = (bytes[4] << 8) | (bytes[3]);
      // convert N from raw ADC counts to mV 
      var n18 = (nInt18*3300)/4095;     
      var pInt18 = (bytes[6] << 8) | (bytes[5]);
      var p18 = (pInt18*3300)/4095;
      var kInt18 = (bytes[8] << 8) | (bytes[7]);
      var k18 = (kInt18*3300)/4095;
      if(loglevel=="verbose" || loglevel=="extra-verbose"){
        console.log("fPort14");
        console.log("--------------");
        console.log("packetId is " + readID14);
        console.log("pHInt18 is " + pHInt18);
        console.log("nInt18 is " + nInt18); 
        console.log("pInt18 is " + pInt18);
        console.log("kInt18 is " + kInt18);   
        console.log("---------------");
      }
      client.hmset(`${messageJson.devEUI}-${readID14}`, {
        "packetID": readID14,
        "applicationID": messageJson.applicationID,
        "applicationName": messageJson.applicationName,
        "deviceName": messageJson.deviceName,
        "epoch": epoch,  
        "pHRaw18": pH18,  
        "nRaw18": n18,  
        "n18": convertedN18,
        "pRaw18": p18,  
        "p18": convertedP18,
        "kRaw18": k18,  
        "k18": convertedK18,
        "rxInfo": JSON.stringify(messageJson.rxInfo),
        "txInfo": JSON.stringify(messageJson.txInfo)
      });
      if(loglevel=="extra-verbose"){
        client.hgetall(`${messageJson.devEUI}-${readID14}`, function(err, object){
          console.log(object);
        });
      };
    break;
    case 15:
      var readID15 = (bytes[0]);
      var soilTempInt36 = (bytes[2] << 8) | (bytes[1]);
      var soilTemp36Converted1 = (soilTempInt36/4095)*3.3;
      var soilTemp36Converted2 = (soilTemp36Converted1*100000)/(3.3 - soilTemp36Converted1);
      var soilTemp36Converted3 = (Math.log(10000/soilTemp36Converted2))/(Math.log(2.71828));
      // temp in Kelvin 
      var soilTemp36Converted4 = 3380/((3380/298.15) - soilTemp36Converted3); 
      // temp in Celcius       
      var soilTemp36 = soilTemp36Converted4 - 273.15; 
      // map EC36       
      var ecInt36 = (bytes[6] << 8) | (bytes[5]);
      var ec36 = (ecInt36*3.3)/4095;      
      var convertedEC36;
      if (ec36 <= 0) {
	      convertedEC36 = 0;
      } else if (ec36 >= vec1) {
          convertedEC36 = cec1;       
      } else if (ec36 < vec1 && ec36 >= vec2) {
	      convertedEC36 = (ec36 - vec1)*((cec2-cec1)/(vec2-vec1))+cec1;
      } else if (ec36 < vec2 && ec36 >= vec3) {
	      convertedEC36 = (ec36 - vec2)*((cec3-cec2)/(vec3-vec2))+cec2;
      } else if (ec36 < vec3 && ec36 >= vec4) {
	      convertedEC36 = (ec36 - vec3)*((cec4-cec3)/(vec4-vec3))+cec3;
      } else if (ec36 < vec4 && ec36 >= vec5) {
	      convertedEC36 = (ec36 - vec4)*((cec5-cec4)/(vec5-vec4))+cec4;
      } else if (ec36 < vec5 && ec36 != 0) {
          convertedEC36 = cec5;           
      };        
      var moistureInt36 = (bytes[8] << 8) | (bytes[7]);
      var moisture36 = (moistureInt36*3.3)/4095;
      var convertedMoisture36;
      if (moisture36 <= 0) {
          convertedMoisture36 = 0;
      } else if (moisture36 >= vm1) {
          convertedMoisture36 = cm1;         
      } else if (moisture36 < vm1 && moisture36 >= vm2) {
	      convertedMoisture36 = (moisture36 - vm1)*((cm2-cm1)/(vm2-vm1))+cm1;
      } else if (moisture36 < vm2 && moisture36 >= vm3) {
	      convertedMoisture36 = (moisture36 - vm2)*((cm3-cm2)/(vm3-vm2))+cm2;
      } else if (moisture36 < vm3 && moisture36 >= vm4) {
	      convertedMoisture36 = (moisture36 - vm3)*((cm4-cm3)/(vm4-vm3))+cm3;
      } else if (moisture36 < vm4 && moisture36 >= vm5) {
	      convertedMoisture36 = (moisture36 - vm4)*((cm5-cm4)/(vm5-vm4))+cm4;
      } else if (moisture36 < vm5 && moisture36 >= vm6) {
	      convertedMoisture36 = (moisture36 - vm5)*((cm6-cm5)/(vm6-vm5))+cm5;
      } else if (moisture36 < vm6 && moisture36 >= vm7) {
	      convertedMoisture36 = (moisture36 - vm6)*((cm7-cm6)/(vm7-vm6))+cm6;
      } else if (moisture36 < vm7 && moisture36 >= vm8) {
          convertedMoisture36 = (moisture36 - vm7)*((cm8-cm7)/(vm8-vm7))+cm7;               
      } else if (moisture36 < vm8 && moisture36 >= vm9) {
          convertedMoisture36 = (moisture36 - vm8)*((cm9-cm8)/(vm9-vm8))+cm8;
      } else if (moisture36 < vm9 && moisture36 >= vm10) {
          convertedMoisture36 = (moisture36 - vm9)*((cm10-cm9)/(vm10-vm9))+cm9;
      } else if (moisture36 < vm10 && moisture36 >= vm11) {
          convertedMoisture36 = (moisture36 - vm10)*((cm11-cm10)/(vm11-vm10))+cm10;
      } else if (moisture36 < vm11 && moisture36 >= vm12) {
          convertedMoisture36 = (moisture36 - vm11)*((cm12-cm11)/(vm12-vm11))+cm11;
      } else if (moisture36 < vm12 && moisture36 >= vm13) {
          convertedMoisture36 = (moisture36 - vm12)*((cm13-cm12)/(vm13-vm12))+cm12;
      } else if (moisture36 < vm13 && moisture36 >= vm14) {
          convertedMoisture36 = (moisture36 - vm13)*((cm14-cm13)/(vm14-vm13))+cm13;
      } else if (moisture36 < vm14 && moisture36 >= vm15) {
          convertedMoisture36 = (moisture36 - vm14)*((cm15-cm14)/(vm15-vm14))+cm14;
      } else if (moisture36 < vm15 && moisture36 >= vm16) {
          convertedMoisture36 = (moisture36 - vm15)*((cm16-cm15)/(vm16-vm15))+cm15;
      } else if (moisture36 < vm16 && moisture36 >= vm17) {
          convertedMoisture36 = (moisture36 - vm16)*((cm17-cm16)/(vm17-vm16))+cm16;
      } else if (moisture36 < vm17 && moisture36 >= vm18) {
          convertedMoisture36 = (moisture36 - vm17)*((cm18-cm17)/(vm18-vm17))+cm17;
      } else if (moisture36 < vm18 && moisture36 >= vm19) {
          convertedMoisture36 = (moisture36 - vm18)*((cm19-cm18)/(vm19-vm18))+cm18;
      } else if (moisture36 < vm19 && moisture36 >= vm20) {
          convertedMoisture36 = (moisture36 - vm19)*((cm20-cm19)/(vm20-vm19))+cm19;
      } else if (moisture36 < vm20 && moisture36 >= vm21) {
          convertedMoisture36 = (moisture36 - vm20)*((cm21-cm20)/(vm21-vm20))+cm20;
      } else if (moisture36 < vm21 && moisture36 >= vm22) {
          convertedMoisture36 = (moisture36 - vm21)*((cm22-cm21)/(vm22-vm21))+cm21;
      } else if (moisture36 < vm22 && moisture36 >= vm23) {
          convertedMoisture36 = (moisture36 - vm22)*((cm23-cm22)/(vm23-vm22))+cm22;
      } else if (moisture36 < vm23 && moisture36 >= vm24) {
          convertedMoisture36 = (moisture36 - vm23)*((cm24-cm23)/(vm24-vm23))+cm23;
      } else if (moisture36 < vm24 && moisture36 != 0) {
          convertedMoisture36 = cm24;
      };        
      // volumetric water content 
      var VolWater36 = (4.3*Math.pow(10,-6)*Math.pow(convertedMoisture36,3)) - (5.5*Math.pow(10,-4)*Math.pow(convertedMoisture36,2)) + (2.92*Math.pow(10,-2)*convertedMoisture36) - (5.3*Math.pow(10,-2));
      if (VolWater36 < 0) {
          VolWater36 = 0;  
      } else if (VolWater36 > 1) {
          VolWater36 = 1;
      };       
      if(loglevel=="verbose" || loglevel=="extra-verbose"){
        console.log("fPort15");
        console.log("--------------");
        console.log("packetId is " + readID15);
        console.log("soilTempInt36 is " + soilTempInt36);
        console.log("soilTemp36 is " + soilTemp36);  
        console.log("ecInt36 is " + ecInt36);
        console.log("ec36 is " + convertedEC36);  
        console.log("moistureInt36 is " + moistureInt36);
        console.log("perm36 is " + convertedMoisture36);  
        console.log("moisture36 is " + VolWater36);  
        console.log("---------------");
      }
      client.hmset(`${messageJson.devEUI}-${readID15}`, {
        "packetID": readID15,
        "applicationID": messageJson.applicationID,
        "applicationName": messageJson.applicationName,
        "deviceName": messageJson.deviceName,
        "epoch": epoch,  
        "soilTempRaw36": soilTempInt36,  
        "soilTemp36": soilTemp36,
        "ecRaw36": ec36,  
        "ec36": convertedEC36,
        "moistureRaw36": moisture36,
        "perm36": convertedMoisture36,  
        "moisture36": VolWater36,  
        "rxInfo": JSON.stringify(messageJson.rxInfo),
        "txInfo": JSON.stringify(messageJson.txInfo)
      });
      if(loglevel=="extra-verbose"){
        client.hgetall(`${messageJson.devEUI}-${readID15}`, function(err, object){
          console.log(object);
        });
      };
    break;
    case 16:
      var readID16 = (bytes[0]);
      client.get(`${messageJson.devEUI}-${readID16}-complete`, function(err, reply) {
        if(reply==null){
            processAndPublishToTopic(messageJson, bytes, readID16);
        }
      });
    break;
  }
  //end switch statement
});

  var processAndPublishToTopic = function (messageJson, bytes, readID16){
  let epoch = Math.round((new Date()).getTime() / 1000);
  var pHInt36 = (bytes[2] << 8) | (bytes[1]);
  var pH36 = (pHInt36*3300)/4095;
  var nInt36 = (bytes[4] << 8) | (bytes[3]);
  // raw ADC counts to mV
  var n36 = (nInt36*3300)/4095;    
  var pInt36 = (bytes[6] << 8) | (bytes[5]);
  var p36 = (pInt36*3300)/4095; 
  // K concentration       
  var kInt36 = (bytes[8] << 8) | (bytes[7]);
  var k36 = (kInt36*3300)/4095;
  if(loglevel=="verbose" || loglevel=="extra-verbose"){
    console.log("fPort16");
    console.log("--------------");
    console.log("packetId is " + readID16);
    console.log("pHInt36 is " + pHInt36);
    console.log("pH36 is " + convertedpH36);
    console.log("nInt36 is " + nInt36);
    console.log("convertedN36 is " + convertedN36);   
    console.log("pInt36 is " + pInt36);
    console.log("kInt36 is " + kInt36);
    console.log("convertedK36 is " + convertedK36);  
    console.log("---------------");
  }
  client.hmset(`${messageJson.devEUI}-${readID16}`, {
    "packetID": readID16,
    "applicationID": messageJson.applicationID,
    "applicationName": messageJson.applicationName,
    "deviceName": messageJson.deviceName,
    "epoch": epoch,  
    "pHRaw36": pH36,  
    "pH36": convertedpH36,
    "nRaw36": n36,  
    "n36": convertedN36,
    "pRaw36": p36,  
    "p36": convertedP36,
    "kRaw36": k36,
    "k36": convertedK36,  
    "rxInfo": JSON.stringify(messageJson.rxInfo),
    "txInfo": JSON.stringify(messageJson.txInfo)
  });
  client.hgetall(`${messageJson.devEUI}-${readID16}`, function(err, object){
    if(loglevel=="verbose" || loglevel=="extra-verbose"){
          console.log(object);
    }
    mqttclient.publish('application/34/node/'+ messageJson.devEUI +'/complete', JSON.stringify(object));
    client.set(`${messageJson.devEUI}-${readID16}-complete`, true);
    client.expire(`${messageJson.devEUI}-${readID16}-complete`, 600)
    client.del(`${messageJson.devEUI}-${readID16}`, function(err, response) {
      if (response == 1) {
        console.log("Deleted Successfully!")
      } else{
        console.log("Cannot delete")
      }
    })
  });

};
