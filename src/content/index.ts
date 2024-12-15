declare const eko: any;

if (!(window as any).eko) {
  (window as any).eko = { lastMouseX: 0, lastMouseY: 0 };
}

document.addEventListener("mousemove", (event) => {
  eko.lastMouseX = event.clientX;
  eko.lastMouseY = event.clientY;
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  (async () => {
    try {
      switch (request.type) {
        case "page:getDetailLinks": {
          let result = await eko.getDetailLinks(request.search);
          sendResponse(result);
          break;
        }
        case "page:getContent": {
          let result = await eko.getContent(request.search);
          sendResponse(result);
          break;
        }
        case "computer:key": {
          sendResponse(key(request));
          break;
        }
        case "computer:type": {
          sendResponse(type(request));
          break;
        }
        case "computer:mouse_move": {
          sendResponse(mouse_move(request));
          break;
        }
        case "computer:left_click": {
          simulateMouseEvent(request, ["mousedown", "mouseup", "click"], 0);
          sendResponse();
          break;
        }
        case "computer:right_click": {
          simulateMouseEvent(
            request,
            ["mousedown", "mouseup", "contextmenu"],
            2
          );
          sendResponse();
          break;
        }
        case "computer:double_click": {
          simulateMouseEvent(
            request,
            [
              "mousedown",
              "mouseup",
              "click",
              "mousedown",
              "mouseup",
              "click",
              "dblclick",
            ],
            0
          );
          sendResponse();
          break;
        }
        case "computer:left_click_drag": {
          sendResponse(left_click_drag(request));
          break;
        }
        case "computer:scroll_to": {
          sendResponse(scroll_to(request));
          break;
        }
        case "computer:cursor_position": {
          sendResponse({ coordinate: [eko.lastMouseX, eko.lastMouseY] });
          break;
        }
      }
    } catch (e) {
      console.log("onMessage error", e);
    }
  })();
  return true;
});

function key(request: any) {
  const event = new KeyboardEvent(request.keyEventType || "keydown", {
    key: request.key,
    ctrlKey: request.ctrlKey,
    altKey: request.altKey,
    shiftKey: request.shiftKey,
    metaKey: request.metaKey,
    bubbles: true,
    cancelable: true,
  });
  let coordinate = request.coordinate as [number, number];
  (
    document.activeElement ||
    document.elementFromPoint(coordinate[0], coordinate[1])
  )?.dispatchEvent(event);
}

function type(request: any) {
  let text = request.text as string;
  let coordinate = request.coordinate as [number, number];
  let element = document.elementFromPoint(coordinate[0], coordinate[1]);
  if (!element) {
    return;
  }
  let input: any;
  if (
    element.tagName == "INPUT" ||
    element.tagName == "TEXTAREA" ||
    element.childElementCount == 0
  ) {
    input = element;
  } else {
    input =
      element.querySelector("input") ||
      element.querySelector("textarea") ||
      element;
  }
  input.focus && input.focus();
  input.value += text;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function mouse_move(request: any) {
  let coordinate = request.coordinate as [number, number];
  let x = coordinate[0];
  let y = coordinate[1];
  const event = new MouseEvent("mousemove", {
    view: window,
    bubbles: true,
    cancelable: true,
    screenX: x,
    screenY: y,
    clientX: x,
    clientY: y,
  });
  return document.body.dispatchEvent(event);
}

function simulateMouseEvent(
  request: any,
  eventTypes: Array<string>,
  button: 0 | 1 | 2
) {
  const coordinate = request.coordinate as [number, number];
  const x = coordinate[0];
  const y = coordinate[1];
  const element = document.elementFromPoint(x, y) || document.body;
  for (let i = 0; i < eventTypes.length; i++) {
    const event = new MouseEvent(eventTypes[i], {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      button, // 0 left; 2 right
    });
    element.dispatchEvent(event);
  }
}

function scroll_to(request: any) {
  // const from_coordinate = request.from_coordinate as [number, number];
  const to_coordinate = request.to_coordinate as [number, number];
  window.scrollTo({
    top: to_coordinate[0],
    left: to_coordinate[1],
    behavior: "smooth",
  });
}

function left_click_drag(request: any, steps = 10) {
  const from_coordinate = request.from_coordinate as [number, number];
  const to_coordinate = request.to_coordinate as [number, number];
  let startX = from_coordinate[0];
  let startY = from_coordinate[1];
  let endX = to_coordinate[0];
  let endY = to_coordinate[1];
  let element = document.elementFromPoint(startX, startY) || document.body;
  const mouseDownEvent = new MouseEvent("mousedown", {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: startX,
    clientY: startY,
    button: 0,
  });
  element.dispatchEvent(mouseDownEvent);
  for (let i = 1; i <= steps; i++) {
    const intermediateX = startX + (endX - startX) * (i / steps);
    const intermediateY = startY + (endY - startY) * (i / steps);
    const dragEvent = new MouseEvent("mousemove", {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: intermediateX,
      clientY: intermediateY,
      button: 0,
    });
    element.dispatchEvent(dragEvent);
  }
  const mouseUpEvent = new MouseEvent("mouseup", {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: endX,
    clientY: endY,
    button: 0,
  });
  element.dispatchEvent(mouseUpEvent);
}
