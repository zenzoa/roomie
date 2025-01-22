class SideSidebar {
	static setup(sides) {
		Sidebar.createHeader(sides.length > 1 ? 'Sides' : 'Side')

		const x1Input = Sidebar.createIntInput('side-x1', 'x1', MAX_U32)
		x1Input.value = Sidebar.allTheSame(sides, 'x1') ? sides[0].x1 : ''
		x1Input.addEventListener('change', () => {
			const x1 = Sidebar.getInputInt(x1Input, sides[0].x1)
			setupSelectionForMovement()
			for (let side of tempSides) {
				side.x1 = x1
				const room = tempRooms.find(r => r.id === side.room_id)
				if (room && side.position === 'Top') {
					room.x_left = x1
				} else if (room && side.position === 'Bottom') {
					room.x_left = x1
				} else if (room && side.position === 'Left') {
					room.x_left = x1
				} else if (room && side.position === 'Right') {
					room.x_right = x1
				}
			}
			finishMovingSelection()
		})

		const y1Input = Sidebar.createIntInput('side-y1', 'y1', MAX_U32)
		y1Input.value = Sidebar.allTheSame(sides, 'y1') ? sides[0].y1 : ''
		y1Input.addEventListener('change', () => {
			const y1 = Sidebar.getInputInt(y1Input, sides[0].y1)
			setupSelectionForMovement()
			for (let side of tempSides) {
				side.y1 = y1
				const room = tempRooms.find(r => r.id === side.room_id)
				if (room && side.position === 'Top') {
					room.y_top_left = y1
				} else if (room && side.position === 'Bottom') {
					room.y_bot_left = y1
				} else if (room && side.position === 'Left') {
					room.y_top_left = y1
				} else if (room && side.position === 'Right') {
					room.y_top_right = y1
				}
			}
			finishMovingSelection()
		})

		const x2Input = Sidebar.createIntInput('side-x2', 'x2', MAX_U32)
		x2Input.value = Sidebar.allTheSame(sides, 'x2') ? sides[0].x2 : ''
		x2Input.addEventListener('change', () => {
			const x2 = Sidebar.getInputInt(x2Input, sides[0].x2)
			setupSelectionForMovement()
			for (let side of tempSides) {
				side.x2 = x2
				const room = tempRooms.find(r => r.id === side.room_id)
				if (room && side.position === 'Top') {
					room.x_right = x2
				} else if (room && side.position === 'Bottom') {
					room.x_right = x2
				} else if (room && side.position === 'Left') {
					room.x_left = x2
				} else if (room && side.position === 'Right') {
					room.x_right = x2
				}
			}
			finishMovingSelection()
		})

		const y2Input = Sidebar.createIntInput('side-y2', 'y2', MAX_U32)
		y2Input.value = Sidebar.allTheSame(sides, 'y2') ? sides[0].y2 : ''
		y2Input.addEventListener('change', () => {
			const y2 = Sidebar.getInputInt(y2Input, sides[0].y2)
			setupSelectionForMovement()
			for (let side of tempSides) {
				side.y2 = y2
				const room = tempRooms.find(r => r.id === side.room_id)
				if (room && side.position === 'Top') {
					room.y_top_right = y2
				} else if (room && side.position === 'Bottom') {
					room.y_bot_right = y2
				} else if (room && side.position === 'Left') {
					room.y_bot_left = y2
				} else if (room && side.position === 'Right') {
					room.y_bot_right = y2
				}
			}
			finishMovingSelection()
		})
	}
}
