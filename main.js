/*
- CA links (link vertical rooms)
- CA emitters
- BLK file support
- favorite places code
*/

const sketch = require('./script/sketch')

const nwWin = nw.Window.get()

window.onload = () => {
	chrome.developerPrivate.openDevTools({
    renderViewId: -1,
    renderProcessId: -1,
    extensionId: chrome.runtime.id
	})
	nwWin.showDevTools()

	document.body.addEventListener('contextmenu', (event) => {
		event.preventDefault()
		return false
	}, false)

	sketch.setup(p5)
}
