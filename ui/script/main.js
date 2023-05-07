const Tauri = window.__TAURI__

let metaroom = null
let undoStack = []
let redoStack = []
let isModified = false

let bgImage = null
let faviconImage = null
let overlayImages = {}

const WORLD_WIDTH = 200000
const WORLD_HEIGHT = 200000

const MIN_GAP = 10
const SNAP_DIST = 8
const SELECT_DIST = 8

let mouseXEl = null
let mouseYEl = null

const NUDGE_REPEAT_DELAY = 10
let nudgeRepeatCounter = 0

let config = {
	guide_enabled: true,
	mouse_pos_enabled: true,
	bg_opacity: 128
}

function setup() {
	createCanvas(window.innerWidth, window.innerHeight)
	UI.disableContextMenu()
	UI.setupResizeHandles()
	strokeJoin(ROUND)

	metaroom = new Metaroom({})
	UI.reset()
	loadConfig()
	UI.updateGuide()
	UI.updateMousePos()

	// titlebar event listeners
	document.getElementById('new-file-button').addEventListener('click', newFile)
	document.getElementById('open-file-button').addEventListener('click', openFile)
	document.getElementById('save-file-button').addEventListener('click', saveFile)
	document.getElementById('save-as-file-button').addEventListener('click', saveAsFile)
	document.getElementById('undo-button').addEventListener('click', undo)
	document.getElementById('redo-button').addEventListener('click', redo)
	document.getElementById('zoom-in-button').addEventListener('click', zoomIn)
	document.getElementById('zoom-out-button').addEventListener('click', zoomOut)
	document.getElementById('zoom-reset-button').addEventListener('click', zoomReset)
	document.getElementById('new-room-button').addEventListener('click', newRoom)
	document.getElementById('new-link-button').addEventListener('click', newLink)
	document.getElementById('new-overlay-button').addEventListener('click', newOverlay)
	document.getElementById('delete-selection-button').addEventListener('click', deleteSelection)
	document.getElementById('guide-button').addEventListener('click', toggleGuide)
	document.getElementById('mouse-pos-button').addEventListener('click', toggleMousePos)

	// metaroom event listeners
	document.getElementById('metaroom-background').addEventListener('click', changeMetaroomBackground)
	document.getElementById('metaroom-background-remove').addEventListener('click', removeMetaroomBackground)
	document.getElementById('metaroom-music').addEventListener('click', changeMetaroomMusic)
	document.getElementById('metaroom-music-remove').addEventListener('click', removeMetaroomMusic)
	document.getElementById('metaroom-x').addEventListener('change', changeMetaroomX)
	document.getElementById('metaroom-y').addEventListener('change', changeMetaroomY)
	document.getElementById('metaroom-w').addEventListener('change', changeMetaroomW)
	document.getElementById('metaroom-h').addEventListener('change', changeMetaroomH)

	// favicon event listeners
	document.getElementById('favicon-add').addEventListener('click', enableFavicon)
	document.getElementById('favicon-remove').addEventListener('click', disableFavicon)
	document.getElementById('favicon-x').addEventListener('change', changeFaviconX)
	document.getElementById('favicon-y').addEventListener('change', changeFaviconY)
	document.getElementById('favicon-sprite').addEventListener('click', changeFaviconSprite)
	document.getElementById('favicon-classifier').addEventListener('change', changeFaviconClassifier)

	// room event listeners
	document.getElementById('room-type').addEventListener('change', changeRoomType)
	document.getElementById('room-music').addEventListener('click', changeRoomMusic)
	document.getElementById('room-music-remove').addEventListener('click', removeRoomMusic)
	document.getElementById('room-x-left').addEventListener('change', changeRoomXL)
	document.getElementById('room-x-right').addEventListener('change', changeRoomXR)
	document.getElementById('room-y-top-left').addEventListener('change', changeRoomYTL)
	document.getElementById('room-y-top-right').addEventListener('change', changeRoomYTR)
	document.getElementById('room-y-bottom-left').addEventListener('change', changeRoomYBL)
	document.getElementById('room-y-bottom-right').addEventListener('change', changeRoomYBR)

	// multi-room event listeners
	document.getElementById('multi-room-type').addEventListener('change', changeRoomType)
	document.getElementById('multi-room-music').addEventListener('click', changeRoomMusic)
	document.getElementById('multi-room-music-remove').addEventListener('click', removeRoomMusic)

	// smell event listeners
	document.getElementById('add-smell').addEventListener('click', addSmell)
	document.getElementById('room-emitter-classifier').addEventListener('change', changeEmitterClassifier)

	// door event listeners
	document.getElementById('door-permeability').addEventListener('change', changeDoorPermeability)

	// overlay event listeners
	document.getElementById('overlay-x').addEventListener('change', changeOverlayX)
	document.getElementById('overlay-y').addEventListener('change', changeOverlayY)
	document.getElementById('overlay-sprite').addEventListener('click', changeOverlaySprite)
	document.getElementById('overlay-classifier').addEventListener('change', changeOverlayClassifier)
	document.getElementById('overlay-plane').addEventListener('change', changeOverlayPlane)

	// mouse pos elements
	mouseXEl = document.getElementById('mouse-pos-x')
	mouseYEl = document.getElementById('mouse-pos-y')

	// close requested listener
	Tauri.window.appWindow.listen("tauri://close-requested", (event) => {
		if (isModified) {
			Tauri.dialog.ask(
				'You have unmodified changes to the current metaroom. Are you sure you want to discard the changes?',
				{ title: 'Discard changes?', type: 'warning' }
			)
			.then((confirmed) => {
				if (confirmed) {
					Tauri.window.appWindow.close()
				}
			})
		} else {
			Tauri.window.appWindow.close()
		}
	})
}

