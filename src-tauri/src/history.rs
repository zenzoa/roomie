use std::sync::Mutex;

use tauri::{ AppHandle, State, Emitter, Manager};

use crate::metaroom::{ MetaroomState, Metaroom };
use crate::file::FileState;
use crate::frontend::update_window_title;

#[derive(Default)]
pub struct HistoryState {
	pub undo_states: Mutex<Vec<Metaroom>>,
	pub redo_states: Mutex<Vec<Metaroom>>
}

pub fn reset_history(handle: &AppHandle) {
	let history_state: State<HistoryState> = handle.state();
	*history_state.undo_states.lock().unwrap() = Vec::new();
	*history_state.redo_states.lock().unwrap() = Vec::new();
}

pub fn add_history_state(handle: &AppHandle, metaroom: &Metaroom) {
	let history_state: State<HistoryState> = handle.state();
	history_state.undo_states.lock().unwrap().push(metaroom.clone());

	let file_state: State<FileState> = handle.state();
	*file_state.is_modified.lock().unwrap() = true;
}

#[tauri::command]
pub fn undo(handle: AppHandle) {
	let history_state: State<HistoryState> = handle.state();
	let mut undo_states = history_state.undo_states.lock().unwrap();
	let mut redo_states = history_state.redo_states.lock().unwrap();

	if let Some(last_undo_state) = undo_states.pop() {
		let metaroom_state: State<MetaroomState> = handle.state();
		let mut metaroom_opt = metaroom_state.metaroom.lock().unwrap();
		if let Some(metaroom) = metaroom_opt.as_mut() {
			redo_states.push(metaroom.clone());
			*metaroom = last_undo_state.clone();

			metaroom.refresh_images(&handle, &last_undo_state);

			let file_state: State<FileState> = handle.state();
			*file_state.is_modified.lock().unwrap() = true;

			handle.emit("update_metaroom", (metaroom.clone(), false)).unwrap_or_default();
		}
	}

	update_window_title(&handle);
}

#[tauri::command]
pub fn redo(handle: AppHandle) {
	let history_state: State<HistoryState> = handle.state();
	let mut undo_states = history_state.undo_states.lock().unwrap();
	let mut redo_states = history_state.redo_states.lock().unwrap();

	if let Some(last_redo_state) = redo_states.pop() {
		let metaroom_state: State<MetaroomState> = handle.state();
		let mut metaroom_opt = metaroom_state.metaroom.lock().unwrap();
		if let Some(metaroom) = metaroom_opt.as_mut() {
			undo_states.push(metaroom.clone());
			*metaroom = last_redo_state.clone();

			metaroom.refresh_images(&handle, &last_redo_state);

			let file_state: State<FileState> = handle.state();
			*file_state.is_modified.lock().unwrap() = true;

			handle.emit("update_metaroom", (metaroom.clone(), false)).unwrap_or_default();
		}
	}

	update_window_title(&handle);
}
