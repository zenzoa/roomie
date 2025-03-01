use std::sync::Mutex;
use std::collections::HashMap;
use std::fs;
use std::error::Error;
use std::cmp::Ordering;

use rfd::{ MessageDialog, MessageButtons, MessageDialogResult };
use serde::{ Serialize, Deserialize };

use tauri::{ AppHandle, State, Manager, Emitter as TauriEmitter };
use tauri::async_runtime::spawn;

use crate::geometry::{ Point, Polygon };

pub mod room;
pub mod side;
pub mod corner;
pub mod door;
pub mod link;
pub mod overlay;
pub mod favicon;

use room::Room;
use side::Side;
use corner::Corner;
use door::Door;
use link::Link;
use overlay::Overlay;
use favicon::Favicon;

use crate::file::FileState;
use crate::format::blk::import_blk;
use crate::frontend::error_dialog;

#[derive(Default)]
pub struct MetaroomState {
	pub metaroom: Mutex<Option<Metaroom>>
}

#[derive(Default, Clone, Serialize, Deserialize)]
pub struct Metaroom {
	pub x: u32,
	pub y: u32,
	pub width: u32,
	pub height: u32,
	pub background: String,
	pub music_file_name: String,
	pub music_track_name: String,
	pub favicon: Option<Favicon>,
	pub emitter_species: Option<u16>,
	pub rooms: Vec<Room>,
	pub sides: Vec<Side>,
	pub corners: Vec<Corner>,
	pub doors: Vec<Door>,
	pub links: Vec<Link>,
	pub overlays: Vec<Overlay>,
	pub permeabilities: HashMap<(u32, u32), u32>,
}

impl Metaroom {
	pub fn new() -> Self {
		Metaroom {
			width: 1600,
			height: 1024,
			..Default::default()
		}
	}

	pub fn contains_point(&self, x: u32, y: u32) -> bool {
		x >= self.x && x < self.x + self.width && y >= self.y && y < self.y + self.height
	}

	pub fn update_room_bits(&mut self, room_id: u32) {
		if let Some(room) = self.rooms.get_mut(room_id as usize) {
			for side in self.sides.iter_mut() {
				if side.room_id == room.id {
					side.update_from_line(&room.get_side_line(&side.position));
				}
			}

			for corner in self.corners.iter_mut() {
				if corner.room_id == room.id {
					(corner.x, corner.y) = room.get_corner_xy(&corner.position);
				}
			}

			for link in self.links.iter_mut() {
				let room_center = room.center();
				if link.room1_id == room.id {
					link.line.a = room_center;
				} else if link.room2_id == room.id {
					link.line.b = room_center;
				}
			}
		}
	}

	pub fn mark_room_collisions(&mut self) {
		let other_rooms = self.rooms.clone();
		for room in self.rooms.iter_mut() {
			room.collision = false;
			for other_room in &other_rooms {
				if room.id != other_room.id && room.collides_room(other_room) {
					room.collision = true;
				}
			}
		}
	}

	pub fn create_doors(&self) -> Vec<Door> {
		let mut doors = Vec::new();
		let mut existing_room_pairs = Vec::new();

		for room1 in self.rooms.iter() {
			for room2 in self.rooms.iter() {
				let room1_id = room1.id.min(room2.id);
				let room2_id = room1.id.max(room2.id);
				let room_pair = (room1_id, room2_id);

				if room1_id != room2_id && !existing_room_pairs.contains(&room_pair) {
					existing_room_pairs.push(room_pair);

					if let Some(line) = room1.get_overlap(room2) {
						let permeability = match self.permeabilities.get(&room_pair) {
							Some(perm) => *perm,
							None => 100
						};

						doors.push(Door {
							id: doors.len() as u32,
							room1_id,
							room2_id,
							permeability,
							line
						})
					}
				}
			}
		}

		doors
	}

	pub fn get_room_mut_at(&mut self, x: u32, y: u32) -> Option<&mut Room> {
		for room in self.rooms.iter_mut() {
			if room.contains_point(x, y) {
				return Some(room)
			}
		}
		None
	}

	pub fn get_room_id_at(&self, x: u32, y: u32) -> Option<u32> {
		for room in self.rooms.iter() {
			if room.contains_point(x, y) {
				return Some(room.id)
			}
		}
		None
	}

	pub fn get_room_ids_at(&self, x: u32, y: u32) -> Option<Vec<u32>> {
		let room_ids: Vec<u32> = self.rooms.iter()
			.filter_map(|room|
				if room.contains_point(x, y) { Some(room.id) } else { None })
			.collect();
		if room_ids.is_empty() { None } else { Some(room_ids) }
	}

	pub fn get_room_ids_within(&self, x: u32, y: u32, w: u32, h: u32) -> Option<Vec<u32>> {
		let rect = &Polygon::from_rect(x, y, w, h);
		let room_ids: Vec<u32> = self.rooms.iter()
			.filter_map(|room|
				if rect.contains(&room.as_polygon()) { Some(room.id) } else { None })
			.collect();
		if room_ids.is_empty() { None } else { Some(room_ids) }
	}

