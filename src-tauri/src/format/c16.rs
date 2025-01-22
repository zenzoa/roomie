use std::error::Error;
use bytes::{ Bytes, Buf };
use image::{ RgbaImage, Rgba };

use super::{
	PixelFormat,
	file_header_error,
	image_header_error,
	image_error,
	parse_pixel
};

struct FileHeader {
	pixel_format: u32, // 2 = 555, 3 = 565
	image_count: u16
}

struct ImageHeader {
	width: u16,
	height: u16,
	line_offsets: Vec<u32>
}

pub fn import_c16(contents: &[u8]) -> Result<Vec<RgbaImage>, Box<dyn Error>> {
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
	Ok(frames)
}

fn read_file_header(buffer: &mut Bytes) -> Result<FileHeader, Box<dyn Error>> {
	if buffer.remaining() < 6 { return Err(file_header_error()); }
	Ok(FileHeader {
		pixel_format: buffer.get_u32_le(),
		image_count: buffer.get_u16_le()
	})
}

fn read_image_header(buffer: &mut Bytes) -> Result<ImageHeader, Box<dyn Error>> {
	if buffer.remaining() < 8 { return Err(image_header_error()); }
	let mut line_offsets = vec![ buffer.get_u32_le() ];
	let width = buffer.get_u16_le();
	let height = buffer.get_u16_le();
	for _ in 0..(height - 1) {
		if buffer.remaining() < 2 { return Err(image_header_error()); }
		line_offsets.push(buffer.get_u32_le());
	}
	Ok(ImageHeader {
		width,
		height,
		line_offsets
	})
}

fn read_image_data(contents: &[u8], header: &ImageHeader, pixel_format: PixelFormat) -> Result<RgbaImage, Box<dyn Error>> {
	let mut image = RgbaImage::new(header.width as u32, header.height as u32);
	for (y, line_offset) in header.line_offsets.iter().enumerate() {
		let mut buffer = Bytes::copy_from_slice(contents);
		buffer.advance(*line_offset as usize);
		let mut x: u16 = 0;
		while x < header.width {
			if buffer.remaining() < 2 { return Err(image_error()); }
			let run_header = buffer.get_u16_le();
			let run_type = run_header & 0x1; // 0 = transparent, 1 = color
			let run_length = (run_header & 0xfffe) >> 1;
			if run_type == 1 && buffer.remaining() >= (run_length * 2).into() {
				for i in 0..run_length {
					if buffer.remaining() < 2 { return Err(image_error()); }
					let pixel_data = buffer.get_u16_le();
					let color = parse_pixel(pixel_data, pixel_format);
					image.put_pixel((x + i) as u32, y as u32, color);
				}
			} else if run_type == 0 {
				for i in 0..run_length {
					image.put_pixel((x + i) as u32, y as u32, Rgba([0, 0, 0, 0]));
				}
			}
			x += run_length;
		}
	}
	Ok(image)
}
