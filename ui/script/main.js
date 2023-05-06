const Tauri = window.__TAURI__

let metaroom = null
let undoStack = []
let redoStack = []
let isModified = false

let bgImage = null
let faviconImage = null

const WORLD_WIDTH = 200000
const WORLD_HEIGHT = 200000

const MIN_GAP = 10
const SNAP_DIST = 8
const SELECT_DIST = 8

let mouseXEl = null
let mouseYEl = null

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
	document.getElementById('delete-selection-button').addEventListener('click', deleteSelection)
	document.getElementById('guide-button').addEventListener('click', toggleGuide)

	// metaroom event listeners
	document.getElementById('metaroom-background').addEventListener('click', changeMetaroomBackground)
	document.getElementById('metaroom-music').addEventListener('click', changeMetaroomMusic)
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
	document.getElementById('room-x-left').addEventListener('change', changeRoomXL)
	document.getElementById('room-x-right').addEventListener('change', changeRoomXR)
	document.getElementById('room-y-top-left').addEventListener('change', changeRoomYTL)
	document.getElementById('room-y-top-right').addEventListener('change', changeRoomYTR)
	document.getElementById('room-y-bottom-left').addEventListener('change', changeRoomYBL)
	document.getElementById('room-y-bottom-right').addEventListener('change', changeRoomYBR)

	// smell event listeners
	document.getElementById('add-smell').addEventListener('click', addSmell)
	document.getElementById('room-emitter-classifier').addEventListener('change', changeEmitterClassifier)

	// door event listeners
	document.getElementById('door-permeability').addEventListener('change', changeDoorPermeability)

	// mouse pos elements
	mouseXEl = document.getElementById('mouse-pos-x')
	mouseYEl = document.getElementById('mouse-pos-y')
}

function draw() {
	clear()
	scale(UI.zoomLevel)
	translate(UI.xOffset, UI.yOffset)

	if (bgImage) {
		push()
		scale(2)
		tint(255, config.bg_opacity)
		image(bgImage, 0, 0)
		pop()
	}

	stroke(255)
	strokeWeight(1)
	noFill()
	rect(0, 0, metaroom.w, metaroom.h)

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

	stroke(255)
	strokeWeight(2)
	for (const room of UI.selectedRooms) {
		Room.draw(room, true)
	}

	for (const door of metaroom.doors) {
		Door.draw(door)
	}

	fill(255)
	noStroke()
	for (const room of UI.selectedRooms) {
		Room.drawCorners(room)
	}

	fill(255)
	stroke(255)
	strokeWeight(1)
	for (const link of metaroom.links) {
		Link.draw(link)
	}

	noFill()
	stroke(255)
	strokeWeight(1)
	for (const room of metaroom.rooms) {
		Room.drawSmells(room)
	}

	if (metaroom.hasFavicon) {
		Favicon.draw()
	}

	if (UI.isSelecting) {
		UI.drawSelection()
	}

	if (document.activeElement.tagName !== 'INPUT') {
		if (keyIsDown(LEFT_ARROW)) {
			UI.xOffset += (keyIsDown(SHIFT) ? 100 : 10) / UI.zoomLevel
		}
		if (keyIsDown(RIGHT_ARROW)) {
			UI.xOffset -= (keyIsDown(SHIFT) ? 100 : 10) / UI.zoomLevel
		}
		if (keyIsDown(UP_ARROW)) {
			UI.yOffset += (keyIsDown(SHIFT) ? 100 : 10) / UI.zoomLevel
		}
		if (keyIsDown(DOWN_ARROW)) {
			UI.yOffset -= (keyIsDown(SHIFT) ? 100 : 10) / UI.zoomLevel
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
