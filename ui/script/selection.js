const SELECT_RADIUS = 12
const SNAP_RADIUS = 12

let selectionType = 'Any'
let selectionStyle = null

let selectedRooms = []
let selectedSides = []
let selectedCorners = []
let selectedDoors = []
let selectedLinks = []
let selectedOverlays = []
let isFaviconSelected = false

let newSelection = []

let newLinkRoom1 = null
let newLinkRoom2 = null

let addedLink = false
let addedOverlay = false
let addedFavicon = false

const resetSelection = (except) => {
	if (!except) {
		selectionType = 'Any'
	}
	if (except !== 'Rooms') {
		selectedRooms = []
		tempRooms = []
	}
	if (except !== 'Sides') {
		selectedSides = []
		tempSides = []
	}
	if (except !== 'Corners') {
		selectedCorners = []
		tempCorners = []
	}
	if (except !== 'Doors') {
		selectedDoors = []
		tempDoors = []
	}
	if (except !== 'Links') {
		selectedLinks = []
		tempLink = null
	}
	if (except !== 'Overlays') {
		selectedOverlays = []
		tempOverlays = []
	}
	if (except !== 'Favicon') {
		isFaviconSelected = false
		tempFavicon = null
	}

	addedLink = false
	addedOverlay = false
	addedFavicon = false
}

const clearSelection = () => {
	resetSelection()
	drawAll()
}

const selectAllRooms = () => {
	if (metaroom && showRoomCanvas) {
		selectionType = 'Rooms'
		newSelection = metaroom.rooms.map(r => r.id)
		finishSelectingObject()
	}
}

const startSelectingObject = (event) => {
	newSelection = null

	selectionStyle = null
	if (event.ctrlKey || event.metaKey) {
		selectionStyle = 'Toggle'
	} else if (event.shiftKey) {
		selectionStyle = 'Add'
	} else {
		selectionType = 'Any'
	}

	const x = xMouseRel
	const y = yMouseRel
	const r = SELECT_RADIUS / scale * DPR

	tauri_invoke('get_object_at', { x, y, r, selectionType }).then(startNewSelection)
}

const finishSelectingObject = () => {
	if (newSelection != null && newSelection.length > 0) {
		if (selectionType === 'Rooms') {
			resetSelection('Rooms')
			selectedRooms = onClickObjects(selectedRooms, newSelection)

		} else if (selectionType === 'Sides') {
			resetSelection('Sides')
			selectedSides = onClickObjects(selectedSides, newSelection)

		} else if (selectionType === 'Corners') {
			resetSelection('Corners')
			selectedCorners = onClickObjects(selectedCorners, newSelection)

		} else if (selectionType === 'Doors') {
			resetSelection('Doors')
			selectedDoors = onClickObjects(selectedDoors, newSelection)

		} else if (selectionType === 'Links') {
			resetSelection('Links')
			selectedLinks = onClickObjects(selectedLinks, newSelection)

		} else if (selectionType === 'Overlays') {
			resetSelection('Overlays')
			selectedOverlays = onClickObjects(selectedOverlays, newSelection)

		} else if (selectionType === 'Favicon') {
			resetSelection('Favicon')
			isFaviconSelected = true
		}

		drawRooms()
		drawOverlays()

	} else if (!selectionStyle) {
		clearSelection()
	}

	selectionStyle = null

	Sidebar.setTo(selectionType)
}

const startSelectingArea = (event) => {
	newSelection = null

	selectionStyle = null
	if (event.ctrlKey || event.metaKey) {
		selectionStyle = 'Remove'
	} else if (event.shiftKey) {
		selectionStyle = 'Add'
	} else {
		selectionType = 'Any'
	}

	const x = Math.min(xDragStartRel, xMouseRel)
	const y = Math.min(yDragStartRel, yMouseRel)
	const w = Math.abs(xDragStartRel - xMouseRel)
	const h = Math.abs(yDragStartRel - yMouseRel)

	tauri_invoke('get_objects_within', { x, y, w, h, selectionType }).then(startNewSelection)
}

