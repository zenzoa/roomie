use std::error::Error;

use image::Rgba;

pub mod c16;
pub mod blk;

#[derive(Copy, Clone, PartialEq)]
pub enum PixelFormat {
	Format555,
	Format565
}

pub fn file_header_error() -> Box<dyn Error> {
	"Invalid data. File ends in the middle of file header.".into()
}

pub fn image_header_error() -> Box<dyn Error> {
	"Invalid data. File ends in the middle of an image header".into()
}

pub fn image_error() -> Box<dyn Error> {
	"Invalid data. File ends in the middle of an image".into()
}

pub fn parse_pixel(pixel: u16, pixel_format: PixelFormat) -> Rgba<u8> {
	match pixel_format {
		PixelFormat::Format555 => parse_pixel_555(pixel),
		PixelFormat::Format565 => parse_pixel_565(pixel)
	}
}

fn parse_pixel_555(pixel: u16) -> Rgba<u8> {
	let r = ((pixel & 0x7c00) >> 7) as u8;
	let g = ((pixel & 0x03e0) >> 2) as u8;
	let b = ((pixel & 0x001f) << 3) as u8;
	Rgba([r, g, b, 255])
}

fn parse_pixel_565(pixel: u16) -> Rgba<u8> {
	let r = ((pixel & 0xf800) >> 8) as u8;
	let g = ((pixel & 0x07e0) >> 3) as u8;
	let b = ((pixel & 0x001f) << 3) as u8;
	Rgba([r, g, b, 255])
}

pub fn encode_pixel(pixel: &Rgba<u8>) -> u16 {
	let r = ((pixel[0] as u16) & 0xf8) << 8;
	let g = ((pixel[1] as u16) & 0xfc) << 3;
	let b = ((pixel[2] as u16) & 0xf8) >> 3;
	r | g | b
}
