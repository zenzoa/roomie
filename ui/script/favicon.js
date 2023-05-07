class Favicon {

	constructor() {
		this.x = 0,
		this.y = 0,
		this.sprite = '',
		this.classifier = 1000
	}

	static updateSidebar() {
		if (metaroom.hasFavicon) {
			document.getElementById('favicon-x').value = metaroom.favicon.x
			document.getElementById('favicon-y').value = metaroom.favicon.y
			document.getElementById('favicon-sprite-value').innerText = metaroom.favicon.sprite || '—'
			document.getElementById('favicon-classifier').value = metaroom.favicon.classifier
		}

		if (metaroom.hasFavicon && document.getElementById('favicon-remove').className.includes('hidden')) {
			document.getElementById('favicon-add').className = 'float-right icon-button hidden'
			document.getElementById('favicon-remove').className = 'float-right icon-button'
			document.getElementById('favicon-x-label').className = ''
			document.getElementById('favicon-y-label').className = ''
			document.getElementById('favicon-sprite-label').className = ''
			document.getElementById('favicon-classifier-label').className = ''

		} else if (!metaroom.hasFavicon && document.getElementById('favicon-add').className.includes('hidden')) {
			document.getElementById('favicon-add').className = 'float-right icon-button'
			document.getElementById('favicon-remove').className = 'float-right icon-button hidden'
			document.getElementById('favicon-x-label').className = 'hidden'
			document.getElementById('favicon-y-label').className = 'hidden'
			document.getElementById('favicon-sprite-label').className = 'hidden'
			document.getElementById('favicon-classifier-label').className = 'hidden'
		}
	}

	static draw() {
		if (UI.selectedFavicon) { strokeWeight(4) }
		if (faviconImage) {
			const w = Math.floor(faviconImage.width / 3)
			const h = faviconImage.height
			image(faviconImage, metaroom.favicon.x, metaroom.favicon.y, w, h, w, 0, w, h)
			noFill()
			circle(metaroom.favicon.x + 24, metaroom.favicon.y + 23, 44)
		} else {
			fill(40, 16, 80)
			circle(metaroom.favicon.x + 24, metaroom.favicon.y + 23, 44)
			noFill()
		}
		if (UI.selectedFavicon) { strokeWeight(1) }
	}

	static importSprite() {
		if (metaroom && metaroom.favicon && metaroom.favicon.sprite) {
			Tauri.invoke('get_sprite_path', { dir: metaroom.dir, title: metaroom.favicon.sprite })
			.then((favicon_path) => {
				const assetUrl = Tauri.tauri.convertFileSrc(favicon_path)
				loadImage(assetUrl,
					(img) => {
						faviconImage = img
						UI.updateSidebar()
					},
					() => {
						Tauri.dialog.message('Unable to load favorite place sprite, ' + metaroom.favicon.sprite + '.png', { title: 'File Error', type: 'error' })
					}
				)
			})
			.catch((why) => {
				Tauri.dialog.message(why, { title: 'Image Error', type: 'error' })
			})
		}
	}

	static nudge() {
		saveState()
		const d = keyIsDown(SHIFT) ? 10 : 1
		if (keyIsDown(LEFT_ARROW)){
			metaroom.favicon.x -= d
		}
		if (keyIsDown(RIGHT_ARROW)) {
			metaroom.favicon.x += d
		}
		if (keyIsDown(UP_ARROW)) {
			metaroom.favicon.y -= d
		}
		if (keyIsDown(DOWN_ARROW)) {
			metaroom.favicon.y += d
		}
		UI.updateSidebar()
	}

	static mouseOn(x, y) {
		return Geometry.pointInCircle(x, y, metaroom.favicon.x + 24, metaroom.favicon.y + 23, 23)
	}

	static move(x, y) {
		metaroom.favicon.x = x - 24
		metaroom.favicon.y = y - 23
	}

}

function enableFavicon() {
	saveState()
	metaroom.hasFavicon = true
	metaroom.favicon.x = Math.floor(metaroom.w / 2) - 24
	metaroom.favicon.y = Math.floor(metaroom.h / 2) - 23
	UI.updateSidebar()
}

function disableFavicon() {
	saveState()
	metaroom.hasFavicon = false
	UI.updateSidebar()
}

function changeFaviconX() {
	const input = document.getElementById('favicon-x')
	const x = parseInt(input.value)
	if (!isNaN(x)) {
		saveState()
		metaroom.favicon.x = Math.max(0, Math.min(metaroom.w - 1, x))
		UI.updateSidebar()
	}
}

function changeFaviconY() {
	const input = document.getElementById('favicon-y')
	const y = parseInt(input.value)
	if (!isNaN(y)) {
		saveState()
		metaroom.favicon.y = Math.max(0, Math.min(metaroom.h - 1, y))
		UI.updateSidebar()
	}
}

function changeFaviconSprite() {
	Tauri.dialog.open({ filters: [{ name: 'Image File', extensions: ['png', 'c16'] }] })
	.then((filePath) => {
		Tauri.path.basename(filePath)
		.then((basename) => {
			saveState()
			metaroom.favicon.sprite = basename.replace(/\.(png|c16)$/i, '')
			if (!metaroom.dir) {
				metaroom.dir = filePath.replace(basename, '')
			}
			Favicon.importSprite()
			UI.updateSidebar()
		})
		.catch((why) => console.error(why))
	})
	.catch((why) => console.error(why))
}

function changeFaviconClassifier() {
	const input = document.getElementById('favicon-classifier')
	const classifier = parseInt(input.value)
	if (!isNaN(classifier)) {
		saveState()
		metaroom.favicon.classifier = Math.max(0, classifier)
		UI.updateSidebar()
	}
	UI.updateSidebar()
}