const finishSelectingArea = () => {
	if (newSelection != null && newSelection.length > 0) {
		if (selectionType === 'Rooms') {
			resetSelection('Rooms')
			selectedRooms = onClickObjects(selectedRooms, newSelection)

		} else if (selectionType === 'Sides') {
			resetSelection('Sides')
			selectedSides = onClickObjects(selectedSides, newSelection)

		} else if (selectionType === 'Corners') {
			resetSelection('Corners')
			selectedCorners = onClickObjects(selectedCorners, newSelection)

		} else if (selectionType === 'Doors') {
			resetSelection('Doors')
			selectedDoors = onClickObjects(selectedDoors, newSelection)

		} else if (selectionType === 'Links') {
			resetSelection('Links')
			selectedLinks = onClickObjects(selectedLinks, newSelection)

		} else if (selectionType === 'Overlays') {
			resetSelection('Overlays')
			selectedOverlays = onClickObjects(selectedOverlays, newSelection)

		} else if (selectionType === 'Favicon') {
			resetSelection('Favicon')
			isFaviconSelected = true
		}

		drawRooms()
		drawOverlays()

	} else if (!selectionStyle) {
		clearSelection()
	}

	selectionStyle = null

	Sidebar.setTo(selectionType)
}

const startNewSelection = (result) => {
	if (!result) {
		if (!selectionStyle) {
			selectionType = 'Any'
		}

	} else if (result.Corners && (selectionType === 'Corners' || selectionType === 'Any')) {
		selectionType = 'Corners'
		newSelection = result.Corners

	} else if (result.Doors && (selectionType === 'Doors' || selectionType === 'Any')) {
		selectionType = 'Doors'
		newSelection = result.Doors

	} else if (result.Sides && (selectionType === 'Sides' || selectionType === 'Any')) {
		selectionType = 'Sides'
		newSelection = result.Sides

	} else if (result.Rooms && (selectionType === 'Rooms' || selectionType === 'Any')) {
		selectionType = 'Rooms'
		newSelection = result.Rooms

	} else if (result.Links && (selectionType === 'Links' || selectionType === 'Any')) {
		selectionType = 'Links'
		newSelection = result.Links

	} else if (result.Overlays && (selectionType === 'Overlays' || selectionType === 'Any')) {
		selectionType = 'Overlays'
		newSelection = result.Overlays

	} else if (result.Favicon && (selectionType === 'Favicon' || selectionType === 'Any')) {
		selectionType = 'Favicon'
		newSelection = [0]

	} else if (!selectionStyle) {
		selectionType = 'Any'
	}
}

const onClickObjects = (selection, ids) => {
	if (selectionStyle === 'Toggle') {
		return toggleObjectsInSelection(selection.slice(), ids)
	} else if (selectionStyle === 'Add') {
		return addObjectsToSelection(selection.slice(), ids)
	} else if (selectionStyle === 'Remove') {
		return removeObjectsFromSelection(selection.slice(), ids)
	} else {
		return ids
	}
}

const addObjectsToSelection = (selection, ids) => {
	for (const id of ids) {
		if (!selection.includes(id)) {
			selection.push(id)
		}
	}
	return selection
}

const removeObjectsFromSelection = (selection, ids) => {
	return selection.filter(id => !ids.includes(id))
}

const toggleObjectsInSelection = (selection, ids) => {
	for (const id of ids) {
		if (selection.includes(id)) {
			selection = selection.filter(id2 => id !== id2)
		} else {
			selection.push(id)
		}
	}
	return selection
}

const removeSelectedObjects = () => {
	if (selectionType === 'Rooms') {
		tauri_invoke('remove_rooms', { ids: selectedRooms })
	} else if (selectionType === 'Links') {
		tauri_invoke('remove_links', { ids: selectedLinks })
	} else if (selectionType === 'Overlays') {
		tauri_invoke('remove_overlays', { ids: selectedOverlays })
	} else if (selectionType === 'Favicon') {
		tauri_invoke('remove_favicon', {})
	}
	clearSelection()
}
