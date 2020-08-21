function sortByOrder(a, b) {
	return (a.order_ || 100) - (b.order_ || 100);
}

class RenderEngine {
	labelFromIndex(sIndex) {
		const noPrefix = sIndex.split("_")[1];
		const withSpaces = [];
		noPrefix.split("").forEach((each, index) => {
			if (index === 0) {
				withSpaces.push(each.toUpperCase());
			} else {
				if (each === each.toUpperCase()) {
					withSpaces.push(" ");
				}
				withSpaces.push(each);
			}
		});
		return withSpaces.join("");
	}

	render(river) {
		const streamKeys = Object.keys(river.self_);
		// do html first, so others can append to it
		streamKeys.filter(each => each.startsWith("html_")).forEach(each => {
			const zHtml = river[each];
			const html = zHtml.value("<div>Empty Stream</div>");
			const $element = $(html);
			const parentQuery = zHtml.parentQuery_ || this.parentQuery();
			$(parentQuery).append($element);
			zHtml.postRender($element);
		});
		streamKeys
			.filter(each => each.startsWith("btn_"))
			.map(each => river[each])
			.sort(sortByOrder)
			.forEach(each => {
				this.renderButton(each);
			});
		streamKeys
			.filter(each => each.startsWith("ipt_"))
			.forEach(each => {
				const id = each;
				const label = river[each].label() || this.labelFromIndex(each);
				const parentQuery = each.parentQuery_ || this.parentQuery();
				$(parentQuery).append(`<input id="${id}" placeholder="${label}">`);
				$(`#${id}`).on("blur", function () {
					river[each].uPush($(this).val());
				});
				river[each].onValue(v => {
					$(`#${id}`).val(v);
				}, true);
			});
		streamKeys.filter(each => each.startsWith("ul_")).forEach(each => {
			const id = each;
			const parentQuery = each.parentQuery_ || this.parentQuery();
			//create the list once
			$(parentQuery).append(`<div class="ListPane"><ul id="${id}"></ul></div>`);
			//create the click handler once, on the document
			$(document).on("click", `#${id} li`, function () {
				river[`selection_${each}`].uPush($(this).text());
			});
			//each time the stream changes (and at creation), update the ul
			river[each].onValue(v => {
				$(`#${id}`).empty();
				v.forEach(each2 => {
					$(`#${id}`).append(`<li>${each2}</li>`);
				});
			}, true);
			river[`selection_${each}`].onValue(v => {
				const $item = $(`#${id} li`);
				$item.removeClass("selected");
				$item.filter(function () {
					return $(this).text() === v;
				}).addClass("selected");
			});
		});
		streamKeys.filter(each => each.startsWith("txt_")).forEach((each) => {
			const id = each;
			const parentQuery = each.parentQuery_ || this.parentQuery();
			$(parentQuery).append(`<textarea id=${id} class="TextArea"></textarea>`);
		});
	}

	renderButton(zButton) {
		// btn_
		const streamName = zButton.name_;
		const parentQuery = zButton.parentQuery_ || this.parentQuery();
		const label = zButton.label() || this.labelFromIndex(streamName);
		$(parentQuery).append(`<button id="${streamName}" class="Button">${label}</button>`);
		const $element = $(`#${streamName}`);
		$element.click(() => {
			zButton.push(true);
		});
		zButton.postRender($element);
	}

	clear(sQuery) {
		$(sQuery).empty();
	}

	parentQuery(v) {
		if (v) {
			this.parentQuery_ = v;
		} else {
			return this.parentQuery_;
		}
	}
}