	pub fn add_room(&mut self, mut room: Room) {
		room.id = self.rooms.len() as u32;
		self.sides.extend_from_slice(&room.sides());
		self.corners.extend_from_slice(&room.corners());
		self.rooms.push(room);
		self.mark_room_collisions();
		self.doors = self.create_doors();
	}

	pub fn remove_room(&mut self, room_id: u32) {
		self.rooms = self.rooms.clone().into_iter().filter_map(|mut room| {
			match room.id.cmp(&room_id) {
				Ordering::Equal => { return None; },
				Ordering::Greater => { room.id -= 1; },
				Ordering::Less => {},
			}
			Some(room)
		}).collect();

		self.sides = self.sides.clone().into_iter().filter_map(|mut side| {
			match side.room_id.cmp(&room_id) {
				Ordering::Equal => { return None; },
				Ordering::Greater => { side.room_id -= 1; },
				Ordering::Less => {},
			}
			Some(side)
		}).collect();

		self.corners = self.corners.clone().into_iter().filter_map(|mut corner| {
			match corner.room_id.cmp(&room_id) {
				Ordering::Equal => { return None; },
				Ordering::Greater => { corner.room_id -= 1; },
				Ordering::Less => {},
			}
			Some(corner)
		}).collect();

		self.doors = self.doors.clone().into_iter().filter_map(|mut door| {
			if door.room1_id == room_id || door.room2_id == room_id {
				return None;
			}
			if door.room1_id > room_id {
				door.room1_id -= 1;
			}
			if door.room2_id > room_id {
				door.room2_id -= 1;
			}
			Some(door)
		}).collect();

		self.links = self.links.clone().into_iter().filter_map(|mut link| {
			if link.room1_id == room_id || link.room2_id == room_id {
				return None;
			}
			if link.room1_id > room_id {
				link.room1_id -= 1;
			}
			if link.room2_id > room_id {
				link.room2_id -= 1;
			}
			Some(link)
		}).collect();
	}

	pub fn get_side_ids_at(&self, x: u32, y: u32, r: f64) -> Option<Vec<u32>> {
		let side_ids: Vec<u32> = self.sides.iter().enumerate()
			.filter_map(|(i, s)|
				if s.as_line().intersects_circle(x as f64, y as f64, r) { Some(i as u32) } else { None })
			.collect();
		if side_ids.is_empty() { None } else { Some(side_ids) }
	}

	pub fn get_side_ids_within(&self, x: u32, y: u32, w: u32, h: u32) -> Option<Vec<u32>> {
		let rect = &Polygon::from_rect(x, y, w, h);
		let side_ids: Vec<u32> = self.sides.iter().enumerate()
			.filter_map(|(i, side)|
				if rect.contains(&side.as_line()) { Some(i as u32) } else { None })
			.collect();
		if side_ids.is_empty() { None } else { Some(side_ids) }
	}

	pub fn get_corner_ids_at(&self, x: u32, y: u32, r: f64) -> Option<Vec<u32>> {
		let corner_ids: Vec<u32> = self.corners.iter().enumerate()
			.filter_map(|(i, c)|
				if c.as_point().intersects_circle(x as f64, y as f64, r) { Some(i as u32) } else { None })
			.collect();
		if corner_ids.is_empty() { None } else { Some(corner_ids) }
	}

	pub fn get_corner_ids_within(&self, x: u32, y: u32, w: u32, h: u32) -> Option<Vec<u32>> {
		let rect = &Polygon::from_rect(x, y, w, h);
		let corner_ids: Vec<u32> = self.corners.iter().enumerate()
			.filter_map(|(i, corner)|
				if rect.contains(&corner.as_point()) { Some(i as u32) } else { None })
			.collect();
		if corner_ids.is_empty() { None } else { Some(corner_ids) }
	}

	pub fn get_door_ids_at(&self, x: u32, y: u32, r: f64) -> Option<Vec<u32>> {
		let door_ids: Vec<u32> = self.doors.iter().enumerate()
			.filter_map(|(i, d)|
				if d.line.intersects_circle(x as f64, y as f64, r) { Some(i as u32) } else { None })
			.collect();
		if door_ids.is_empty() { None } else { Some(door_ids) }
	}

	pub fn get_door_ids_within(&self, x: u32, y: u32, w: u32, h: u32) -> Option<Vec<u32>> {
		let door_ids: Vec<u32> = self.doors.iter().enumerate()
			.filter_map(|(i, d)|
				if d.intersects_rect(x, y, w, h) { Some(i as u32) } else { None })
			.collect();
		if door_ids.is_empty() { None } else { Some(door_ids) }
	}

