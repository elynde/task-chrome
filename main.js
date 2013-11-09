console.log('load');
chrome.runtime.onMessage.addListener(function () {
	console.log('message rev');
});