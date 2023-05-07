class Overlay {

	constructor({ x, y, w, h, sprite, classifier, plane }) {
		this.x = x || 0
		this.y = y || 0
		this.w = w || 50
		this.h = h || 50
		this.sprite = sprite || ''
		this.classifier = classifier || 1000
		this.plane = plane || 8000
	}

	static updateSidebar(overlays) {
		if (overlays.length === 1) {
			document.getElementById('overlay-x-label').className = ''
			document.getElementById('overlay-y-label').className = ''
			document.getElementById('overlay-classifier-label').className = ''

			document.getElementById('overlay-x').value = overlays[0].x
			document.getElementById('overlay-y').value = overlays[0].y
			document.getElementById('overlay-sprite-value').innerText = overlays[0].sprite || '—'
			document.getElementById('overlay-classifier').value = overlays[0].classifier
			document.getElementById('overlay-plane').value = overlays[0].plane

		} else if (overlays.length > 0) {
			document.getElementById('overlay-x-label').className = 'hidden'
			document.getElementById('overlay-y-label').className = 'hidden'
			document.getElementById('overlay-classifier-label').className = 'hidden'

			let allSameSprite = true
			let lastSprite = overlays[0].sprite
			let allSamePlane = true
			let lastPlane = overlays[0].plane

			overlays.forEach(o => {
				if (o.sprite !== lastSprite) {
					allSameSprite = false
				}
				if (o.plane !== lastPlane) {
					allSamePlane = false
				}
				lastSprite = o.sprite
				lastPlane = o.plane
			})

			if (!allSameSprite) {
				lastSprite = '[multiple]'
			}

			if (!allSamePlane) {
				lastPlane = null
			}

			document.getElementById('overlay-sprite-value').innerText = lastSprite || '—'
			document.getElementById('overlay-plane').value = lastPlane
		}
	}

	static draw(overlay) {
		const isSelected = UI.selectedOverlays.includes(overlay)
		const useTemp = UI.isDragging && isSelected
		const x = useTemp ? overlay.x_temp : overlay.x
		const y = useTemp ? overlay.y_temp : overlay.y
		const sprite = overlayImages[overlay.sprite]

		if (sprite) {
			if (!UI.overlayMode) { tint(255, 50) }
			image(sprite, x, y)
			if (!UI.overlayMode) { noTint() }
		} else {
			line(x, y, x + overlay.w, y + overlay.h)
			line(x + overlay.w, y, x, y + overlay.h)
		}

		if (UI.overlayMode || !sprite) {
			if (isSelected) { strokeWeight(4) }
			rect(x, y, overlay.w, overlay.h)
			if (isSelected) { strokeWeight(1) }
		}
	}

	static importSprite(overlay) {
		if (overlay.sprite) {
			Tauri.invoke('get_sprite', { dir: metaroom.dir, title: overlay.sprite, frameCount: 1 })
			.then((overlay_path) => {
				const assetUrl = Tauri.tauri.convertFileSrc(overlay_path)
				loadImage(assetUrl,
					(img) => {
						overlayImages[overlay.sprite] = img
						overlay.w = img.width
						overlay.h = img.height
						UI.updateSidebar()
					},
					() => {
						Tauri.dialog.message('Unable to load overlay sprite, ' + overlay.sprite + '.png', { title: 'File Error', type: 'error' })
					}
				)
			})
			.catch((why) => {
				if (why === 'not_found') {
					Tauri.dialog.message('All images must be in the same folder as your COS file', { title: 'Wrong Folder', type: 'error' })
				} else {
					Tauri.dialog.message(why, { title: 'Image Error', type: 'error' })
				}
			})
		}
	}

	static nudge(overlay) {
		saveState()
		const d = keyIsDown(SHIFT) ? 10 : 1
		if (keyIsDown(LEFT_ARROW)){
			overlay.x -= d
		}
		if (keyIsDown(RIGHT_ARROW)) {
			overlay.x += d
		}
		if (keyIsDown(UP_ARROW)) {
			overlay.y -= d
		}
		if (keyIsDown(DOWN_ARROW)) {
			overlay.y += d
		}
		UI.updateSidebar()
	}

	static startMove(overlay) {
		overlay.x_temp = overlay.x
		overlay.y_temp = overlay.y
	}

	static endMove(overlay) {
		overlay.x = Math.floor(overlay.x_temp)
		overlay.y = Math.floor(overlay.y_temp)
		delete overlay.x_temp
		delete overlay.y_temp
	}

	static move(overlay, dx, dy) {
		overlay.x_temp = Math.floor(overlay.x + dx)
		overlay.y_temp = Math.floor(overlay.y + dy)
	}

}

function changeOverlayX() {
	if (UI.selectedOverlays.length === 1) {
		const input = document.getElementById('overlay-x')
		const x = parseInt(input.value)
		if (!isNaN(x)) {
			saveState()
			UI.selectedOverlays[0].x = Math.max(0, x)
		}
		UI.updateSidebar()
	}
}

function changeOverlayY() {
	if (UI.selectedOverlays.length === 1) {
		const input = document.getElementById('overlay-y')
		const y = parseInt(input.value)
		if (!isNaN(y)) {
			saveState()
			UI.selectedOverlays[0].y = Math.max(0, y)
		}
		UI.updateSidebar()
	}
}

function changeOverlaySprite() {
	if (UI.selectedOverlays.length > 0) {
		Tauri.dialog.open({ filters: [{ name: 'Image File', extensions: ['png', 'c16'] }] })
		.then((filePath) => {
			Tauri.path.basename(filePath)
			.then((basename) => {
				saveState()
				const sprite = basename.replace(/\.(png|c16)$/i, '')
				UI.selectedOverlays.forEach(o => { o.sprite = sprite })
				if (!metaroom.dir) {
					metaroom.dir = filePath.replace(basename, '')
				}
				UI.selectedOverlays.forEach(o => Overlay.importSprite(o))
				UI.updateSidebar()
			})
			.catch((why) => console.error(why))
		})
		.catch((why) => console.error(why))
	}
}

function changeOverlayClassifier() {
	if (UI.selectedOverlays.length === 1) {
		const input = document.getElementById('overlay-classifier')
		const classifier = parseInt(input.value)
		if (!isNaN(classifier)) {
			saveState()
			UI.selectedOverlays[0].classifier = Math.max(0, classifier)
		}
		UI.updateSidebar()
	}
}

function changeOverlayPlane() {
	if (UI.selectedOverlays.length > 0) {
		const input = document.getElementById('overlay-plane')
		const plane = parseInt(input.value)
		if (!isNaN(plane)) {
			saveState()
			UI.selectedOverlays.forEach(o => o.plane = Math.max(0, plane))
		}
		UI.updateSidebar()
	}
}
