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

