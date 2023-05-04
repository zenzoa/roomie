use bytes::{ Bytes, BytesMut, Buf, BufMut };
use image::{ RgbaImage, Rgba };

struct FileHeader {
	pixel_format: u32, // 2 = 555, 3 = 565
	cols: u16,
	rows: u16,
	image_count: u16
}

struct ImageHeader {
	first_line_offset: u32,
	width: u16,
	height: u16
}

fn read_file_header(buffer: &mut Bytes) -> Result<FileHeader, String> {
	if buffer.remaining() >= 10 {
		Ok(FileHeader {
			pixel_format: buffer.get_u32_le(),
			cols: buffer.get_u16_le(),
			rows: buffer.get_u16_le(),
			image_count: buffer.get_u16_le() // this should equal cols * rows
		})
	} else {
		Err(String::from("File ends in the middle of file header."))
	}
}

fn read_image_header(buffer: &mut Bytes) -> Result<ImageHeader, String> {
	if buffer.remaining() >= 8 {
		let first_line_offset = buffer.get_u32_le() + 4;
		let width = buffer.get_u16_le();
		let height = buffer.get_u16_le();
		if width == 128 && height == 128 {
			Ok(ImageHeader {
				width,
				height,
				first_line_offset
			})
		} else {
			Err(String::from("File ends in the middle of an image."))
		}
	} else {
		Err(String::from("File ends in the middle of an image header."))
	}
}

fn read_image_data(contents: &[u8], header: &ImageHeader, pixel_format: u32) -> RgbaImage {
	let mut image = RgbaImage::new(header.width as u32, header.height as u32);
	let mut buffer = Bytes::copy_from_slice(contents);
	buffer.advance(header.first_line_offset as usize);
	for y in 0..image.height() {
		for x in 0..image.width() {
			let color = read_pixel_data(buffer.get_u16_le(), pixel_format);
			image.put_pixel(x, y, color);
		}
	}
	image
}

fn read_pixel_data(pixel: u16, pixel_format: u32) -> Rgba<u8> {
	match pixel_format {
		2 => {
			// 555 format
			let r = ((pixel & 0x7c00) >> 7) as u8;
			let g = ((pixel & 0x03e0) >> 2) as u8;
			let b = ((pixel & 0x001f) << 3) as u8;
			Rgba([r, g, b, 255])
		},
		_ => {
			// 565 format
			let r = ((pixel & 0xf800) >> 8) as u8;
			let g = ((pixel & 0x07e0) >> 3) as u8;
			let b = ((pixel & 0x001f) << 3) as u8;
			Rgba([r, g, b, 255])
		}
	}
}

fn combine_image_data(images: Vec<RgbaImage>, cols: u32, rows: u32) -> RgbaImage {
	let mut output_image = RgbaImage::new(cols * 128, rows * 128);
	for (i, image) in images.iter().enumerate() {
		let image_x = (i as u32) / rows;
		let image_y = (i as u32) % rows;
		for x in 0..image.width() {
			for y in 0..image.height() {
				let pixel_x = (image_x * 128) + x;
				let pixel_y = (image_y * 128) + y;
				let color = image.get_pixel(x, y);
				output_image.put_pixel(pixel_x, pixel_y, *color);
			}
		}
	}
	output_image
}

pub fn decode(contents: &[u8]) -> Result<RgbaImage, String> {
	let mut buffer = Bytes::copy_from_slice(contents);
	match read_file_header(&mut buffer) {
		Ok(file_header) => {
			let mut image_headers: Vec<ImageHeader> = Vec::new();
			for _ in 0..file_header.image_count {
				if let Ok(image_header) = read_image_header(&mut buffer) {
					image_headers.push(image_header);
				}
			}
			let mut images: Vec<RgbaImage> = Vec::new();
			for image_header in image_headers {
				let image = read_image_data(contents, &image_header, file_header.pixel_format);
				images.push(image);
			}
			let output_image = combine_image_data(images, file_header.cols as u32, file_header.rows as u32);
			Ok(output_image)
		},
		Err(why) => Err(why)
	}
}

fn write_file_header(buffer: &mut BytesMut, cols: u16, rows: u16) {
	buffer.put_u32_le(3); // 565 format
	buffer.put_u16_le(cols);
	buffer.put_u16_le(rows);
	buffer.put_u16_le(cols * rows);
}

fn write_image_header(buffer: &mut BytesMut, first_line_offset: u32) {
	buffer.put_u32_le(first_line_offset - 4);
	buffer.put_u16_le(128);
	buffer.put_u16_le(128);
}

fn write_image_data(image: &RgbaImage, image_x: u32, image_y: u32) -> BytesMut {
	let mut buffer = BytesMut::new();
	for y in 0..128 {
		for x in 0..128 {
			let pixel = image.get_pixel(image_x + x, image_y + y);
			write_pixel_data(&mut buffer, pixel[0].into(), pixel[1].into(), pixel[2].into());
		}
	}
	buffer
}

fn write_pixel_data(buffer: &mut BytesMut, r: u16, g: u16, b: u16) {
	let pixel_data: u16 = ((r << 8) & 0xf800) | ((g << 3) & 0x07e0) | ((b >> 3) & 0x001f);
	buffer.put_u16_le(pixel_data);
}

pub fn encode(image: RgbaImage) -> Bytes {
	let mut buffer = BytesMut::new();

	let cols = image.width() / 128;
	let rows = image.height() / 128;
	let image_count = cols * rows;

	write_file_header(&mut buffer, cols as u16, rows as u16);

	let size_of_headers = 10 + (8 * image_count);
	let size_of_image = 128 * 128 * 2;

	let mut images_buffer = BytesMut::new();
	for i in 0..(cols * rows) {
		let first_line_offset = size_of_headers + (size_of_image * i);
		write_image_header(&mut buffer, first_line_offset);
		let image_x = (i / rows) * 128;
		let image_y = (i % rows) * 128;
		let image_buffer = write_image_data(&image, image_x, image_y);
		images_buffer.unsplit(image_buffer);
	}
	buffer.unsplit(images_buffer);

	buffer.freeze()
}
