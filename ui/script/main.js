const Tauri = window.__TAURI__
const tauri_listen = Tauri.event.listen
const tauri_invoke = Tauri.core.invoke
const convertFileSrc = Tauri.core.convertFileSrc

let metaroom = null

let positionEl = null
let xPositionEl = null
let yPositionEl = null

window.addEventListener('load', () => {
	document.body.addEventListener('contextmenu', event => {
		event.preventDefault()
		return false
	}, false)

	setupCanvas()
	setupInput()

	Toolbar.setup()
	Sidebar.setup()

	positionEl = document.getElementById('position')
	xPositionEl = document.getElementById('position-x')
	yPositionEl = document.getElementById('position-y')

	tauri_listen('update_metaroom', (event) => {
		if (event.payload) {
			metaroom = event.payload[0]

			if (event.payload[1]) {
				metaroomBG.style.backgroundImage = null
				faviconImage = null
				overlayImages = []
				resetSelection()

			} else if (addedLink) {
				selectionType = 'Links'
				newSelection = [metaroom.links.length - 1]
				finishSelectingObject()

			} else if (addedOverlay) {
				selectionType = 'Overlays'
				newSelection = [metaroom.overlays.length - 1]
				finishSelectingObject()

			} else if (addedFavicon) {
				selectionType = 'Favicon'
				newSelection = [0]
				finishSelectingObject()
			}

			drawAll()

			const focusedID = document.activeElement ? document.activeElement.id : null
			Sidebar.setTo(selectionType)
			const focusedEl = document.getElementById(focusedID)
			if (focusedEl) focusedEl.focus()
		}
	})

	tauri_listen('start_adding_room', startAddingRoom)
	tauri_listen('start_adding_link', startAddingLink)
	tauri_listen('start_adding_favicon', startAddingFavicon)
	tauri_listen('start_adding_overlay', startAddingOverlay)

	tauri_listen('redraw', drawAll)

	tauri_listen('update_bg_image', updateBGImage)
	tauri_listen('update_favicon_image', updateFaviconImage)
	tauri_listen('update_overlay_image', updateOverlayImage)

	tauri_listen('select_all', selectAllRooms)
	tauri_listen('deselect', clearSelection)

	tauri_listen('reset_zoom', () => setScale(1))
	tauri_listen('zoom_in', () => setScale(scale * 1.1))
	tauri_listen('zoom_out', () => setScale(scale * 0.9))
	tauri_listen('zoom_fill', () => scaleToFill())

	tauri_listen('set_theme', e => Theme.set(e.payload))
	tauri_listen('set_toolbar_visibility', e => Toolbar.setVisibility(e.payload))
	tauri_listen('set_coords_visibility', e => setCoordsVisibility(e.payload))
	tauri_listen('set_room_color_visibility', e => setRoomColorVisibility(e.payload, true))

	tauri_listen('set_bg_visibility', e => setBGVisibility(e.payload))
	tauri_listen('set_room_visibility', e => setRoomVisibility(e.payload))
	tauri_listen('set_overlay_visibility', e => setOverlayVisibility(e.payload))

	tauri_listen('set_bg_opacity', e => setBGOpacity(e.payload))
	tauri_listen('set_overlay_opacity', e => setOverlayOpacity(e.payload))

	tauri_listen('show_spinner', showSpinner)
	tauri_listen('hide_spinner', hideSpinner)

	tauri_listen('error', showErrorDialog)

	AboutDialog.setup()

	tauri_invoke('load_config_file').then(result => {
		Theme.set(result.theme.toLowerCase())
		Toolbar.setVisibility(result.show_toolbar)
		setCoordsVisibility(result.show_coords)
		setRoomColorVisibility(result.show_room_colors, false)
		setBGOpacity(result.bg_opacity)
		setOverlayOpacity(result.overlay_opacity)
	})
})

const setCoordsVisibility = (value) => {
	if (value) {
		positionEl.classList.remove('always-hidden')
	} else {
		positionEl.classList.add('always-hidden')
	}
}

const showSpinner = (event) => {
	const spinnerEl = document.getElementById('spinner')
	spinnerEl.classList.add('on')
}

const hideSpinner = (event) => {
	const spinnerEl = document.getElementById('spinner')
	spinnerEl.classList.remove('on')
}

const showErrorDialog = (event) => {
	tauri_invoke('error_dialog', { why: event.payload })
}
