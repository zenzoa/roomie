class FavPlace {
	constructor(metaroom) {
		this.parentMetaroom = metaroom
		this.enabled = false
		
		this.classifier = 1000
		this.sprite = ''
		
		this.r = 22
		this.x = Math.floor(metaroom.w / 2) - this.r
		this.y = Math.floor(metaroom.h / 2) - this.r
		this.xDrag = this.x
		this.yDrag = this.y
		this.xStart = this.x
		this.yStart = this.y
	}

	setX(x) {
		if (x < 2) { x = 2}
		if (x > this.parentMetaroom.w - 2) { x = this.parentMetaroom.w - 2}
		this.x = Math.floor(x)
		this.parentMetaroom.setModified(true)
	}

	setY(y) {
		if (y < 1) { y = 1}
		if (y > this.parentMetaroom.h - 1) { y = this.parentMetaroom.h - 1}
		this.y = Math.floor(y)
		this.parentMetaroom.setModified(true)
	}

	chooseSprite() {
		window.api.showOpenDialog(this.path || '', [
			{ name: 'Sprites', extensions: ['c16'] },
			{ name: 'All Files', extensions: ['*'] }
		]).then((result) => {
			if (result.filePaths.length > 0) {
				let filePath = result.filePaths[0]
				let fileName = filePath.match(/[^\\//]+?$/)[0]
				this.sprite = fileName.replace('.c16', '')
				this.parentMetaroom.setModified(true)
			}
		})
	}

	startDrag(x, y) {
		this.xDrag = x
		this.yDrag = y
		this.xStart = this.x
		this.yStart = this.y
	}

	drag(x, y) {
		let dx = x - this.xDrag
		let dy = y - this.yDrag
		this.setX(this.xStart + dx)
		this.setY(this.yStart + dy)
	}

	endDrag() {
		return
	}

	draw(p, isSelected) {
		p.fill(40, 16, 80)
		p.stroke(255)
		if (isSelected) {
			p.strokeWeight(2)
		} else {
			p.strokeWeight(1)
		}
		p.circle(this.x + this.r, this.y + this.r, this.r * 2)
	}
}
