
import { send_ws_pcm_signal } from "./websocket.js";

const SAMPLE_RATE = 8000

const HAPTIC_DECODE_AUDIO_CTX = new AudioContext({ sampleRate: SAMPLE_RATE, latencyHint: "playback" });

export function notnull(v) {
	if (v != null) return v;
	else throw new TypeError("Unexpected null");
}

/**
 *
 * @param {File} file
 * @returns {Promise<Float32Array>}
 */
export async function load_pcm(file) {
	// if (file.type !== "audio/wav") { // lets just let decodeAudioData complain
	// 	throw new Error("Invalid file type, must be audio/wav");
	// }
	if (file.size > 5e6) {
		throw new Error("File size should be less than 5MB (soft limit, can remove if needed)");
	}
	try {
		const reader = new FileReader();
		const read_prom = new Promise((resolve, reject) => {
			reader.onload = async () => {
				try {
					const data = notnull(reader.result);
					if (typeof data === "string") throw new TypeError("unreachable");

					const decoded_pcm = await HAPTIC_DECODE_AUDIO_CTX.decodeAudioData(data);
					if (decoded_pcm.numberOfChannels !== 1) throw new Error("Audio file is not mono");
					const pcm = decoded_pcm.getChannelData(0); // device expects f32le
					resolve(pcm);
				} catch (err) {
					reject(err);
				}
			};
			reader.readAsArrayBuffer(file);
		});

		return await read_prom;
	} catch (err) {
		throw new Error(`Failed to load PCM data from file '${file.name}': ${err}`);
	}
}

/**
 *
 * @param {File} file
 */
export async function load_and_send_pcm(file) {
	const pcm = await load_pcm(file);
	send_pcm(pcm, file.name);
}

/**
 *
 * @param {Float32Array} pcm
 * @param {string} filename
 */
export function send_pcm(pcm, filename) {
	send_ws_pcm_signal(pcm);
}