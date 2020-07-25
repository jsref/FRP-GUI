class Stream {
	constructor(sName = "Stream", oRiver = {name_: "River"}) {
		this.name_ = sName;
		this.river_ = oRiver;
		this.onValueFunctions_ = [];
		this.postRenderFunctions_ = [];
		this.value_ = undefined;
	}

	// =================================
	// API - touch
	// =================================
	// do nothing - allows stream to be created
	touch() {
	}

	// =================================
	// API - query
	// =================================
	value(vDefault) {
		if (this.value_ === undefined) {
			return vDefault;
		} else {
			return this.value_;
		}
	}

	hasValue() {
		return !(this.value_ === undefined);
	}

	label(sLabel) {
		if (sLabel === undefined) {
			return this.label_;
		} else {
			this.label_ = sLabel;
			return this;
		}
	}

	// =================================
	// API - listen
	// =================================
	onValue(f, trigger = false) {
		// f(v, oStream)
		this.onValueFunctions_.push(f);
		if (trigger && this.hasValue()) {
			f(this.value_, this);
		}
		return this;
	}

	clearListeners() {
		this.onValueFunctions_ = [];
		return this;
	}

	// =================================
	// API - push
	// =================================
	triggerOnValue() {
		if (this.hasValue()) {
			this.onValueFunctions_.forEach(each => each(this.value_, this));
		}
		return this;
	}

	push(v, kw = {}) {
		const options = {...{clean: false, unique: false}, ...kw};
		if (options.unique && _.isEqual(v, this.value_)) {
			//do not push if v has not changed
			return this;
		}
		this.value_ = v;
		this.triggerOnValue();
		return this;
	}

	uPush(v) {
		return this.push(v, {unique: true});
	};

	pushCycle(a) {
		const currentIndex = a.indexOf(this.value());
		const nextIndex = (currentIndex + 1) % a.length;
		this.push(a[nextIndex]);
	}

	// =================================
	// API - push strings
	// =================================
	appendString(s, delimiter = "") {
		if ((!_.isString(this.value_)) || this.value_ === "") {
			//push first string
			this.push(s.toString());
		} else {
			//push subsequent strings
			this.push(this.value_ + delimiter + s.toString());
		}
		return this;
	};

	appendLine(s) {
		this.appendString(s, "\n");
		return this;
	};

	clearString() {
		this.push("");
		return this;
	}

	// =================================
	// API - render
	// =================================
	onRender(f) {
		// f($element, z)
		this.postRenderFunctions_.push(f);
		return this;
	}

	postRender($element) {
		this.postRenderFunctions_.forEach(each => each($element, this));
		return this;
	}

	setClasses(...args) {
		this.classes_ = args;
		return this;
	}

	getClasses() {
		return this.classes_ || [];
	}

	getClassString(sClass) {
		return [sClass || ""].concat(this.getClasses()).join(" ").trim();
	}
	// Stream
}

class EventStream extends Stream {
	constructor(sName = "EventStream", oRiver = {name_: "River"}) {
		super(sName, oRiver);
		this.onEventFunctions_ = {};
	}

	// =================================
	// API - events
	// =================================
	on(sEventName, f) {
		this.getEventHandlers(sEventName).push(f);
		return this;
	}

	trigger(sEventName, ...args) {
		this.getEventHandlers(sEventName).forEach(each => {
			each(...args);
		});
		return this;
	}

	// =================================
	// utility
	// =================================
	getEventHandlers(sEventName) {
		let allHandlers = this.onEventFunctions_;
		if (!allHandlers) {
			allHandlers = {};
			this.onEventFunctions_ = allHandlers;
		}
		let eventHandlers = allHandlers[sEventName];
		if (!eventHandlers) {
			eventHandlers = [];
			this.onEventFunctions_[sEventName] = eventHandlers;
		}
		return eventHandlers;
	}

	// used for tests
	clearEventHandlers(sEventName) {
		if (sEventName) {
			this.onEventFunctions_[sEventName] = [];
		} else {
			this.onEventFunctions_ = {};
		}
		return this;
	}
	// EventStream
}

class River {
	constructor(oRiver = {name_: "River"}) {
		return new Proxy(oRiver, {
			get: function (oRiver, sGetter) {
				if (sGetter === "self_") {
					return oRiver;
				}
				if (oRiver[sGetter] === undefined) {
					oRiver[sGetter] = new EventStream(sGetter, oRiver);
					oRiver.onStreamCreate_ && oRiver.onStreamCreate_(oRiver[sGetter], oRiver);
				}
				return oRiver[sGetter];
			},
		});
	}

	static clear(zzRiver) {
		const target = zzRiver.self_;
		const keys = Object.keys(target);
		keys.forEach((each) => {
			// only delete stream names
			if (each.slice(-1) !== "_") {
				delete target[each];
			}
		});
	}

	static test_label(t) {
		const river = new River();
		const stream = river.one;
		let result = stream.label("One").label();
		t.eq(result, "One");
		result = stream.label_;
		t.eq(result, "One");
	}

	static test_onStreamCreate_(t) {
		const river = new River();
		river.two_ = 2;
		river.onStreamCreate_ = (stream, river) => stream.one_ = 3 - river.two_;
		const stream = river.one;
		let result = stream.one_;
		t.eq(result, 1);
	}

	static test_getEventHandlers(t) {
		const river = new River();
		const stream = river.one;
		let result = stream.getEventHandlers("eventOne");
		t.eq(result, []);
		result = stream.onEventFunctions_;
		t.eq(result, {eventOne: []});
	}

	static test_on_trigger(t) {
		const river = new River();
		const stream = river.one;
		let result = "RESULT";
		stream.on("eventOne", (x, y) => {
			result += x;
			result += y;
		});
		stream.trigger("eventOne", " ONE", " TWO");
		t.eq(result, "RESULT ONE TWO");
	}

	static test_clearEventListeners(t) {
		const river = new River();
		const stream = river.one;
		stream.on("eventOne", () => 9999);
		stream.on("eventTwo", () => 9999);
		stream.on("eventThree", () => 9999);
		t.eq(stream.getEventHandlers("eventOne").length, 1);
		t.eq(stream.getEventHandlers("eventTwo").length, 1);
		t.eq(stream.getEventHandlers("eventThree").length, 1);
		stream.clearEventHandlers("eventTwo");
		t.eq(stream.getEventHandlers("eventOne").length, 1);
		t.eq(stream.getEventHandlers("eventTwo").length, 0);
		t.eq(stream.getEventHandlers("eventThree").length, 1);
		stream.clearEventHandlers();
		t.eq(stream.getEventHandlers("eventOne").length, 0);
		t.eq(stream.getEventHandlers("eventTwo").length, 0);
		t.eq(stream.getEventHandlers("eventThree").length, 0);
	}

	static test_push(t) {
		let result = 0;
		const river = new River();
		const stream = river.one;
		stream.onValue(function (v) {
			result = v;
		});
		t.eq(result, 0);
		stream.push(17);
		t.eq(result, 17);
		stream.push(18);
		t.eq(result, 18);
		result = 0;
		stream.uPush(18);
		t.eq(result, 0);
		stream.clearString();
		t.eq(result, "");
		stream.appendString("xxx");
		t.eq(result, "xxx");
		stream.appendString("yyy");
		t.eq(result, "xxxyyy");
		stream.appendString("zzz", "|");
		t.eq(result, "xxxyyy|zzz");
		stream.appendLine("aaa");
		t.eq(result, "xxxyyy|zzz\naaa");
		stream.clearListeners();
		stream.push(17);
		t.eq(result, "xxxyyy|zzz\naaa");
	}
	// River
}