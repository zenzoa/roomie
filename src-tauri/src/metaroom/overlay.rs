use std::fs;

use tauri::{ AppHandle, State, Manager, Emitter };

use serde::{ Serialize, Deserialize };

use crate::frontend::error_dialog;
use crate::format::c16::import_c16;
use crate::file::FileState;

#[derive(Default, Clone, Serialize, Deserialize)]
pub struct Overlay {
	pub id: u32,
	pub species: u16,
	pub sprite: String,
	pub image_count: u32,
	pub first_image: u32,
	pub plane: u32,
	pub animation: Vec<u8>,
	pub x: u32,
	pub y: u32,
	pub w: u32,
	pub h: u32,
}

impl Overlay {
	pub fn new(species: u16, sprite: String, image_count: u32, first_image: u32, plane: u32) -> Self {
		Self { species, sprite, image_count, first_image, plane, ..Default::default() }
	}

	pub fn new_at(x: u32, y: u32) -> Self {
		Self { x, y, w: 50, h: 50, ..Default::default() }
	}

	pub fn contains(&self, x: u32, y: u32) -> bool {
		x >= self.x && x < self.x + self.w && y >= self.y && y < self.y + self.h
	}

	pub fn within(&self, x: u32, y: u32, w: u32, h: u32) -> bool {
		self.x >= x && self.x + self.w < x + w && self.y >= y && self.y + self.h < y + h
	}

	pub fn load_image(&mut self, handle: &AppHandle) {
		if !self.sprite.is_empty() {
			let file_state: State<FileState> = handle.state();
			let path_opt = file_state.path.lock().unwrap().clone();
			if let Some(path) = path_opt {
				let mut overlay_images = file_state.overlay_images.lock().unwrap();
				let image_path = path.with_file_name(format!("{}.c16", self.sprite));
				match fs::read(&image_path) {
					Ok(img_contents) => {
						match import_c16(&img_contents) {
							Ok(frames) => {
								if let Some(frame) = frames.get(self.first_image as usize) {
									overlay_images.insert(self.id, frame.clone());
									self.w = frame.width();
									self.h = frame.height();
									handle.emit("update_overlay_image", (true, self.id, self.w, self.h)).unwrap_or_default();
									return
								}
							},
							Err(_why) => error_dialog(format!("ERROR: Unable to read overlay image {}", image_path.to_string_lossy()))
						}
					}
					Err(_why) => error_dialog(format!("ERROR: Unable to find overlay image {}", image_path.to_string_lossy()))
				}
			}
		}
		self.w = 50;
		self.h = 50;
		handle.emit("update_overlay_image", (false, self.id, self.w, self.h)).unwrap_or_default();
	}
}
