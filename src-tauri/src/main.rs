#![cfg_attr(
	all(not(debug_assertions), target_os = "windows"),
	windows_subsystem = "windows"
)]

use tauri::Manager;
use std::path::{ Path, PathBuf };
use std::fs::File;
use std::io::prelude::*;
use image::io::Reader as ImageReader;
use image::{ RgbaImage, GenericImage, GenericImageView };

mod blk;
mod c16;

fn main() {
	tauri::Builder::default()
		.invoke_handler(tauri::generate_handler![get_bg_path, get_favicon_path, get_overlay_path])
		.run(tauri::generate_context!())
		.expect("Error while running Roomie");
}

#[tauri::command]
fn get_bg_path(dir: String, title: String, app_handle: tauri::AppHandle) -> Result<String, String> {
	let png_path = Path::join(Path::new(&dir), &format!("{}.png", &title));
	let png_exists = match File::open(&png_path) { Ok(_) => true, Err(_) => false };

	let blk_path = Path::join(Path::new(&dir), &format!("{}.blk", &title));
	let blk_exists = match File::open(&blk_path) { Ok(_) => true, Err(_) => false };

	if png_exists && !blk_exists {
		if let Err(why) = png_to_blk(&png_path, &blk_path, &title) { return Err(why); }
	} else if blk_exists && !png_exists {
		if let Err(why) = blk_to_png(&blk_path, &png_path, &title) { return Err(why); }
	} else if !blk_exists && !png_exists {
		return Err(String::from("not_found"));
	}

	let fs_scope = app_handle.fs_scope();
	fs_scope.allow_file(&png_path).unwrap();

	Ok(png_path.display().to_string())
}

#[tauri::command]
fn get_favicon_path(dir: String, title: String, app_handle: tauri::AppHandle) -> Result<String, String> {
	let png_path = Path::join(Path::new(&dir), &format!("{}.png", &title));
	let png_exists = match File::open(&png_path) { Ok(_) => true, Err(_) => false };

	let c16_path = Path::join(Path::new(&dir), &format!("{}.c16", &title));
	let c16_exists = match File::open(&c16_path) { Ok(_) => true, Err(_) => false };

	if png_exists && !c16_exists {
		if let Err(why) = spritesheet_to_c16(&png_path, &c16_path, &title, 3) { return Err(why); }
	} else if !png_exists && c16_exists {
		if let Err(why) = c16_to_spritesheet(&c16_path, &png_path, &title) { return Err(why); }
	} else if !png_exists && !c16_exists {
		return Err(String::from("not_found"));
	}

	let fs_scope = app_handle.fs_scope();
	fs_scope.allow_file(&png_path).unwrap();

	Ok(png_path.display().to_string())
}

#[tauri::command]
fn get_overlay_path(dir: String, title: String, frame: usize, app_handle: tauri::AppHandle) -> Result<String, String> {
	let c16_path = Path::join(Path::new(&dir), &format!("{}.c16", &title));
	let png_with_index_path = Path::join(Path::new(&dir), format!("{}-{}.png", &title, frame));
	let png_path = Path::join(Path::new(&dir), format!("{}.png", &title));
	let path;

	match File::open(&c16_path) {
		Ok(_) => {
			match c16_to_pngs(&c16_path, &dir, &title, frame) {
				Ok(new_path) => path = new_path,
				Err(why) => return Err(why)
			}
		},
		Err(_) => {
			match File::open(&png_with_index_path) {
				Ok(_) => {
					if let Err(why) = pngs_to_c16(&c16_path, &dir, &title) { return Err(why); }
					path = png_with_index_path;
				},
				Err(_) => {
					if frame == 0 {
						match File::open(&png_path) {
							Ok(_) => {
								if let Err(why) = spritesheet_to_c16(&png_path, &c16_path, &title, 1) { return Err(why); }
								path = png_path;
							},
							Err(_) => {
								return Err(String::from("wrong_frame_format"));
							}
						}
					} else {
						return Err(String::from("wrong_frame_format"));
					}
				}
			}
		}
	}

	match File::open(&path) {
		Ok(_) => {
			let fs_scope = app_handle.fs_scope();
			fs_scope.allow_file(&path).unwrap();
			Ok(path.display().to_string())
		},
		Err(why) => Err(why.to_string())
	}
}

fn png_to_blk(png_path: &Path, blk_path: &Path, title: &String) -> Result<(), String> {
	match ImageReader::open(&png_path) {
		Ok(image_encoded) => {
			match image_encoded.decode() {
				Ok(image) => {
					match File::create(blk_path) {
						Ok(mut file) => {
							let blk_data = blk::encode(image.into_rgba8());
							match file.write_all(&blk_data) {
								Ok(()) => Ok(()),
								Err(_) => Err(format!("Unable to write data to BLK file, {}.blk", &title))
							}
						},
						Err(_) => Err(format!("Unable to save BLK file, {}.blk", &title))
					}
				},
				Err(_) => Err(format!("Unable to decode PNG file, {}.png", &title))
			}
		},
		Err(_) => Err(format!("Unable to open PNG file, {}.png", &title))
	}
}

