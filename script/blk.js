// Sources:
// https://creatures.wiki/BLK_files
// https://creatures.wiki/555/565

exports.toImage = (data) => {
	let dataView = new DataView(data.buffer)

	// read file header
	let pixelFormat = dataView.getUint32(0, true)
	let blockWidth = dataView.getUint16(4, true)
	let blockHeight = dataView.getUint16(6, true)
	let spriteCount = dataView.getUint16(8, true)

	// read sprite headers
	let spriteHeaders = []
	for (let i = 0; i < spriteCount; i++) {
		let offset = 10 + i * 8
		spriteHeaders.push({
			offset: dataView.getUint32(offset, true),
			width: dataView.getUint16(offset + 4, true),
			height: dataView.getUint16(offset + 6, true)
		})
	}

	// read sprite data
	let sprites = []
	spriteHeaders.forEach((h) => {
		let sprite = []
		let offset = h.offset + 4
		for (let y = 0; y < h.height; y++) {
			let row = []
			for (let x = 0; x < h.width; x++) {
				let pixel = dataView.getUint16(offset, true)
				let r, g, b
				if (pixelFormat === 0) { // 555 format
					r = (pixel & 0x7c00) >> 7
					g = (pixel & 0x03e0) >> 2
					b = (pixel & 0x001f) << 3
				} else { // 565 format
					r = (pixel & 0xf800) >> 8
					g = (pixel & 0x07e0) >> 3
					b = (pixel & 0x001f) << 3
				}
				row.push([ r, g, b ])
				offset += 2
			}
			sprite.push(row)
		}
		sprites.push(sprite)
	})

	// stitch sprites together
	let p = nw.Window.get().window.p
	let combinedWidth = blockWidth * 128
	let combinedHeight = blockHeight * 128
	let image = p.createImage(combinedWidth, combinedHeight)
	image.loadPixels()
	for (let y = 0; y < combinedHeight; y++) {
		for (let x = 0; x < combinedWidth; x++) {
			let bx = Math.floor(x / 128)
			let by = Math.floor(y / 128)
			let sprite = sprites[bx * blockHeight + by]
			let pixel = sprite[y - by * 128][x - bx * 128]
			let i = (y * combinedWidth + x) * 4
			image.pixels[i] = pixel[0]
			image.pixels[i + 1] = pixel[1]
			image.pixels[i + 2] = pixel[2]
			image.pixels[i + 3] = 255
		}
	}
	image.updatePixels()

	return image
}

exports.fromImage = (image) => {
	image.loadPixels()
	let blockWidth = Math.ceil(image.width / 128)
	let blockHeight = Math.ceil(image.height / 128)
	let sprites = Array(blockWidth * blockHeight).fill(0).map(() => Array(128 * 128).fill(0))
	for (let y = 0; y < image.height; y++) {
		for (let x = 0; x < image.width; x++) {
			let bx = Math.floor(x / 128)
			let by = Math.floor(y / 128)
			let sx = x - bx * 128
			let sy = y - by * 128
			let i = (y * image.width + x) * 4
			let r = image.pixels[i]
			let g = image.pixels[i + 1]
			let b = image.pixels[i + 2]
			sprites[bx * blockHeight + by][sy * 128 + sx] = { r, g, b }
		}
	}

	let headerSize = 10
	let spriteHeadersSize = sprites.length * 8
	let spriteSize = 128 * 128 * 2
	let spritesSize = sprites.length * spriteSize

	let buffer = new ArrayBuffer(headerSize + spriteHeadersSize + spritesSize)
	let dataView = new DataView(buffer)

	// write file header
	dataView.setUint32(0, 1, true) // use 565 pixel format
	dataView.setUint16(4, blockWidth, true)
	dataView.setUint16(6, blockHeight, true)
	dataView.setUint16(8, sprites.length, true)

	// write sprite headers
	sprites.forEach((s, i) => {
		let offset = headerSize + (i * 8)
		let spriteOffset = headerSize + spriteHeadersSize + (i * spriteSize) - 4
		dataView.setUint32(offset, spriteOffset, true)
		dataView.setUint16(offset + 4, 128, true)
		dataView.setUint16(offset + 6, 128, true)
	})

	// write sprite data
	sprites.forEach((s, i) => {
		let offset = headerSize + spriteHeadersSize + (i * spriteSize)
		s.forEach((pixel, i) => {
			let pixelOffset = offset + (i * 2)
			let { r, g, b } = pixel
			let pixelData = (r << 8) | (g << 3) | (b >> 3)
			dataView.setUint16(pixelOffset, pixelData, true)
		})
	})

	return dataView
}