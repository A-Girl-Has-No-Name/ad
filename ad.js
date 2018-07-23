require('chromedriver')
const { By, Key, Keyboard, switchTo, window, Preferences, wait } = require('selenium-webdriver');
const { Options } = require('selenium-webdriver/chrome');
const { expect } = require('chai');
const webdriver = require('selenium-webdriver');
const { Capabilities } = require('selenium-webdriver');
const { until, promise, util } = require('selenium-webdriver');
const { assert } = require('chai');
const { waitForNetworkRedirect, waitForNetwork, getCurrentLogs } = require('./network');
const fs = require("fs");
const moment = require("moment");
const webshot = require('webshot');
var seleniumWebdriver = require('selenium-webdriver');
const {Builder, logging} = require('selenium-webdriver');
var mongo = require('mongodb');    
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
var getJSON = require('get-json');

var options = { 
  shotSize:  {width: 'all', height: 'all'},
  shotOffset:  {left: 0, right: 0, top: 0,  bottom: 0}

};

var basename = "mydb";
var collectionname = "logs";

var searchsys = 'https://google.ru';
var search = "билеты Вену самолет";


var needed = {
  system : "google",
  search : "  ",
  time : "time",
  flag : "0 ",
  url : "  ",
  adblocks: 0,
  logs : {},
  region : " ",
  picture: " "
 } 

var i;
var print = getRandomInt (0, 999999999999);
 const prefs = new logging.Preferences();
 prefs.setLevel(logging.Type.PERFORMANCE, logging.Level.ALL);

 const driver = new Builder()
            .forBrowser('chrome')
            .setLoggingPrefs(prefs)
            .build();



 async function waiting (time) {
    await promise.delayed(time * 1000);
}   


function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}      


async function wat (n) {
  await driver.wait(async () => {
        const currentUrl = await driver.getCurrentUrl();
        needed["url"] = currentUrl;
        
        return true;
    }, 10000);


  const fullLogs = await getCurrentLogs(driver);
  return await fullLogs.filter( log => log.type === 'Document');
 }


async function getreg () {
     await driver.wait(async () => {
        const currentUrl = await driver.getCurrentUrl(); 
        return currentUrl.includes('google.ru/search'); 
    }, 10000);

  reg =  await driver.findElement(By.css('#swml-loc')).getText();
await 	console.log("region:  ",reg );
  return reg;
}

async function writedown (needed) {
var woww = await JSON.stringify(needed, null, 2);
await fs.appendFileSync("logs.json", woww + '\n');
await console.log("wrote"); 
}

async function writebase (needed) {
  await MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db(basename);
  needed["logs"] = JSON.stringify (needed["logs"]);

  var myobj;

  myobj = Object.assign({}, needed);
  dbo.collection(collectionname).insertOne(myobj, function(err, res) {
    if (err) throw err;
    console.log("Inserted");
    db.close();
  });
});
}

async function work (element) {
  await driver.switchTo().window(element);
  await waiting (getRandomInt(3,8)); 
  await console.log ("switched");
  needed["logs"] = await wat();
  needed["time"]  = moment().utcOffset(3).format('MMMM Do YYYY, h:mm:ss a');
  if ( ! needed["url"].includes("google.ru/search") )   
  await writebase(needed);                         
                            }

async function processArray (array) {
  for (const item of array) {
    await work(item);
  }
  console.log("Done!");
}


async function tl () {

console.log("start");

 await driver.get(searchsys)
        .then(_ => 
            waiting( getRandomInt(2,5) )
); 

await driver.findElement(By.name('q')).sendKeys(search, Key.RETURN);
await waiting (getRandomInt(2,4))
console.log("search:  ", search);

needed["region"] = await getreg();  
console.log(needed["region"]);
needed["search"] = search;
needed["flag"] = 0;


var ad = await driver.findElements(By.className('ad_cclk'))
.then((found) => {
console.log("all ad:    ", found.length);
needed["adblocks"] = found.length;
return found ;
});


await ad.forEach( async function(element) {
      await element.click();
      await console.log ("element");
});

await waiting(7);


 await driver.wait(async () => {
        const currentUrl = await driver.getCurrentUrl();
 var nam = print + '.png';
        needed["picture"] = print;
await    console.log("pic:  ", print);
        await webshot(currentUrl, nam, options, function(err) {});
   
        return currentUrl.includes('google.ru/search');  
               }, 10000);

await driver.getAllWindowHandles().then(async (allhandles) => {
        await       console.log("all:  ", allhandles.length)
        await processArray (allhandles)
	if (allhanles.length == 1) await writebase(needed)
 }) 

await driver.quit();
await console.log("quit");
await waiting (60*40 + getRandomInt(0, 2400));
}


tl(); 

