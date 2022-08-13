const { api } = require('./script/api')
const { buildMenu } = require('./script/menu')

nw.Window.open('index.html', {}, mainWindow => {
	mainWindow.menu = buildMenu()

	mainWindow.window.api = api

	if (process.versions['nw-flavor'] === 'sdk') {
		// chrome.developerPrivate.openDevTools({
		// 	renderViewId: -1,
		// 	renderProcessId: -1,
		// 	extensionId: chrome.runtime.id
		// })
		mainWindow.showDevTools()
	}
})
