class Overlay {

	constructor({ x, y, w, h, sprite, frame, classifier, plane }) {
		this.x = x || 0
		this.y = y || 0
		this.w = w || 50
		this.h = h || 50
		this.sprite = sprite || ''
		this.frame = frame || 0
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
			document.getElementById('overlay-frame').value = overlays[0].frame
			document.getElementById('overlay-classifier').value = overlays[0].classifier
			document.getElementById('overlay-plane').value = overlays[0].plane

		} else if (overlays.length > 1) {
			document.getElementById('overlay-x-label').className = 'hidden'
			document.getElementById('overlay-y-label').className = 'hidden'
			document.getElementById('overlay-classifier-label').className = 'hidden'

			let allSameSprite = true
			let lastSprite = overlays[0].sprite
			let allSameFrame = true
			let lastFrame = overlays[0].frame
			let allSamePlane = true
			let lastPlane = overlays[0].plane

			overlays.forEach(o => {
				if (o.sprite !== lastSprite) {
					allSameSprite = false
				}
				if (o.frame !== lastFrame) {
					allSameFrame = false
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

			if (!allSameFrame) {
				lastFrame = null
			}

			if (!allSamePlane) {
				lastPlane = null
			}

			document.getElementById('overlay-sprite-value').innerText = lastSprite || '—'
			document.getElementById('overlay-frame').value = lastFrame
			document.getElementById('overlay-plane').value = lastPlane
		}
	}

	static draw(overlay) {
		const isSelected = UI.selectedOverlays.includes(overlay)
		const useTemp = UI.isDragging && isSelected
		const x = useTemp ? overlay.x_temp : overlay.x
		const y = useTemp ? overlay.y_temp : overlay.y
		const sprite = overlayImages[`${overlay.sprite}-${overlay.frame}`]

		if (sprite) {
			if (!UI.overlayMode) { tint(255, 50) }
			image(sprite, x, y)
			if (!UI.overlayMode) { noTint() }
		} else {
			line(x, y, x + overlay.w, y + overlay.h)
			line(x + overlay.w, y, x, y + overlay.h)
		}

		if (UI.overlayMode || !sprite) {
			if (isSelected) { strokeWeight(4 / UI.zoomLevel) }
			rect(x, y, overlay.w, overlay.h)
			if (isSelected) { strokeWeight(1 / UI.zoomLevel) }
		}
	}

	static importSprite(overlay, title, frame) {
		if (title && !isNaN(frame) && frame >= 0) {
			if (overlayImages[`${title}-${frame}`]) {
				const img = overlayImages[`${title}-${frame}`]
				overlay.sprite = title
				overlay.frame = frame
				overlay.w = img.width
				overlay.h = img.height

			} else {
				Tauri.invoke('get_overlay_path', {
					dir: metaroom.dir,
					title: title,
					frame: frame
				})
				.then((overlay_path) => {
					const assetUrl = Tauri.tauri.convertFileSrc(overlay_path)
					loadImage(assetUrl,
						(img) => {
							overlayImages[`${title}-${frame}`] = img
							overlay.sprite = title
							overlay.frame = frame
							overlay.w = img.width
							overlay.h = img.height
							UI.updateSidebar()
						},
						() => {
							Tauri.dialog.message('Unable to load overlay sprite, ' + title + '.png', { title: 'File Error', type: 'error' })
						}
					)
				})
				.catch((why) => {
					const frameInput = document.getElementById('overlay-frame')
					const ignoreChange = () => { frameInput.value = overlay.frame }
					frameInput.removeEventListener('change', changeOverlayFrame)
					frameInput.addEventListener('change', ignoreChange)

					let dialog_title = 'Image Error'
					let dialog_message = why
					if (why === 'not_found') {
						dialog_title = 'Wrong Folder'
						dialog_message = 'All images must be in the same folder as your COS file'
					} else if (why === 'wrong_frame_format') {
						dialog_title = 'Image Not Found'
						dialog_message = 'Frame PNGs must be named using the format "[title]-[index].png'
					}

					Tauri.dialog.message(dialog_message, { title: dialog_title, type: 'error' })
					.then(() => {
						frameInput.addEventListener('change', changeOverlayFrame)
						frameInput.removeEventListener('change', ignoreChange)
					})
				})
			}
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
				let title = ''
				let frame = 0
				if (basename.endsWith('.c16')) {
					title = basename.replace('.c16', '')
				} else {
					const frameMatch = basename.match(/-(\d+).png$/i)
					if (frameMatch && frameMatch.length >= 2 && !isNaN(parseInt(frameMatch[1]))) {
						title = basename.replace(/-\d+.png$/i, '')
						frame = parseInt(frameMatch[1])
					} else {
						title = basename.replace('.png', '')
					}
				}
				if (!metaroom.dir) {
					metaroom.dir = filePath.replace(basename, '')
				}
				UI.selectedOverlays.forEach(o => {
					Overlay.importSprite(o, title, frame)
				})
				UI.updateSidebar()
			})
			.catch((why) => console.error(why))
		})
		.catch((why) => console.error(why))
	}
}

function changeOverlayFrame() {
	if (UI.selectedOverlays.length > 0) {
		const input = document.getElementById('overlay-frame')
		const frame = Math.max(0, parseInt(input.value))
		if (!isNaN(frame)) {
			saveState()
			UI.selectedOverlays.forEach(o => {
				Overlay.importSprite(o, o.sprite, frame)
			})
		}
		UI.updateSidebar()
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