	pub fn get_link_id_at(&self, x: u32, y: u32, r: f64) -> Option<u32> {
		let mouse_point = Point::new(x as f64, y as f64);
		let mut closest_link_id = None;
		let mut closest_dist_sq = r * r;
		for (i, link) in self.links.iter().enumerate() {
			let dist_sq = link.line.dist_sq(&mouse_point);
			if dist_sq < closest_dist_sq && link.line.intersects_circle(x as f64, y as f64, r) {
				closest_link_id = Some(i as u32);
				closest_dist_sq = dist_sq;
			}
		}
		closest_link_id
	}

	pub fn get_overlay_ids_within(&self, x: u32, y: u32, w: u32, h: u32) -> Option<Vec<u32>> {
		let overlay_ids: Vec<u32> = self.overlays.iter().enumerate()
			.filter_map(|(i, o)|
				if o.within(x, y, w, h) { Some(i as u32) } else { None })
			.collect();
		if overlay_ids.is_empty() { None } else { Some(overlay_ids) }
	}

	pub fn get_overlay_ids_at(&self, x: u32, y: u32) -> Option<Vec<u32>> {
		let overlay_ids: Vec<u32> = self.overlays.iter().enumerate()
			.filter_map(|(i, o)|
				if o.contains(x, y) { Some(i as u32) } else { None })
			.collect();
		if overlay_ids.is_empty() { None } else { Some(overlay_ids) }
	}

	pub fn resize(&mut self, w: u32, h: u32) -> Result<(), Box<dyn Error>> {
		if let Some(favicon) = &self.favicon {
			if favicon.x + 24 >= w || favicon.y + 23 >= h {
				return Err("Unable to resize metaroom because one or more objects are outside the new dimensions.".into());
			}
		}

		for overlay in &self.overlays {
			if overlay.x + overlay.w >= w || overlay.y + overlay.h >= h {
				return Err("Unable to resize metaroom because one or more objects are outside the new dimensions.".into());
			}
		}

		for room in &self.rooms {
			if room.x_right >= w || room.y_bot_left >= h || room.y_bot_right >= h {
				return Err("Unable to resize metaroom because one or more objects are outside the new dimensions.".into());
			}
		}

		self.width = w;
		self.height = h;

		Ok(())
	}

	pub fn load_background_image(&self, handle: &AppHandle) {
		if !self.background.is_empty() {
			let file_state: State<FileState> = handle.state();
			let path_opt = file_state.path.lock().unwrap().clone();
			if let Some(path) = path_opt {
				let bg_path = path.with_file_name(format!("{}.blk", self.background));
				match fs::read(&bg_path) {
					Ok(img_contents) => {
						let handle = handle.clone();
						spawn(async move {
							let mut bg_found = false;
							match import_blk(&img_contents) {
								Ok(bg_image) => {
									let metaroom_state: State<MetaroomState> = handle.state();
									let mut metaroom_opt = metaroom_state.metaroom.lock().unwrap();
									if let Some(metaroom) = metaroom_opt.as_mut() {
										if bg_image.width() != metaroom.width || bg_image.height() != metaroom.height {
											let result = MessageDialog::new()
												.set_title("Resize Metaroom?")
												.set_description(format!("Background image ({}x{}) has different dimensions than metaroom ({}x{}). Resize metaroom to match?", bg_image.width(), bg_image.height(), metaroom.width, metaroom.height))
												.set_buttons(MessageButtons::YesNo)
												.show();
											if let MessageDialogResult::Yes = result {
												if let Err(why) = metaroom.resize(bg_image.width(), bg_image.height()) {
													error_dialog(why.to_string());
												} else {
													handle.emit("update_metaroom", (metaroom.clone(), false)).unwrap_or_default();
												}
											}
										}
									}
									let file_state: State<FileState> = handle.state();
									*file_state.bg_image.lock().unwrap() = Some(bg_image);
									bg_found = true;
								},
								Err(_why) => {
									error_dialog(format!("ERROR: Unable to read background image {}", bg_path.to_string_lossy()))
								}
							}
							handle.emit("update_bg_image", bg_found).unwrap_or_default();
						});
						return;
					}
					Err(_why) => error_dialog(format!("ERROR: Unable to find background image {}", bg_path.to_string_lossy()))
				}
			}
		}
		handle.emit("update_bg_image", false).unwrap_or_default();
	}

	pub fn load_images(&mut self, handle: &AppHandle) {
		self.load_background_image(handle);
		if let Some(favicon) = &self.favicon {
			favicon.load_image(handle);
		}
		for overlay in self.overlays.iter_mut() {
			overlay.load_image(handle);
		}
	}

	pub fn refresh_images(&mut self, handle: &AppHandle, other_metaroom: &Metaroom) {
		if self.background != other_metaroom.background {
			self.load_background_image(handle);
		}
		if self.favicon != other_metaroom.favicon {
			if let Some(favicon) = &self.favicon {
				favicon.load_image(handle);
			}
		}
		for overlay in self.overlays.iter_mut() {
			if let Some(other_overlay) = other_metaroom.overlays.get(overlay.id as usize) {
				if overlay.sprite != other_overlay.sprite {
					overlay.load_image(handle);
				}
			}
		}
	}
}
