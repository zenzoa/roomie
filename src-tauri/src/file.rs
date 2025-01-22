use std::fs;
use std::error::Error;
use std::path::{ Path, PathBuf };
use std::sync::Mutex;
use std::collections::HashMap;

use tauri::{ AppHandle, State, Manager, Emitter };
use tauri::async_runtime::spawn;

use rfd::{ FileDialog, MessageDialog, MessageButtons, MessageDialogResult };

use image::RgbaImage;

use crate::frontend::{ error_dialog, update_window_title, update_frontend_metaroom };
use crate::caos::{ encode_metaroom, decode_metaroom };
use crate::metaroom::{ MetaroomState, Metaroom };
use crate::history::reset_history;
use crate::config::{ add_recent_file, get_recent_file_path };

#[derive(Default)]
pub struct FileState {
	pub path: Mutex<Option<PathBuf>>,
	pub is_modified: Mutex<bool>,
	pub lines_before: Mutex<Vec<String>>,
	pub lines_after: Mutex<Vec<String>>,
	pub bg_image: Mutex<Option<RgbaImage>>,
	pub favicon_image: Mutex<Option<RgbaImage>>,
	pub overlay_images: Mutex<HashMap<u32, RgbaImage>>
}

enum WhereAmI {
	Before,
	MainScript,
	RemovalScript,
	After
}

pub fn create_open_dialog(handle: &AppHandle) -> FileDialog {
	let mut file_dialog = FileDialog::new();

	let file_state: State<FileState> = handle.state();
	let path_opt = file_state.path.lock().unwrap().clone();
	if let Some(path) = path_opt {
		file_dialog = file_dialog.set_directory(path);
	}

	file_dialog
}

pub fn create_save_dialog(handle: &AppHandle, extension: &str) -> FileDialog {
	let mut file_dialog = FileDialog::new();

	let mut file_name = PathBuf::from("untitled");

	let file_state: State<FileState> = handle.state();
	let path_opt = file_state.path.lock().unwrap().clone();
	if let Some(path) = path_opt {
		if let Some(existing_file_name) = path.file_name() {
			file_name = PathBuf::from(existing_file_name)
		}
		if let Some(parent_dir) = path.parent() {
			file_dialog = file_dialog.set_directory(parent_dir)
		}
	};

	file_name.set_extension(extension);
	file_dialog = file_dialog.set_file_name(file_name.to_string_lossy());

	file_dialog
}

pub fn is_ok_to_modify(handle: &AppHandle) -> bool {
	let file_state: State<FileState> = handle.state();
	if *file_state.is_modified.lock().unwrap() {
		let confirm_continue = MessageDialog::new()
			.set_title("File modified")
			.set_description("Do you want to continue anyway and lose any unsaved work?")
			.set_buttons(MessageButtons::YesNo)
			.show();
		if let MessageDialogResult::Yes = confirm_continue {
			true
		} else {
			false
		}
	} else {
		true
	}
}

#[tauri::command]
pub fn new_file(handle: AppHandle) {
	if is_ok_to_modify(&handle) {
		let metaroom_state: State<MetaroomState> = handle.state();
		*metaroom_state.metaroom.lock().unwrap() = Some(Metaroom::new());

		let file_state: State<FileState> = handle.state();
		*file_state.path.lock().unwrap() = None;
		*file_state.is_modified.lock().unwrap() = false;
		*file_state.lines_before.lock().unwrap() = Vec::new();
		*file_state.lines_after.lock().unwrap() = Vec::new();

		update_window_title(&handle);
		update_frontend_metaroom(&handle, true);
		reset_history(&handle);
	}
}

#[tauri::command]
pub fn open_file(handle: AppHandle) {
	if is_ok_to_modify(&handle) {
		let file_handle_opt = create_open_dialog(&handle)
			.set_title("Open Metaroom")
			.add_filter("Metaroom Script", &["cos", "COS"])
			.pick_file();
		if let Some(file_handle) = file_handle_opt {
			handle.emit("show_spinner", ()).unwrap_or_default();
			spawn(async move {
				if let Err(why) = open_file_from_path(&handle, &file_handle.as_path()) {
					println!("ERROR: {}", why);
					error_dialog(why.to_string());
				};
				handle.emit("hide_spinner", ()).unwrap_or_default();
			});
		}
	}
}

