use std::error::Error;
use bytes::{ Bytes, BytesMut, Buf, BufMut };
use image::{ Rgba, RgbaImage };

use super::{
	PixelFormat,
	file_header_error,
	image_header_error,
	image_error,
	parse_pixel,
	encode_pixel
};

struct FileHeader {
	pixel_format: u32, // 0 = 555, 1 = 565
	cols: u16,
	rows: u16,
	image_count: u16
}

struct ImageHeader {
	first_line_offset: u32,
	width: u16,
	height: u16
}

pub fn import_blk(contents: &[u8]) -> Result<RgbaImage, Box<dyn Error>> {
	let mut frames: Vec<RgbaImage> = Vec::new();
	let mut buffer = Bytes::copy_from_slice(contents);
	let file_header = read_file_header(&mut buffer)?;
	let pixel_format = match file_header.pixel_format {
		0 => PixelFormat::Format555,
		_ => PixelFormat::Format565
	};
	let mut image_headers: Vec<ImageHeader> = Vec::new();
	for _ in 0..file_header.image_count {
		if let Ok(image_header) = read_image_header(&mut buffer) {
			image_headers.push(image_header);
		}
	}
	for image_header in image_headers {
		let image = read_image_data(contents, &image_header, pixel_format)?;
		frames.push(image);
	}
	combine_frames(&frames, file_header.cols.into(), file_header.rows.into(), false)
}

fn read_file_header(buffer: &mut Bytes) -> Result<FileHeader, Box<dyn Error>> {
	if buffer.remaining() < 6 { return Err(file_header_error()); }
	Ok(FileHeader {
		pixel_format: buffer.get_u32_le(),
		cols: buffer.get_u16_le(),
		rows: buffer.get_u16_le(),
		image_count: buffer.get_u16_le() // this should equal cols * rows
	})
}

fn read_image_header(buffer: &mut Bytes) -> Result<ImageHeader, Box<dyn Error>> {
	if buffer.remaining() < 8 { return Err(image_header_error()); }
	let first_line_offset = buffer.get_u32_le() + 4;
	let width = buffer.get_u16_le();
	let height = buffer.get_u16_le();
	if width != 128 || height != 128 {
		return Err("Invalid data. All frames in a BLK file must be 128 x 128 px.".into());
	}
	Ok(ImageHeader {
		width,
		height,
		first_line_offset
	})
}

fn read_image_data(contents: &[u8], header: &ImageHeader, pixel_format: PixelFormat) -> Result<RgbaImage, Box<dyn Error>> {
	let mut image = RgbaImage::new(header.width as u32, header.height as u32);
	let mut buffer = Bytes::copy_from_slice(contents);
	buffer.advance(header.first_line_offset as usize);
	for y in 0..image.height() {
		for x in 0..image.width() {
			if buffer.remaining() < 2 { return Err(image_error()); }
			let pixel_data = buffer.get_u16_le();
			let color = parse_pixel(pixel_data, pixel_format);
			image.put_pixel(x, y, color);
		}
	}
	Ok(image)
}

fn combine_frames(frames: &Vec<RgbaImage>, cols: usize, rows: usize, by_rows: bool) -> Result<RgbaImage, Box<dyn Error>> {
	let mut tile_width = 0;
	let mut tile_height = 0;
	for frame in frames {
		if frame.width() > tile_width { tile_width = frame.width(); }
		if frame.height() > tile_height { tile_height = frame.height(); }
	}

	let image_width = tile_width * cols as u32;
	let image_height = tile_height * rows as u32;
	let mut output_image = RgbaImage::new(image_width, image_height);

	for (i, frame) in frames.iter().enumerate() {
		let tile_x = if by_rows { i % cols } else { i / rows };
		let tile_y = if by_rows { i / cols } else { i % rows };

		for y in 0..frame.height() {
			for x in 0..frame.width() {
				let pixel = *frame.get_pixel(x, y);
				let image_x = (tile_x as u32 * tile_width) + x;
				let image_y = (tile_y as u32 * tile_height) + y;
				if image_x < output_image.width() && image_y < output_image.height() {
					output_image.put_pixel(image_x, image_y, pixel);
				}
			}
		}
	}

	Ok(output_image)
}

pub fn encode_blk(img: &RgbaImage) -> Result<Bytes, Box<dyn Error>> {
	let cols = (img.width() as f32 / 128.0).ceil() as u32;
	let rows = (img.height() as f32 / 128.0).ceil() as u32;

	let mut frames: Vec<RgbaImage> = Vec::new();
	for col in 0..cols {
		for row in 0..rows {
			let tile_x = col * 128_u32;
			let tile_y = row * 128_u32;
			let mut tile_image = RgbaImage::new(128, 128);
			for y in 0..128 {
				for x in 0..128 {
					let image_x = tile_x + x;
					let image_y = tile_y + y;
					let pixel = if image_x < img.width() && image_y < img.height() {
						*img.get_pixel(image_x, image_y)
					} else {
						Rgba([0, 0, 0, 255])
					};
					tile_image.put_pixel(x, y, pixel);
				}
			}
			frames.push(tile_image);
		}
	}

	export_blk(&frames, cols as u16, rows as u16)
}

pub fn export_blk(frames: &[RgbaImage], width: u16, height: u16) -> Result<Bytes, Box<dyn Error>> {
	if frames.len() != width as usize * height as usize {
		return Err(format!("Expected {} frames, found {}.", width * height, frames.len()).into());
	}

	let mut buffer = BytesMut::new();
	buffer.unsplit(write_file_header(width, height));

	let header_size = 10 + (8 * frames.len());
	let frame_size = 128 * 128 * 2;

	let mut images_buffer = BytesMut::new();
	for (i, frame) in frames.iter().enumerate() {
		if frame.width() != 128 || frame.height() != 128 {
			return Err("All frames in a BLK file must be 128 x 128px.".into());
		}
		let first_line_offset = header_size + (frame_size * i);
		buffer.unsplit(write_image_header(first_line_offset as u32));
		let image_buffer = write_image_data(frame);
		images_buffer.unsplit(image_buffer);
	}

	buffer.unsplit(images_buffer);
	Ok(buffer.freeze())
}

fn write_file_header(cols: u16, rows: u16) -> BytesMut {
	let mut buffer = BytesMut::new();
	buffer.put_u32_le(1); // 565 format
	buffer.put_u16_le(cols);
	buffer.put_u16_le(rows);
	buffer.put_u16_le(cols * rows);
	buffer
}

fn write_image_header(first_line_offset: u32) -> BytesMut {
	let mut buffer = BytesMut::new();
	buffer.put_u32_le(first_line_offset - 4);
	buffer.put_u16_le(128);
	buffer.put_u16_le(128);
	buffer
}

fn write_image_data(image: &RgbaImage) -> BytesMut {
	let mut buffer = BytesMut::new();
	for y in 0..128 {
		for x in 0..128 {
			let pixel = image.get_pixel(x, y);
			buffer.put_u16_le(encode_pixel(pixel));
		}
	}
	buffer
}
