class RoomSidebar {
	static setup(rooms) {
		Sidebar.createHeader(rooms.length > 1 ? 'Rooms' : 'Room')

		const roomTypeInput = Sidebar.createDropdown('room-type', 'type', [
			{ value: '', label: '-' },
			{ value: 0, label: '0 - Atmosphere' },
			{ value: 1, label: '1 - Wooden Walkway' },
			{ value: 2, label: '2 - Concrete Walkway' },
			{ value: 3, label: '3 - Indoor Concrete' },
			{ value: 4, label: '4 - Outdoor Concrete' },
			{ value: 5, label: '5 - Normal Soil' },
			{ value: 6, label: '6 - Boggy Soil' },
			{ value: 7, label: '7 - Drained Soil' },
			{ value: 8, label: '8 - Fresh Water' },
			{ value: 9, label: '9 - Salt Water' },
			{ value: 10, label: '10 - Ettin Home' },
			{ value: 11, label: '11 - [unknown]' },
			{ value: 12, label: '12 - [unknown]' },
			{ value: 13, label: '13 - [unknown]' },
			{ value: 14, label: '14 - [unknown]' },
			{ value: 15, label: '15 - [unknown]' },
			{ value: 16, label: '16 - [unknown]' },
			{ value: 17, label: '17 - [unknown]' },
			{ value: 18, label: '18 - [unknown]' },
			{ value: 19, label: '19 - [unknown]' },
			{ value: 20, label: '20 - [unknown]' }
		])
		roomTypeInput.value = Sidebar.allTheSame(rooms, 'room_type') ? rooms[0].room_type : ''
		roomTypeInput.addEventListener('change', () => {
			let roomType = parseInt(roomTypeInput.value)
			if (!isNaN(roomType) && roomType >= 0 && roomType <= 20) {
				for (let room of rooms) room.room_type = roomType
				tauri_invoke('update_rooms', { rooms })
			} else {
				roomTypeInput.value = ''
			}
		})

		const xlInput = Sidebar.createIntInput('room-xl', 'x left', MAX_U32)
		xlInput.value = Sidebar.allTheSame(rooms, 'x_left') ? rooms[0].x_left : ''
		xlInput.addEventListener('change', () => {
			const xl = Sidebar.getInputInt(xlInput, rooms[0].x_left)
			setupSelectionForMovement()
			for (let room of tempRooms) room.x_left = xl
			finishMovingSelection()
		})

		const xrInput = Sidebar.createIntInput('room-xr', 'x right', MAX_U32)
		xrInput.value = Sidebar.allTheSame(rooms, 'x_right') ? rooms[0].x_right : ''
		xrInput.addEventListener('change', () => {
			const xr = Sidebar.getInputInt(xrInput, rooms[0].x_right)
			setupSelectionForMovement()
			for (let room of tempRooms) room.x_right = xr
			finishMovingSelection()
		})

		const ytlInput = Sidebar.createIntInput('room-ytl', 'y top-left', MAX_U32)
		ytlInput.value = Sidebar.allTheSame(rooms, 'y_top_left') ? rooms[0].y_top_left : ''
		ytlInput.addEventListener('change', () => {
			const ytl = Sidebar.getInputInt(ytlInput, rooms[0].y_top_left)
			setupSelectionForMovement()
			for (let room of tempRooms) room.y_top_left = ytl
			finishMovingSelection()
		})

		const ytrInput = Sidebar.createIntInput('room-ytr', 'y top-right', MAX_U32)
		ytrInput.value = Sidebar.allTheSame(rooms, 'y_top_right') ? rooms[0].y_top_right : ''
		ytrInput.addEventListener('change', () => {
			const ytr = Sidebar.getInputInt(ytrInput, rooms[0].y_top_right)
			setupSelectionForMovement()
			for (let room of tempRooms) room.y_top_right = ytr
			finishMovingSelection()
		})

		const yblInput = Sidebar.createIntInput('room-ybl', 'y bottom-left', MAX_U32)
		yblInput.value = Sidebar.allTheSame(rooms, 'y_bot_left') ? rooms[0].y_bot_left : ''
		yblInput.addEventListener('change', () => {
			const ybl = Sidebar.getInputInt(yblInput, rooms[0].y_bot_left)
			setupSelectionForMovement()
			for (let room of tempRooms) room.y_bot_left = ybl
			finishMovingSelection()
		})

		const ybrInput = Sidebar.createIntInput('room-ybr', 'y bottom-right', MAX_U32)
		ybrInput.value = Sidebar.allTheSame(rooms, 'y_bot_right') ? rooms[0].y_bot_right : ''
		ybrInput.addEventListener('change', () => {
			const ybr = Sidebar.getInputInt(ybrInput, rooms[0].y_bot_right)
			setupSelectionForMovement()
			for (let room of tempRooms) room.y_bot_right = ybr
			finishMovingSelection()
		})

		Sidebar.createDivider()

		if (rooms.length === 1) {
			const room = rooms[0]
			const width = room.x_right - room.x_left
			const bottomHeight = room.y_bot_right - room.y_bot_left
			const leftHeight = room.y_bot_left - room.y_top_left
			const rightHeight = room.y_bot_right - room.y_top_right
			const slope = -Math.floor(bottomHeight / width * 100 * 100)/ 100

			if (leftHeight < 170 || rightHeight < 170) {
				const sizeWarningEl = document.createElement('div')
				sizeWarningEl.className = 'size-warning'
				sizeWarningEl.innerText = 'Room may be too short for some creatures'
				Sidebar.contentEl.append(sizeWarningEl)
			}

			const widthEl = document.createElement('label')
			widthEl.innerHTML = `<span>width</span><span class="static-value">${width}</span>`
			Sidebar.contentEl.append(widthEl)

			const heightEl = document.createElement('label')
			if (leftHeight === rightHeight) {
				heightEl.innerHTML = `<span>height</span><span class="static-value">${leftHeight}</span>`
			} else {
				heightEl.innerHTML = `<span>height</span><span class="static-value">${leftHeight} | ${rightHeight}</span>`
			}
			Sidebar.contentEl.append(heightEl)

			const slopeEl = document.createElement('label')
			slopeEl.innerHTML = `<span>slope</span><span class="static-value">${slope}%</span>`
			Sidebar.contentEl.append(slopeEl)

			Sidebar.createDivider()
		}

		const [musicFileInput, musicFileButton] = Sidebar.createFileInput('room-music-file', 'music file')
		musicFileInput.value = Sidebar.allTheSame(rooms, 'music_file_name') ? rooms[0].music_file_name : ''
		musicFileInput.addEventListener('change', () => {
			for (let room of rooms) room.music_file_name = musicFileInput.value
			tauri_invoke('update_rooms', { rooms })
		})

		const musicTrackInput = Sidebar.createStrInput('room-music-track', 'track name')
		musicTrackInput.value = Sidebar.allTheSame(rooms, 'music_track_name') ? rooms[0].music_track_name : ''
		musicTrackInput.addEventListener('change', () => {
			for (let room of rooms) room.music_track_name = musicTrackInput.value
			tauri_invoke('update_rooms', { rooms })
		})

		if (rooms.length === 1) {
			const room = rooms[0]

			Sidebar.createDivider()
			Sidebar.createSubheader('CA Smells')

			for (const smellId in room.smells) {
				RoomSidebar.createSmell(room, smellId)
			}

			const newSmellButton = document.createElement('button')
			newSmellButton.className = 'text-button'
			newSmellButton.innerText = 'Add Smell'
			newSmellButton.addEventListener('click', () => {
				room.smells.push({ ca: 0, amount: 0 })
				tauri_invoke('update_smells', { roomId: room.id, smells: room.smells })
			})
			Sidebar.contentEl.append(newSmellButton)
		}
	}

