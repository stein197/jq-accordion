import $ from "jquery";

// TODO: Add options ({duration: number;})
const MODE_DEFAULT: Mode = "single";
const CLASS_ACCORDION = "jq-accordion";
const CLASS_ITEM = "jq-accordion-item";
const CLASS_BUTTON = "jq-accordion-button";
const CLASS_BODY = "jq-accordion-body";
const CLASS_EXPANDED = "expanded";
const CLASS_COLLAPSED = "collapsed";
const CLASS_TOGGLING = "toggling";
const EVENT_TOGGLE_BEFORE = "accordion.toggle.before";
const EVENT_TOGGLE_AFTER = "accordion.toggle.after";

$.fn.accordion = function (this: JQuery<HTMLElement>) {
	toggleBodiesVisibility();
	this.delegate("." + CLASS_BUTTON, "click", onButtonClick);
}

function onButtonClick(this: JQuery<HTMLElement>, e: any) {
	e.preventDefault();
	const $item = getItem(this);
	if (!$item)
		throw new Error("There is no item for the button");
	Item.toggle($item);
}

function toggleBodiesVisibility(): void {
	$("." + CLASS_BODY).each(function () {
		const $body = $(this);
		const $item = $body.closest("." + CLASS_ITEM);
		if ($item.hasClass(CLASS_EXPANDED))
			$body.slideDown();
		if ($item.hasClass(CLASS_COLLAPSED))
			$body.slideUp();
	});
}

function getItem($element: JQuery<HTMLElement>): JQuery<HTMLElement> | null {
	return getClosestByClassName($element, CLASS_ITEM);
}

function getAccordion($element: JQuery<HTMLElement>): JQuery<HTMLElement> | null {
	return getClosestByClassName($element, CLASS_ACCORDION);
}

function getClosestByClassName($element: JQuery<HTMLElement>, className: string): JQuery<HTMLElement> | null {
	const $closest = $element.closest("." + className);
	return $closest.length ? $closest : null;
}

namespace Accordion {

	export function getMode($element: JQuery<HTMLElement>): Mode {
		return $element.attr("data-mode") as Mode || MODE_DEFAULT;
	}

	export function getExpandedItems($accordion: JQuery<HTMLElement>): JQuery<HTMLElement>[] {
		const items = getItems($accordion);
		return items.filter($item => $item.hasClass(CLASS_EXPANDED));
	}

	function getItems($accordion: JQuery<HTMLElement>): JQuery<HTMLElement>[] {
		const items = $accordion.find("." + CLASS_ITEM).toArray().map(item => {
			const $item = $(item);
			return [$item, $item.parents().length] as [item: JQuery<HTMLElement>, depth: number];
		});
		const lowestDepth = Math.min(...items.map(entry => entry[1]));
		const result: JQuery<HTMLElement>[] = [];
		for (const [$item, depth] of items) {
			if (depth === lowestDepth)
				result.push($item);
		}
		return result;
	}
}

namespace Item {

	export function getBody($item: JQuery<HTMLElement>): JQuery<HTMLElement> | null {
		const bodies = $item.find("." + CLASS_BODY).toArray().map(item => {
			const $item = $(item);
			return [$item, $item.parents().length] as [item: JQuery<HTMLElement>, depth: number];
		});
		if (!bodies.length)
			return null;
		const bodyEntry = bodies.reduce((prev, cur) => cur[1] < prev[1] ? cur : prev, [null as unknown as JQuery<HTMLElement>, Infinity]);
		return bodyEntry[0];
	}

	export function toggle($element: JQuery<HTMLElement>): void {
		if (isToggling($element))
			return;
		$element.trigger(EVENT_TOGGLE_BEFORE);
		const $body = getBody($element);
		if (!$body)
			throw new Error("There is no body in the item");
		$body.slideToggle(400, onSlideComplete);
		const $accordion = getAccordion($element);
		if (!$accordion)
			throw new Error("There is no accordion for the item");
		if (Accordion.getMode($accordion) === "single" && !isExpanded($element)) {
			const $expandedItem = Accordion.getExpandedItem($element);
			if ($expandedItem) {
				$expandedItem.removeClass(CLASS_EXPANDED).addClass(CLASS_COLLAPSED);
				const $expandedBody = getBody($expandedItem);
				if (!$expandedBody)
					throw new Error("There is no body in the expanded item");
				$expandedBody.slideUp(400, onSlideComplete);
			}
		}
		$element.toggleClass(CLASS_COLLAPSED).toggleClass(CLASS_EXPANDED);
		$element.trigger(EVENT_TOGGLE_AFTER); // TODO: Trigger on slide complete
	}

	export function isToggling($item: JQuery<HTMLElement>): boolean {
		const $body = getBody($item);
		if (!$body)
			throw new Error("There is no body in the item");
		return $body.hasClass(CLASS_TOGGLING);
	}

	export function isExpanded($element: JQuery<HTMLElement>): boolean {
		return $element.hasClass(CLASS_EXPANDED);
	}

	function onSlideComplete(this: HTMLElement): void {
		$(this).toggleClass(CLASS_TOGGLING).trigger(EVENT_TOGGLE_AFTER); // TODO: Add class to an item, not to a body
	}
}

declare global {
	interface JQuery {
		// TODO: Docs, tests
		accordion(this: JQuery<HTMLElement>): void;
	}
}

type Mode = "single" | "multiple";