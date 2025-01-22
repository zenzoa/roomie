class FaviconSidebar {
	static setup(favicon) {
		Sidebar.createHeader('Favicon')

		const speciesInput = Sidebar.createIntInput('favicon-species', 'species', MAX_U16)
		speciesInput.value = favicon.species
		speciesInput.addEventListener('change', () => {
			const species = Sidebar.getInputInt(speciesInput, favicon.species)
			favicon.species = species
			tauri_invoke('update_favicon', { favicon, reloadImage: false })
		})

		const spriteInput = Sidebar.createStrInput('favicon-sprite', 'sprite')
		spriteInput.value = favicon.sprite
		spriteInput.addEventListener('change', () => {
			favicon.sprite = spriteInput.value
			tauri_invoke('update_favicon', { favicon, reloadImage: true })
		})

		const xInput = Sidebar.createIntInput('favicon-x', 'x', MAX_U32)
		xInput.value = favicon.x
		xInput.addEventListener('change', () => {
			const x = Sidebar.getInputInt(xInput, favicon.x)
			setupSelectionForMovement()
			favicon.x = x
			finishMovingSelection()
		})

		const yInput = Sidebar.createIntInput('favicon-y', 'y', MAX_U32)
		yInput.value = favicon.y
		yInput.addEventListener('change', () => {
			const y = Sidebar.getInputInt(yInput, favicon.y)
			setupSelectionForMovement()
			favicon.y = y
			finishMovingSelection()
		})
	}
}
