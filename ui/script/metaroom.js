class Metaroom {

	constructor({ x, y, w, h, background }) {
		this.x = x || 0
		this.y = y || 0
		this.w = w || 800
		this.h = h || 600

		this.path = ''
		this.dir = ''

		this.background = background || ''

		this.music = ''

		this.hasFavicon = false
		this.favicon = new Favicon()

		this.rooms = []
		this.doors = []
		this.links = []
		this.overlays = []
	}

	static updateSidebar(metaroom) {
		document.getElementById('metaroom-background-value').innerText = metaroom.background || '—'
		document.getElementById('metaroom-music-value').innerText = metaroom.music || '—'

		document.getElementById('metaroom-x').value = metaroom.x
		document.getElementById('metaroom-y').value = metaroom.y
		document.getElementById('metaroom-w').value = metaroom.w
		document.getElementById('metaroom-h').value = metaroom.h

		Favicon.updateSidebar(metaroom.favicon)
	}

	static roomAt(metaroom, x, y) {
		for (const room of metaroom.rooms) {
			if (Geometry.intersect(
					Geometry.quadPolygon(room),
					Geometry.rectPolygon({ x, y, w: 1, h: 1 })
				)) {
					return room
			}
		}
	}

	static doorAt(metaroom, x, y) {
		for (const door of metaroom.doors) {
			if (door.active && door.overlap) {
				const { x1, y1, x2, y2 } = door.overlap
				if (Geometry.circleOnLine(x, y, SNAP_DIST, x1, y1, x2, y2)) {
					return door
				}
			}
		}
	}

	static linkAt(metaroom, x, y) {
		for (const link of metaroom.links) {
			const room1 = metaroom.rooms[link.room1Id]
			const room2 = metaroom.rooms[link.room2Id]
			if (room1 && room2) {
				const point1 = Room.getCenter(room1)
				const point2 = Room.getCenter(room2)
				if (Geometry.circleOnLine(x, y, SNAP_DIST, point1.x, point1.y, point2.x, point2.y)) {
					return link
				}
			}
		}
	}

	static overlayAt(metaroom, x, y) {
		for (const overlay of metaroom.overlays) {
			if (Geometry.intersect(
					Geometry.rectPolygon(overlay),
					Geometry.rectPolygon({ x, y, w: 1, h: 1 })
				)) {
					return overlay
			}
		}
	}

	static removeRoom(metaroom, roomId) {
		metaroom.doors = metaroom.doors.filter(d => d.room1Id !== roomId && d.room2Id !== roomId)
		metaroom.links = metaroom.links.filter(l => l.room1Id !== roomId && l.room2Id !== roomId)
		for (const door of metaroom.doors) {
			if (door.room1Id > roomId) door.room1Id--
			if (door.room2Id > roomId) door.room2Id--
		}
		for (const link of metaroom.links) {
			if (link.room1Id > roomId) link.room1Id--
			if (link.room2Id > roomId) link.room2Id--
		}
		metaroom.rooms = metaroom.rooms.filter((_, i) => i !== roomId)
	}

	static updateDoors(metaroom) {
		metaroom.rooms.forEach((room1, room1Id) => {
			metaroom.rooms.forEach((room2, room2Id) => {
				let door = metaroom.doors.find(d =>
					(d.room1Id === room1Id && d.room2Id === room2Id) ||
					(d.room1Id === room2Id && d.room2Id === room1Id)
				)
				const overlap = Room.sideOverlap(room1, room2)
				if (overlap) {
					if (door) {
						door.active = true
					} else {
						door = new Door({ room1Id, room2Id, permeability: 100 })
						metaroom.doors.push(door)
					}
					door.overlap = overlap
				} else if (door) {
					door.active = false
					door.overlap = null
				}
			})
		})
	}

	static importBgImage(metaroom, updateDimensions) {
		if (metaroom && metaroom.background) {
			Tauri.invoke('get_background', { dir: metaroom.dir, title: metaroom.background })
			.then((bg_path) => {
				const assetUrl = Tauri.tauri.convertFileSrc(bg_path)
				loadImage(assetUrl,
					(img) => {
						bgImage = img
						if (updateDimensions) {
							metaroom.w = bgImage.width
							metaroom.h = bgImage.height
						}
						bgImage.resize(bgImage.width / 2, bgImage.height / 2)
						UI.updateSidebar()
					},
					() => {
						Tauri.dialog.message('Unable to load background image ' + metaroom.background + '.png', { title: 'File Error', type: 'error' })
					}
				)
			})
			.catch((why) => {
				Tauri.dialog.message(why, { title: 'Image Error', type: 'error' })
			})
		}
	}
}

function changeMetaroomBackground() {
	Tauri.dialog.open({ filters: [{ name: 'Image File', extensions: ['png', 'blk'] }] })
	.then((filePath) => {
		Tauri.path.basename(filePath)
		.then((basename) => {
			saveState()
			metaroom.background = basename.replace(/\.(png|blk)$/i, '')
			if (!metaroom.dir) {
				metaroom.dir = filePath.replace(basename, '')
			}
			Metaroom.importBgImage(metaroom, true)
		})
		.catch((why) => console.error(why))
	})
	.catch((why) => console.error(why))
}

function removeMetaroomBackground() {
	saveState()
	metaroom.background = ''
	UI.updateSidebar()
}

function changeMetaroomMusic() {
	Tauri.dialog.open({ filters: [{ name: 'Creatures Music File', extensions: ['mng'] }] })
	.then((filePath) => {
		Tauri.path.basename(filePath)
		.then((basename) => {
			saveState()
			metaroom.music = basename.replace(/\.mng$/i, '')
			if (!metaroom.dir) {
				metaroom.dir = filePath.replace(basename, '')
			}
			UI.updateSidebar()
		})
		.catch((why) => console.error(why))
	})
	.catch((why) => console.error(why))
}

function removeMetaroomMusic() {
	saveState()
	metaroom.music = ''
	UI.updateSidebar()
}

function changeMetaroomX() {
	const input = document.getElementById('metaroom-x')
	const x = parseInt(input.value)
	if (!isNaN(x)) {
		saveState()
		metaroom.x = Math.max(0, Math.min(x, WORLD_WIDTH - metaroom.w))
	}
	UI.updateSidebar()
}

function changeMetaroomY() {
	const input = document.getElementById('metaroom-y')
	const y = parseInt(input.value)
	if (!isNaN(y)) {
		saveState()
		metaroom.y = Math.max(0, Math.min(y, WORLD_HEIGHT - metaroom.h))
	}
	UI.updateSidebar()
}

function changeMetaroomW() {
	const input = document.getElementById('metaroom-w')
	const w = parseInt(input.value)
	if (!isNaN(w)) {
		saveState()
		metaroom.w = Math.max(0, Math.min(w, WORLD_WIDTH - metaroom.x))
	}
	UI.updateSidebar()
	Room.checkCollisions()
}

function changeMetaroomH() {
	const input = document.getElementById('metaroom-h')
	const h = parseInt(input.value)
	if (!isNaN(h)) {
		saveState()
		metaroom.h = Math.max(0, Math.min(h, WORLD_HEIGHT - metaroom.y))
	}
	UI.updateSidebar()
	Room.checkCollisions()
}