pub fn open_recent_file(handle: AppHandle, path_str: &str) {
	if let Some(path) = get_recent_file_path(&handle, path_str) {
		handle.emit("show_spinner", ()).unwrap_or_default();
		spawn(async move {
			if let Err(why) = open_file_from_path(&handle, &path) {
				println!("ERROR: {}", why);
				error_dialog(why.to_string());
			};
			handle.emit("hide_spinner", ()).unwrap_or_default();
		});
	}
}

pub fn open_file_from_path(handle: &AppHandle, path: &Path) -> Result<(), Box<dyn Error>> {
	let file_contents = fs::read_to_string(path)?;

	let mut where_am_i = WhereAmI::Before;
	let mut lines_before = Vec::new();
	let mut lines_after = Vec::new();
	let mut roomie_code = String::new();
	for line in file_contents.lines() {
		match where_am_i {
			WhereAmI::Before => {
				if line == "***ROOMIE_START***" {
					where_am_i = WhereAmI::MainScript;
				} else {
					lines_before.push(line.to_string());
				}
			},
			WhereAmI::MainScript => {
				if line == "*Removal script" {
					where_am_i = WhereAmI::RemovalScript;
				} else if line == "***ROOMIE_END***" {
					where_am_i = WhereAmI::After;
				} else if !line.starts_with('*') {
					roomie_code.push('\n');
					roomie_code.push_str(line);
				}
			},
			WhereAmI::RemovalScript => {
				if line == "***ROOMIE_END***" {
					where_am_i = WhereAmI::After;
				}
			},
			WhereAmI::After => {
				lines_after.push(line.to_string());
			}
		}
	}

	if roomie_code.is_empty() {
		return Err("No Roomie metaroom code found".into());
	}

	let mut metaroom = decode_metaroom(&roomie_code)?;

	let metaroom_state: State<MetaroomState> = handle.state();
	*metaroom_state.metaroom.lock().unwrap() = Some(metaroom.clone());

	let file_state: State<FileState> = handle.state();
	*file_state.path.lock().unwrap() = Some(path.to_owned());
	*file_state.is_modified.lock().unwrap() = false;
	*file_state.lines_before.lock().unwrap() = lines_before;
	*file_state.lines_after.lock().unwrap() = lines_after;
	*file_state.bg_image.lock().unwrap() = None;

	add_recent_file(&handle, path);

	update_window_title(&handle);
	update_frontend_metaroom(&handle, true);
	reset_history(&handle);

	metaroom.load_images(&handle);

	Ok(())
}

#[tauri::command]
pub fn save_file(handle: AppHandle) {
	let file_state: State<FileState> = handle.state();
	let path_opt = file_state.path.lock().unwrap().clone();
	if let Some(path) = path_opt {
		handle.emit("show_spinner", ()).unwrap_or_default();
		if let Err(why) = save_file_to_path(&handle, &path) {
			println!("ERROR: {}", why);
			error_dialog(why.to_string());
		}
		update_window_title(&handle);
		handle.emit("hide_spinner", ()).unwrap_or_default();
	} else {
		save_as(handle);
	};
}

#[tauri::command]
pub fn save_as(handle: AppHandle) {
	let file_handle_opt = create_save_dialog(&handle, "cos")
		.set_title("Save As")
		.add_filter("Metaroom Script", &["cos", "COS"])
		.save_file();

	if let Some(file_handle) = file_handle_opt {
		handle.emit("show_spinner", ()).unwrap_or_default();
		spawn(async move {
			if let Err(why) = save_file_to_path(&handle, &file_handle.as_path()) {
				println!("ERROR: {}", why);
				error_dialog(why.to_string());
			}
			update_window_title(&handle);
			handle.emit("hide_spinner", ()).unwrap_or_default();
		});
	}
}

pub fn save_file_to_path(handle: &AppHandle, path: &Path) -> Result<(), Box<dyn Error>> {
	let version = handle.package_info().version.to_string();

	let metaroom_state: State<MetaroomState> = handle.state();
	let metaroom_opt = metaroom_state.metaroom.lock().unwrap();
	let metaroom = metaroom_opt.as_ref().ok_or("No metaroom")?;

	let metaroom_data = encode_metaroom(&metaroom, &version);

	let file_state: State<FileState> = handle.state();
	let data_before = file_state.lines_before.lock().unwrap().join("\r\n");
	let data_after = file_state.lines_after.lock().unwrap().join("\r\n");
	let data = [data_before, metaroom_data, data_after].concat();
	fs::write(path, &data)?;

	*file_state.path.lock().unwrap() = Some(path.to_owned());
	*file_state.is_modified.lock().unwrap() = false;

	add_recent_file(handle, path);

	Ok(())
}
