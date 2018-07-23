const {logging} = require('selenium-webdriver');

const savedLogsByDriver = new Map();

function waitForNetwork(fn) {
	return async function(driver) {
		const logs = await getCurrentLogs(driver);
		for (let i = 0; i < logs.length; i++) {
			const logResult = fn(logs[i]);
			if (logResult) {
				savedLogsByDriver.set(driver, logs.slice(i + 1));
				return logResult;
			}
		}
		savedLogsByDriver.set(driver, []);
		return null;
	}
}
exports.waitForNetwork = waitForNetwork;



function waitForNetworkRedirect(url) {
	return waitForNetwork(log => !!log.isRedirect && log.url === url && log)
}
exports.waitForNetworkRedirect = waitForNetworkRedirect;



async function getCurrentLogs(driver) {
	const logsNewRaw = await driver.manage().logs().get(logging.Type.PERFORMANCE);
	const logsNew = logsNewRaw.map(logCleanup).filter(x => x);
	const logs = (savedLogsByDriver.get(driver) || []).concat(logsNew);
	savedLogsByDriver.set(driver, logs);
	return logs;
}
exports.getCurrentLogs = getCurrentLogs;



function logCleanup({level, message}) {
	const {message: {method, params}} = JSON.parse(message);
	if (method === 'Network.requestWillBeSent') {
		const redirectResponse = params.redirectResponse;
		return {
			url: params.request.url,
			status: redirectResponse ? redirectResponse.status : undefined,
			method: params.request.method,
			type: params.type,
			networkMethod: 'requestWillBeSent',
			isRedirect: !!redirectResponse,
		}
	} else if (method === 'Network.responseReceived') {
		const requestHeadersText = params.response.requestHeadersText || '';
		return {
			url: params.response.url,
			status: params.response.status, /* 200 */
			method: requestHeadersText.split(' ')[0], /* GET */
			type: params.type, /* Image */
			networkMethod: 'responseReceived',
		}
	}
}

/*

const redirectExample = {
	"message": {
		"method": "Network.requestWillBeSent",
		"params": {
			"documentURL": "http://ozon.travel/",
			"frameId": "(C3BBFB163989F0C4B63860E202EDB833)",
			"initiator": {"type": "other"},
			"loaderId": "588.1",
			"redirectResponse": {
				"connectionId": 359,
				"connectionReused": false,
				"encodedDataLength": 177,
				"fromDiskCache": false,
				"fromServiceWorker": false,
				"headers": {"Content-Length": "156", "Content-Type": "text/html; charset=UTF-8", "Date": "Thu, 08 Feb 2018 11:49:07 GMT", "Location": "https://www.ozon.travel/index.dir"},
				"headersText": "HTTP/1.1 301 Moved Permanently\r\nContent-Type: text/html; charset=UTF-8\r\nLocation: https://www.ozon.travel/index.dir\r\nDate: Thu, 08 Feb 2018 11:49:07 GMT\r\nContent-Length: 156\r\n\r\n",
				"mimeType": "text/html",
				"protocol": "http/1.1",
				"remoteIPAddress": "195.34.21.5",
				"remotePort": 80,
				"requestHeaders": {
					"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*!/!*;q=0.8",
					"Accept-Encoding": "gzip, deflate",
					"Accept-Language": "en-US,en;q=0.9",
					"Connection": "keep-alive",
					"Cookie": "cto_lwid=2dc576cb-795d-44cd-b8c5-1e9257538a7f; _ga=GA1.2.1537751748.1518090506; _gid=GA1.2.961276254.1518090506; _gat=1; _ym_uid=1518090506709231013; _ym_isad=2",
					"Host": "ozon.travel",
					"Upgrade-Insecure-Requests": "1",
					"User-Agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36"
				},
				"requestHeadersText": "GET / HTTP/1.1\r\nHost: ozon.travel\r\nConnection: keep-alive\r\nUser-Agent: Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36\r\nUpgrade-Insecure-Requests: 1\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*!/!*;q=0.8\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCookie: cto_lwid=2dc576cb-795d-44cd-b8c5-1e9257538a7f; _ga=GA1.2.1537751748.1518090506; _gid=GA1.2.961276254.1518090506; _gat=1; _ym_uid=1518090506709231013; _ym_isad=2\r\n",
				"securityState": "neutral",
				"status": 301,
				"statusText": "Moved Permanently",
				"timing": {
					"connectEnd": 5.18199987709522,
					"connectStart": 1.37600000016391,
					"dnsEnd": 1.37600000016391,
					"dnsStart": 1.37600000016391,
					"proxyEnd": 1.37600000016391,
					"proxyStart": 0.481999944895506,
					"pushEnd": 0,
					"pushStart": 0,
					"receiveHeadersEnd": 10.5079999193549,
					"requestTime": 1298118.039059,
					"sendEnd": 5.37099991925061,
					"sendStart": 5.34199993126094,
					"sslEnd": -1,
					"sslStart": -1,
					"workerReady": -1,
					"workerStart": -1
				},
				"url": "http://ozon.travel/"
			},
			"request": {
				"headers": {"User-Agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36"},
				"initialPriority": "VeryHigh",
				"method": "GET",
				"mixedContentType": "none",
				"referrerPolicy": "no-referrer-when-downgrade",
				"url": "https://www.ozon.travel/index.dir"
			},
			"requestId": "588.1",
			"timestamp": 1298118.450003,
			"type": "Document",
			"wallTime": 1518090549.32057
		}
	}, "webview": "(C3BBFB163989F0C4B63860E202EDB833)"
}
*/
