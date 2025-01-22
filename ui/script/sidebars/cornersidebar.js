class CornerSidebar {
	static setup(corners) {
		Sidebar.createHeader(corners.length > 1 ? 'Corners' : 'Corner')

		const xInput = Sidebar.createIntInput('corner-x', 'x', MAX_U32)
		xInput.value = Sidebar.allTheSame(corners, 'x') ? corners[0].x : ''
		xInput.addEventListener('change', () => {
			const x = Sidebar.getInputInt(xInput, corners[0].x)
			setupSelectionForMovement()
			for (let corner of tempCorners) {
				corner.x = x
				const room = tempRooms.find(r => r.id === corner.room_id)
				if (room && side.position === 'TopLeft') {
					room.x_left = x
				} else if (room && side.position === 'TopRight') {
					room.x_right = x
				} else if (room && side.position === 'BottomLeft') {
					room.x_left = x
				} else if (room && side.position === 'BottomRight') {
					room.x_right = x
				}
			}
			finishMovingSelection()
		})

		const yInput = Sidebar.createIntInput('corner-y', 'y', MAX_U32)
		yInput.value = Sidebar.allTheSame(corners, 'y') ? corners[0].y : ''
		yInput.addEventListener('change', () => {
			const y = Sidebar.getInputInt(yInput, corners[0].y)
			setupSelectionForMovement()
			for (let corner of tempCorners) {
				corner.y = y
				const room = tempRooms.find(r => r.id === corner.room_id)
				if (room && corner.position === 'TopLeft') {
					room.y_top_left = y
				} else if (room && corner.position === 'TopRight') {
					room.y_top_right = y
				} else if (room && corner.position === 'BottomLeft') {
					room.y_bot_left = y
				} else if (room && corner.position === 'BottomRight') {
					room.y_bot_right = y
				}
			}
			finishMovingSelection()
		})
	}
}
