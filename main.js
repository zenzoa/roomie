/*
- CA links (link vertical rooms)
- CA emitters
- favorite places code
*/

const sketch = require('./script/sketch')

window.onload = () => {
	if (process.versions['nw-flavor'] === 'sdk') {
		chrome.developerPrivate.openDevTools({
			renderViewId: -1,
			renderProcessId: -1,
			extensionId: chrome.runtime.id
		})
		nw.Window.get().showDevTools()
	}

	document.body.addEventListener('contextmenu', (event) => {
		event.preventDefault()
		return false
	}, false)

	sketch.setup(p5)
}
