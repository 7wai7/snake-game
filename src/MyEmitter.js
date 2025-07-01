export default class MyEmitter {
	constructor() {
		this.events = {};
	}

	on(event, cb) {
		this.events[event] ??= [];
		this.events[event].push(cb);
	}

	emit(event, data) {
		this.events[event]?.forEach(cb => cb(data));
	}
}