function draw() {
	clear()
	scale(UI.zoomLevel)
	translate(UI.xOffset, UI.yOffset)

	if (bgImage && metaroom.background) {
		push()
		scale(2)
		tint(255, config.bg_opacity)
		image(bgImage, 0, 0)
		noTint()
		pop()
	}

	stroke(255)
	strokeWeight(1)
	noFill()
	rect(0, 0, metaroom.w, metaroom.h)

	if (UI.overlayMode) {
		stroke(255, 128)
	}

	const unselectedRooms = metaroom.rooms.filter(r => !UI.selectedRooms.includes(r) && !r.hasCollision)
	const collidingRooms = metaroom.rooms.filter(r => !UI.selectedRooms.includes(r) && r.hasCollision)

	for (const room of unselectedRooms) {
		Room.draw(room)
	}

	if (UI.isDrawingRoom) {
		UI.drawNewRoom()
	} else if (UI.isDrawingLink) {
		UI.drawNewLink()
	} else if (UI.isExtrudingRoom) {
		UI.drawExtrudedRoom()
	}

	stroke(200, 50, 50)
	for (const room of collidingRooms) {
		Room.draw(room)
	}

	stroke(255, UI.overlayMode && 128)
	strokeWeight(2)
	for (const room of UI.selectedRooms) {
		Room.draw(room, true)
	}

	for (const door of metaroom.doors) {
		Door.draw(door)
	}

	fill(255, UI.overlayMode && 128)
	noStroke()
	for (const room of UI.selectedRooms) {
		Room.drawCorners(room)
	}

	fill(255, UI.overlayMode && 128)
	stroke(255, UI.overlayMode && 128)
	strokeWeight(1)
	for (const link of metaroom.links) {
		Link.draw(link)
	}

	noFill()
	stroke(255, UI.overlayMode && 128)
	strokeWeight(1)
	for (const room of metaroom.rooms) {
		Room.drawSmells(room)
	}

	if (metaroom.hasFavicon) {
		Favicon.draw()
	}

	stroke(255, !UI.overlayMode && 50)
	for (const overlay of metaroom.overlays) {
		Overlay.draw(overlay)
	}

	if (UI.isSelecting) {
		UI.drawSelection()
	}

	if (document.activeElement.tagName !== 'INPUT' &&
		(keyIsDown(LEFT_ARROW) || keyIsDown(RIGHT_ARROW) ||
		keyIsDown(UP_ARROW) || keyIsDown(DOWN_ARROW))) {
			if (UI.selectedRooms.length > 0) {
				if (nudgeRepeatCounter === 0) {
					for (const room of UI.selectedRooms) {
						Room.nudge(room)
					}
				}
			} else if (UI.selectedOverlays.length > 0) {
				if (nudgeRepeatCounter === 0) {
					for (const overlay of UI.selectedOverlays) {
						Overlay.nudge(overlay)
					}
				}
			} else if (UI.selectedFavicon) {
				if (nudgeRepeatCounter === 0) {
					Favicon.nudge()
				}
			} else {
				UI.nudge()
			}

			if (nudgeRepeatCounter < NUDGE_REPEAT_DELAY) {
				nudgeRepeatCounter += 1
			} else {
				nudgeRepeatCounter = 0
			}
	}
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
}

function loadConfig() {
	Tauri.fs.readTextFile('roomie.conf', { dir: Tauri.fs.BaseDirectory.AppConfig })
	.then((contents) => {
		try {
			const newConfig = JSON.parse(contents)
			for (const key in newConfig) {
				if (config[key] !== null) {
					config[key] = newConfig[key]
				}
			}
		} catch (why) {
			console.error(why)
		}
	})
	.catch((why) => console.error(why))
}

function saveConfig() {
	const path = 'roomie.conf'
	const dir = Tauri.fs.BaseDirectory.AppConfig
	const contents = JSON.stringify(config)
	Tauri.fs.exists(path, { dir })
	.then(() => {
		Tauri.fs.writeTextFile({ path, contents }, { dir })
		.then(() => {})
		.catch((why) => console.error(why))
	})
	.catch((_) => {
		Tauri.fs.createDir('', { dir, recursive: true })
		.then(() => {
			Tauri.fs.writeTextFile({ path, contents }, { dir })
			.then(() => {})
			.catch((why) => console.error(why))
		})
	})
}
