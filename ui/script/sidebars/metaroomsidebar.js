class MetaroomSidebar {
	static setup(metaroom) {
		Sidebar.createHeader('Metaroom')

		const backgroundInput = Sidebar.createStrInput('metaroom-background', 'background')
		backgroundInput.value = metaroom.background
		backgroundInput.addEventListener('change', () => {
			metaroom.background = backgroundInput.value
			tauri_invoke('update_metaroom', { metaroom })
		})

		const xInput = Sidebar.createIntInput('metaroom-x', 'x', MAX_U32)
		xInput.value = metaroom.x
		xInput.addEventListener('change', () => {
			metaroom.x = Sidebar.getInputInt(xInput, metaroom.x)
			tauri_invoke('update_metaroom', { metaroom })
		})

		const yInput = Sidebar.createIntInput('metaroom-y', 'y', MAX_U32)
		yInput.value = metaroom.y
		yInput.addEventListener('change', () => {
			metaroom.y = Sidebar.getInputInt(yInput, metaroom.y)
			tauri_invoke('update_metaroom', { metaroom })
		})

		const widthInput = Sidebar.createIntInput('metaroom-width', 'width', MAX_U32)
		widthInput.value = metaroom.width
		widthInput.addEventListener('change', () => {
			metaroom.width = Sidebar.getInputInt(widthInput, metaroom.width)
			tauri_invoke('update_metaroom', { metaroom })
		})

		const heightInput = Sidebar.createIntInput('metaroom-height', 'height', MAX_U32)
		heightInput.value = metaroom.height
		heightInput.addEventListener('change', () => {
			metaroom.height = Sidebar.getInputInt(heightInput, metaroom.height)
			tauri_invoke('update_metaroom', { metaroom })
		})

		const musicFileInput = Sidebar.createStrInput('metaroom-music-file', 'music file')
		musicFileInput.value = metaroom.music_file_name
		musicFileInput.addEventListener('change', () => {
			metaroom.music_file_name = musicFileInput.value
			tauri_invoke('update_metaroom', { metaroom })
		})

		const musicTrackInput = Sidebar.createStrInput('metaroom-music-track', 'track name')
		musicTrackInput.value = metaroom.music_track_name
		musicTrackInput.addEventListener('change', () => {
			metaroom.music_track_name = musicTrackInput.value
			tauri_invoke('update_metaroom', { metaroom })
		})

		const emitterSpeciesInput = Sidebar.createIntInput('emitter-species', 'CA emitter species', MAX_U16)
		emitterSpeciesInput.value = metaroom.emitter_species
		emitterSpeciesInput.addEventListener('change', () => {
			metaroom.emitter_species = Sidebar.getInputInt(emitterSpeciesInput, metaroom.emitter_species)
			tauri_invoke('update_metaroom', { metaroom })
		})
	}
}