	static createSmell(room, smellId) {
		let smell = room.smells[smellId]

		let smellEl = document.createElement('div')
		smellEl.className = 'smell'

		const smellTypeInput = Sidebar.createDropdown(`smell-${smellId}-type`, null, [
			{ value: '', label: '-' },
			{ value: 0, label: '0 - (Critters & Bugs)' },
			{ value: 1, label: '1 - Light' },
			{ value: 2, label: '2 - Heat' },
			{ value: 3, label: '3 - Precipitation' },
			{ value: 4, label: '4 - Nutrient' },
			{ value: 5, label: '5 - Water' },
			{ value: 6, label: '6 - Protein' },
			{ value: 7, label: '7 - Carbohydrate' },
			{ value: 8, label: '8 - Fat' },
			{ value: 9, label: '9 - (Flowers/Detritus)' },
			{ value: 10, label: '10 - Machinery' },
			{ value: 11, label: '11 - Eggs' },
			{ value: 12, label: '12 - Norn' },
			{ value: 13, label: '13 - Grendel' },
			{ value: 14, label: '14 - Ettin' },
			{ value: 15, label: '15 - Norn Home' },
			{ value: 16, label: '16 - Grendel Home' },
			{ value: 17, label: '17 - Ettin Home' },
			{ value: 18, label: '18 - Gadgets' },
			{ value: 19, label: '19 - (Toys)' }
		])
		smellTypeInput.value = smell.ca
		smellTypeInput.addEventListener('change', () => {
			const smellType = parseInt(smellTypeInput.value)
			if (!isNaN(smellType) && smellType >= 0 && smellType <= 19) {
				smell.ca = smellType
				tauri_invoke('update_smells', { roomId: room.id, smells: room.smells })
			} else {
				smellTypeInput.value = smell.ca
			}
		})

		let arrowEl = document.createElement('div')
		arrowEl.className = 'dropdown-arrow'
		arrowEl.innerHTML = '<img src="library/mono-icons/svg/caret-down.svg">'

		let dropdownContainer = document.createElement('div')
		dropdownContainer.className = 'dropdown-container'
		dropdownContainer.appendChild(smellTypeInput)
		dropdownContainer.appendChild(arrowEl)
		smellEl.append(dropdownContainer)

		const smellAmountInput = Sidebar.createFloatInput(`smell-${smellId}-amount`, null, 255)
		smellAmountInput.value = smell.amount
		smellAmountInput.addEventListener('change', () => {
			const smellAmount = Sidebar.getInputFloat(smellAmountInput, smell.amount)
			smell.amount = smellAmount
			tauri_invoke('update_smells', { roomId: room.id, smells: room.smells })
		})
		smellEl.append(smellAmountInput)

		const smellDeleteButton = createIconButton(`smell-${smellId}-delete`, 'Delete Smell', 'delete')
		smellDeleteButton.addEventListener('click', () => {
			room.smells.splice(smellId, 1)
			tauri_invoke('update_smells', { roomId: room.id, smells: room.smells })
		})
		smellEl.append(smellDeleteButton)

		Sidebar.contentEl.append(smellEl)
	}
}
