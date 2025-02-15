class Toolbar {
	static el = null
	static height = 0

	static setup() {
		Toolbar.el = document.getElementById('toolbar')

		document.getElementById('new-file-button').addEventListener('click', () => {
			tauri_invoke('new_file')
		})
		document.getElementById('open-file-button').addEventListener('click', () => {
			tauri_invoke('open_file')
		})
		document.getElementById('save-file-button').addEventListener('click', () => {
			tauri_invoke('save_file')
		})
		document.getElementById('save-as-file-button').addEventListener('click', () => {
			tauri_invoke('save_as')
		})

		document.getElementById('undo-button').addEventListener('click', () => {
			tauri_invoke('undo')
		})
		document.getElementById('redo-button').addEventListener('click', () => {
			tauri_invoke('redo')
		})

		document.getElementById('add-room-button').addEventListener('click', () => {
			startAddingRoom()
		})
		document.getElementById('add-link-button').addEventListener('click', () => {
			startAddingLink()
		})
		document.getElementById('add-favicon-button').addEventListener('click', () => {
			tauri_invoke('try_adding_favicon')
		})
		document.getElementById('add-overlay-button').addEventListener('click', () => {
			tauri_invoke('try_adding_overlay')
		})
		document.getElementById('delete-button').addEventListener('click', () => {
			removeSelectedObjects()
		})
	}

	static setVisibility(value) {
		if (value) {
			document.documentElement.style.setProperty(`--toolbar-height`, '48px')
			Toolbar.el.classList.remove('hidden')
			Toolbar.height = 48
		} else {
			document.documentElement.style.setProperty(`--toolbar-height`, '0')
			Toolbar.el.classList.add('hidden')
			Toolbar.height = 0
		}
	}
}
