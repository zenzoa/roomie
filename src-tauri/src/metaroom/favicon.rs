use std::fs;

use tauri::{ AppHandle, State, Manager, Emitter };

use serde::{ Serialize, Deserialize };

use crate::geometry::Point;
use crate::frontend::error_dialog;
use crate::format::c16::import_c16;
use crate::file::FileState;

#[derive(Default, Clone, PartialEq, Serialize, Deserialize)]
pub struct Favicon {
	pub species: u16,
	pub sprite: String,
	pub x: u32,
	pub y: u32
}

impl Favicon {
	pub fn new(species: u16, sprite: String) -> Self {
		let mut favicon = Favicon::default();
		favicon.species = species;
		favicon.sprite = sprite;
		favicon
	}

	pub fn center(&self) -> Point {
		Point::new(self.x as f64, self.y as f64)
	}

	pub fn contains(&self, x: u32, y: u32) -> bool {
		Point::new(x as f64, y as f64).dist_sq(&self.center()) <= 22.0 * 22.0
	}

	pub fn within(&self, x: u32, y: u32, w: u32, h: u32) -> bool {
		let left = if self.x >= 22 { self.x - 22 } else { 0 };
		let right = self.x + 22;
		let top = if self.y >= 22 { self.y - 22 } else { 0 };
		let bottom = self.y + 22;
		left >= x && right < x + w && top >= y && bottom < y + h
	}

	pub fn load_image(&self, handle: &AppHandle) {
		if !self.sprite.is_empty() {
			let file_state: State<FileState> = handle.state();
			let path_opt = file_state.path.lock().unwrap().clone();
			if let Some(path) = path_opt {
				let favicon_path = path.with_file_name(format!("{}.c16", self.sprite));
				match fs::read(&favicon_path) {
					Ok(img_contents) => {
						match import_c16(&img_contents) {
							Ok(favicon_frames) => {
								if let Some(favicon_image) = favicon_frames.get(1) {
									*file_state.favicon_image.lock().unwrap() = Some(favicon_image.clone());
									handle.emit("update_favicon_image", true).unwrap_or_default();
									return
								}
							},
							Err(_why) => error_dialog(format!("ERROR: Unable to read favicon image {}", favicon_path.to_string_lossy()))
						}
					}
					Err(_why) => error_dialog(format!("ERROR: Unable to find favicon image {}", favicon_path.to_string_lossy()))
				}
			}
		}
		handle.emit("update_favicon_image", false).unwrap_or_default();
	}
}
