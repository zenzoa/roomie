class OverlaySidebar {
	static setup(overlays) {
		Sidebar.createHeader(overlays.length > 1 ? 'Overlays' : 'Overlay')

		const speciesInput = Sidebar.createIntInput('overlay-species', 'species', MAX_U16)
		speciesInput.value = Sidebar.allTheSame(overlays, 'species') ? overlays[0].species : ''
		speciesInput.addEventListener('change', () => {
			const species = Sidebar.getInputInt(speciesInput, overlays[0].species)
			for (let overlay of overlays) overlay.species = species
			tauri_invoke('update_overlays', { overlays, reloadImages: false })
		})

		const spriteInput = Sidebar.createStrInput('overlay-sprite', 'sprite')
		spriteInput.value = Sidebar.allTheSame(overlays, 'sprite') ? overlays[0].sprite : ''
		spriteInput.addEventListener('change', () => {
			for (let overlay of overlays) overlay.sprite = spriteInput.value
			tauri_invoke('update_overlays', { overlays, reloadImages: true })
		})

		const animationInput = Sidebar.createStrInput('overlay-animation', 'animation')
		animationInput.value = Sidebar.allTheSame(overlays, 'animation') ? overlays[0].animation.join(' ') : ''
		animationInput.addEventListener('change', () => {
			const animation = animationInput.value
				.replaceAll('[', '')
				.replaceAll(']', '')
				.split(' ')
				.map(n => parseInt(n))
				.filter(n => !isNaN(n) && n >= 0 && n <= 255)
			for (let overlay of overlays) overlay.animation = animation
			tauri_invoke('update_overlays', { overlays, reloadImages: false })
		})

		const planeInput = Sidebar.createIntInput('overlay-plane', 'plane', MAX_U32)
		planeInput.value = Sidebar.allTheSame(overlays, 'plane') ? overlays[0].plane : ''
		planeInput.addEventListener('change', () => {
			const plane = Sidebar.getInputInt(planeInput, overlays[0].plane)
			for (let overlay of overlays) overlay.plane = plane
			tauri_invoke('update_overlays', { overlays, reloadImages: false })
		})

		const imageCountInput = Sidebar.createIntInput('overlay-image-count', 'image count', MAX_U32)
		imageCountInput.value = Sidebar.allTheSame(overlays, 'image_count') ? overlays[0].image_count : ''
		imageCountInput.addEventListener('change', () => {
			const imageCount = Sidebar.getInputInt(yInput, overlays[0].image_count)
			for (let overlay of overlays) overlay.image_count = imageCount
			tauri_invoke('update_overlays', { overlays, reloadImages: false })
		})

		const firstImageInput = Sidebar.createIntInput('overlay-first-image', 'first image', MAX_U32)
		firstImageInput.value = Sidebar.allTheSame(overlays, 'first_image') ? overlays[0].first_image : ''
		firstImageInput.addEventListener('change', () => {
			const firstImage = Sidebar.getInputInt(firstImageInput, overlays[0].first_image)
			for (let overlay of overlays) overlay.first_image = firstImage
			tauri_invoke('update_overlays', { overlays, reloadImages: true })
		})

		const xInput = Sidebar.createIntInput('overlay-x', 'x', MAX_U32)
		xInput.value = Sidebar.allTheSame(overlays, 'x') ? overlays[0].x : ''
		xInput.addEventListener('change', () => {
			const x = Sidebar.getInputInt(xInput, overlays[0].x)
			setupSelectionForMovement()
			for (let overlay of tempOverlays) overlay.x = x
			finishMovingSelection()
		})

		const yInput = Sidebar.createIntInput('overlay-y', 'y', MAX_U32)
		yInput.value = Sidebar.allTheSame(overlays, 'y') ? overlays[0].y : ''
		yInput.addEventListener('change', () => {
			const y = Sidebar.getInputInt(yInput, overlays[0].y)
			setupSelectionForMovement()
			for (let overlay of tempOverlays) overlay.y = y
			finishMovingSelection()
		})
	}
}