fn blk_to_png(blk_path: &Path, png_path: &Path, title: &String) -> Result<(), String> {
	match File::open(blk_path) {
		Ok(mut file) => {
			let mut buffer = Vec::new();
			match file.read_to_end(&mut buffer) {
				Ok(_) => {
					match blk::decode(&buffer) {
						Ok(image) => {
							match image.save(&png_path) {
								Ok(()) => Ok(()),
								Err(_) => Err(format!("Unable to save PNG file, {}.png", &title))
							}
						}
						Err(why) => Err(format!("Unable to decode BLK file, {}.blk. {}", &title, &why))
					}
				},
				Err(_) => Err(format!("Unable to read BLK file, {}.blk", &title))
			}

		},
		Err(_) => Err(format!("Unable to open BLK file, {}.blk", &title))
	}
}

fn spritesheet_to_c16(png_path: &Path, c16_path: &Path, title: &String, frame_count: usize) -> Result<(), String> {
	match ImageReader::open(&png_path) {
		Ok(image_encoded) => {
			match image_encoded.decode() {
				Ok(image) => {
					match File::create(c16_path) {
						Ok(mut file) => {
							let width = image.width() / frame_count as u32;
							let height = image.height();
							let mut frames = vec![];
							for _ in 0..frame_count {
								frames.push(RgbaImage::new(width, height));
							}
							let mut x = 0;
							for frame in frames.iter_mut() {
								let view = image.view(x, 0, width, height);
								frame.copy_from(&view.to_image(), 0, 0).unwrap();
								x += frame.width();
							}
							let c16_data = c16::encode(frames);
							match file.write_all(&c16_data) {
								Ok(()) => Ok(()),
								Err(_) => Err(format!("Unable to write data to C16 file, {}.c16", &title))
							}
						},
						Err(_) => Err(format!("Unable to save C16 file, {}.c16", &title))
					}
				},
				Err(_) => Err(format!("Unable to decode PNG file, {}.png", &title))
			}
		},
		Err(_) => Err(format!("Unable to open PNG file, {}.png", &title))
	}
}

fn c16_to_spritesheet(c16_path: &Path, png_path: &Path, title: &String) -> Result<(), String> {
	match File::open(c16_path) {
		Ok(mut file) => {
			let mut buffer = Vec::new();
			match file.read_to_end(&mut buffer) {
				Ok(_) => {
					match c16::decode(&buffer) {
						Ok(mut frames) => {
							let mut width = 0;
							let mut height = 0;
							for frame in frames.iter_mut() {
								width += frame.width();
								if frame.height() > height {
									height = frame.height();
								}
							}
							let mut image = RgbaImage::new(width, height);
							let mut x = 0;
							for frame in frames.iter_mut() {
								image.copy_from(frame, x, 0).unwrap();
								x += frame.width();
							}
							match image.save(&png_path) {
								Ok(()) => Ok(()),
								Err(_) => Err(format!("Unable to save PNG file, {}.png", &title))
							}
						}
						Err(why) => Err(format!("Unable to decode C16 file, {}.c16. {}", &title, &why))
					}
				},
				Err(_) => Err(format!("Unable to read C16 file, {}.c16", &title))
			}

		},
		Err(_) => Err(format!("Unable to open C16 file, {}.c16", &title))
	}
}

fn pngs_to_c16(c16_path: &Path, dir: &String, title: &String) -> Result<(), String> {
	let mut images = Vec::new();

	for i in 0..1000 {
		let png_path = Path::join(Path::new(&dir), format!("{}-{}.png", &title, i));
		match ImageReader::open(&png_path) {
			Ok(image_encoded) => {
				match image_encoded.decode() {
					Ok(image) => {
						images.push(image.to_rgba8());
					},
					Err(_) => break
				}
			},
			Err(_) => break
		}
	}

	if images.is_empty() {
		Err(String::from("wrong_frame_format"))
	} else {
		match File::create(c16_path) {
			Ok(mut file) => {
				let c16_data = c16::encode(images);
				match file.write_all(&c16_data) {
					Ok(()) => Ok(()),
					Err(_) => Err(format!("Unable to write data to C16 file, {}.c16", &title))
				}
			},
			Err(_) => Err(format!("Unable to save C16 file, {}.c16", &title))
		}
	}

}

fn c16_to_pngs(c16_path: &Path, dir: &String, title: &String, frame: usize) -> Result<PathBuf, String> {
	match File::open(c16_path) {
		Ok(mut file) => {
			let mut buffer = Vec::new();
			match file.read_to_end(&mut buffer) {
				Ok(_) => {
					match c16::decode(&buffer) {
						Ok(images) => {
							if images.len() <= frame {
								Err(format!("Frame {} does not exist in file, {}.c16", frame, &title))

							} else if images.len() == 1 {
								let png_path = Path::join(Path::new(&dir), format!("{}.png", &title));
								match images[0].save(&png_path) {
									Ok(()) => Ok(png_path),
									Err(_) => return Err(format!("Unable to save PNG file, {}.png", &title))
								}

							} else {
								for (i, image) in images.iter().enumerate() {
									let png_path = Path::join(Path::new(&dir), format!("{}-{}.png", &title, i));
									match image.save(&png_path) {
										Ok(()) => {},
										Err(_) => return Err(format!("Unable to save PNG file, {}-{}.png", &title, i))
									}
								}
								Ok(Path::join(Path::new(&dir), format!("{}-{}.png", &title, frame)))
							}
						}
						Err(why) => Err(format!("Unable to decode C16 file, {}.c16. {}", &title, &why))
					}
				},
				Err(_) => Err(format!("Unable to read C16 file, {}.c16", &title))
			}

		},
		Err(_) => Err(format!("Unable to open C16 file, {}.c16", &title))
	}
}
