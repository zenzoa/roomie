class MetaroomSidebar {
	static setup(metaroom) {
		Sidebar.createHeader('Metaroom')

		const [backgroundInput, backgroundButton] = Sidebar.createFileInput('metaroom-background', 'background')
		backgroundInput.value = metaroom.background
		backgroundInput.addEventListener('change', () => {
			tauri_invoke('update_metaroom_bg', { bg: backgroundInput.value })
		})
		backgroundButton.addEventListener('click', () => {
			tauri_invoke('select_blk_file').then((result) => {
				if (result) {
					tauri_invoke('update_metaroom_bg', { bg: result })
				}
			})
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
			newWidth = Sidebar.getInputInt(widthInput, metaroom.width)
			tauri_invoke('resize_metaroom', { w: newWidth, h: metaroom.height })
		})

		const heightInput = Sidebar.createIntInput('metaroom-height', 'height', MAX_U32)
		heightInput.value = metaroom.height
		heightInput.addEventListener('change', () => {
			newHeight = Sidebar.getInputInt(heightInput, metaroom.height)
			tauri_invoke('resize_metaroom', { w: metaroom.width, h: newHeight })
		})

		const [musicFileInput, musicFileButton] = Sidebar.createFileInput('metaroom-music-file', 'music file')
		musicFileInput.value = metaroom.music_file_name
		musicFileInput.addEventListener('change', () => {
			metaroom.music_file_name = musicFileInput.value
			tauri_invoke('update_metaroom', { metaroom })
		})
		musicFileButton.addEventListener('click', () => {
			tauri_invoke('select_mng_file').then((result) => {
				if (result) {
					metaroom.music_file_name = result
					tauri_invoke('update_metaroom', { metaroom })
				}
			})
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
