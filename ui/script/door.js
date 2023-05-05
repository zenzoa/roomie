class Door {

	constructor({ room1Id, room2Id, permeability }) {
		this.active = true
		this.room1Id = room1Id
		this.room2Id = room2Id
		this.permeability = permeability || 100
		this.overlap = null
	}

	static updateSidebar(door) {
		document.getElementById('door-permeability').value = door.permeability
	}

	static draw(door) {
		if (!door.active) return

		const room1 = metaroom.rooms[door.room1Id]
		const room2 = metaroom.rooms[door.room2Id]

		if (room1 && room2 && !room1.hasCollision && !room2.hasCollision) {
			if (UI.selectedRooms.includes(room1) || UI.selectedRooms.includes(room2)) {
				const lastSelected = UI.selectedRooms[UI.selectedRooms.length - 1]
				if (UI.isDragging) {
					return
				} else if (lastSelected === room1 || lastSelected === room2) {
					strokeWeight(5)
				} else {
					strokeWeight(3)
				}
			} else {
				if (door === UI.selectedDoor) {
					strokeWeight(10)
				} else {
					strokeWeight(2)
				}
			}

			if (door.permeability >= 50) {
				const r = 1 - ((door.permeability - 50) / 50)
				stroke(Math.floor(r * 255), 255, 0)
			} else if (door.permeability < 50) {
				let b = door.permeability / 50
				stroke(255, Math.floor(b * 255), 0)
			}

			const overlap = Room.sideOverlap(room1, room2)
			if (overlap) {
				line(overlap.x1, overlap.y1, overlap.x2, overlap.y2)
			}
		}
	}
}

function changeDoorPermeability() {
	if (UI.selectedDoor) {
		const input = document.getElementById('door-permeability')
		const permeability = parseInt(input.value)
		if (!isNaN(permeability)) {
			saveState()
			UI.selectedDoor.permeability = Math.min(100, Math.max(0, permeability))
		}
		input.value = UI.selectedDoor.permeability
	}
}