let MAX_U16 = 65535
let MAX_U32 = 4294967295

class Sidebar {
	static el = null
	static contentEl = null
	static baseWidth = 360
	static width = 0

	static setup() {
		Sidebar.el = document.getElementById('sidebar')
		Sidebar.contentEl = document.getElementById('sidebar-content')
	}

	static setWidth(width, init) {
		Sidebar.baseWidth = width
		if (!Sidebar.el.classList.contains('hidden')) {
			const style = document.documentElement.style
			style.setProperty(`--sidebar-width`, `${width}px`)
			Sidebar.width = width
		}
		if (!init) {
			tauri_invoke('set_sidebar_width', { sidebarWidth: width, init: false })
		}
	}

	static setVisibility(value) {
		if (value) {
			document.documentElement.style.setProperty('--sidebar-width', `${Sidebar.baseWidth}px`)
			Sidebar.el.classList.remove('hidden')
			Sidebar.width = Sidebar.baseWidth
		} else {
			document.documentElement.style.setProperty('--sidebar-width', '0')
			Sidebar.el.classList.add('hidden')
			Sidebar.width = 0
		}
	}

	static setTo(type) {
		if (!metaroom) {
			Sidebar.setVisibility(false)
			return
		}

		Sidebar.contentEl.innerHTML = ''

		if (type === 'Rooms' && selectedRooms.length) {
			const selectedObjects = metaroom.rooms.filter((_, i) => selectedRooms.includes(i))
			RoomSidebar.setup(selectedObjects)

		} else if (type === 'Sides' && selectedSides.length) {
			const selectedObjects = metaroom.sides.filter((_, i) => selectedSides.includes(i))
			SideSidebar.setup(selectedObjects)

		} else if (type === 'Corners' && selectedCorners.length) {
			const selectedObjects = metaroom.corners.filter((_, i) => selectedCorners.includes(i))
			CornerSidebar.setup(selectedObjects)

		} else if (type === 'Doors' && selectedDoors.length) {
			const selectedObjects = metaroom.doors.filter((_, i) => selectedDoors.includes(i))
			DoorSidebar.setup(selectedObjects)

		} else if (type === 'Links' && selectedLinks.length) {
			const selectedObjects = metaroom.links.filter((_, i) => selectedLinks.includes(i))
			LinkSidebar.setup(selectedObjects)

		} else if (type === 'Overlays' && selectedOverlays.length) {
			const selectedObjects = metaroom.overlays.filter((_, i) => selectedOverlays.includes(i))
			OverlaySidebar.setup(selectedObjects)

		} else if (type === 'Favicon' && isFaviconSelected) {
			FaviconSidebar.setup(metaroom.favicon)

		} else {
			MetaroomSidebar.setup(metaroom)
		}

		Sidebar.setVisibility(true)
	}

	static allTheSame(objects, prop) {
		const first = objects[0][prop]
		return !objects.find(o => o[prop] !== first)
	}

	static createHeader(value) {
		let h1El = document.createElement('h1')
		h1El.innerText = value
		Sidebar.contentEl.append(h1El)
		return h1El
	}

	static createSubheader(value) {
		let h2El = document.createElement('h2')
		h2El.innerText = value
		Sidebar.contentEl.append(h2El)
		return h2El
	}

	static createDivider() {
		Sidebar.contentEl.append(document.createElement('hr'))
	}

	static createStrInput(id, label) {
		let labelEl = document.createElement('label')

		let spanEl = document.createElement('span')
		spanEl.innerText = label
		labelEl.append(spanEl)

		let inputEl = document.createElement('input')
		inputEl.setAttribute('type', 'text')
		inputEl.id = id
		labelEl.append(inputEl)

		Sidebar.contentEl.append(labelEl)

		return inputEl
	}

	static createNumInput(id, label, min, max, step) {
		let inputEl = document.createElement('input')
		inputEl.setAttribute('type', 'number')
		if (min != null) inputEl.setAttribute('min', min)
		if (max != null) inputEl.setAttribute('max', max)
		if (step != null) inputEl.setAttribute('step', step)
		inputEl.id = id

		if (label != null) {
			let labelEl = document.createElement('label')

			let spanEl = document.createElement('span')
			spanEl.innerText = label
			labelEl.append(spanEl)

			labelEl.append(inputEl)
			Sidebar.contentEl.append(labelEl)
		}

		return inputEl
	}

	static createIntInput(id, label, max) {
		return Sidebar.createNumInput(id, label, 0, max, 1)
	}

	static createFloatInput(id, label, max) {
		return Sidebar.createNumInput(id, label, 0, max, null)
	}

	static createDropdown(id, label, options) {
		let selectEl = document.createElement('select')
		selectEl.id = id

		for (const option of options) {
			let optionEl = document.createElement('option')
			optionEl.setAttribute('value', option.value)
			optionEl.innerText = option.label
			selectEl.append(optionEl)
		}

		if (label != null) {
			let labelEl = document.createElement('label')

			let spanEl = document.createElement('span')
			spanEl.innerText = label
			labelEl.append(spanEl)

			labelEl.append(selectEl)

			let arrowEl = document.createElement('div')
			arrowEl.className = 'dropdown-arrow'
			arrowEl.innerHTML = '<img src="library/mono-icons/svg/caret-down.svg">'
			labelEl.append(arrowEl)

			Sidebar.contentEl.append(labelEl)
		}

		return selectEl
	}

	static getInputInt(el, originalValue) {
		const min = parseInt(el.getAttribute('min'))
		const max = parseInt(el.getAttribute('max'))
		let newValue = parseInt(el.value)
		if (isNaN(newValue)) {
			newValue = originalValue
		} else {
			newValue = Math.max(min, Math.min(max, newValue))
		}
		el.value = newValue
		return newValue
	}

	static getInputFloat(el, originalValue) {
		const max = parseFloat(el.getAttribute('max'))
		const min = parseFloat(el.getAttribute('min'))
		let newValue = parseFloat(el.value)
		if (isNaN(newValue)) {
			newValue = originalValue
		} else {
			newValue = Math.max(min, Math.min(max, newValue))
		}
		el.value = newValue
		return newValue
	}
}
